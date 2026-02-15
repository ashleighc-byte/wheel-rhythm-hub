import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import { fetchGlobalDashboard } from "@/lib/airtable";

const fallbackStats = [
  { target: 0, label: "Total Schools" },
  { target: 0, label: "Total Riders" },
  { target: 0, label: "Total Sessions" },
  { target: 0, label: "Total Miles" },
];

const StatsBar = () => {
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalDashboard()
      .then((res) => {
        if (res.records.length > 0) {
          const fields = res.records[0].fields;
          setStats([
            { target: Number(fields["Total Schools"] ?? 0), label: "Total Schools" },
            { target: Number(fields["Total Riders"] ?? 0), label: "Total Riders" },
            { target: Number(fields["Total Sessions"] ?? 0), label: "Total Sessions" },
            { target: Number(fields["Total Miles"] ?? 0), label: "Total Miles" },
          ]);
        }
      })
      .catch((err) => console.error("Failed to fetch global dashboard:", err))
      .finally(() => setLoading(false));
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
          {stats.map((stat) => (
            <AnimatedCounter key={stat.label} target={stat.target} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
