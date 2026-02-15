import AnimatedCounter from "./AnimatedCounter";

const stats = [
  { target: 48, label: "Total Schools" },
  { target: 1234, label: "Total Riders" },
  { target: 12847, label: "Total Sessions" },
  { target: 64235, label: "Total Miles" },
];

const StatsBar = () => {
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
