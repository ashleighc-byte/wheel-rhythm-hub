import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Bike, Zap, Mountain, Sparkles, CalendarRange, Trophy, School } from "lucide-react";
import { callAirtable } from "@/lib/airtable";

const pointRules = [
  { icon: Bike, label: "Base ride completion", points: "10 pts" },
  { icon: Sparkles, label: "7-day streak bonus", points: "+5 pts" },
  { icon: Trophy, label: "New track first attempt", points: "+3 pts" },
  { icon: Zap, label: "Top speed > 30 km/h", points: "+2 pts" },
  { icon: Mountain, label: "Elevation > 200m gain", points: "+2 pts" },
];

const seasonBlocks = [
  { label: "Block 1", dates: "Mon 31 Aug – Thu 25 Sep 2026", tone: "primary" as const },
  { label: "Mid-season break", dates: "Fri 26 Sep – Sun 11 Oct 2026", tone: "muted" as const },
  { label: "Block 2", dates: "Mon 12 Oct – Fri 6 Nov 2026", tone: "primary" as const },
];

const cardClass =
  "border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))]";

const Info = () => {
  const [schools, setSchools] = useState<string[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callAirtable("Organisations", "GET", { maxRecords: 100 });
        if (cancelled) return;
        const names = (res?.records ?? [])
          .map((r: any) => r.fields?.["Organisation Name"] || r.fields?.["Name"] || r.fields?.["School"])
          .filter((n: unknown): n is string => typeof n === "string" && n.length > 0);
        setSchools(Array.from(new Set(names)).sort());
      } catch {
        // silent — handled by fallback blurb
      } finally {
        if (!cancelled) setLoadingSchools(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
        {/* Section 1: What is Freewheeler? */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${cardClass} p-6 md:p-8`}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground">
            What is Freewheeler?
          </h1>
          <div className="mt-4 space-y-3 font-body text-base leading-relaxed text-foreground">
            <p>Freewheeler is a cycling league for NZ secondary school students.</p>
            <p>
              Students ride smart bikes at school using the MyWhoosh app, logging each ride via an
              NFC bracelet tap.
            </p>
            <p>
              Points accumulate over an 8-week season and schools compete on a leaderboard.
            </p>
          </div>
        </motion.section>

        {/* Section 2: How Points Work */}
        <section>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground mb-5">
            How Points Work
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pointRules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.label}
                  className={`${cardClass} p-5 flex items-start gap-3 hover-lift`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-secondary bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm text-foreground">{rule.label}</p>
                    <p className="mt-1 font-display text-lg font-bold uppercase tracking-wider text-primary">
                      {rule.points}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Season Dates */}
        <section>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground mb-5 flex items-center gap-2">
            <CalendarRange className="h-7 w-7 text-primary" />
            Season Dates
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {seasonBlocks.map((block) => (
              <div
                key={block.label}
                className={`${cardClass} p-5 ${
                  block.tone === "muted" ? "bg-muted" : ""
                }`}
              >
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {block.label}
                </p>
                <p className="mt-2 font-display text-lg font-bold uppercase tracking-wide text-foreground">
                  {block.dates}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Competing Schools */}
        <section>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground mb-5 flex items-center gap-2">
            <School className="h-7 w-7 text-primary" />
            Competing Schools
          </h2>
          <div className={`${cardClass} p-6`}>
            <p className="font-body text-base leading-relaxed text-foreground">
              You're riding alongside other secondary schools across the Waikato Region. Every
              ride you log adds to your school's total — climb the leaderboard together and put
              your school on top.
            </p>

            {!loadingSchools && schools.length > 0 && (
              <div className="mt-6">
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Schools in the league
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {schools.map((name) => (
                    <div
                      key={name}
                      className="border-[2px] border-secondary bg-background p-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Info;
