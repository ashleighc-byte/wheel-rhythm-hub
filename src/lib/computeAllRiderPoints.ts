/**
 * Shared helper: fetches all session reflections for all students,
 * computes points per rider using the gamification engine.
 * Returns a Map<airtableStudentId, { totalPoints, totalMinutes, sessions }>.
 */
import { callAirtable } from "@/lib/airtable";
import { calculateSessionPoints, parseDurationToMinutes, isValidSession, getLevelName } from "@/lib/gamification";

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

export async function computeAllRiderPoints(): Promise<Map<string, RiderPointsSummary>> {
  // Fetch ALL session reflections (no filter)
  const sessionsRes = await callAirtable("Session Reflections", "GET");

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
    let totalPoints = 0;
    let totalMinutes = 0;
    let totalDistance = 0;
    let totalElevation = 0;
    let validCount = 0;

    for (const s of sessions) {
      const rawData = s.fields["Session Data Table"];
      const parsed = parseSessionDataValue(
        typeof rawData === "object" && rawData !== null && "value" in (rawData as any)
          ? (rawData as any).value
          : rawData
      );
      const durationStr = String(s.fields["Total minutes"] ?? parsed?.duration_hh_mm_ss ?? "0:00");
      const duration_minutes = parseDurationToMinutes(s.fields["Rollup Minutes"] ?? durationStr);
      const distance_km = Number(s.fields["Total km "] ?? parsed?.distance_km ?? 0);
      const elevation_m = Number(s.fields["Total Elevation"] ?? parsed?.elevation_m ?? 0);
      const avg_speed_kmh = Number(s.fields["Avg Speed"] ?? parsed?.speed_kmh ?? 0);

      const input = { duration_minutes, distance_km, elevation_m, avg_speed_kmh };
      if (!isValidSession(input)) continue;

      totalPoints += calculateSessionPoints(input);
      totalMinutes += duration_minutes;
      totalDistance += distance_km;
      totalElevation += elevation_m;
      validCount++;
    }

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
