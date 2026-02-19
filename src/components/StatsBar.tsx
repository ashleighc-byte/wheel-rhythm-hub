import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import { fetchGlobalDashboard, callAirtable } from "@/lib/airtable";

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

function formatHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

const StatsBar = () => {
  const [stats, setStats] = useState<StatItem[]>(fallbackStats);

  useEffect(() => {
    Promise.all([
      fetchGlobalDashboard(),
      callAirtable("Student Registration", "GET"),
    ])
      .then(([dashRes, studentsRes]) => {
        if (dashRes.records.length === 0) return;
        const fields = dashRes.records[0].fields;

        // Try Global Dashboard Total Hours first (it's in hours, not minutes)
        const rawHoursField = fields["Total Hours"];
        let totalMinutes: number | null = null;

        if (typeof rawHoursField === "number" && !isNaN(rawHoursField)) {
          totalMinutes = rawHoursField * 60;
        } else {
          // Fallback: sum student minutes directly
          let sum = 0;
          for (const r of studentsRes.records) {
            const mins = r.fields["Total minutes Rollup (from Session Reflections)"];
            if (typeof mins === "number" && !isNaN(mins)) {
              sum += mins;
            }
          }
          totalMinutes = sum;
        }

        setStats([
          { target: Number(fields["Total Schools"] ?? 0), label: "Total Schools" },
          { target: Number(fields["Total Riders"] ?? 0), label: "Total Riders" },
          { target: Number(fields["Total Sessions"] ?? 0), label: "Total Sessions" },
          { target: totalMinutes, label: "Total Hours", formatted: formatHours(totalMinutes) },
        ]);
      })
      .catch((err) => console.error("Failed to fetch global dashboard:", err));
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

