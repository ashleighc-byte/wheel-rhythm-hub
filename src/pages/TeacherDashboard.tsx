import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  fetchTeacherOrgFull,
  fetchStudentsByIds,
  fetchAllSurveysForStudents,
  fetchSessionsByRecordIds,
  fetchOrgsInRegion,
  fetchAllStudentsForOrgs,
  isSuperAdmin,
  OrgInfo,
  callAirtable,
} from "@/lib/airtable";
import type { AirtableRecord } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Users, Clock, Bike, MessageSquare, Filter, Globe, QrCode } from "lucide-react";
import StudentQRCodes from "@/components/StudentQRCodes";
import TeacherObservationForm from "@/components/TeacherObservationForm";
import AdminChallengesView from "@/components/AdminChallengesView";
import RoleManagement from "@/components/RoleManagement";
import { Button } from "@/components/ui/button";
import {
  CHALLENGE_DEFINITIONS,
  calculateAllChallengeProgress,
  calculateTeamRankings,
  parseSessionsForChallenges,
  type TeamRanking,
} from "@/lib/challenges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { formatFriendlyDate } from "@/lib/dateFormat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentRow {
  id: string;
  name: string;
  school: string;
  sessions: number;
  points: number;
  prePilot: boolean;
  fourWeek: boolean;
  postPilot: boolean;
  nfcToken?: string;
}

interface SessionRow {
  studentName: string;
  date: string;
  km: string | number;
  time: string | number;
  moodBefore: string | number;
  moodAfter: string | number;
}

interface NudgeRecord {
  student_id: string;
  nudged_at: string;
}

