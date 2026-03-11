/**
 * Free Wheeler Gamification Engine
 * All points, streaks, levels, challenges, and achievements computed client-side.
 */

// ── Session Data ──────────────────────────────────────────
export interface RideSession {
  id: string;
  riderId: string;
  riderName: string;
  schoolId: string;
  schoolName: string;
  date: string; // YYYY-MM-DD
  distance_km: number;
  duration_minutes: number;
  elevation_m: number;
  avg_speed_kmh: number;
  feelingBefore: number;
  feelingAfter: number;
  reflection: string;
  screenshotUrl?: string;
  points: number; // calculated
}

// ── Points Calculation ────────────────────────────────────
export function calculateSessionPoints(session: {
  duration_minutes: number;
  distance_km: number;
  elevation_m: number;
  avg_speed_kmh: number;
}): number {
  const { duration_minutes, distance_km, elevation_m, avg_speed_kmh } = session;

  // Valid session check
  if (duration_minutes <= 0 && distance_km <= 0) return 0;

  let pts = 10; // base

  // Time bonus: 1pt per 10 min
  pts += Math.floor(duration_minutes / 10);

  // Distance bonus: 1pt per 5 km
  pts += Math.floor(distance_km / 5);

  // Elevation bonus: boosted for harder courses
  // 1pt per 25 m (was 50 m) — rewards hill climbing more
  pts += Math.floor(elevation_m / 25);

  // High elevation single-ride bonus (hard course rewards)
  if (elevation_m >= 500) pts += 15;
  else if (elevation_m >= 300) pts += 10;
  else if (elevation_m >= 150) pts += 5;
  else if (elevation_m >= 75) pts += 2;

  // Speed bonus
  if (avg_speed_kmh >= 30) pts += 6;
  else if (avg_speed_kmh >= 25) pts += 4;
  else if (avg_speed_kmh >= 20) pts += 2;

  // Long ride bonus
  if (duration_minutes >= 60) pts += 10;
  else if (duration_minutes >= 45) pts += 5;

  return pts;
}

export function isValidSession(s: { duration_minutes: number; distance_km: number }): boolean {
  return s.duration_minutes > 0 || s.distance_km > 0;
}

// ── Duration Parsing ──────────────────────────────────────
export function parseDurationToMinutes(dur: string | number | undefined): number {
  if (dur === undefined || dur === null) return 0;
  if (typeof dur === "number") return dur;
  const str = String(dur).trim();
  // hh:mm:ss
  const hms = str.match(/^(\d+):(\d+):(\d+)$/);
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2]) + parseInt(hms[3]) / 60;
  // h:mm or mm
  const hm = str.match(/^(\d+):(\d+)$/);
  if (hm) {
    const a = parseInt(hm[1]);
    const b = parseInt(hm[2]);
    // If a is small, treat as h:mm
    return a < 10 ? a * 60 + b : a + b / 60;
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// ── Streaks ───────────────────────────────────────────────
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  milestonesReached: number[]; // days reached
}

const STREAK_MILESTONES = [3, 5, 7, 14, 30];
const STREAK_BONUS: Record<number, number> = { 3: 5, 5: 10, 7: 20, 14: 40, 30: 100 };

export function computeStreaks(sessions: { date: string; duration_minutes: number; distance_km: number }[]): StreakResult {
  const valid = sessions.filter(s => isValidSession(s));
  const uniqueDays = [...new Set(valid.map(s => s.date))].sort();
  if (uniqueDays.length === 0) return { currentStreak: 0, longestStreak: 0, milestonesReached: [] };

  let longest = 1;
  let current = 1;
  const streakLengths: number[] = [];

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
    } else {
      streakLengths.push(current);
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  streakLengths.push(current);

  // Current streak: check if the last ride day is today or yesterday
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDay = uniqueDays[uniqueDays.length - 1];
  const isCurrentActive = lastDay === today || lastDay === yesterday;
  const currentStreak = isCurrentActive ? current : 0;

  const milestonesReached = STREAK_MILESTONES.filter(m => longest >= m);

  return { currentStreak, longestStreak: longest, milestonesReached };
}

