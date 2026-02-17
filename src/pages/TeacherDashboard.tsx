import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  fetchTeacherOrg,
  fetchStudentsBySchool,
  fetchAllSurveysForStudents,
  fetchRecentSessionsForSchool,
} from "@/lib/airtable";
import { CheckCircle2, XCircle, Users, Clock, Bike } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  sessions: number;
  prePilot: boolean;
  fourWeek: boolean;
  postPilot: boolean;
}

interface SessionRow {
  studentName: string;
  date: string;
  km: string | number;
  time: string | number;
  moodBefore: string | number;
  moodAfter: string | number;
}

const StatusIcon = ({ done }: { done: boolean }) =>
  done ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />
  ) : (
    <XCircle className="mx-auto h-5 w-5 text-muted-foreground/40" />
  );

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      try {
        setLoading(true);

        // 1. Get teacher's org
        const org = await fetchTeacherOrg(user.email!);
        if (!org) {
          setError("Could not find your organisation in Airtable. Make sure your email matches the Organisations table.");
          return;
        }
        setOrgName(org.name);

        // 2. Get all students at that school
        const studentData = await fetchStudentsBySchool(org.id);
        const studentRecords = studentData.records;

        if (!studentRecords.length) {
          setStudents([]);
          setSessions([]);
          return;
        }

        const studentIds = studentRecords.map((r) => r.id);

        // 3. Batch fetch surveys for all students
        const surveyData = await fetchAllSurveysForStudents(studentIds);
        const surveyRecords = surveyData.records;

        // Index surveys by student record ID
        const surveyMap: Record<string, { prePilot: boolean; fourWeek: boolean; postPilot: boolean }> = {};
        for (const id of studentIds) {
          surveyMap[id] = { prePilot: false, fourWeek: false, postPilot: false };
        }

        // Pre-pilot: student record itself has a non-empty 'Surveys & Student Voice' array
        for (const rec of studentRecords) {
          const linked = rec.fields["Surveys & Student Voice"];
          if (Array.isArray(linked) && linked.length > 0) {
            surveyMap[rec.id].prePilot = true;
          }
        }

        // 4-week & post-pilot: check survey records
        for (const survey of surveyRecords) {
          const type: string = survey.fields["Survey Type"] || "";
          const linkedStudents: string[] = survey.fields["Student Name"] || [];
          for (const sid of linkedStudents) {
            if (surveyMap[sid]) {
              if (type === "4 Week Check In") surveyMap[sid].fourWeek = true;
              if (type === "Post-Pilot") surveyMap[sid].postPilot = true;
            }
          }
        }

        // 4. Build student rows
        const rows: StudentRow[] = studentRecords.map((rec) => ({
          id: rec.id,
          name: rec.fields["Full Name"] || "—",
          sessions: rec.fields["Count (Session Reflections)"] || 0,
          ...surveyMap[rec.id],
        }));
        rows.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(rows);

        // 5. Fetch recent sessions
        const sessionData = await fetchRecentSessionsForSchool(org.id);
        const sessionRows: SessionRow[] = sessionData.records.map((rec) => ({
          studentName:
            Array.isArray(rec.fields["Student Name (from Student Registration)"])
              ? rec.fields["Student Name (from Student Registration)"][0]
              : rec.fields["Full Name"] || "—",
          date: rec.fields["Date"] || rec.createdTime?.slice(0, 10) || "—",
          km: rec.fields["Distance (km)"] ?? "—",
          time: rec.fields["Duration (mins)"] ?? rec.fields["Time (mins)"] ?? "—",
          moodBefore: rec.fields["Mood Before"] ?? "—",
          moodAfter: rec.fields["Mood After"] ?? "—",
        }));
        setSessions(sessionRows);
      } catch (e: any) {
        setError(e.message || "Failed to load teacher dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-secondary py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-5xl">
            Teacher Dashboard
          </h1>
          {orgName && (
            <p className="mt-2 font-body text-lg text-secondary-foreground/70">
              {orgName}
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
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Users, label: "Total Students", value: students.length },
                { icon: Bike, label: "Total Sessions", value: students.reduce((s, r) => s + r.sessions, 0) },
                { icon: CheckCircle2, label: "Pre-Pilot Done", value: students.filter((r) => r.prePilot).length },
                { icon: CheckCircle2, label: "Post-Pilot Done", value: students.filter((r) => r.postPilot).length },
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

            {/* Student table */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Student Progress
              </h2>
              {students.length === 0 ? (
                <p className="font-body text-muted-foreground">No students found for your school.</p>
              ) : (
                <div className="overflow-x-auto border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                  <table className="w-full font-body text-sm">
                    <thead className="bg-secondary text-secondary-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          Sessions
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          Pre-Pilot
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          4 Week Check-In
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          Post-Pilot
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/40 bg-card">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-center text-foreground">{s.sessions}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusIcon done={s.prePilot} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusIcon done={s.fourWeek} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusIcon done={s.postPilot} />
                          </td>
                        </tr>
                      ))}
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
                <p className="font-body text-muted-foreground">No session submissions found for your school.</p>
              ) : (
                <div className="overflow-x-auto border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                  <table className="w-full font-body text-sm">
                    <thead className="bg-secondary text-secondary-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          km
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          Time (mins)
                        </th>
                        <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                          Mood
                        </th>
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
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
