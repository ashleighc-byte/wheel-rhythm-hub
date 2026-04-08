import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike, Clock, MapPin, TrendingUp, Trophy, Plus, Zap,
  Frown, Meh, Smile, Laugh, Flame, Target, Award, Star,
  ChevronRight, Timer, Calendar, Sparkles, Mountain, Repeat,
  Gauge, ClipboardCheck, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import ChallengesDashboard from "@/components/ChallengesDashboard";
import {
  CHALLENGE_DEFINITIONS,
  calculateAllChallengeProgress,
  calculateTeamRankings,
  parseSessionsForChallenges,
  type ChallengeProgress as InterSchoolChallengeProgress,
  type TeamRanking,
  type SessionData,
} from "@/lib/challenges";
import Navbar from "@/components/Navbar";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import LevelProgress from "@/components/LevelProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchStudents, fetchSessionReflections, callAirtable,
  isSurveyCompleted, isMidPhaseDue, isValidRecordId
} from "@/lib/airtable";
import { isSurveyDismissed, dismissSurvey } from "@/lib/surveyDismissals";
import { formatFriendlyDate } from "@/lib/dateFormat";
import artEliteRider from "@/assets/art-elite-rider.jpeg";
import { computeAllRiderPoints } from "@/lib/computeAllRiderPoints";
import {
  calculateSessionPoints, parseDurationToMinutes, isValidSession,
  computeStreaks, getStreakBonusPoints, computeRiderTotals,
  computeChallenges, computeAchievements, computeGrandTotalPoints,
  getLevel, getLevelName,
  type RideSession, type Challenge, type Achievement, type RiderTotals,
} from "@/lib/gamification";

// ── Types ─────────────────────────────────────────────────
interface SchoolmateRider {
  rank: number;
  name: string;
  points: number;
  sessions: number;
  level: string;
  isCurrentUser: boolean;
}

// ── Helpers ───────────────────────────────────────────────
const moodIcons = [Frown, Frown, Meh, Smile, Laugh];
const moodColors = [
  "text-destructive", "text-destructive/70",
  "text-muted-foreground", "text-primary", "text-accent"
];

const ACHIEVEMENT_ICONS: Record<string, any> = {
  Bike, Flame, Clock, Trophy, TrendingUp, Target, MapPin, Mountain, Repeat, Gauge,
};

function parseSessionData(raw: any): { distance_km: number; duration_hh_mm_ss: string; speed_kmh: number; elevation_m: number } | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      distance_km: Number(obj.distance_km ?? 0),
      duration_hh_mm_ss: String(obj.duration_hh_mm_ss ?? "0:00"),
      speed_kmh: Number(obj.speed_kmh ?? 0),
      elevation_m: Number(obj.elevation_m ?? 0),
    };
  } catch { return null; }
}

function MoodIcon({ value }: { value: number }) {
  if (value < 1 || value > 5) return <span className="text-muted-foreground">—</span>;
  const Icon = moodIcons[value - 1];
  return <Icon className={`h-5 w-5 ${moodColors[value - 1]}`} />;
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = Date.now();
      const dur = 1200;
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.floor(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return <>{display.toLocaleString()}</>;
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, isFormatted, index, suffix }: {
  icon: any; value: number | string; label: string; isFormatted?: boolean; index: number; suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ delay: 0.1 + index * 0.08, type: "spring", stiffness: 200 }}
      className="stat-card flex flex-col items-center px-3 py-5 md:px-4 md:py-6"
    >
      <Icon className="mb-2 h-5 w-5 text-primary md:h-6 md:w-6" />
      <div className="font-display text-2xl font-bold text-accent md:text-3xl">
        {isFormatted ? value : typeof value === "number" ? (
          <AnimatedNumber value={value} delay={200 + index * 100} />
        ) : value}
        {suffix && <span className="text-lg">{suffix}</span>}
      </div>
      <div className="mt-1 font-display text-[9px] font-semibold uppercase tracking-widest text-accent/70 md:text-[10px]">
        {label}
      </div>
    </motion.div>
  );
}

