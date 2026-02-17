import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Clock } from "lucide-react";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { useAuth } from "@/hooks/useAuth";

interface Rider {
  rank: number;
  name: string;
  school: string;
  sessions: number;
  totalTime: string;
}

const TopRiders = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [riders, setRiders] = useState<Rider[]>([]);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      try {
        const [allStudentsRes, orgsRes] = await Promise.all([
          fetchStudents(),
          callAirtable("Organisations", "GET"),
        ]);

        // Build a map of org ID -> name
        const orgMap = new Map<string, string>();
        orgsRes.records.forEach((o) => {
          orgMap.set(o.id, String(o.fields["Organisation Name"] ?? ""));
        });

        let schoolFilterId: string | null = null;

        if (!isAdmin) {
          // For students, filter to their own school
          const currentStudentRes = await fetchStudents(user.email!);
          if (!currentStudentRes.records.length) return;
          const userSchoolIds = currentStudentRes.records[0].fields["School"] as string[] | undefined;
          if (!userSchoolIds?.length) return;
          schoolFilterId = userSchoolIds[0];
          const org = orgsRes.records.find((o) => o.id === schoolFilterId);
          setSchoolName(org ? String(org.fields["Organisation Name"] ?? "") : "");
        }
        // Admins get all schools — no filter, no school name label

        const mapped = allStudentsRes.records
          .filter((r) => {
            if (!schoolFilterId) return true; // admin: all students
            const school = r.fields["School"] as string[] | undefined;
            return school?.[0] === schoolFilterId;
          })
          .map((r) => ({
            name: String(r.fields["Full Name"] ?? ""),
            school: orgMap.get((r.fields["School"] as string[])?.[0] ?? "") ?? "",
            sessions: Number(r.fields["Count (Session Reflections)"] ?? 0),
            totalTime: String(r.fields["Total Time (h:mm)"] ?? "0:00"),
            totalMinutes: Number(r.fields["Total minutes Rollup (from Session Reflections)"] ?? 0),
          }))
          .filter((r) => r.sessions > 0)
          .sort((a, b) => b.totalMinutes - a.totalMinutes)
          .slice(0, 10)
          .map((r, i) => ({
            rank: i + 1,
            name: r.name,
            school: r.school,
            sessions: r.sessions,
            totalTime: r.totalTime,
          }));

        setRiders(mapped);
      } catch (err) {
        console.error("TopRiders load error:", err);
      }
    };

    load();
  }, [user?.email, isAdmin]);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">
          {isAdmin ? "Top Riders – All Schools" : `Top Riders${schoolName ? ` – ${schoolName}` : ""}`}
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
                <div className="font-display text-base font-bold uppercase text-foreground">
                  {rider.name}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3 w-3" /> {rider.sessions} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {rider.totalTime}
                  </span>
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
