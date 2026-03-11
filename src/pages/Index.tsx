import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CTASection from "@/components/CTASection";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import OnboardingTour from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";

const Index = () => {
  const location = useLocation();
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openLogRide) {
      setLogOpen(true);
      // Clear the state so it doesn't re-open on subsequent renders
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CTASection />
      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />

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

export default Index;
