import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Zap, Clock } from "lucide-react";
import { getCachedTopRiders, type CachedRider } from "@/lib/leaderboardCache";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  name: string;
  school: string;
  sessions: number;
  totalPoints: number;
  level: string;
}

const RecentActivityFeed = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    getCachedTopRiders()
      .then((riders) => {
        // Show most recent active riders (those with sessions) sorted by sessions desc, take top 8
        const active = riders
          .filter(r => r.sessions > 0)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 8)
          .map(r => ({
            name: r.name,
            school: r.school,
            sessions: r.sessions,
            totalPoints: r.totalPoints,
            level: r.level,
          }));
        setActivity(active);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-secondary shadow-[6px_6px_0px_hsl(var(--brand-green))]">
      <div className="px-6 py-4">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider text-accent md:text-2xl">
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-primary/20 px-2 pb-3">
        {activity.length === 0 ? (
          <div className="px-4 py-6 text-center font-body text-sm text-accent/60">
            No activity yet.
          </div>
        ) : (
          activity.map((item, i) => (
            <motion.div
              key={`${item.name}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/20">
                <Bike className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-accent truncate">
                  {item.name}
                </p>
                <p className="font-body text-[10px] text-accent/60 truncate">
                  {item.school}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="flex items-center gap-1 font-display text-xs font-bold text-accent">
                  <Zap className="h-3 w-3" /> {item.totalPoints}
                </span>
                <span className="font-body text-[10px] text-accent/60">
                  {item.sessions} rides
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityFeed;