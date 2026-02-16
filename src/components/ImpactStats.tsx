import { useState, useEffect } from "react";
import { fetchGlobalDashboard } from "@/lib/airtable";

const ImpactStats = () => {
  const [stats, setStats] = useState({ sessions: 0, riders: 0, schools: 0 });

  useEffect(() => {
    fetchGlobalDashboard()
      .then((res) => {
        if (res.records.length > 0) {
          const f = res.records[0].fields;
          setStats({
            sessions: Number(f["Total Sessions"] ?? 0),
            riders: Number(f["Total Riders"] ?? 0),
            schools: Number(f["Total Schools"] ?? 0),
          });
        }
      })
      .catch(console.error);
  }, []);

  const items = [
    { value: stats.sessions, label: "Total Sessions" },
    { value: stats.riders, label: "Total Riders" },
    { value: stats.schools, label: "Active Schools" },
  ];

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-secondary shadow-[6px_6px_0px_hsl(var(--brand-green))]">
      <div className="px-6 py-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider text-accent md:text-2xl">
          Impact Stats
        </h3>
      </div>
      <div className="space-y-1 px-6 pb-6">
        {items.map((item) => (
          <div key={item.label} className="border-t-2 border-primary pt-4">
            <div className="font-display text-5xl font-bold text-accent">
              {item.value.toLocaleString()}
            </div>
            <div className="font-display text-xs font-semibold uppercase tracking-widest text-accent/70">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImpactStats;
