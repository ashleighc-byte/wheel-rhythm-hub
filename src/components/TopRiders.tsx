import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Zap } from "lucide-react";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { useAuth } from "@/hooks/useAuth";
import { getLevelName } from "@/components/LevelProgress";
import { Badge } from "@/components/ui/badge";
import { pluraliseUnit } from "@/lib/dateFormat";
import { supabase } from "@/integrations/supabase/client";

/** Format "h:mm" string with correct pluralisation */
function formatTime(timeStr: string): string {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const hPart = hours > 0 ? pluraliseUnit(hours, "hour") : "";
  const mPart = pluraliseUnit(minutes, "minute");
  return hPart ? `${hPart} ${mPart}` : mPart;
}

interface Rider {
  rank: number;
  name: string;
  school: string;
  sessions: number;
  totalTime: string;
  totalPoints: number;
  level: string;
}

interface TopRidersProps {
  mode?: "time" | "points";
}

const TopRiders = ({ mode = "time" }: TopRidersProps) => {
  const { user, role, nfcSession } = useAuth();
  const isAdmin = role === 'admin';
  const [riders, setRiders] = useState<Rider[]>([]);
  const [schoolName, setSchoolName] = useState("");

  const hasIdentity = !!user?.email || !!nfcSession;

  useEffect(() => {
    if (!hasIdentity) return;

    const load = async () => {
      try {
        const [allStudentsRes, orgsRes] = await Promise.all([
          fetchStudents(),
          callAirtable("Organisations", "GET"),
        ]);

        const orgMap = new Map<string, string>();
        orgsRes.records.forEach((o) => {
          orgMap.set(o.id, String(o.fields["Organisation Name"] ?? ""));
        });

        let schoolFilterId: string | null = null;

        if (!isAdmin) {
          let currentStudentRec;
          if (user?.email) {
            const currentStudentRes = await fetchStudents(user.email);
            currentStudentRec = currentStudentRes.records[0];
          } else if (nfcSession?.studentId) {
            const currentStudentRes = await callAirtable('Student Registration', 'GET', {
              filterByFormula: `RECORD_ID()='${nfcSession.studentId}'`,
              maxRecords: 1,
            });
            currentStudentRec = currentStudentRes.records[0];
          }
          if (!currentStudentRec) return;
          const userSchoolIds = currentStudentRec.fields["School"] as string[] | undefined;
          if (!userSchoolIds?.length) return;
          schoolFilterId = userSchoolIds[0];
          const org = orgsRes.records.find((o) => o.id === schoolFilterId);
          setSchoolName(org ? String(org.fields["Organisation Name"] ?? "") : "");
        }

        // Fetch points from Supabase grouped by airtable_student_id
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

        const mapped = allStudentsRes.records
          .filter((r) => {
            if (!schoolFilterId) return true;
            const school = r.fields["School"] as string[] | undefined;
            return school?.[0] === schoolFilterId;
          })
          .map((r) => {
            const totalPoints = pointsMap.get(r.id) ?? 0;
            return {
              name: String(r.fields["Full Name"] ?? ""),
              school: orgMap.get((r.fields["School"] as string[])?.[0] ?? "") ?? "",
              sessions: Number(r.fields["Count (Session Reflections)"] ?? 0),
              totalTime: String(r.fields["Total Time (h:mm)"] ?? "0:00"),
              totalMinutes: Number(r.fields["Total minutes Rollup (from Session Reflections)"] ?? 0),
              totalPoints,
              level: getLevelName(totalPoints),
            };
          })
          .filter((r) => r.sessions > 0)
          .sort((a, b) =>
            mode === "points"
              ? b.totalPoints - a.totalPoints
              : b.totalMinutes - a.totalMinutes
          )
          .slice(0, isAdmin ? 5 : 10)
          .map((r, i) => ({
            rank: i + 1,
            name: r.name,
            school: r.school,
            sessions: r.sessions,
            totalTime: r.totalTime,
            totalPoints: r.totalPoints,
            level: r.level,
          }));

        setRiders(mapped);
      } catch (err) {
        console.error("TopRiders load error:", err);
      }
    };

    load();
  }, [hasIdentity, isAdmin, user?.email, nfcSession?.studentId, mode]);

  const title = mode === "points"
    ? (isAdmin ? "Top Riders by Points – All Schools" : `Top Riders by Points${schoolName ? ` – ${schoolName}` : ""}`)
    : (isAdmin ? "Top Riders – All Schools" : `Top Riders${schoolName ? ` – ${schoolName}` : ""}`);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-muted">
        {riders.length === 0 ? (
          <div className="px-6 py-8 text-center font-body text-muted-foreground">
            No riders with sessions yet.
          </div>
        ) : (
          riders.map((rider, i) => (
            <motion.div
              key={rider.rank}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted"
            >
              <div className="rank-badge flex-shrink-0">{rider.rank}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold uppercase text-foreground">
                    {rider.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {rider.level}
                  </Badge>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3 w-3" /> {rider.sessions} sessions
                  </span>
                  {mode === "points" ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {rider.totalPoints} pts
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(rider.totalTime)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopRiders;