export function getStreakBonusPoints(milestonesReached: number[]): number {
  return milestonesReached.reduce((sum, m) => sum + (STREAK_BONUS[m] ?? 0), 0);
}

// ── Levels ────────────────────────────────────────────────
export interface LevelInfo {
  name: string;
  min: number;
  index: number;
}

export const LEVELS: LevelInfo[] = [
  { name: "Pedal Pusher", min: 0, index: 0 },
  { name: "Gear Shifter", min: 50, index: 1 },
  { name: "Hill Climber", min: 150, index: 2 },
  { name: "Breakaway Rider", min: 300, index: 3 },
  { name: "Pace Setter", min: 500, index: 4 },
  { name: "Sprint Leader", min: 800, index: 5 },
  { name: "Free Wheeler Legend", min: 1200, index: 6 },
];

export function getLevel(totalPoints: number): { current: LevelInfo; next: LevelInfo | null } {
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].min) {
      current = LEVELS[i];
      break;
    }
  }
  const next = current.index < LEVELS.length - 1 ? LEVELS[current.index + 1] : null;
  return { current, next };
}

export function getLevelName(totalPoints: number): string {
  return getLevel(totalPoints).current.name;
}

// ── Rider Totals ──────────────────────────────────────────
export interface RiderTotals {
  riderId: string;
  riderName: string;
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalDistance: number;
  totalElevation: number;
  avgSpeed: number;
  currentStreak: number;
  longestStreak: number;
  streakMilestones: number[];
  streakBonusPoints: number;
  level: LevelInfo;
  nextLevel: LevelInfo | null;
  xpToNextLevel: number;
  completedChallenges: string[];
  unlockedAchievements: string[];
}

export function computeRiderTotals(riderId: string, riderName: string, schoolId: string, schoolName: string, sessions: RideSession[]): RiderTotals {
  const validSessions = sessions.filter(s => isValidSession(s));
  const totalSessions = validSessions.length;
  const totalMinutes = validSessions.reduce((s, r) => s + r.duration_minutes, 0);
  const totalDistance = validSessions.reduce((s, r) => s + r.distance_km, 0);
  const totalElevation = validSessions.reduce((s, r) => s + r.elevation_m, 0);
  const totalSessionPoints = validSessions.reduce((s, r) => s + r.points, 0);

  const speeds = validSessions.filter(s => s.avg_speed_kmh > 0).map(s => s.avg_speed_kmh);
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  const streak = computeStreaks(validSessions);
  const streakBonus = getStreakBonusPoints(streak.milestonesReached);

  // Challenge rewards computed elsewhere
  const totalPoints = totalSessionPoints + streakBonus;

  const { current, next } = getLevel(totalPoints);
  const xpToNextLevel = next ? next.min - totalPoints : 0;

  return {
    riderId, riderName, schoolId, schoolName,
    totalPoints, totalSessions,
    totalMinutes, totalHours: Math.round(totalMinutes / 6) / 10,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalElevation: Math.round(totalElevation),
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    streakMilestones: streak.milestonesReached,
    streakBonusPoints: streakBonus,
    level: current, nextLevel: next, xpToNextLevel,
    completedChallenges: [],
    unlockedAchievements: [],
  };
}

// ── School Totals ─────────────────────────────────────────
export interface SchoolTotals {
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  totalSessions: number;
  totalHours: number;
  totalDistance: number;
  totalElevation: number;
  avgSpeed: number;
  activeRiders: number;
}

