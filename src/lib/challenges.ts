/**
 * Inter-School Challenge Engine — Term 2, 2026
 * Config-driven: add new challenges by pushing to CHALLENGE_DEFINITIONS.
 */

import { parseDurationToMinutes, isValidSession } from "./gamification";

// ── Types ─────────────────────────────────────────────────

export type MetricType = 'ride_count' | 'distance' | 'duration' | 'elevation' | 'team_time';
export type ChallengeMode = 'individual' | 'team';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'ended';

export interface ChallengeDefinition {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (inclusive)
  metricType: MetricType;
  target: number;
  unit: string; // e.g. "rides", "km", "hours", "m", "hours"
  mode: ChallengeMode;
  teamSize?: number;
  courseFilter?: string; // MyWhoosh course name filter (for team_time)
  reward: string;
  rewardDependsOn?: string[]; // other challenge IDs that must also be completed
  displayOrder: number;
  active: boolean;
  description?: string;
}

export interface ChallengeProgress {
  definition: ChallengeDefinition;
  status: ChallengeStatus;
  current: number;       // progress value
  target: number;
  percentage: number;    // 0-100
  completed: boolean;
  rewardEarned: boolean; // accounts for dependsOn
  daysRemaining: number;
  daysTotal: number;
}

export interface TeamRanking {
  schoolId: string;
  schoolName: string;
  totalValue: number;   // accumulated time in minutes (for team_time)
  riderCount: number;
  rank: number;
}

export interface SessionData {
  id: string;
  studentId: string;    // Airtable record ID
  schoolId: string;
  date: string;         // YYYY-MM-DD
  distance_km: number;
  duration_minutes: number;
  elevation_m: number;
  avg_speed_kmh: number;
  courseName?: string;
}

// ── Challenge Definitions ─────────────────────────────────

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  {
    id: 'ch1-starter',
    name: '6 Ride Starter Challenge',
    startDate: '2026-05-04',
    endDate: '2026-05-17',
    metricType: 'ride_count',
    target: 6,
    unit: 'rides',
    mode: 'individual',
    reward: 'Bracelet',
    displayOrder: 1,
    active: true,
    description: 'Complete 6 MyWhoosh rides to earn your FreeWheeler bracelet!',
  },
  {
    id: 'ch2-distance',
    name: '210KM Distance Challenge',
    startDate: '2026-05-18',
    endDate: '2026-05-31',
    metricType: 'distance',
    target: 210,
    unit: 'km',
    mode: 'individual',
    reward: 'Drink Bottle',
    displayOrder: 2,
    active: true,
    description: 'Ride a combined 210 km to win a FreeWheeler drink bottle!',
  },
  {
    id: 'ch3-endurance',
    name: '14 Hour Endurance Challenge',
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    metricType: 'duration',
    target: 14, // hours
    unit: 'hours',
    mode: 'individual',
    reward: 'None (Part of T-Shirt combo)',
    displayOrder: 3,
    active: true,
    description: 'Accumulate 14 hours of riding time. Complete this AND the Climbing Challenge to earn a training T-shirt!',
  },
  {
    id: 'ch4-climbing',
    name: '2000VM Climbing Challenge',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    metricType: 'elevation',
    target: 2000,
    unit: 'm',
    mode: 'individual',
    reward: 'Training T-Shirt (quick-dry)',
    rewardDependsOn: ['ch3-endurance'],
    displayOrder: 4,
    active: true,
    description: 'Climb 2,000 vertical metres! Earn a training T-shirt by completing both this and the Endurance Challenge.',
  },
  {
    id: 'ch5-team',
    name: 'Inter-School Team Time Challenge',
    startDate: '2026-06-29',
    endDate: '2026-07-03',
    metricType: 'team_time',
    target: 0, // no fixed target — ranking based
    unit: 'hours',
    mode: 'team',
    teamSize: 10,
    courseFilter: undefined, // Set to specific MyWhoosh course name when confirmed
    reward: 'FreeWheeler Trophy',
    displayOrder: 5,
    active: true,
    description: 'School vs School! Your school\'s top 10 riders compete for the fastest combined time. The winning school takes home the FreeWheeler Trophy!',
  },
];

// ── Helpers ───────────────────────────────────────────────

function parseDate(d: string): Date {
  return new Date(d + 'T00:00:00');
}

