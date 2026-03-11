import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike, Clock, MapPin, TrendingUp, Trophy, Activity, Plus, Zap,
  Frown, Meh, Smile, Laugh, Flame, Target, Award, Star,
  ChevronRight, Timer, Calendar, Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import LevelProgress, { getLevel, getLevelName } from "@/components/LevelProgress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchStudents, fetchSessionReflections, callAirtable,
  hasCompletedFourWeekCheckIn, isValidRecordId
} from "@/lib/airtable";
import { getTotalPoints } from "@/lib/points";
import { formatFriendlyDate } from "@/lib/dateFormat";
import artEliteRider from "@/assets/art-elite-rider.jpeg";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────
interface SessionDataJSON {
  distance_km?: number | string;
  duration_hh_mm_ss?: string;
  speed_kmh?: number | string;
  elevation_m?: number | string;
}

interface StudentData {
  name: string;
  school: string;
  totalSessions: number;
  totalKm: number;
  totalMinutes: number;
  totalTimeFormatted: string;
  totalPoints: number;
  recordId: string;
}

interface SessionRow {
  id: string;
  date: string;
  km: number;
  minutes: string;
  feelingBefore: number;
  feelingAfter: number;
  reflection: string;
  speed: number | null;
  elevation: number | null;
  points: number;
}

interface SchoolmateRider {
  rank: number;
  name: string;
  points: number;
  sessions: number;
  isCurrentUser: boolean;
}

// ── Helpers ───────────────────────────────────────────────
const moodIcons = [Frown, Frown, Meh, Smile, Laugh];
const moodColors = [
  "text-destructive", "text-destructive/70",
  "text-muted-foreground", "text-primary", "text-accent"
];

function parseSessionData(raw: any): SessionDataJSON | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (typeof raw === "object") return raw as SessionDataJSON;
  } catch { /* ignore */ }
  return null;
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

function computeStreak(sessions: SessionRow[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1]);
    const prev = new Date(uniqueDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) streak++;
    else break;
  }
  return streak;
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, isFormatted, index }: {
  icon: any; value: number | string; label: string; isFormatted?: boolean; index: number;
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
      </div>
      <div className="mt-1 font-display text-[9px] font-semibold uppercase tracking-widest text-accent/70 md:text-[10px]">
        {label}
      </div>
    </motion.div>
  );
}