export function computeSchoolTotals(schoolId: string, schoolName: string, riderTotals: RiderTotals[]): SchoolTotals {
  const schoolRiders = riderTotals.filter(r => r.schoolId === schoolId);
  const activeRiders = schoolRiders.filter(r => r.totalSessions > 0).length;
  const totalPoints = schoolRiders.reduce((s, r) => s + r.totalPoints, 0);
  const totalSessions = schoolRiders.reduce((s, r) => s + r.totalSessions, 0);
  const totalMinutes = schoolRiders.reduce((s, r) => s + r.totalMinutes, 0);
  const totalDistance = schoolRiders.reduce((s, r) => s + r.totalDistance, 0);
  const totalElevation = schoolRiders.reduce((s, r) => s + r.totalElevation, 0);
  const speeds = schoolRiders.filter(r => r.avgSpeed > 0).map(r => r.avgSpeed);
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  return {
    schoolId, schoolName, totalPoints, totalSessions,
    totalHours: Math.round(totalMinutes / 6) / 10,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalElevation: Math.round(totalElevation),
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    activeRiders,
  };
}

// ── Challenges ────────────────────────────────────────────
export interface Challenge {
  id: string;
  type: "daily" | "weekly" | "milestone";
  title: string;
  current: number;
  goal: number;
  reward: number;
  completed: boolean;
  repeatable: boolean;
}