const StatusIcon = ({ done }: { done: boolean }) =>
  done ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />
  ) : (
    <XCircle className="mx-auto h-5 w-5 text-muted-foreground/40" />
  );

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observationOpen, setObservationOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Super admin school filter
  const [schoolOptions, setSchoolOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");

  // Challenge state
  const [challengeSchoolStats, setChallengeSchoolStats] = useState<any[]>([]);
  const [challengeTeamRankings, setChallengeTeamRankings] = useState<TeamRanking[]>([]);

  // Nudge state
  const [nudges, setNudges] = useState<Map<string, string>>(new Map());
  const [nudgeTarget, setNudgeTarget] = useState<StudentRow | null>(null);
  const [nudging, setNudging] = useState(false);

  // Load existing nudges
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("student_nudges")
      .select("student_id, nudged_at")
      .eq("nudged_by", user.id)
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, string>();
          data.forEach((n: NudgeRecord) => map.set(n.student_id, n.nudged_at));
          setNudges(map);
        }
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      try {
        setLoading(true);
        const org = await fetchTeacherOrgFull(user.email!);
        if (!org) {
          setError("Could not find your organisation. Make sure your email matches the Organisations table.");
          return;
        }
        setOrgInfo(org);
        const isSA = isSuperAdmin(org);
        setSuperAdmin(isSA);

        let allStudentIds: string[] = [];
        let orgMap = new Map<string, string>(); // orgId -> orgName

        if (isSA) {
          // Fetch all orgs in region
          const regionOrgs = await fetchOrgsInRegion(org.region);
          const schools: { id: string; name: string }[] = [];
          for (const o of regionOrgs.records) {
            const name = String(o.fields["Organisation Name"] || "");
            orgMap.set(o.id, name);
            // Only include orgs that have students
            const studentIds = Array.isArray(o.fields["Student Registration"]) ? o.fields["Student Registration"] : [];
            if (studentIds.length > 0) {
              schools.push({ id: o.id, name });
            }
          }
          setSchoolOptions(schools.sort((a, b) => a.name.localeCompare(b.name)));

          allStudentIds = await fetchAllStudentsForOrgs(regionOrgs.records);
        } else {
          allStudentIds = org.studentRecordIds;
          orgMap.set(org.id, org.name);
        }

        if (!allStudentIds.length) {
          setStudents([]);
          setSessions([]);
          return;
        }

        // Fetch all student records
        const studentData = await fetchStudentsByIds(allStudentIds);
        const studentRecords = studentData.records;

        if (!studentRecords.length) {
          setStudents([]);
          setSessions([]);
          return;
        }

        // Also fetch all orgs to map school names for students
        if (isSA) {
          // orgMap already populated above
        } else {
          // For teachers, fetch org name
          const allOrgs = await callAirtable("Organisations", "GET");
          for (const o of allOrgs.records) {
            orgMap.set(o.id, String(o.fields["Organisation Name"] || ""));
          }
        }

        const studentIds = studentRecords.map((r) => r.id);

        // Fetch points from Supabase
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

        // Surveys
        const surveyData = await fetchAllSurveysForStudents(studentIds);
        const surveyRecords = surveyData.records;

        const surveyMap: Record<string, { prePilot: boolean; fourWeek: boolean; postPilot: boolean }> = {};
        for (const id of studentIds) {
          surveyMap[id] = { prePilot: false, fourWeek: false, postPilot: false };
        }

        for (const survey of surveyRecords) {
          const phase: string = survey.fields["Phase"] || "";
          const linkedStudents: string[] = Array.isArray(survey.fields["Student Name"])
            ? survey.fields["Student Name"]
            : [];
          for (const sid of linkedStudents) {
            if (surveyMap[sid]) {
              if (phase === "Pre Phase") surveyMap[sid].prePilot = true;
              if (phase === "Mid Phase") surveyMap[sid].fourWeek = true;
              if (phase === "Post Phase") surveyMap[sid].postPilot = true;
            }
          }
        }

        const rows: StudentRow[] = studentRecords.map((rec) => {
          const schoolIds = rec.fields["School"] as string[] | undefined;
          const schoolName = schoolIds?.[0] ? orgMap.get(schoolIds[0]) || "" : "";
          return {
            id: rec.id,
            name: rec.fields["Full Name"] || "—",
            school: schoolName,
            sessions: rec.fields["Count (Session Reflections)"] || 0,
            points: pointsMap.get(rec.id) ?? 0,
            nfcToken: String(rec.fields["NFC Bracelet Token"] ?? ""),
            ...surveyMap[rec.id],
          };
        });
        rows.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(rows);

        // Sessions
        const allSessionIds: string[] = [];
        const sessionStudentMap: Record<string, string> = {};
        for (const rec of studentRecords) {
          const sIds: string[] = rec.fields["Session Reflections"] || [];
          const name: string = rec.fields["Full Name"] || "—";
          for (const sid of sIds) {
            allSessionIds.push(sid);
            sessionStudentMap[sid] = name;
          }
        }

        const sessionData = await fetchSessionsByRecordIds(allSessionIds.slice(0, 40));
        const sessionRows: SessionRow[] = sessionData.records
          .map((rec) => {
            const dateRaw: string = rec.fields["Auto date"] || rec.createdTime || "";
            const date = dateRaw
              ? new Date(dateRaw).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })
              : "—";
            return {
              studentName: sessionStudentMap[rec.id] || "—",
              date,
              km: rec.fields["Total km "] ?? "—",
              time: rec.fields["Total minutes"] ?? "—",
              moodBefore: rec.fields["How did you feel before you jumped on the bike?"] ?? "—",
              moodAfter: rec.fields["How did you feel after your bike session today?"] ?? "—",
              _dateRaw: dateRaw,
            };
          })
          .sort((a: any, b: any) => new Date(b._dateRaw).getTime() - new Date(a._dateRaw).getTime())
          .slice(0, 20);
        setSessions(sessionRows);

        // ── Inter-School Challenge Stats ──
        try {
          const studentSchoolMap = new Map<string, string>();
          const schoolNameMap = new Map<string, string>();
          for (const s of studentRecords) {
            const sSchool = s.fields["School"] as string[] | undefined;
            if (sSchool?.[0]) studentSchoolMap.set(s.id, sSchool[0]);
          }
          for (const [id, name] of orgMap) {
            schoolNameMap.set(id, name);
          }

          const allSessionsRes = await callAirtable("Session Reflections", "GET");
          const challengeSessions = parseSessionsForChallenges(allSessionsRes.records, studentSchoolMap);

          // Per-school completion stats
          const individualDefs = CHALLENGE_DEFINITIONS.filter(d => d.mode !== 'team');
          const schoolStatsMap = new Map<string, { schoolId: string; schoolName: string; totalStudents: number; completionsByChallenge: Record<string, number> }>();

          // Group students by school
          const studentsBySchool = new Map<string, string[]>();
          for (const s of studentRecords) {
            const sSchool = (s.fields["School"] as string[] | undefined)?.[0];
            if (sSchool) {
              if (!studentsBySchool.has(sSchool)) studentsBySchool.set(sSchool, []);
              studentsBySchool.get(sSchool)!.push(s.id);
            }
          }

          for (const [schoolId, studentIds] of studentsBySchool) {
            const completions: Record<string, number> = {};
            for (const def of individualDefs) {
              let count = 0;
              for (const sid of studentIds) {
                const studentSessions = challengeSessions.filter(s => s.studentId === sid);
                const progress = calculateAllChallengeProgress(studentSessions);
                const p = progress.find(pp => pp.definition.id === def.id);
                if (p?.completed) count++;
              }
              completions[def.id] = count;
            }
            schoolStatsMap.set(schoolId, {
              schoolId,
              schoolName: schoolNameMap.get(schoolId) ?? 'Unknown',
              totalStudents: studentIds.length,
              completionsByChallenge: completions,
            });
          }

          setChallengeSchoolStats([...schoolStatsMap.values()]);

          // Team rankings
          const teamDef = CHALLENGE_DEFINITIONS.find(d => d.mode === 'team');
          if (teamDef) {
            const rankings = calculateTeamRankings(teamDef, challengeSessions, schoolNameMap);
            setChallengeTeamRankings(rankings);
          }
        } catch (err) {
          console.error("Challenge stats error:", err);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email]);

  const handleNudge = async () => {
    if (!nudgeTarget || !user?.id) return;
    setNudging(true);
    try {
      const { error: insertErr } = await supabase.from("student_nudges").insert({
        student_id: nudgeTarget.id,
        nudged_by: user.id,
      });
      if (insertErr) throw insertErr;
      setNudges((prev) => new Map(prev).set(nudgeTarget.id, new Date().toISOString()));
      toast({ title: `Nudge sent to ${nudgeTarget.name}` });
    } catch (err: any) {
      toast({ title: "Failed to send nudge", description: err.message, variant: "destructive" });
    } finally {
      setNudging(false);
      setNudgeTarget(null);
    }
  };

  // Filter students by selected school (super admin only)
  const filteredStudents = superAdmin && selectedSchool !== "all"
    ? students.filter((s) => s.school === selectedSchool)
    : students;

  const dashboardTitle = superAdmin
    ? `Regional Dashboard — ${orgInfo?.region || ""}`
    : "Teacher Dashboard";

  const subtitle = superAdmin
    ? `${orgInfo?.name || ""} · ${schoolOptions.length} schools · ${students.length} students`
    : orgInfo?.name || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TeacherObservationForm open={observationOpen} onOpenChange={setObservationOpen} />

      {/* Nudge confirmation */}
      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Send a reminder to {nudgeTarget?.name} to log their first ride?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={nudging}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNudge} disabled={nudging}>
              {nudging ? "Sending…" : "Send Nudge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <section className="bg-secondary py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            {superAdmin && <Globe className="h-8 w-8 text-accent" />}
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-5xl">
              {dashboardTitle}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-2 font-body text-lg text-secondary-foreground/70">
              {subtitle}
            </p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 space-y-12">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <p className="font-display text-xl uppercase tracking-wider text-foreground animate-pulse">
              Loading…
            </p>
          </div>
        )}

        {error && (
          <div className="border-[3px] border-destructive bg-destructive/10 p-6 font-body text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Teacher Observation Form */}
              <button
                onClick={() => setObservationOpen(true)}
                className="block w-full border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] transition-transform hover:translate-x-1 hover:-translate-y-1 text-left"
              >
                <div className="flex items-center gap-3 mb-1">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Teacher Observation Form</h3>
                </div>
                <p className="font-body text-sm text-muted-foreground">Record student observations →</p>
              </button>

              {/* QR Code Backup Sheet */}
              <button
                onClick={() => setQrOpen(true)}
                className="block w-full border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] transition-transform hover:translate-x-1 hover:-translate-y-1 text-left"
              >
                <div className="flex items-center gap-3 mb-1">
                  <QrCode className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Student QR Codes</h3>
                </div>
                <p className="font-body text-sm text-muted-foreground">Print backup QR codes for bracelet-less login →</p>
              </button>
            </div>

            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Users, label: "Total Students", value: filteredStudents.length },
                { icon: Bike, label: "Total Sessions", value: filteredStudents.reduce((s, r) => s + r.sessions, 0) },
                { icon: CheckCircle2, label: "Pre Phase Done", value: filteredStudents.filter((r) => r.prePilot).length },
                { icon: CheckCircle2, label: "Post Phase Done", value: filteredStudents.filter((r) => r.postPilot).length },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
                >
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <div className="font-display text-3xl font-extrabold text-foreground">{value}</div>
                  <div className="mt-1 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* School filter for super admins */}
            {superAdmin && schoolOptions.length > 0 && (
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Filter by School:
                </span>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-[280px] border-2 border-secondary font-display text-sm uppercase">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schoolOptions.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Student table */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Student Progress
              </h2>
              {filteredStudents.length === 0 ? (
                <p className="font-body text-muted-foreground">No students found.</p>
              ) : (
                <div className="overflow-x-auto border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                  <table className="w-full font-body text-sm">
                    <thead className="bg-secondary text-secondary-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">Student Name</th>
                        {superAdmin && (
                          <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">School</th>
                        )}
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Sessions</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Points</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Pre Phase</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Mid Phase</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Post Phase</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/40 bg-card">
                      {filteredStudents.map((s) => {
                        const nudgedAt = nudges.get(s.id);
                        return (
                          <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                            {superAdmin && (
                              <td className="px-4 py-3 text-foreground/80 text-xs">{s.school}</td>
                            )}
                            <td className="px-4 py-3 text-center text-foreground">{s.sessions}</td>
                            <td className="px-4 py-3 text-center font-bold text-primary">{s.points}</td>
                            <td className="px-4 py-3 text-center"><StatusIcon done={s.prePilot} /></td>
                            <td className="px-4 py-3 text-center"><StatusIcon done={s.fourWeek} /></td>
                            <td className="px-4 py-3 text-center"><StatusIcon done={s.postPilot} /></td>
                            <td className="px-4 py-3 text-center">
                              {s.sessions === 0 ? (
                                nudgedAt ? (
                                  <span className="font-display text-xs text-muted-foreground">
                                    Nudged {formatFriendlyDate(nudgedAt.slice(0, 10))}
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setNudgeTarget(s)}
                                    className="font-display text-xs uppercase"
                                  >
                                    Nudge
                                  </Button>
                                )
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent sessions table */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Recent Session Submissions
              </h2>
              {sessions.length === 0 ? (
                <p className="font-body text-muted-foreground">No session submissions found.</p>
              ) : (
                <div className="overflow-x-auto border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                  <table className="w-full font-body text-sm">
                    <thead className="bg-secondary text-secondary-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">km</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Time (mins)</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Mood</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/40 bg-card">
                      {sessions.map((s, i) => (
                        <tr key={i} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{s.studentName}</td>
                          <td className="px-4 py-3 text-foreground/80">{s.date}</td>
                          <td className="px-4 py-3 text-center text-foreground/80">{s.km}</td>
                          <td className="px-4 py-3 text-center text-foreground/80">{s.time}</td>
                          <td className="px-4 py-3 text-center text-foreground/80">
                            {s.moodBefore} → {s.moodAfter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inter-School Challenges */}
            {challengeSchoolStats.length > 0 && (
              <AdminChallengesView
                schoolStats={challengeSchoolStats}
                teamRankings={challengeTeamRankings}
              />
            )}

            {/* Role Management — super admins only */}
            {superAdmin && (
              <div className="mt-6">
                <RoleManagement />
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Code Backup Sheet */}
      {qrOpen && (
        <StudentQRCodes
          students={filteredStudents.map((s) => ({ name: s.name, token: s.nfcToken || "" }))}
          schoolName={orgInfo?.name || "School"}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
