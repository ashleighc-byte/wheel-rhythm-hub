import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import SchoolLeaderboard from "@/components/SchoolLeaderboard";
import TopRiders from "@/components/TopRiders";
import ImpactStats from "@/components/ImpactStats";
import CTASection from "@/components/CTASection";

const Leaderboards = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StatsBar />

      <section className="bg-background pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <SchoolLeaderboard />
            <div className="space-y-6">
              <ImpactStats />
              <TopRiders />
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