export function computeChallenges(totals: RiderTotals, sessions: RideSession[]): Challenge[] {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const todaySessions = sessions.filter(s => s.date === today && isValidSession(s));
  const weekSessions = sessions.filter(s => s.date >= weekStartStr && isValidSession(s));
  const weekMinutes = weekSessions.reduce((s, r) => s + r.duration_minutes, 0);
  const weekKm = weekSessions.reduce((s, r) => s + r.distance_km, 0);
  const weekPoints = weekSessions.reduce((s, r) => s + r.points, 0);
  const todayPoints = todaySessions.reduce((s, r) => s + r.points, 0);
  const bestTodayMinutes = todaySessions.length > 0 ? Math.max(...todaySessions.map(s => s.duration_minutes)) : 0;

  // Elevation stats
  const weekElevation = weekSessions.reduce((s, r) => s + r.elevation_m, 0);
  const bestTodayElevation = todaySessions.length > 0 ? Math.max(...todaySessions.map(s => s.elevation_m)) : 0;
  const bestSessionElevation = sessions.length > 0 ? Math.max(...sessions.filter(s => isValidSession(s)).map(s => s.elevation_m)) : 0;
  const bestSessionSpeed = sessions.length > 0 ? Math.max(...sessions.filter(s => isValidSession(s)).map(s => s.avg_speed_kmh)) : 0;
  const uniqueElevationRanges = new Set(sessions.filter(s => isValidSession(s) && s.elevation_m > 0).map(s => {
    if (s.elevation_m < 50) return "flat";
    if (s.elevation_m < 150) return "rolling";
    if (s.elevation_m < 300) return "hilly";
    return "mountain";
  }));

  const challenges: Challenge[] = [
    // Daily
    { id: "daily-ride", type: "daily", title: "Ride Today", current: Math.min(todaySessions.length, 1), goal: 1, reward: 5, completed: todaySessions.length >= 1, repeatable: true },
    { id: "daily-20min", type: "daily", title: "Ride 20 Min in One Session", current: Math.min(Math.round(bestTodayMinutes), 20), goal: 20, reward: 5, completed: bestTodayMinutes >= 20, repeatable: true },
    { id: "daily-15pts", type: "daily", title: "Earn 15 Points Today", current: Math.min(todayPoints, 15), goal: 15, reward: 5, completed: todayPoints >= 15, repeatable: true },
    { id: "daily-climb", type: "daily", title: "Climb 50 m Today", current: Math.min(Math.round(bestTodayElevation), 50), goal: 50, reward: 5, completed: bestTodayElevation >= 50, repeatable: true },
    // Weekly
    { id: "weekly-3rides", type: "weekly", title: "Ride 3 Times This Week", current: Math.min(weekSessions.length, 3), goal: 3, reward: 15, completed: weekSessions.length >= 3, repeatable: true },
    { id: "weekly-5rides", type: "weekly", title: "Ride 5 Times This Week", current: Math.min(weekSessions.length, 5), goal: 5, reward: 25, completed: weekSessions.length >= 5, repeatable: true },
    { id: "weekly-60min", type: "weekly", title: "Ride 60 Min This Week", current: Math.min(Math.round(weekMinutes), 60), goal: 60, reward: 15, completed: weekMinutes >= 60, repeatable: true },
    { id: "weekly-120min", type: "weekly", title: "Ride 120 Min This Week", current: Math.min(Math.round(weekMinutes), 120), goal: 120, reward: 25, completed: weekMinutes >= 120, repeatable: true },
    { id: "weekly-20km", type: "weekly", title: "Ride 20 km This Week", current: Math.min(Math.round(weekKm), 20), goal: 20, reward: 15, completed: weekKm >= 20, repeatable: true },
    { id: "weekly-50pts", type: "weekly", title: "Earn 50 Points This Week", current: Math.min(weekPoints, 50), goal: 50, reward: 15, completed: weekPoints >= 50, repeatable: true },
    { id: "weekly-100pts", type: "weekly", title: "Earn 100 Points This Week", current: Math.min(weekPoints, 100), goal: 100, reward: 25, completed: weekPoints >= 100, repeatable: true },
    { id: "weekly-200elev", type: "weekly", title: "Climb 200 m This Week", current: Math.min(Math.round(weekElevation), 200), goal: 200, reward: 20, completed: weekElevation >= 200, repeatable: true },
    // Milestones
    { id: "milestone-first", type: "milestone", title: "Complete First Ride", current: Math.min(totals.totalSessions, 1), goal: 1, reward: 20, completed: totals.totalSessions >= 1, repeatable: false },
    { id: "milestone-5sess", type: "milestone", title: "Reach 5 Sessions", current: Math.min(totals.totalSessions, 5), goal: 5, reward: 15, completed: totals.totalSessions >= 5, repeatable: false },
    { id: "milestone-10sess", type: "milestone", title: "Reach 10 Sessions", current: Math.min(totals.totalSessions, 10), goal: 10, reward: 20, completed: totals.totalSessions >= 10, repeatable: false },
    { id: "milestone-25sess", type: "milestone", title: "Reach 25 Sessions", current: Math.min(totals.totalSessions, 25), goal: 25, reward: 30, completed: totals.totalSessions >= 25, repeatable: false },
    { id: "milestone-50km", type: "milestone", title: "Reach 50 km Total", current: Math.min(Math.round(totals.totalDistance), 50), goal: 50, reward: 20, completed: totals.totalDistance >= 50, repeatable: false },
    { id: "milestone-100km", type: "milestone", title: "Reach 100 km Total", current: Math.min(Math.round(totals.totalDistance), 100), goal: 100, reward: 30, completed: totals.totalDistance >= 100, repeatable: false },
    { id: "milestone-100min", type: "milestone", title: "Reach 100 Minutes Total", current: Math.min(Math.round(totals.totalMinutes), 100), goal: 100, reward: 20, completed: totals.totalMinutes >= 100, repeatable: false },
    { id: "milestone-300min", type: "milestone", title: "Ride 5 Hours Total", current: Math.min(Math.round(totals.totalMinutes), 300), goal: 300, reward: 30, completed: totals.totalMinutes >= 300, repeatable: false },
    // Elevation milestones
    { id: "milestone-250elev", type: "milestone", title: "Climb 250 m Total", current: Math.min(totals.totalElevation, 250), goal: 250, reward: 20, completed: totals.totalElevation >= 250, repeatable: false },
    { id: "milestone-500elev", type: "milestone", title: "Climb 500 m Total", current: Math.min(totals.totalElevation, 500), goal: 500, reward: 30, completed: totals.totalElevation >= 500, repeatable: false },
    { id: "milestone-1000elev", type: "milestone", title: "Climb 1,000 m Total", current: Math.min(totals.totalElevation, 1000), goal: 1000, reward: 50, completed: totals.totalElevation >= 1000, repeatable: false },
    { id: "milestone-hard-course", type: "milestone", title: "Ride a 150 m+ Elevation Course", current: Math.min(Math.round(bestSessionElevation), 150), goal: 150, reward: 25, completed: bestSessionElevation >= 150, repeatable: false },
    { id: "milestone-mountain", type: "milestone", title: "Ride a 300 m+ Mountain Course", current: Math.min(Math.round(bestSessionElevation), 300), goal: 300, reward: 40, completed: bestSessionElevation >= 300, repeatable: false },
    { id: "milestone-variety", type: "milestone", title: "Ride 3 Different Course Types", current: Math.min(uniqueElevationRanges.size, 3), goal: 3, reward: 25, completed: uniqueElevationRanges.size >= 3, repeatable: false },
    // Speed milestones
    { id: "milestone-speed20", type: "milestone", title: "Average 20+ km/h in a Ride", current: Math.min(Math.round(bestSessionSpeed), 20), goal: 20, reward: 15, completed: bestSessionSpeed >= 20, repeatable: false },
    { id: "milestone-speed25", type: "milestone", title: "Average 25+ km/h in a Ride", current: Math.min(Math.round(bestSessionSpeed), 25), goal: 25, reward: 25, completed: bestSessionSpeed >= 25, repeatable: false },
    { id: "milestone-speed30", type: "milestone", title: "Average 30+ km/h in a Ride", current: Math.min(Math.round(bestSessionSpeed), 30), goal: 30, reward: 40, completed: bestSessionSpeed >= 30, repeatable: false },
  ];

  return challenges;
}

