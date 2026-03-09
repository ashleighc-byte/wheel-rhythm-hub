import { useState } from "react";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import SchoolLeaderboard from "@/components/SchoolLeaderboard";
import TopRiders from "@/components/TopRiders";
import ImpactStats from "@/components/ImpactStats";
import CTASection from "@/components/CTASection";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Leaderboards = () => {
  const [mode, setMode] = useState<"time" | "points">("points");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StatsBar />

      <section className="bg-background pb-20">
        <div className="container mx-auto px-4">
          {/* Tab toggle */}
          <div className="mb-6 flex justify-center">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "time" | "points")}>
              <TabsList className="border-[2px] border-secondary bg-muted">
                <TabsTrigger value="time" className="font-display uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  ⏱ Time
                </TabsTrigger>
                <TabsTrigger value="points" className="font-display uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  ⚡ Points
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <SchoolLeaderboard />
            <div className="space-y-6">
              <ImpactStats />
              <TopRiders mode={mode} />
            </div>
          </div>
        </div>
      </section>

      <CTASection />

      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Leaderboards;
