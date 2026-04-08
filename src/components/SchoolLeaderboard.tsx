import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getCachedSchoolRankings, type CachedSchoolRanking } from "@/lib/leaderboardCache";

const SchoolLeaderboard = () => {
  const [schools, setSchools] = useState<CachedSchoolRanking[]>([]);

  useEffect(() => {
    getCachedSchoolRankings()
      .then(setSchools)
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