// ── Challenge Card ────────────────────────────────────────
function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const { title, current, goal, reward, completed, type } = challenge;
  const progress = Math.min((current / goal) * 100, 100);
  const typeColors = { daily: "text-accent", weekly: "text-primary", milestone: "text-accent" };
  const typeIcons = { daily: Calendar, weekly: Timer, milestone: Award };
  const TypeIcon = typeIcons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.06 }}
      className={`border-[3px] bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce ${
        completed ? "border-primary" : "border-secondary"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${
          completed ? "bg-primary" : "bg-secondary"
        }`}>
          {completed ? (
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          ) : (
            <TypeIcon className={`h-5 w-5 ${typeColors[type]}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</p>
            <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
              {type}
            </Badge>
          </div>
          <div className="mt-2 h-3 w-full border-[2px] border-secondary bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.06 }}
              className={`h-full ${completed ? "bg-primary" : "bg-accent"}`}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-body text-[10px] text-muted-foreground">
              {current}/{goal}
            </span>
            <span className="flex items-center gap-0.5 font-display text-[10px] font-bold text-primary">
              <Zap className="h-3 w-3" /> +{reward} pts
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Achievement Badge ─────────────────────────────────────
function AchievementBadge({ achievement, index }: { achievement: Achievement; index: number }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Star;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.06, type: "spring" }}
      className={`flex flex-col items-center gap-2 p-3 text-center transition-all ${
        achievement.unlocked ? "" : "opacity-30 grayscale"
      }`}
    >
      <div className={`flex h-14 w-14 items-center justify-center border-[3px] ${
        achievement.unlocked
          ? "border-primary bg-secondary shadow-[0_0_12px_hsl(var(--brand-neon)/0.4)]"
          : "border-muted bg-muted"
      }`}>
        <Icon className={`h-7 w-7 ${achievement.unlocked ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      <span className="font-display text-[10px] font-bold uppercase tracking-wider text-foreground">
        {achievement.title}
      </span>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
const Dashboard = () => {
  const { user, role, nfcSession } = useAuth();
  const navigate = useNavigate();
  const [riderTotals, setRiderTotals] = useState<RiderTotals | null>(null);
  const [rideSessions, setRideSessions] = useState<RideSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [schoolRank, setSchoolRank] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [moodImprovement, setMoodImprovement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [schoolRiders, setSchoolRiders] = useState<SchoolmateRider[]>([]);
  const [interSchoolProgress, setInterSchoolProgress] = useState<InterSchoolChallengeProgress[]>([]);
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [mySchoolId, setMySchoolId] = useState("");

  const hasIdentity = !!user?.email || !!nfcSession;

  // ── Mid Phase survey prompt ──
  const [showMidPrompt, setShowMidPrompt] = useState(false);
  useEffect(() => {
    if (nfcSession) return;
    if (!user?.email || !user?.id || !user?.created_at || role !== "student") return;
    if (isSurveyCompleted("Mid Phase", user.email)) return;
    if (!isMidPhaseDue(user.created_at)) return;

    isSurveyDismissed("Mid Phase", user.id, user.email).then((dismissed) => {
      if (!dismissed) setShowMidPrompt(true);
    });
  }, [user?.email, user?.id, user?.created_at, role, nfcSession]);

  // ── Post Phase survey prompt ──
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  useEffect(() => {
    if (nfcSession) return;
    if (!user?.email || role !== "student") return;
    if (isSurveyCompleted("Post Phase", user.email)) return;

    const POST_PHASE_DATE = "2026-12-07";
    const today = new Date().toISOString().slice(0, 10);
    const isAfterTerm = today > POST_PHASE_DATE;
    const hasHitMilestone = (riderTotals?.totalSessions ?? 0) >= 200;

    if (isAfterTerm || hasHitMilestone) {
      setShowPostPrompt(true);
    }
  }, [user?.email, role, nfcSession, riderTotals?.totalSessions]);

  // ── Load data ──
  const loadData = async () => {
    if (!hasIdentity) { setLoading(false); return; }
    setLoading(true);
    try {
      let studentsRes;
      if (user?.email) {
        studentsRes = await fetchStudents(user.email);
      } else if (nfcSession?.studentId && isValidRecordId(nfcSession.studentId)) {
        studentsRes = await callAirtable('Student Registration', 'GET', {
          filterByFormula: `RECORD_ID()='${nfcSession.studentId}'`,
          maxRecords: 1,
        });
      } else { setLoading(false); return; }

      if (studentsRes.records.length === 0) { setLoading(false); return; }
      const rec = studentsRes.records[0];
      const f = rec.fields;
      const schoolIds = f["School"] as string[] | undefined;
      const sessionIds = f["Session Reflections"] as string[] | undefined;

      const [orgsRes, allStudentsRes, sessionsRes] = await Promise.all([
        callAirtable("Organisations", "GET"),
        callAirtable("Student Registration", "GET"),
        fetchSessionReflections(sessionIds),
      ]);

      // Resolve school name
      let localSchoolId = "";
      let mySchoolName = "";
      if (schoolIds?.length) {
        const org = orgsRes.records.find((o) => o.id === schoolIds[0]);
        localSchoolId = schoolIds[0];
        mySchoolName = org ? String(org.fields["Organisation Name"] ?? "") : "";
        setSchoolName(mySchoolName);
        setMySchoolId(localSchoolId);
      }

      const riderName = String(f["Full Name"] ?? nfcSession?.fullName ?? "Rider");

      // Parse sessions into RideSession format with app-calculated points
      const mappedSessions: RideSession[] = sessionsRes.records
        .map((s) => {
          const rawData = s.fields["Session Data Table"];
          const parsed = parseSessionData(
            typeof rawData === "object" && rawData !== null && "value" in (rawData as any)
              ? (rawData as any).value
              : rawData
          );
          const durationStr = String(s.fields["Total minutes"] ?? parsed?.duration_hh_mm_ss ?? "0:00");
          const duration_minutes = parseDurationToMinutes(s.fields["Rollup Minutes"] ?? durationStr);
          const distance_km = Number(s.fields["Total km "] ?? parsed?.distance_km ?? 0);
          const elevation_m = Number(parsed?.elevation_m ?? 0);
          const avg_speed_kmh = Number(parsed?.speed_kmh ?? 0);

          const sessionInput = { duration_minutes, distance_km, elevation_m, avg_speed_kmh };
          const points = calculateSessionPoints(sessionInput);

          return {
            id: s.id,
            riderId: rec.id,
            riderName,
            schoolId: localSchoolId,
            schoolName: mySchoolName,
            date: String(s.fields["Auto date"] ?? s.createdTime).slice(0, 10),
            distance_km,
            duration_minutes,
            elevation_m,
            avg_speed_kmh,
            feelingBefore: Number(s.fields["How did you feel before you jumped on the bike?"] ?? 0),
            feelingAfter: Number(s.fields["How did you feel after your bike session today?"] ?? 0),
            reflection: String(s.fields["What did you enjoy or not enjoy about today's session?"] ?? ""),
            screenshotUrl: undefined,
            points,
          } satisfies RideSession;
        })
        .sort((a, b) => b.date.localeCompare(a.date));

      setRideSessions(mappedSessions);

      // Compute rider totals using gamification engine
      const totals = computeRiderTotals(rec.id, riderName, localSchoolId, mySchoolName, mappedSessions);

      // Compute challenges & achievements
      const ch = computeChallenges(totals, mappedSessions);
      const completedChallengeIds = ch.filter(c => c.completed).map(c => c.id);
      totals.completedChallenges = completedChallengeIds;

      const grand = computeGrandTotalPoints(mappedSessions, totals.streakMilestones, ch);
      totals.totalPoints = grand;
      // Recompute level with grand total
      const { current, next } = getLevel(grand);
      totals.level = current;
      totals.nextLevel = next;
      totals.xpToNextLevel = next ? next.min - grand : 0;

      setRiderTotals(totals);
      setChallenges(ch);
      setGrandTotal(grand);

      // School leaderboard preview (compute all riders' points via gamification engine)
      if (schoolIds?.length) {
        const schoolmates = allStudentsRes.records
          .filter((s) => {
            const sSchool = s.fields["School"] as string[] | undefined;
            return sSchool?.[0] === schoolIds[0];
          });

        // Fetch computed points for ALL riders using the gamification engine
        const riderPointsMap = await computeAllRiderPoints();

        const ranked = schoolmates
          .map((s) => {
            const computed = riderPointsMap.get(s.id);
            return {
              id: s.id,
              name: String(s.fields["Full Name"] ?? ""),
              sessions: computed?.sessions ?? 0,
              // Use the current user's grand total (includes challenges/streaks), computed points for others
              totalPoints: s.id === rec.id ? grand : (computed?.totalPoints ?? 0),
            };
          })
          .sort((a, b) => b.totalPoints - a.totalPoints);

        const rank = ranked.findIndex((s) => s.id === rec.id) + 1;
        setSchoolRank(rank > 0 ? rank : null);

        setSchoolRiders(
          ranked.slice(0, 5).map((s, i) => ({
            rank: i + 1,
            name: s.name,
            points: s.totalPoints,
            sessions: s.sessions,
            level: getLevelName(s.totalPoints),
            isCurrentUser: s.id === rec.id,
          }))
        );
      }

      // Achievements
      const ach = computeAchievements(totals, schoolRank);
      setAchievements(ach);

      // Mood improvement
      const withMood = mappedSessions.filter((s) => s.feelingBefore > 0 && s.feelingAfter > 0);
      if (withMood.length > 0) {
        const avgChange = withMood.reduce((sum, s) => sum + (s.feelingAfter - s.feelingBefore), 0) / withMood.length;
        setMoodImprovement(avgChange >= 0 ? `+${avgChange.toFixed(1)}` : avgChange.toFixed(1));
      }

      // ── Inter-School Challenges ──
      try {
        // Build student → school mapping from all students
        const studentSchoolMap = new Map<string, string>();
        const schoolNameMap = new Map<string, string>();
        for (const s of allStudentsRes.records) {
          const sSchool = s.fields["School"] as string[] | undefined;
          if (sSchool?.[0]) studentSchoolMap.set(s.id, sSchool[0]);
        }
        for (const o of orgsRes.records) {
          schoolNameMap.set(o.id, String(o.fields["Organisation Name"] ?? ""));
        }

        // Fetch ALL session reflections for challenge calculation
        const allSessionsRes = await callAirtable("Session Reflections", "GET");
        const challengeSessions = parseSessionsForChallenges(allSessionsRes.records, studentSchoolMap);

        // Individual progress for current student
        const mySessions = challengeSessions.filter(s => s.studentId === rec.id);
        const progress = calculateAllChallengeProgress(mySessions);
        setInterSchoolProgress(progress);

        // Team rankings
        const teamDef = CHALLENGE_DEFINITIONS.find(d => d.mode === 'team');
        if (teamDef) {
          const rankings = calculateTeamRankings(teamDef, challengeSessions, schoolNameMap);
          setTeamRankings(rankings);
        }
      } catch (err) {
        console.error("Challenge calculation error:", err);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.email, nfcSession?.studentId]);

  const handleLogClose = (open: boolean) => {
    setLogOpen(open);
    if (!open) loadData();
  };

  // ── Derived values ──
  const firstName = riderTotals?.riderName.split(" ")[0] ?? nfcSession?.firstName ?? "Rider";
  const currentLevel = riderTotals ? riderTotals.level : getLevel(0).current;
  const streak = riderTotals?.currentStreak ?? 0;

  // This-week sessions
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const thisWeekSessions = rideSessions.filter(s => s.date >= weekStartStr && isValidSession(s));

  // Split challenges by type
  const dailyChallenges = challenges.filter(c => c.type === "daily");
  const weeklyChallenges = challenges.filter(c => c.type === "weekly");
  const milestoneChallenges = challenges.filter(c => c.type === "milestone");

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-3 font-display text-xl uppercase tracking-wider text-foreground"
          >
            <Bike className="h-6 w-6 animate-pulse text-primary" />
            Loading your dashboard...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 md:py-8">

        {/* ═══ HERO PANEL ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative overflow-hidden border-[3px] border-secondary bg-secondary p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))] md:p-7"
        >
          <div className="absolute inset-0">
            <img src={artEliteRider} alt="" className="h-full w-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-secondary/75" />
          </div>
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex h-14 w-14 items-center justify-center border-[3px] border-accent bg-secondary shadow-[0_0_16px_hsl(var(--brand-neon)/0.3)] md:h-16 md:w-16"
                >
                  <Bike className="h-7 w-7 text-accent md:h-8 md:w-8" />
                </motion.div>
                <div>
                  <h1 className="text-3xl text-secondary-foreground md:text-4xl lg:text-5xl">
                    Hey, {firstName}!
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-body text-sm text-secondary-foreground/70">
                      {schoolName || ""}
                    </span>
                    {schoolRank && (
                      <span className="border-[2px] border-accent bg-secondary px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
                        Rank #{schoolRank}
                      </span>
                    )}
                    <span className="border-[2px] border-primary bg-primary px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      {currentLevel.name}
                    </span>
                    {streak > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex items-center gap-1 border-[2px] border-accent bg-accent px-2 py-0.5 font-display text-[10px] font-bold uppercase text-accent-foreground"
                      >
                        <Flame className="h-3 w-3 animate-flame-flicker" /> {streak} streak
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ LEVEL PROGRESS — FIRST THING ═══ */}
        <div className="mb-6">
          <LevelProgress totalPoints={grandTotal} />
        </div>

        {/* ═══ GAMIFICATION QUICK STATS ═══ */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="border-[3px] border-secondary bg-card p-4 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
            <Zap className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-accent">{grandTotal}</p>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Points</p>
          </div>
          <div className="border-[3px] border-secondary bg-card p-4 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
            <Flame className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-accent">{streak}</p>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Day Streak</p>
          </div>
          <div className="border-[3px] border-secondary bg-card p-4 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
            <Bike className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-accent">{riderTotals?.totalSessions ?? 0}</p>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Rides</p>
          </div>
        </div>

        {/* ═══ LOG A RIDE CTA ═══ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex gap-3">
            <button
              onClick={() => setLogOpen(true)}
              className="tape-element-green flex flex-1 items-center justify-center gap-3 py-5 text-xl md:text-2xl"
            >
              <Bike className="h-7 w-7" />
              LOG A RIDE
            </button>
            <Link to="/race">
              <button className="tape-element flex h-full items-center justify-center gap-2 px-5 py-5 text-base md:text-lg">
                🏁 RACE
              </button>
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="border-[2px] border-secondary bg-card p-3 text-center hover-bounce">
              <Target className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Challenge</p>
              <p className="font-display text-xs font-bold text-foreground">
                {challenges.find(c => !c.completed)?.title ?? "All done!"}
              </p>
            </div>
            <div className="border-[2px] border-secondary bg-card p-3 text-center hover-bounce">
              <Flame className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Streak</p>
              <p className="font-display text-lg font-bold text-accent">{streak}</p>
            </div>
            <div className="border-[2px] border-secondary bg-card p-3 text-center hover-bounce">
              <Calendar className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This Week</p>
              <p className="font-display text-lg font-bold text-accent">{thisWeekSessions.length} rides</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ MID PHASE SURVEY BANNER ═══ */}
        {showMidPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-4 border-[3px] border-accent bg-accent/10 p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-accent" />
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Mid Phase Check-in Ready
              </p>
              <p className="font-body text-xs text-muted-foreground">
                It's been 4 weeks — time for a quick check-in survey!
              </p>
            </div>
            <Link to="/survey?phase=Mid Phase">
              <Button size="sm" className="tape-element font-display text-xs uppercase tracking-wider">
                Start
              </Button>
            </Link>
            <button onClick={() => {
              setShowMidPrompt(false);
              if (user?.id && user?.email) dismissSurvey("Mid Phase", user.id, user.email);
            }}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </motion.div>
        )}

        {showPostPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-4 border-[3px] border-primary bg-primary/10 p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <ClipboardCheck className="h-6 w-6 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                End-of-Programme Survey
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Complete your end-of-programme survey to help us improve FreeWheeler for Sport NZ.
              </p>
            </div>
            <Link to="/survey?phase=Post Phase">
              <Button size="sm" className="tape-element-green font-display text-xs uppercase tracking-wider">
                Start Survey
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ═══ DETAILED STATS (collapsible) ═══ */}
        <details className="group mb-6 border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <summary className="flex cursor-pointer items-center gap-2 p-4 font-display text-sm font-bold uppercase tracking-wider text-foreground select-none list-none [&::-webkit-details-marker]:hidden">
            <BarChart3 className="h-5 w-5 text-primary" />
            Detailed Stats
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="grid grid-cols-2 gap-3 border-t-[2px] border-secondary p-4 sm:grid-cols-3 md:grid-cols-5">
            <StatCard icon={Clock} value={riderTotals ? `${riderTotals.totalHours}h` : "0h"} label="Total Time" isFormatted index={0} />
            <StatCard icon={MapPin} value={riderTotals ? `${riderTotals.totalDistance}` : "0"} label="Distance (km)" isFormatted index={1} />
            <StatCard icon={Mountain} value={riderTotals?.totalElevation ?? 0} label="Elevation (m)" index={2} />
            <StatCard icon={Gauge} value={riderTotals ? `${riderTotals.avgSpeed}` : "0"} label="Avg Speed" isFormatted index={3} />
            <StatCard icon={TrendingUp} value={moodImprovement ?? "—"} label="Mood Change" isFormatted index={4} />
          </div>
        </details>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
          >
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                Surveys
              </h3>
            </div>
            <div className="grid gap-2">
              {[
                { phase: "Pre Phase", label: "Pre Phase Survey", always: true },
                { phase: "Mid Phase", label: "Mid Phase Survey (4 weeks)", always: true },
                { phase: "Post Phase", label: "Post Phase Survey", always: true },
              ].map(({ phase, label }) => {
                const done = isSurveyCompleted(phase, user.email!);
                return (
                  <div
                    key={phase}
                    className={`flex items-center gap-3 border-[2px] p-3 transition-all ${
                      done ? "border-primary/30 bg-primary/5" : "border-secondary bg-card"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <div className="h-5 w-5 shrink-0 border-[2px] border-muted" />
                    )}
                    <span className="flex-1 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                      {label}
                    </span>
                    {done ? (
                      <span className="font-display text-[10px] uppercase tracking-wider text-primary">
                        ✅ Completed
                      </span>
                    ) : (
                      <Link to={`/survey?phase=${encodeURIComponent(phase)}`}>
                        <Button size="sm" variant="outline" className="font-display text-xs uppercase tracking-wider">
                          Start
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ INTER-SCHOOL CHALLENGES ═══ */}
        {interSchoolProgress.length > 0 && (
          <div className="mb-6">
            <ChallengesDashboard
              challengeProgress={interSchoolProgress}
              teamRankings={teamRankings}
              studentSchoolId={mySchoolId}
            />
          </div>
        )}

        {/* ═══ TWO-COLUMN: Recent Rides + Top Riders ═══ */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Recent Rides */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
          >
            <div className="leaderboard-header flex items-center justify-between px-5 py-3">
              <h3 className="flex items-center gap-2 text-base tracking-wider">
                <Clock className="h-4 w-4" /> Recent Rides
              </h3>
              <button
                onClick={() => setLogOpen(true)}
                className="tape-element py-1 px-3 text-[10px] no-underline cursor-pointer"
              >
                LOG NEW
              </button>
            </div>
            {rideSessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bike className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-display text-lg uppercase text-muted-foreground">No rides yet</p>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  Log your first ride to start tracking!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-muted">
                {rideSessions.slice(0, 5).map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    <button
                      onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                      className="w-full text-left px-5 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-secondary">
                          <Bike className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold uppercase text-foreground">
                              {formatFriendlyDate(session.date)}
                            </span>
                            {session.points > 0 && (
                              <span className="font-display text-xs font-bold text-primary">
                                +{session.points} pts
                              </span>
                            )}
                          </div>
                          {/* All metrics with icons, no mood faces */}
                          <div className="mt-1 flex flex-wrap items-center gap-3 font-body text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" /> {Math.round(session.duration_minutes)} min
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {session.distance_km} km
                            </span>
                            {session.elevation_m > 0 && (
                              <span className="flex items-center gap-1">
                                <Mountain className="h-3 w-3" /> {session.elevation_m} m
                              </span>
                            )}
                            {session.avg_speed_kmh > 0 && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" /> {session.avg_speed_kmh} km/h
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedSession === session.id ? "rotate-90" : ""
                        }`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedSession === session.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-muted bg-muted/50 px-5 py-3"
                        >
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Duration</p>
                              <p className="font-display text-lg font-bold text-foreground">{Math.round(session.duration_minutes)} min</p>
                            </div>
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Distance</p>
                              <p className="font-display text-lg font-bold text-primary">{session.distance_km} km</p>
                            </div>
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Mountain className="h-3 w-3" /> Elevation</p>
                              <p className="font-display text-lg font-bold text-foreground">{session.elevation_m} m</p>
                            </div>
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Avg Speed</p>
                              <p className="font-display text-lg font-bold text-foreground">{session.avg_speed_kmh} km/h</p>
                            </div>
                          </div>
                          {/* Points breakdown */}
                          <div className="mt-2 flex items-center gap-1 font-display text-xs text-primary">
                            <Zap className="h-3 w-3" /> {session.points} points earned this session
                          </div>
                          {session.reflection && (
                            <p className="mt-2 font-body text-sm text-foreground/70 italic">
                              "{session.reflection}"
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Leaderboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
          >
            <div className="leaderboard-header flex items-center justify-between px-5 py-3">
              <h3 className="flex items-center gap-2 text-base tracking-wider">
                <Trophy className="h-4 w-4" /> Top Riders
              </h3>
              <Link
                to="/leaderboards"
                className="flex items-center gap-1 font-body text-xs text-primary-foreground/80 hover:text-primary-foreground"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-muted">
              {schoolRiders.length === 0 ? (
                <div className="px-5 py-8 text-center font-body text-sm text-muted-foreground">
                  No riders with sessions yet.
                </div>
              ) : (
                schoolRiders.map((rider, i) => (
                  <motion.div
                    key={rider.rank}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      rider.isCurrentUser ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <div className={`rank-badge flex-shrink-0 text-xs ${
                      rider.rank <= 3 ? "bg-accent text-accent-foreground" : ""
                    }`}>
                      {rider.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-display text-sm font-bold uppercase ${
                          rider.isCurrentUser ? "text-primary" : "text-foreground"
                        }`}>
                          {rider.name} {rider.isCurrentUser && "(You)"}
                        </span>
                        <Badge variant="secondary" className="text-[8px]">
                          {rider.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> {rider.points}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bike className="h-3 w-3" /> {rider.sessions}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* ═══ CHALLENGES (full width, below leaderboard + rides) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Challenges
            </h3>
            <span className="ml-auto font-display text-xs text-muted-foreground">
              {challenges.filter(c => c.completed).length}/{challenges.length} completed
            </span>
          </div>

          {/* Daily */}
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Daily
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            {dailyChallenges.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i} />
            ))}
          </div>

          {/* Weekly */}
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Timer className="h-3 w-3" /> Weekly
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            {weeklyChallenges.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i + 4} />
            ))}
          </div>

          {/* Milestones */}
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Award className="h-3 w-3" /> Milestones
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {milestoneChallenges.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i + 12} />
            ))}
          </div>
        </motion.div>

        {/* ═══ ACHIEVEMENTS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Achievements
            </h3>
            <span className="ml-auto font-display text-xs text-muted-foreground">
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-8">
            {achievements.map((a, i) => (
              <AchievementBadge key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ═══ STREAK MILESTONES ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6 border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary animate-flame-flicker" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Streak Milestones
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {[3, 5, 7, 14, 30].map((m) => {
              const reached = riderTotals?.streakMilestones.includes(m) ?? false;
              return (
                <motion.div
                  key={m}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.8 }}
                  className={`flex flex-col items-center gap-1 border-[3px] p-3 ${
                    reached
                      ? "border-primary bg-secondary shadow-[0_0_12px_hsl(var(--brand-neon)/0.3)]"
                      : "border-muted bg-muted opacity-40"
                  }`}
                >
                  <Flame className={`h-6 w-6 ${reached ? "text-accent animate-flame-flicker" : "text-muted-foreground"}`} />
                  <span className="font-display text-sm font-bold text-foreground">{m} Days</span>
                  <span className="font-display text-[10px] text-primary">
                    +{({ 3: 5, 5: 10, 7: 20, 14: 40, 30: 100 } as Record<number, number>)[m]} pts
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ POINTS BREAKDOWN ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-6 border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              How Points Work
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Bike, label: "Ride Completion", value: "10 pts" },
              { icon: Timer, label: "Time Bonus", value: "+1 pt / 10 min" },
              { icon: MapPin, label: "Distance Bonus", value: "+1 pt / 5 km" },
              { icon: Mountain, label: "Elevation Bonus", value: "+1 pt / 25 m" },
              { icon: Mountain, label: "Hard Course (150m+)", value: "+5 to +15 pts" },
              { icon: Gauge, label: "Speed (20+ km/h)", value: "+2 to +6 pts" },
              { icon: Clock, label: "Long Ride (45+ min)", value: "+5 to +10 pts" },
              { icon: Flame, label: "Streak Milestones", value: "+5 to +100 pts" },
              { icon: Target, label: "Challenge Rewards", value: "+5 to +50 pts" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 border-[2px] border-secondary bg-muted p-3">
                <item.icon className="h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{item.label}</p>
                </div>
                <span className="font-display text-xs font-bold text-accent whitespace-nowrap">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <SessionFeedbackForm open={logOpen} onOpenChange={handleLogClose} />
    </div>
  );
};

export default Dashboard;
