import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bike, Users, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CTASection from "@/components/CTASection";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import OnboardingTour from "@/components/OnboardingTour";
import StudentRegistrationForm from "@/components/StudentRegistrationForm";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import logoSrc from "@/assets/fw-logo-new.png";
import artRaceModeHero from "@/assets/art-race-mode-hero.png";

// ── Public Landing Page ──────────────────────────────────────────────────────

const PublicLanding = () => (
  <div className="min-h-screen bg-background">
    {/* Top bar with Sign In */}
    <header className="relative z-10 bg-secondary">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <img src={logoSrc} alt="Free Wheeler" className="h-10 object-contain md:h-12" />
        <Link
          to="/auth"
          className="tape-element text-sm md:text-base"
        >
          SIGN IN
        </Link>
      </div>
    </header>

    {/* Hero with registration form */}
    <section className="relative overflow-hidden bg-secondary">
      <div className="absolute inset-0 speed-lines" />
      <div className="absolute inset-0">
        <img src={artRaceModeHero} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/90 to-secondary/70" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:py-20">
        <div className="grid items-start gap-10 md:grid-cols-2">
          {/* Left: tagline */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              className="text-4xl leading-[0.95] text-secondary-foreground md:text-6xl lg:text-7xl"
            >
              PEDAL YOUR
              <br />
              OWN PATH
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 max-w-lg font-body text-base leading-relaxed text-secondary-foreground/80 md:text-lg"
            >
              Free Wheeler Bike League is indoor cycling for secondary school students.
              Jump on a smart bike, race in MyWhoosh, log your rides, and compete with your school —
              no trials, no pressure, just ride.
            </motion.p>
          </div>

          {/* Right: registration form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="mb-4 text-center font-display text-xl font-bold uppercase tracking-wider text-secondary-foreground">
              JOIN THE LEAGUE
            </h2>
            <StudentRegistrationForm />
          </motion.div>
        </div>
      </div>
    </section>

    {/* How it Works */}
    <section className="bg-background py-14">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center text-2xl text-foreground md:text-3xl">
          HOW IT WORKS
        </h2>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Bike, title: "Ride", desc: "Jump on a smart bike and ride in MyWhoosh at school." },
            { icon: Trophy, title: "Earn Points", desc: "10 points per ride. Hit 3 or 5 rides a week for bonus points." },
            { icon: Users, title: "Compete", desc: "Climb the leaderboard and push your school to the top." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="border-[3px] border-secondary bg-card p-6 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce"
            >
              <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 font-body text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
      <div className="container mx-auto text-center">
        <div className="font-display text-lg font-bold uppercase text-accent">
          Free Wheeler Bike League
        </div>
        <p className="mt-2 font-body text-sm text-secondary-foreground/60">
          Pedal Your Own Path · © 2026
        </p>
        <Link
          to="/terms"
          className="mt-2 inline-block font-body text-xs text-secondary-foreground/40 underline hover:text-secondary-foreground/60"
        >
          Terms & Conditions
        </Link>
      </div>
    </footer>
  </div>
);

// ── Authenticated Home Page ──────────────────────────────────────────────────

const AuthenticatedHome = () => {
  const location = useLocation();
  const [logOpen, setLogOpen] = useState(false);
  const { showTour, completeTour, role } = useOnboarding();

  useEffect(() => {
    if (location.state?.openLogRide) {
      setLogOpen(true);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CTASection />
      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />
      {showTour && <OnboardingTour role={role} onComplete={completeTour} />}

      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
          <Link
            to="/terms"
            className="mt-2 inline-block font-body text-xs text-secondary-foreground/40 underline hover:text-secondary-foreground/60"
          >
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};

// ── Router ───────────────────────────────────────────────────────────────────

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <AuthenticatedHome /> : <PublicLanding />;
};

export default Index;