// ── Challenge Card ────────────────────────────────────────
function ChallengeCard({ icon: Icon, title, current, goal, reward, index }: {
  icon: any; title: string; current: number; goal: number; reward: number; index: number;
}) {
  const progress = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className={`border-[3px] bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce ${
        isComplete ? "border-primary" : "border-secondary"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${
          isComplete ? "bg-primary" : "bg-secondary"
        }`}>
          {isComplete ? (
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          ) : (
            <Icon className={`h-5 w-5 ${isComplete ? "text-primary-foreground" : "text-accent"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </p>
          <div className="mt-2 h-3 w-full border-[2px] border-secondary bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
              className={`h-full ${isComplete ? "bg-primary" : "bg-accent"}`}
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

// ── Badge ─────────────────────────────────────────────────
function AchievementBadge({ icon: Icon, title, unlocked, index }: {
  icon: any; title: string; unlocked: boolean; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.08, type: "spring" }}
      className={`flex flex-col items-center gap-2 p-3 text-center transition-all ${
        unlocked ? "" : "opacity-30 grayscale"
      }`}
    >
      <div className={`flex h-14 w-14 items-center justify-center border-[3px] ${
        unlocked
          ? "border-primary bg-secondary shadow-[0_0_12px_hsl(var(--brand-neon)/0.4)]"
          : "border-muted bg-muted"
      }`}>
        <Icon className={`h-7 w-7 ${unlocked ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      <span className="font-display text-[10px] font-bold uppercase tracking-wider text-foreground">
        {title}
      </span>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
const Dashboard = () => {
  const { user, role, nfcSession } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [schoolRank, setSchoolRank] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [moodImprovement, setMoodImprovement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [schoolRiders, setSchoolRiders] = useState<SchoolmateRider[]>([]);

  const hasIdentity = !!user?.email || !!nfcSession;
  const streak = computeStreak(sessions);
  const totalPoints = student?.totalPoints ?? 0;
  const { current: currentLevel } = getLevel(totalPoints);

  // ── 4-week check-in redirect ──
  useEffect(() => {
    if (nfcSession) return;
    if (!user?.email || !user?.created_at || role !== "student") return;
    const createdAt = new Date(user.created_at);
    const fourWeeksLater = new Date(createdAt.getTime() + 28 * 24 * 60 * 60 * 1000);
    if (new Date() < fourWeeksLater) return;
    hasCompletedFourWeekCheckIn(user.email).then((done) => {
      if (!done) navigate("/four-week-check-in", { replace: true });
    }).catch(console.error);
  }, [user?.email, user?.created_at, role, navigate, nfcSession]);

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

      const studentData: StudentData = {
        name: String(f["Full Name"] ?? ""),
        school: "",
        totalSessions: Number(f["Count (Session Reflections)"] ?? 0),
        totalKm: Number(f["Total km  Rollup (from Session Reflections)"] ?? 0),
        totalMinutes: Number(f["Total minutes Rollup (from Session Reflections)"] ?? 0),
        totalTimeFormatted: String(f["Total Time (h:mm)"] ?? "0:00"),
        totalPoints: Number(f["Total Points"] ?? 0),
        recordId: rec.id,
      };

      const [orgsRes, allStudentsRes, sessionsRes] = await Promise.all([
        callAirtable("Organisations", "GET"),
        callAirtable("Student Registration", "GET"),
        fetchSessionReflections(sessionIds),
      ]);

      // Points from Supabase
      const { data: pointsRows } = await supabase
        .from("student_points")
        .select("airtable_student_id, total_points");
      const pointsMap = new Map<string, number>();
      if (pointsRows) {
        for (const row of pointsRows) {
          const prev = pointsMap.get(row.airtable_student_id) ?? 0;
          pointsMap.set(row.airtable_student_id, prev + row.total_points);
        }
      }

      if (schoolIds?.length) {
        const org = orgsRes.records.find((o) => o.id === schoolIds[0]);
        studentData.school = org ? String(org.fields["Organisation Name"] ?? "") : "";
        setSchoolName(studentData.school);

        const schoolmates = allStudentsRes.records
          .filter((s) => {
            const sSchool = s.fields["School"] as string[] | undefined;
            return sSchool?.[0] === schoolIds[0];
          })
          .map((s) => ({
            id: s.id,
            name: String(s.fields["Full Name"] ?? ""),
            sessions: Number(s.fields["Count (Session Reflections)"] ?? 0),
            totalPoints: pointsMap.get(s.id) ?? 0,
            totalMinutes: Number(s.fields["Total minutes Rollup (from Session Reflections)"] ?? 0),
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints);

        const rank = schoolmates.findIndex((s) => s.id === rec.id) + 1;
        setSchoolRank(rank > 0 ? rank : null);

        setSchoolRiders(
          schoolmates.slice(0, 5).map((s, i) => ({
            rank: i + 1,
            name: s.name,
            points: s.totalPoints,
            sessions: s.sessions,
            isCurrentUser: s.id === rec.id,
          }))
        );
      }

      if (user?.id) {
        try {
          const supabasePoints = await getTotalPoints(user.id);
          if (supabasePoints > 0) studentData.totalPoints = supabasePoints;
        } catch {}
      }

      setStudent(studentData);

      const mapped: SessionRow[] = sessionsRes.records
        .map((s) => {
          const sessionJson = parseSessionData(s.fields["Session Data Table"]);
          return {
            id: s.id,
            date: String(s.fields["Auto date"] ?? s.createdTime).slice(0, 10),
            km: Number(s.fields["Total km "] ?? sessionJson?.distance_km ?? 0),
            minutes: String(s.fields["Total minutes"] ?? sessionJson?.duration_hh_mm_ss ?? "0:00"),
            feelingBefore: Number(s.fields["How did you feel before you jumped on the bike?"] ?? 0),
            feelingAfter: Number(s.fields["How did you feel after your bike session today?"] ?? 0),
            reflection: String(s.fields["What did you enjoy or not enjoy about today's session?"] ?? ""),
            speed: sessionJson?.speed_kmh ? Number(sessionJson.speed_kmh) : null,
            elevation: sessionJson?.elevation_m ? Number(sessionJson.elevation_m) : null,
            points: Number(s.fields["Points Earned"] ?? 0),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      setSessions(mapped);

      const withMood = mapped.filter((s) => s.feelingBefore > 0 && s.feelingAfter > 0);
      if (withMood.length > 0) {
        const avgChange = withMood.reduce((sum, s) => sum + (s.feelingAfter - s.feelingBefore), 0) / withMood.length;
        setMoodImprovement(avgChange >= 0 ? `+${avgChange.toFixed(1)}` : avgChange.toFixed(1));
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

  // ── Challenges computed from session data ──
  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  });
  const totalMinutesNum = student?.totalMinutes ?? 0;
  const bestSessionKm = sessions.length > 0 ? Math.max(...sessions.map(s => s.km)) : 0;

  const challenges = [
    { icon: Target, title: "Ride 3 times this week", current: thisWeekSessions.length, goal: 3, reward: 5 },
    { icon: Timer, title: "Ride 100 total minutes", current: Math.round(totalMinutesNum), goal: 100, reward: 10 },
    { icon: Flame, title: "Build a 5-ride streak", current: streak, goal: 5, reward: 15 },
  ];

  // ── Achievements ──
  const totalRides = student?.totalSessions ?? 0;
  const achievements = [
    { icon: Bike, title: "First Ride", unlocked: totalRides >= 1 },
    { icon: Flame, title: "5 Ride Streak", unlocked: streak >= 5 },
    { icon: Clock, title: "100 Minutes", unlocked: totalMinutesNum >= 100 },
    { icon: Trophy, title: "Top 3", unlocked: (schoolRank ?? 99) <= 3 },
    { icon: Star, title: "50 Points", unlocked: totalPoints >= 50 },
    { icon: Award, title: "Level Up", unlocked: totalPoints >= 50 },
  ];

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

  const firstName = student?.name.split(" ")[0] ?? nfcSession?.firstName ?? "Rider";

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
                {/* Rider avatar */}
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
                      {student?.school || ""}
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
                      <span className="flex items-center gap-1 border-[2px] border-accent bg-accent px-2 py-0.5 font-display text-[10px] font-bold uppercase text-accent-foreground">
                        <Flame className="h-3 w-3" /> {streak} streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          <StatCard icon={Bike} value={student?.totalSessions ?? 0} label="Total Rides" index={0} />
          <StatCard icon={Clock} value={student?.totalTimeFormatted ?? "0:00"} label="Total Time" isFormatted index={1} />
          <StatCard icon={Zap} value={student?.totalPoints ?? 0} label="Total Points" index={2} />
          <StatCard icon={TrendingUp} value={moodImprovement ?? "—"} label="Mood Change" isFormatted index={3} />
          <StatCard icon={Flame} value={streak} label="Current Streak" index={4} />
        </div>

        {/* ═══ LOG A RIDE CTA ═══ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={() => setLogOpen(true)}
            className="tape-element-green flex w-full items-center justify-center gap-3 py-5 text-xl md:text-2xl"
          >
            <Bike className="h-7 w-7" />
            LOG A RIDE
          </button>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="border-[2px] border-secondary bg-card p-3 text-center hover-bounce">
              <Target className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Challenge</p>
              <p className="font-display text-xs font-bold text-foreground">
                {challenges.find(c => c.current < c.goal)?.title ?? "All done!"}
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

        {/* ═══ LEVEL PROGRESS ═══ */}
        <div className="mb-6">
          <LevelProgress totalPoints={totalPoints} />
        </div>

        {/* ═══ TWO-COLUMN: Leaderboard + Challenges ═══ */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Leaderboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
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
                    initial={{ opacity: 0, x: -10 }}
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
                      <span className={`font-display text-sm font-bold uppercase ${
                        rider.isCurrentUser ? "text-primary" : "text-foreground"
                      }`}>
                        {rider.name} {rider.isCurrentUser && "(You)"}
                      </span>
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

          {/* Challenges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                Challenges
              </h3>
            </div>
            <div className="space-y-3">
              {challenges.map((c, i) => (
                <ChallengeCard key={c.title} {...c} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ═══ RECENT RIDES ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
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
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bike className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="font-display text-lg uppercase text-muted-foreground">No rides yet</p>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Log your first ride to start tracking!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-muted">
              {sessions.slice(0, 5).map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                >
                  <button
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                    className="w-full text-left px-5 py-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
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
                        <div className="mt-1 flex items-center gap-4 font-body text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {session.minutes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {session.km} km
                          </span>
                          {session.feelingBefore > 0 && session.feelingAfter > 0 && (
                            <span className="flex items-center gap-1">
                              <MoodIcon value={session.feelingBefore} />
                              <ChevronRight className="h-3 w-3" />
                              <MoodIcon value={session.feelingAfter} />
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
                            <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
                            <p className="font-display text-lg font-bold text-primary">{session.km} km</p>
                          </div>
                          <div>
                            <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
                            <p className="font-display text-lg font-bold text-foreground">{session.minutes}</p>
                          </div>
                          {session.speed != null && (
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Speed</p>
                              <p className="font-display text-lg font-bold text-foreground">{session.speed} km/h</p>
                            </div>
                          )}
                          {session.elevation != null && (
                            <div>
                              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Elevation</p>
                              <p className="font-display text-lg font-bold text-foreground">{session.elevation}m</p>
                            </div>
                          )}
                        </div>
                        {session.reflection && (
                          <p className="mt-3 font-body text-sm text-foreground/70 italic">
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
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {achievements.map((a, i) => (
              <AchievementBadge key={a.title} {...a} index={i} />
            ))}
          </div>
        </motion.div>

      </div>

      <SessionFeedbackForm open={logOpen} onOpenChange={handleLogClose} />
    </div>
  );
};

export default Dashboard;
