import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import { getCachedGlobalStats } from "@/lib/leaderboardCache";

interface StatItem {
  target: number;
  label: string;
  formatted?: string;
}

const fallbackStats: StatItem[] = [
  { target: 0, label: "Total Schools" },
  { target: 0, label: "Total Riders" },
  { target: 0, label: "Total Sessions" },
  { target: 0, label: "Total Hours", formatted: "0:00" },
];

function formatHours(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const mins = Math.round((totalHours - hours) * 60);
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

const StatsBar = () => {
  const [stats, setStats] = useState<StatItem[]>(fallbackStats);

  useEffect(() => {
    getCachedGlobalStats()
      .then((data) => {
        if (!data) return;
        setStats([
          { target: data.totalSchools, label: "Total Schools" },
          { target: data.totalRiders, label: "Total Riders" },
          { target: data.totalSessions, label: "Total Sessions" },
          { target: data.totalHours, label: "Total Hours", formatted: formatHours(data.totalHours) },
        ]);
      })
      .catch((err) => console.error("Failed to fetch cached stats:", err));
  }, []);

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Leaderboards
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center font-body text-lg text-muted-foreground">
          See how your school ranks against others. Competition is friendly, but the bragging rights are real.
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat) =>
            stat.formatted ? (
              <div key={stat.label} className="stat-card px-6 py-8 text-center">
                <div className="font-display text-4xl font-bold text-accent md:text-5xl">
                  {stat.formatted}
                </div>
                <div className="mt-2 font-display text-xs font-semibold uppercase tracking-widest text-accent/80">
                  {stat.label}
                </div>
              </div>
            ) : (
              <AnimatedCounter key={stat.label} target={stat.target} label={stat.label} />
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
