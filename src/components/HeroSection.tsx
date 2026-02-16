import { motion } from "framer-motion";
import fwChainPoster from "@/assets/fw-chain-poster.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-secondary">
      {/* Hero image */}
      <div className="absolute inset-0">
        <img
          src={fwChainPoster}
          alt="Free Wheeler - Go hard without having to go anywhere"
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl leading-[0.95] text-secondary-foreground md:text-7xl lg:text-8xl"
          >
            NO PRESSURE.
            <br />
            NO SCHEDULE.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, rotate: -5 }}
            animate={{ opacity: 1, rotate: -3 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="my-8"
          >
            <span className="tape-element text-lg md:text-xl">GO ANYWHERE</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="max-w-lg font-body text-lg leading-relaxed text-secondary-foreground/80"
          >
            Ride whenever you want, wherever you want. No commitments, no stress—just
            you and your bike. Join in whenever it works for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <button className="tape-element text-base transition-transform hover:rotate-0 hover:scale-105 md:text-lg">
              JOIN THE PILOT
            </button>
            <button className="tape-element-green text-base transition-transform hover:rotate-0 hover:scale-105 md:text-lg">
              LEARN MORE
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
