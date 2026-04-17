import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Camera, Trophy, Sparkles, ChevronRight, ChevronLeft, CalendarCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import mywhooshScreenshot from "@/assets/onboarding/mywhoosh-screenshot.png";
import leaderboardScreenshot from "@/assets/onboarding/leaderboard.png";
import myDashboardScreenshot from "@/assets/onboarding/my-dashboard.png";
import bookaBikeScreenshot from "@/assets/onboarding/book-a-bike.png";

interface NfcOnboardingTourProps {
  firstName: string;
  onComplete: () => void;
}

type Step =
  | { type: "text"; icon: React.ElementType; title: string; body: string | ((name: string) => string) }
  | { type: "image"; icon: React.ElementType; title: string; body: string; image: string; imageAlt: string };

const steps: Step[] = [
  {
    type: "text",
    icon: Sparkles,
    title: "Welcome to Freewheeler!",
    body: (name: string) =>
      `Hey ${name}! Welcome to the Freewheeler Cycling League — a competition for Waikato secondary school students delivered through MyWhoosh.\n\nRide at school on your own schedule, earn points, and compete on the leaderboard. No travel, no trials — just ride.\n\nFirst up, book your bike at freewheelerleague.com/book. Pick your school, choose a 30-minute slot, and you're good to go.`,
  },
  {
    type: "image",
    icon: Bike,
    title: "Using MyWhoosh",
    body: "The iPad is locked to the bike and already logged into MyWhoosh. Tap the screen to wake it up.\n\n1. Tap 'Ride' on the home screen\n2. Choose a world and route\n3. Make sure the bike is paired (it connects automatically)\n4. Start pedalling — your speed and power will show on screen\n\nWhen your ride is done, you'll see a summary screen like this:",
    image: mywhooshScreenshot,
    imageAlt: "MyWhoosh ride summary screen showing distance, elevation, speed and duration",
  },
  {
    type: "text",
    icon: Camera,
    title: "Take a Screenshot",
    body: "Before you close the ride summary, take a screenshot on the iPad — you'll need it to log your ride.\n\n📱 iPad: Press the top button + volume up at the same time.\n\nYour screenshot saves to the iPad's Photos app. You'll upload it when you tap your bracelet to log a ride.\n\nMake sure the screenshot clearly shows the route name, distance, and duration.",
  },
  {
    type: "image",
    icon: CalendarCheck,
    title: "Log a Ride",
    body: "After your ride, tap your bracelet (or scan your QR backup) and tap 'Log a Ride'. You'll see a form like this — upload your screenshot and submit your ride.\n\nYour points update instantly. No need to log a test ride right now — just come back after your first real ride!",
    image: bookaBikeScreenshot,
    imageAlt: "Log a ride form preview showing screenshot upload and submission",
  },
  {
    type: "image",
    icon: Trophy,
    title: "The Leaderboard",
    body: "Tap 'See My Dash' after scanning your bracelet to check the leaderboard and see how you stack up against other riders across all Waikato schools.\n\nThe leaderboard shows top riders, school rankings, total sessions, and total hours.",
    image: leaderboardScreenshot,
    imageAlt: "Freewheeler leaderboard showing top riders and school rankings",
  },
  {
    type: "image",
    icon: LayoutDashboard,
    title: "My Dashboard",
    body: "Your personal dashboard shows your total points, distance, hours, elevation, and every ride you've logged. Watch your stats grow across the season!\n\nYou're all set. Tap 'Let's Ride' when you're ready.",
    image: myDashboardScreenshot,
    imageAlt: "My Dashboard showing personal stats, ride activity chart and recent rides",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4 overflow-y-auto py-6"
    >
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-5 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted-foreground/30"
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
            transition={{ duration: 0.22 }}
            className="border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
          >
            {/* Header */}
            <div className="px-6 pt-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
                {current.title}
              </h2>
              <p className="mt-3 whitespace-pre-line font-body text-sm leading-relaxed text-muted-foreground text-left">
                {current.type === "text" ? current.body(firstName) : current.body}
              </p>
            </div>

            {/* Screenshot */}
            {current.type === "image" && (
              <div className="mt-4 mx-0 overflow-hidden border-t-2 border-secondary">
                <img
                  src={current.image}
                  alt={current.imageAlt}
                  className="w-full object-cover"
                />
              </div>
            )}
            <div className="h-4" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between gap-3">
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
