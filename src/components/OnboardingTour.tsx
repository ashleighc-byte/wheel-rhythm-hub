import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

const teacherSteps: TourStep[] = [
  {
    target: '[data-tour="home"]',
    title: "Welcome to Free Wheeler!",
    description: "This is your home page. You'll find quick actions and a summary of the programme here.",
    position: "bottom",
  },
  {
    target: '[data-tour="about"]',
    title: "About the Pilot",
    description: "Learn about the pilot, access setup instructions, and find everything you need to run the programme.",
    position: "bottom",
  },
  {
    target: '[data-tour="leaderboards"]',
    title: "Leaderboards",
    description: "See all schools in the league and the top riders. Toggle between time and points views.",
    position: "bottom",
  },
  {
    target: '[data-tour="teacher-dashboard"]',
    title: "Teacher Dashboard",
    description: "Monitor your students' progress, survey completion, recent sessions, and submit observations.",
    position: "bottom",
  },
  {
    target: '[data-tour="signout"]',
    title: "You're All Set!",
    description: "That's the tour complete. You can always revisit any section from the navigation bar.",
    position: "bottom",
  },
];

const studentSteps: TourStep[] = [
  {
    target: '[data-tour="home"]',
    title: "Welcome to Free Wheeler!",
    description: "This is your home page. After each ride session, you'll come here to log your data.",
    position: "bottom",
  },
  {
    target: '[data-tour="about"]',
    title: "About the Pilot",
    description: "Learn how the programme works, check your survey checklist, and see how points are earned.",
    position: "bottom",
  },
  {
    target: '[data-tour="leaderboards"]',
    title: "Leaderboards",
    description: "See how you rank against other riders and schools. Compete for the top spot!",
    position: "bottom",
  },
  {
    target: '[data-tour="stats"]',
    title: "Your Stats",
    description: "Track your personal dashboard — sessions, distance, time, and points.",
    position: "bottom",
  },
  {
    target: '[data-tour="log-ride"]',
    title: "Log a Ride",
    description: "After every session, tap here to upload your screenshot and submit your session data.",
    position: "bottom",
  },
];

interface OnboardingTourProps {
  role: "admin" | "student" | null;
  onComplete: () => void;
}

const OnboardingTour = ({ role, onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const steps = role === "admin" ? teacherSteps : studentSteps;
  const current = steps[step];

  const positionTooltip = useCallback(() => {
    if (!current) return;
    const el = document.querySelector(current.target);
    if (!el) {
      // Element not found — center the tooltip
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const pad = 12;

    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const updatedRect = el.getBoundingClientRect();
      setTooltipStyle({
        position: "fixed",
        top: updatedRect.bottom + pad,
        left: Math.max(16, Math.min(updatedRect.left, window.innerWidth - 340)),
        maxWidth: 320,
      });
    }, 350);
  }, [current]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [positionTooltip]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Highlight the current target element
  useEffect(() => {
    const el = current ? document.querySelector(current.target) as HTMLElement : null;
    if (el) {
      el.style.position = "relative";
      el.style.zIndex = "10001";
    }
    return () => {
      if (el) {
        el.style.position = "";
        el.style.zIndex = "";
      }
    };
  }, [current]);

  if (!current) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-foreground/50"
        onClick={onComplete}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="z-[10002] border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
      >
        {/* Close */}
        <button
          onClick={onComplete}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Bike className="h-4 w-4 text-primary" />
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {step + 1} of {steps.length}
          </p>
        </div>

        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {current.title}
        </h3>
        <p className="mt-2 font-body text-sm text-foreground/80">
          {current.description}
        </p>

        {/* Nav */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="font-display text-xs uppercase"
          >
            <ChevronLeft className="mr-1 h-3 w-3" /> Back
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            className="bg-primary font-display text-xs uppercase text-primary-foreground"
          >
            {step === steps.length - 1 ? "Done" : "Next"}{" "}
            {step < steps.length - 1 && <ChevronRight className="ml-1 h-3 w-3" />}
          </Button>
        </div>

        {/* Skip link */}
        <button
          onClick={onComplete}
          className="mt-2 block w-full text-center font-body text-[11px] text-muted-foreground underline hover:text-foreground"
        >
          Skip tour
        </button>
      </div>
    </>
  );
};

export default OnboardingTour;
