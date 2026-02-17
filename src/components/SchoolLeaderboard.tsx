import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { callAirtable } from "@/lib/airtable";

interface SchoolRow {
  rank: number;
  name: string;
  riders: number;
}

const SchoolLeaderboard = () => {
  const [schools, setSchools] = useState<SchoolRow[]>([]);

  useEffect(() => {
    Promise.all([
      callAirtable("Organisations", "GET"),
      callAirtable("Student Registration", "GET"),
    ])
      .then(([orgsRes, studentsRes]) => {
        // Build a map of org record ID → name
        const orgMap = new Map<string, string>();
        for (const r of orgsRes.records) {
          orgMap.set(r.id, String(r.fields["Organisation Name"] ?? "Unknown"));
        }

        // Group students by school, count riders
        const countMap = new Map<string, number>();
        for (const r of studentsRes.records) {
          const schoolIds = r.fields["School"];
          if (Array.isArray(schoolIds) && schoolIds.length > 0) {
            const schoolId = schoolIds[0];
            countMap.set(schoolId, (countMap.get(schoolId) ?? 0) + 1);
          }
        }

        // Merge and sort — include ALL orgs, even those with 0 riders
        const rows: SchoolRow[] = Array.from(orgMap.entries())
          .map(([id, name]) => ({
            name,
            riders: countMap.get(id) ?? 0,
            rank: 0,
          }))
          .sort((a, b) => b.riders - a.riders)
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
          <span className="text-right">Riders</span>
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
            <span className="font-display text-2xl font-bold text-primary">
              {school.riders}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SchoolLeaderboard;
