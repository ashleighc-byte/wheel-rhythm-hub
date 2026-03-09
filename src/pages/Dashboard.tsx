import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bike, Clock, MapPin, TrendingUp, Trophy, Activity, Plus, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import LevelProgress from "@/components/LevelProgress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, fetchSessionReflections, callAirtable, hasCompletedFourWeekCheckIn, isValidRecordId } from "@/lib/airtable";
import { getTotalPoints } from "@/lib/points";
import { formatFriendlyDate } from "@/lib/dateFormat";

const moodEmojis = ["😞", "😕", "😐", "🙂", "😁"];

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

function parseSessionData(raw: any): SessionDataJSON | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (typeof raw === "object") return raw as SessionDataJSON;
  } catch { /* ignore */ }
  return null;
}

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

  const hasIdentity = !!user?.email || !!nfcSession;

  // 4-week check-in trigger — skip for NFC users
  useEffect(() => {
    if (nfcSession) return;
    if (!user?.email || !user?.created_at || role !== "student") return;
    const createdAt = new Date(user.created_at);
    const fourWeeksLater = new Date(createdAt.getTime() + 28 * 24 * 60 * 60 * 1000);
    if (new Date() < fourWeeksLater) return;

    hasCompletedFourWeekCheckIn(user.email).then((done) => {
      if (!done) {
        navigate("/four-week-check-in", { replace: true });
      }
    }).catch(console.error);
  }, [user?.email, user?.created_at, role, navigate, nfcSession]);

  const loadData = async () => {
    if (!hasIdentity) {
      setLoading(false);
      return;
    }
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
      } else {
        setLoading(false);
        return;
      }

      if (studentsRes.records.length === 0) {
        setLoading(false);
        return;
      }
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
            totalMinutes: Number(s.fields["Total minutes Rollup (from Session Reflections)"] ?? 0),
          }))
          .sort((a, b) => b.totalMinutes - a.totalMinutes);

        const rank = schoolmates.findIndex((s) => s.id === rec.id) + 1;
        setSchoolRank(rank > 0 ? rank : null);
      }

      setStudent(studentData);

      // Map sessions — parse Session Data Table JSON
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

      // Mood improvement
      const withMood = mapped.filter((s) => s.feelingBefore > 0 && s.feelingAfter > 0);
      if (withMood.length > 0) {
        const avgChange =
          withMood.reduce((sum, s) => sum + (s.feelingAfter - s.feelingBefore), 0) / withMood.length;
        setMoodImprovement(avgChange >= 0 ? `+${avgChange.toFixed(1)}` : avgChange.toFixed(1));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.email, nfcSession?.studentId]);

  const handleLogClose = (open: boolean) => {
    setLogOpen(open);
    if (!open) {
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="font-display text-xl uppercase tracking-wider text-foreground animate-pulse">
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  const firstName = student?.name.split(" ")[0] ?? nfcSession?.firstName ?? "Rider";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl text-foreground md:text-5xl">
              Hey, {firstName}! 👋
            </h1>
            <p className="mt-2 font-body text-lg text-muted-foreground">
              {student?.school ? student.school : ""}{schoolRank ? ` · Rank #${schoolRank}` : ""}
            </p>
          </div>
          <Button
            onClick={() => setLogOpen(true)}
            className="tape-element-green flex items-center gap-2 text-lg transition-transform hover:rotate-0 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Log a Ride
          </Button>
        </motion.div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { icon: Bike, value: student?.totalSessions ?? 0, label: "Total Rides" },
            { icon: MapPin, value: Math.round(student?.totalKm ?? 0), label: "Total KM" },
            { icon: Clock, value: student?.totalTimeFormatted ?? "0:00", label: "Total Time", isFormatted: true },
            { icon: Zap, value: student?.totalPoints ?? 0, label: "Total Points" },
            { icon: TrendingUp, value: moodImprovement ?? "—", label: "Avg Mood Change", isFormatted: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card flex flex-col items-center px-4 py-6"
            >
              <stat.icon className="mb-2 h-6 w-6 text-primary" />
              <div className="font-display text-3xl font-bold text-accent md:text-4xl">
                {stat.isFormatted ? stat.value : Number(stat.value).toLocaleString()}
              </div>
              <div className="mt-1 font-display text-[10px] font-semibold uppercase tracking-widest text-accent/70">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Level Progress */}
        <div className="mb-10">
          <LevelProgress totalPoints={student?.totalPoints ?? 0} />
        </div>

        {/* Rank + Mood cards */}
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              School Rank
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-primary">
                {schoolRank ? `#${schoolRank}` : "—"}
              </span>
              <span className="font-body text-muted-foreground">
                at {schoolName || "your school"}
              </span>
            </div>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Keep riding to climb the leaderboard!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Mood Improvement
            </div>
            <div className="mt-4 font-display text-5xl font-bold text-primary">
              {moodImprovement ?? "—"}
            </div>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Average mood change before vs after riding (1–5 scale)
            </p>
          </motion.div>
        </div>

        {/* Recent sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <div className="leaderboard-header flex items-center justify-between px-6 py-4">
            <h3 className="text-xl tracking-wider">Recent Sessions</h3>
            <button
              onClick={() => setLogOpen(true)}
              className="tape-element py-1 px-4 text-xs no-underline cursor-pointer"
            >
              LOG NEW SESSION
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bike className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="font-display text-lg uppercase text-muted-foreground">No rides logged yet</p>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Log your first ride to see your stats here!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[3px] border-secondary bg-accent">
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">KM</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground hidden sm:table-cell">Speed</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground hidden sm:table-cell">Elev.</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Pts</th>
                    <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Mood</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {sessions.map((session, i) => (
                    <motion.tr
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="transition-colors hover:bg-muted"
                    >
                      <td className="px-4 py-4 font-body text-sm text-foreground">{session.date}</td>
                      <td className="px-4 py-4 font-display text-lg font-bold text-primary">{session.km}</td>
                      <td className="px-4 py-4 font-body text-sm text-foreground">{session.minutes}</td>
                      <td className="px-4 py-4 font-body text-sm text-foreground hidden sm:table-cell">
                        {session.speed != null ? `${session.speed} km/h` : "—"}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-foreground hidden sm:table-cell">
                        {session.elevation != null ? `${session.elevation}m` : "—"}
                      </td>
                      <td className="px-4 py-4 font-display text-sm font-bold text-primary">
                        {session.points > 0 ? `+${session.points}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-lg">
                        {session.feelingBefore > 0 && session.feelingAfter > 0
                          ? `${moodEmojis[session.feelingBefore - 1]} → ${moodEmojis[session.feelingAfter - 1]}`
                          : "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Session logging dialog */}
      <SessionFeedbackForm open={logOpen} onOpenChange={handleLogClose} />
    </div>
  );
};

export default Dashboard;
