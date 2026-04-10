import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import brandPedalPath from "@/assets/brand-pedal-your-path.png";
import stripeBg from "@/assets/stripe-bg-1.png";
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
      {/* Subtle brand watermark overlay */}
      <img
        src={brandPedalPath}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 w-56 opacity-[0.04] md:w-80"
      />
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Text content */}
          <div className="flex-1">
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
                  onClick={() => navigate("/leaderboards")}
                  className="tape-element-green text-base md:text-lg"
                >
                  VIEW LEADERBOARDS
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

          {/* Brand graphic – visible and properly sized */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
            className="flex-shrink-0 w-72 md:w-96 hidden sm:block"
          >
            <img
              src={brandPedalPath}
              alt="Pedal Your Own Path – Free Wheeler Bike League"
              className="w-full h-auto drop-shadow-lg"
            />
          </motion.div>
        </div>
      </div>

      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />
    </section>
  );
};

export default HeroSection;
