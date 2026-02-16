import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Clock } from "lucide-react";
import { fetchStudents } from "@/lib/airtable";

interface Rider {
  rank: number;
  name: string;
  school: string;
  sessions: number;
  totalTime: string;
}

const TopRiders = () => {
  const [riders, setRiders] = useState<Rider[]>([]);

  useEffect(() => {
    fetchStudents()
      .then((res) => {
        const mapped = res.records
          .map((r) => ({
            name: String(r.fields["Full Name"] ?? ""),
            school: String(r.fields["School"] ?? ""),
            sessions: Number(r.fields["Count (Session Reflections)"] ?? 0),
            totalTime: String(r.fields["Total Time (h:mm)"] ?? "0:00"),
            totalMinutes: Number(r.fields["Total minutes Rollup (from Session Reflections)"] ?? 0),
          }))
          .filter((r) => r.sessions > 0)
          .sort((a, b) => b.totalMinutes - a.totalMinutes)
          .slice(0, 5)
          .map((r, i) => ({
            rank: i + 1,
            name: r.name,
            school: r.school,
            sessions: r.sessions,
            totalTime: r.totalTime,
          }));
        setRiders(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">Top Individual Riders</h3>
      </div>
      <div className="divide-y divide-muted">
        {riders.map((rider, i) => (
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
              <div className="font-body text-sm font-medium text-primary">
                {rider.school}
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
        ))}
      </div>
    </div>
  );
};

export default TopRiders;
