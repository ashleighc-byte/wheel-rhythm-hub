import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bike, Users, Trophy } from "lucide-react";
import StudentRegistrationForm from "@/components/StudentRegistrationForm";
import { useAuth } from "@/hooks/useAuth";
import logoSrc from "@/assets/fw-logo-oval.png";
import brandPedalPath from "@/assets/brand-pedal-your-path.png";
import brandBikeIcon from "@/assets/brand-bike-icon.png";
import brandWordmark from "@/assets/fw-wordmark.png";
import stripeBg from "@/assets/stripe-bg-1.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Public Landing Page ──────────────────────────────────────────────────────

const PublicLanding = () => {
  const [regOpen, setRegOpen] = useState(false);

  return (
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

      {/* Hero with centered text + JOIN THE LEAGUE button */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="absolute inset-0">
          <img src={stripeBg} alt="" className="h-full w-full object-cover opacity-40" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-28">
          <div className="flex flex-col items-center text-center">
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
              Freewheeler is a virtual cycling league for secondary school students, delivered through MyWhoosh.
              Complete rides and challenges at school, on a schedule that works for you, with points accumulated across the season —
              no travel, no trials, no pressure, just ride.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              onClick={() => setRegOpen(true)}
              className="tape-element-green mt-8 px-10 py-4 text-xl md:text-2xl"
            >
              JOIN THE LEAGUE
            </motion.button>
          </div>
        </div>
      </section>

      {/* Registration Dialog */}
      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
              Join the League
            </DialogTitle>
          </DialogHeader>
          <StudentRegistrationForm />
        </DialogContent>
      </Dialog>

      {/* How it Works */}
      <section className="bg-background py-14 relative overflow-hidden">
        {/* Decorative "Pedal Your Own Path" graphic */}
        <div className="container relative mx-auto px-4 mb-8">
          <div className="flex justify-center">
            <motion.img
              src={brandPedalPath}
              alt="Pedal Your Own Path"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-48 md:w-64 h-auto"
            />
          </div>
        </div>
        <div className="container relative mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl text-foreground md:text-3xl">
            HOW IT WORKS
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Bike, title: "Ride", desc: "Jump on a smart bike at school and ride in MyWhoosh — on your own schedule. No travel, no equipment needed." },
              { icon: Trophy, title: "Earn Points", desc: "10 points per ride plus bonuses for streaks, elevation, speed, and trying new tracks." },
              { icon: Users, title: "Compete", desc: "Climb the leaderboard, hit milestones, and push your school to the top. 7 Waikato schools competing." },
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
          <p className="mt-6 text-center font-body text-xs text-muted-foreground">
            Limited to the first 24 registrations per school — first in, first served. No participation fee. Once registered, Sport Waikato will deliver your NFC bracelet and user pack to your school.
          </p>
        </div>
      </section>

      {/* Brand divider – stripe pattern with wordmark */}
      <div className="relative bg-secondary py-10 overflow-hidden">
        <div className="absolute inset-0">
          <img src={stripeBg} alt="" className="h-full w-full object-cover opacity-20" />
        </div>
        <div className="container relative mx-auto flex items-center justify-center px-4">
          <motion.img
            src={brandWordmark}
            alt="Freewheeler"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring" }}
            className="h-16 w-auto object-contain md:h-24 drop-shadow-lg"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/programme-overview"
              className="font-display text-xs uppercase tracking-wider text-secondary-foreground/60 underline hover:text-secondary-foreground/80"
            >
              Programme Overview
            </Link>
            <Link
              to="/book"
              className="font-display text-xs uppercase tracking-wider text-secondary-foreground/60 underline hover:text-secondary-foreground/80"
            >
              Book a Bike
            </Link>
            <Link
              to="/terms"
              className="font-display text-xs uppercase tracking-wider text-secondary-foreground/40 underline hover:text-secondary-foreground/60"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── Router ───────────────────────────────────────────────────────────────────

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Navigate to="/dashboard" replace /> : <PublicLanding />;
};

export default Index;
