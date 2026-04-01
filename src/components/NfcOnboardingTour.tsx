import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Camera, ClipboardCheck, Trophy, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NfcOnboardingTourProps {
  firstName: string;
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: "Welcome!",
    body: (name: string) =>
      `Hey ${name}! Welcome to the Free Wheeler Bike League. Let's show you how it works.`,
  },
  {
    icon: Bike,
    title: "The Ride",
    body: () =>
      "Hop on the smart bike and select a track in MyWhoosh. Ride for as long as you want — every minute counts!",
  },
  {
    icon: Camera,
    title: "Take a Screenshot",
    body: () =>
      "When you finish your ride, take a screenshot on the iPad or tablet.\n\n📱 iPad: press the top button + volume up at the same time.\n🤖 Android: press power + volume down.",
  },
  {
    icon: ClipboardCheck,
    title: "Log Your Session",
    body: () =>
      "Scan your bracelet, find your screenshot, rate how you felt, and hit submit. Your points update instantly!",
  },
  {
    icon: Trophy,
    title: "Check Your Stats",
    body: () =>
      "Visit the Leaderboards to see how you rank. Check Your Stats for your personal progress. Now let's log your first ride!",
  },
];

const NfcOnboardingTour = ({ firstName, onComplete }: NfcOnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4"
    >
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="border-[3px] border-secondary bg-card p-8 shadow-[6px_6px_0px_hsl(var(--brand-dark))] text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              {current.title}
            </h2>
            <p className="mt-4 whitespace-pre-line font-body text-sm leading-relaxed text-muted-foreground">
              {current.body(firstName)}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="gap-1 font-display uppercase tracking-wider"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onComplete}
              className="font-display text-xs uppercase tracking-wider text-muted-foreground"
            >
              Skip
            </Button>
          )}

          <Button
            onClick={() => (isLast ? onComplete() : setStep(step + 1))}
            className="tape-element gap-1 font-display uppercase tracking-wider"
          >
            {isLast ? "Let's Ride!" : "Next"} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NfcOnboardingTour;