export function getChallengeRewardPoints(challenges: Challenge[]): number {
  return challenges.filter(c => c.completed).reduce((s, c) => s + c.reward, 0);
}

// ── Achievements ──────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  icon: string; // lucide icon name
  unlocked: boolean;
  unlockedDate?: string;
}

export function computeAchievements(totals: RiderTotals, schoolRank: number | null): Achievement[] {
  return [
    { id: "first-ride", title: "First Ride", icon: "Bike", unlocked: totals.totalSessions >= 1 },
    { id: "streak-3", title: "3 Ride Streak", icon: "Flame", unlocked: totals.longestStreak >= 3 },
    { id: "streak-5", title: "5 Ride Streak", icon: "Flame", unlocked: totals.longestStreak >= 5 },
    { id: "streak-7", title: "7 Ride Streak", icon: "Flame", unlocked: totals.longestStreak >= 7 },
    { id: "10-sessions", title: "10 Sessions", icon: "Repeat", unlocked: totals.totalSessions >= 10 },
    { id: "50km-club", title: "50 km Club", icon: "MapPin", unlocked: totals.totalDistance >= 50 },
    { id: "100km-club", title: "100 km Club", icon: "MapPin", unlocked: totals.totalDistance >= 100 },
    { id: "5-hours", title: "5 Hours Ridden", icon: "Clock", unlocked: totals.totalHours >= 5 },
    { id: "climb-500", title: "Climb 500 m", icon: "Mountain", unlocked: totals.totalElevation >= 500 },
    { id: "school-top3", title: "School Top 3", icon: "Trophy", unlocked: (schoolRank ?? 99) <= 3 },
    { id: "level-up", title: "Level Up", icon: "TrendingUp", unlocked: totals.totalPoints >= 50 },
    { id: "challenge-crusher", title: "Challenge Crusher", icon: "Target", unlocked: totals.completedChallenges.length >= 5 },
  ];
}

// ── Grand Total Points (session + streak + challenge) ─────
export function computeGrandTotalPoints(
  sessions: RideSession[],
  streakMilestones: number[],
  challenges: Challenge[]
): number {
  const sessionPts = sessions.filter(s => isValidSession(s)).reduce((s, r) => s + r.points, 0);
  const streakPts = getStreakBonusPoints(streakMilestones);
  const challengePts = getChallengeRewardPoints(challenges);
  return sessionPts + streakPts + challengePts;
}
