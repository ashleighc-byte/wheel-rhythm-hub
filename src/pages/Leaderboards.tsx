import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import SchoolLeaderboard from "@/components/SchoolLeaderboard";
import TopRiders from "@/components/TopRiders";
import ImpactStats from "@/components/ImpactStats";
import CTASection from "@/components/CTASection";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import artRaceMode from "@/assets/art-race-mode.jpeg";

const Leaderboards = () => {
  const [mode, setMode] = useState<"time" | "points">("points");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StatsBar />

      {/* Leaderboard hero banner */}
      <section className="relative overflow-hidden bg-secondary py-12">
        <div className="absolute inset-0">
          <img src={artRaceMode} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-secondary/75" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-5xl"
          >
            See How Your School Stacks Up
          </motion.h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-base text-secondary-foreground/70">
            Ride more. Climb the leaderboard. Earn bragging rights.
          </p>
        </div>
      </section>

      <section className="bg-background pb-20 pt-8">
        <div className="container mx-auto px-4">
          {/* Tab toggle */}
          <div className="mb-6 flex justify-center">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "time" | "points")}>
              <TabsList className="border-[2px] border-secondary bg-muted">
                <TabsTrigger value="time" className="font-display uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Clock className="mr-1.5 h-4 w-4" /> Time
                </TabsTrigger>
                <TabsTrigger value="points" className="font-display uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Zap className="mr-1.5 h-4 w-4" /> Points
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
