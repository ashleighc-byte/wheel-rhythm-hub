/**
 * Shared helper: fetches all session reflections for all students,
 * computes points per rider using the unified formula:
 * 10 pts/session + weekly bonuses.
 * Returns a Map<airtableStudentId, { totalPoints, totalMinutes, sessions }>.
 */
import { callAirtable } from "@/lib/airtable";
import { parseDurationToMinutes, isValidSession, getLevelName, calculateWeeklyBonus } from "@/lib/gamification";

function parseSessionDataValue(raw: any): { distance_km: number; duration_hh_mm_ss: string; speed_kmh: number; elevation_m: number } | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      distance_km: Number(obj.distance_km ?? 0),
      duration_hh_mm_ss: String(obj.duration_hh_mm_ss ?? "0:00"),
      speed_kmh: Number(obj.avg_speed_kmh ?? obj.speed_kmh ?? 0),
      elevation_m: Number(obj.elevation_m ?? 0),
    };
  } catch {
    return null;
  }
}

export interface RiderPointsSummary {
  totalPoints: number;
  totalMinutes: number;
  totalDistance: number;
  totalElevation: number;
  sessions: number;
  level: string;
}

export async function computeAllRiderPoints(studentIds?: string[]): Promise<Map<string, RiderPointsSummary>> {
  // Batch student IDs into groups to avoid Airtable formula length limits
  const BATCH_SIZE = 15;
  let allRecords: any[] = [];

  if (studentIds?.length) {
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE);
      const clauses = batch.map(id => `FIND("${id}", ARRAYJOIN({Student Registration}))`).join(',');
      const batchRes = await callAirtable("Session Reflections", "GET", {
        filterByFormula: `OR(${clauses})`,
      });
      allRecords = allRecords.concat(batchRes.records);
    }
  } else {
    const res = await callAirtable("Session Reflections", "GET", {});
    allRecords = res.records;
  }
  const sessionsRes = { records: allRecords };

  // Group sessions by student airtable ID
  const studentSessions = new Map<string, any[]>();
  for (const rec of sessionsRes.records) {
    const studentLinks = rec.fields["Student Registration"] as string[] | undefined;
    const studentId = studentLinks?.[0];
    if (!studentId) continue;
    if (!studentSessions.has(studentId)) studentSessions.set(studentId, []);
    studentSessions.get(studentId)!.push(rec);
  }

  const result = new Map<string, RiderPointsSummary>();

  for (const [studentId, sessions] of studentSessions) {
    let totalMinutes = 0;
    let totalDistance = 0;
    let totalElevation = 0;
    let validCount = 0;
    const sessionDates: string[] = [];

    for (const s of sessions) {
      const rawData = s.fields["Session Data Table"];
      const parsed = parseSessionDataValue(
        typeof rawData === "object" && rawData !== null && "value" in (rawData as any)
          ? (rawData as any).value
          : rawData
      );
      // Read from new direct fields first, then fall back to legacy rollup/JSON blob
      const durationStr = String(s.fields["Total minutes"] ?? parsed?.duration_hh_mm_ss ?? "0:00");
      const duration_minutes = parseDurationToMinutes(
        s.fields["Duration (min)"] ?? s.fields["Rollup Minutes"] ?? durationStr
      );
      const distance_km = Number(
        s.fields["Distance (km)"] ?? s.fields["Total km "] ?? parsed?.distance_km ?? 0
      );
      const elevation_m = Number(
        s.fields["Elevation (m)"] ?? s.fields["Total Elevation"] ?? parsed?.elevation_m ?? 0
      );
      const avg_speed_kmh = Number(s.fields["Avg Speed (km/h)"] ?? parsed?.speed_kmh ?? 0);
      const avg_power_watts = s.fields["Avg Power (W)"] ? Number(s.fields["Avg Power (W)"]) : undefined;

      const input = { duration_minutes, distance_km, elevation_m, avg_speed_kmh, avg_power_watts };
      if (!isValidSession(input)) continue;

      totalMinutes += duration_minutes;
      totalDistance += distance_km;
      totalElevation += elevation_m;
      validCount++;

      // Collect date for weekly bonus calc
      const dateStr = String(s.fields["Date"] ?? s.fields["Created"] ?? "").slice(0, 10);
      if (dateStr) sessionDates.push(dateStr);
    }

    // Unified formula: 10 pts/session + weekly bonuses
    const sessionPoints = validCount * 10;
    const weeklyBonus = calculateWeeklyBonus(sessionDates);
    const totalPoints = sessionPoints + weeklyBonus;

    result.set(studentId, {
      totalPoints,
      totalMinutes,
      totalDistance,
      totalElevation,
      sessions: validCount,
      level: getLevelName(totalPoints),
    });
  }

  return result;
}
