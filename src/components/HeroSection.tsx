import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import artRaceModeHero from "@/assets/art-race-mode-hero.png";
import SessionFeedbackForm from "./SessionFeedbackForm";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const [logOpen, setLogOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <section className="relative overflow-hidden bg-secondary">
      {/* Speed lines decoration */}
      <div className="absolute inset-0 speed-lines" />
      
      {/* Hero image */}
      <div className="absolute inset-0">
        <img
          src={artRaceModeHero}
          alt="Free Wheeler Bike League – Race Mode"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />
      </div>

      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="text-5xl leading-[0.95] text-secondary-foreground md:text-7xl lg:text-8xl"
          >
            {isAdmin ? (
              <>TRACK YOUR<br />RIDERS.</>
            ) : (
              <>NO PRESSURE.<br />NO SCHEDULE.</>
            )}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: -100, rotate: -5 }}
            animate={{ opacity: 1, x: 0, rotate: -3 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
            className="my-8"
          >
            <span className="tape-element text-lg md:text-xl">JUST RIDE.</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="max-w-lg font-body text-lg leading-relaxed text-secondary-foreground/80"
          >
            {isAdmin
              ? "Keep tabs on your students' progress, track sessions, and celebrate their achievements — all in one place."
              : "Free Wheeler Bike League is indoor cycling on your terms. Jump on a smart bike, race in MyWhoosh, and log your rides. Ride when you want. Track your progress. Compete with your school."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            {isAdmin ? (
              <button
                onClick={() => navigate("/teacher-dashboard")}
                className="tape-element-green text-base md:text-lg"
              >
                TRACK YOUR STUDENTS
              </button>
            ) : (
              <>
                <button
                  onClick={() => setLogOpen(true)}
                  className="tape-element text-base md:text-lg"
                >
                  LOG A RIDE
                </button>
                <button
                  onClick={() => navigate("/info")}
                  className="tape-element-green text-base md:text-lg"
                >
                  LEARN MORE
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />
    </section>
  );
};

export default HeroSection;