export function getChallengeStatus(def: ChallengeDefinition, today?: Date): ChallengeStatus {
  const now = today ?? new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (todayStr < def.startDate) return 'upcoming';
  if (todayStr > def.endDate) return 'ended';
  return 'active';
}

function daysUntilEnd(endDate: string, today?: Date): number {
  const now = today ?? new Date();
  const end = parseDate(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function totalDays(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function filterSessionsByDateWindow(sessions: SessionData[], startDate: string, endDate: string): SessionData[] {
  return sessions.filter(s => s.date >= startDate && s.date <= endDate);
}

// ── Individual Progress ───────────────────────────────────

export function calculateIndividualProgress(
  def: ChallengeDefinition,
  sessions: SessionData[],
  completedChallengeIds: string[] = [],
): ChallengeProgress {
  const windowSessions = filterSessionsByDateWindow(sessions, def.startDate, def.endDate)
    .filter(s => s.duration_minutes > 0 || s.distance_km > 0);

  let current = 0;
  switch (def.metricType) {
    case 'ride_count':
      current = windowSessions.length;
      break;
    case 'distance':
      current = Math.round(windowSessions.reduce((sum, s) => sum + s.distance_km, 0) * 10) / 10;
      break;
    case 'duration':
      // target is in hours, current in hours
      const totalMinutes = windowSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      current = Math.round((totalMinutes / 60) * 10) / 10;
      break;
    case 'elevation':
      current = Math.round(windowSessions.reduce((sum, s) => sum + s.elevation_m, 0));
      break;
    default:
      current = 0;
  }

  const status = getChallengeStatus(def);
  const completed = def.target > 0 && current >= def.target;

  // Check reward dependency
  let rewardEarned = completed;
  if (completed && def.rewardDependsOn?.length) {
    rewardEarned = def.rewardDependsOn.every(depId => completedChallengeIds.includes(depId));
  }

  return {
    definition: def,
    status: completed ? 'completed' : status,
    current,
    target: def.target,
    percentage: def.target > 0 ? Math.min(100, Math.round((current / def.target) * 100)) : 0,
    completed,
    rewardEarned,
    daysRemaining: daysUntilEnd(def.endDate),
    daysTotal: totalDays(def.startDate, def.endDate),
  };
}

// ── Team Progress ─────────────────────────────────────────

export function calculateTeamRankings(
  def: ChallengeDefinition,
  allSessions: SessionData[],
  schoolMap: Map<string, string>, // schoolId -> schoolName
): TeamRanking[] {
  const windowSessions = filterSessionsByDateWindow(allSessions, def.startDate, def.endDate)
    .filter(s => s.duration_minutes > 0 || s.distance_km > 0);

  // Optional course filter
  const filtered = def.courseFilter
    ? windowSessions.filter(s => s.courseName?.toLowerCase().includes(def.courseFilter!.toLowerCase()))
    : windowSessions;

  // Group by school
  const schoolSessions = new Map<string, Map<string, number>>(); // schoolId -> (studentId -> totalMinutes)
  for (const s of filtered) {
    if (!s.schoolId) continue;
    if (!schoolSessions.has(s.schoolId)) schoolSessions.set(s.schoolId, new Map());
    const studentMap = schoolSessions.get(s.schoolId)!;
    studentMap.set(s.studentId, (studentMap.get(s.studentId) ?? 0) + s.duration_minutes);
  }

  const rankings: TeamRanking[] = [];
  for (const [schoolId, studentMap] of schoolSessions) {
    // Take top N riders by time
    const topN = def.teamSize ?? 10;
    const riderTimes = [...studentMap.values()].sort((a, b) => b - a).slice(0, topN);
    const totalMinutes = riderTimes.reduce((a, b) => a + b, 0);

    rankings.push({
      schoolId,
      schoolName: schoolMap.get(schoolId) ?? 'Unknown School',
      totalValue: Math.round((totalMinutes / 60) * 10) / 10, // hours
      riderCount: Math.min(studentMap.size, topN),
      rank: 0,
    });
  }

  // Sort by highest accumulated time (most time = best)
  rankings.sort((a, b) => b.totalValue - a.totalValue);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  return rankings;
}

// ── Batch Progress ────────────────────────────────────────

export function calculateAllChallengeProgress(
  sessions: SessionData[],
  definitions: ChallengeDefinition[] = CHALLENGE_DEFINITIONS,
): ChallengeProgress[] {
  // First pass: compute completion for each individual challenge
  const progressList: ChallengeProgress[] = [];
  const completedIds: string[] = [];

  // Sort by display order for dependency resolution
  const sorted = [...definitions].sort((a, b) => a.displayOrder - b.displayOrder);

  for (const def of sorted) {
    if (def.mode === 'team') {
      // Team challenges get a placeholder progress (no individual target)
      progressList.push({
        definition: def,
        status: getChallengeStatus(def),
        current: 0,
        target: 0,
        percentage: 0,
        completed: false,
        rewardEarned: false,
        daysRemaining: daysUntilEnd(def.endDate),
        daysTotal: totalDays(def.startDate, def.endDate),
      });
      continue;
    }

    const progress = calculateIndividualProgress(def, sessions, completedIds);
    if (progress.completed) completedIds.push(def.id);
    progressList.push(progress);
  }

  // Second pass: re-evaluate reward dependencies now that all completions are known
  for (const p of progressList) {
    if (p.completed && p.definition.rewardDependsOn?.length) {
      p.rewardEarned = p.definition.rewardDependsOn.every(depId => completedIds.includes(depId));
    }
  }

  return progressList;
}

// ── Format Helpers ────────────────────────────────────────

export function formatDurationHHMM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatChallengeDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export function formatProgressValue(current: number, def: ChallengeDefinition): string {
  switch (def.metricType) {
    case 'ride_count': return `${current}`;
    case 'distance': return `${current} km`;
    case 'duration': return formatDurationHHMM(current);
    case 'elevation': return `${current} m`;
    case 'team_time': return formatDurationHHMM(current);
    default: return `${current}`;
  }
}

export function formatTargetValue(def: ChallengeDefinition): string {
  switch (def.metricType) {
    case 'ride_count': return `${def.target} rides`;
    case 'distance': return `${def.target} km`;
    case 'duration': return `${def.target} hours`;
    case 'elevation': return `${def.target} m`;
    case 'team_time': return 'Fastest combined time';
    default: return `${def.target} ${def.unit}`;
  }
}

// ── Parse session data from Airtable records ──────────────

export function parseSessionsForChallenges(
  sessionRecords: Array<{ id: string; fields: Record<string, any>; createdTime: string }>,
  studentSchoolMap: Map<string, string>, // studentRecordId -> schoolId
): SessionData[] {
  const sessions: SessionData[] = [];

  for (const rec of sessionRecords) {
    const f = rec.fields;
    const studentIds = f['Student Registration'] as string[] | undefined;
    const studentId = studentIds?.[0] ?? '';
    if (!studentId) continue;

    const schoolId = studentSchoolMap.get(studentId) ?? '';
    const dateStr = String(f['Auto date'] ?? rec.createdTime ?? '').slice(0, 10);

    // Parse session data JSON
    const rawData = f['Session Data Table'];
    let distance_km = 0;
    let duration_minutes = 0;
    let elevation_m = 0;
    let avg_speed_kmh = 0;

    if (rawData) {
      try {
        const obj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const data = obj && typeof obj === 'object' && 'value' in obj ? obj.value : obj;
        if (data && typeof data === 'object') {
          distance_km = Number(data.distance_km ?? 0) || 0;
          const durStr = String(data.duration_hh_mm_ss ?? '0:00');
          duration_minutes = parseDurationToMinutes(durStr);
          elevation_m = Number(data.elevation_m ?? 0) || 0;
          avg_speed_kmh = Number(data.speed_kmh ?? data.avg_speed_kmh ?? 0) || 0;
        }
      } catch { /* ignore parse errors */ }
    }

    // Fallback to top-level fields
    if (distance_km === 0) distance_km = Number(f['Total km '] ?? 0) || 0;
    if (duration_minutes === 0) duration_minutes = parseDurationToMinutes(f['Rollup Minutes'] ?? f['Total minutes'] ?? 0);

    if (duration_minutes <= 0 && distance_km <= 0) continue;

    sessions.push({
      id: rec.id,
      studentId,
      schoolId,
      date: dateStr,
      distance_km,
      duration_minutes,
      elevation_m,
      avg_speed_kmh,
      courseName: f['Course Name'] as string | undefined,
    });
  }

  return sessions;
}
