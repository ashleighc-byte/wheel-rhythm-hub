import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { callAirtable } from "@/lib/airtable";
import { computeAllRiderPoints } from "@/lib/computeAllRiderPoints";

interface SchoolRow {
  rank: number;
  name: string;
  riders: number;
  totalPoints: number;
}

const SchoolLeaderboard = () => {
  const [schools, setSchools] = useState<SchoolRow[]>([]);

  useEffect(() => {
    Promise.all([
      callAirtable("Organisations", "GET"),
      callAirtable("Student Registration", "GET"),
      computeAllRiderPoints(),
    ])
      .then(([orgsRes, studentsRes, riderPointsMap]) => {
        const orgMap = new Map<string, string>();
        for (const r of orgsRes.records) {
          orgMap.set(r.id, String(r.fields["Organisation Name"] ?? "Unknown"));
        }

        // Group students by school, count riders and sum points
        const countMap = new Map<string, number>();
        const pointsMap = new Map<string, number>();
        for (const r of studentsRes.records) {
          const schoolIds = r.fields["School"];
          if (Array.isArray(schoolIds) && schoolIds.length > 0) {
            const schoolId = schoolIds[0];
            countMap.set(schoolId, (countMap.get(schoolId) ?? 0) + 1);
            const computed = riderPointsMap.get(r.id);
            pointsMap.set(schoolId, (pointsMap.get(schoolId) ?? 0) + (computed?.totalPoints ?? 0));
          }
        }

        // Ensure every org appears
        for (const [id] of orgMap.entries()) {
          if (!countMap.has(id)) {
            countMap.set(id, 0);
            pointsMap.set(id, 0);
          }
        }

        // Merge by name
        const nameDataMap = new Map<string, { riders: number; points: number }>();
        for (const [id, riders] of countMap.entries()) {
          const name = orgMap.get(id) ?? id;
          const prev = nameDataMap.get(name) ?? { riders: 0, points: 0 };
          nameDataMap.set(name, {
            riders: prev.riders + riders,
            points: prev.points + (pointsMap.get(id) ?? 0),
          });
        }

        // Sort by total points (primary), riders (secondary)
        const rows: SchoolRow[] = Array.from(nameDataMap.entries())
          .map(([name, data]) => ({ name, riders: data.riders, totalPoints: data.points, rank: 0 }))
          .sort((a, b) => b.totalPoints - a.totalPoints || b.riders - a.riders)
          .map((r, i) => ({ ...r, rank: i + 1 }));

        setSchools(rows);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">Engagement Stats</h3>
      </div>
      <div className="border-b-[3px] border-secondary bg-accent px-6 py-3">
        <div className="flex items-center font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">
          <span className="w-16">Rank</span>
          <span className="flex-1">School</span>
          <span className="w-20 text-center">Riders</span>
          <span className="w-20 text-right">Points</span>
        </div>
      </div>
      <div className="divide-y divide-muted">
        {schools.map((school, i) => (
          <motion.div
            key={school.rank}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center px-6 py-5 transition-colors hover:bg-muted"
          >
            <div className="w-16">
              <div className="rank-badge">{school.rank}</div>
            </div>
            <span className="flex-1 font-body text-base font-medium text-foreground">
              {school.name}
            </span>
            <span className="w-20 text-center font-display text-lg font-bold text-foreground">
              {school.riders}
            </span>
            <span className="w-20 text-right font-display text-lg font-bold text-primary flex items-center justify-end gap-1">
              <Zap className="h-3.5 w-3.5" /> {school.totalPoints}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SchoolLeaderboard;
