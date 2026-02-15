import AnimatedCounter from "./AnimatedCounter";

const ImpactStats = () => {
  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-secondary shadow-[6px_6px_0px_hsl(var(--brand-green))]">
      <div className="px-6 py-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider text-accent md:text-2xl">
          Impact Stats
        </h3>
      </div>
      <div className="space-y-1 px-6 pb-6">
        <div className="border-t-2 border-primary pt-4">
          <div className="font-display text-5xl font-bold text-accent">12,847</div>
          <div className="font-display text-xs font-semibold uppercase tracking-widest text-accent/70">
            Total Sessions
          </div>
        </div>
        <div className="border-t-2 border-primary pt-4">
          <div className="font-display text-5xl font-bold text-accent">1,234</div>
          <div className="font-display text-xs font-semibold uppercase tracking-widest text-accent/70">
            New Riders
          </div>
        </div>
        <div className="border-t-2 border-primary pt-4">
          <div className="font-display text-5xl font-bold text-accent">48</div>
          <div className="font-display text-xs font-semibold uppercase tracking-widest text-accent/70">
            Active Schools
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactStats;
