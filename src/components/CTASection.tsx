import { useState } from "react";
import { motion } from "framer-motion";
import SessionFeedbackForm from "./SessionFeedbackForm";
import ReportIssueForm from "./ReportIssueForm";
import { useAuth } from "@/hooks/useAuth";
import artRideCompleteNew from "@/assets/art-ride-complete-new.png";

const CTASection = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <>
      <SessionFeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <ReportIssueForm open={issueOpen} onOpenChange={setIssueOpen} />

      <section className="relative bg-secondary py-20 overflow-hidden">
        {/* Background illustration */}
        <div className="absolute inset-0">
          <img src={artRideCompleteNew} alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-secondary/80" />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 inline-block">
              <span className="tape-element text-2xl md:text-3xl">EVERY RIDE COUNTS</span>
            </div>
            <p className="mx-auto max-w-md font-body text-lg text-secondary-foreground/80">
              {isAdmin
                ? "Your students are riding. Stay on top of their progress and celebrate every milestone."
                : "Ready to pedal your own path? Jump on a bike, log your ride, and move your school up the leaderboard."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {!isAdmin && (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="tape-element text-lg transition-transform hover:rotate-0 hover:scale-105"
                >
                  LOG A DAILY RIDE
                </button>
              )}
              <button
                onClick={() => setIssueOpen(true)}
                className="tape-element-green text-lg transition-transform hover:rotate-0 hover:scale-105 flex flex-col items-center"
              >
                <span>SOMETHING NOT WORKING?</span>
                <span className="text-xs font-body font-normal normal-case tracking-normal opacity-80">Let us know here</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default CTASection;
