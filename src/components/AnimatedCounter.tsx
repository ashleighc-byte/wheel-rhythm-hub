import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  label: string;
}

const AnimatedCounter = ({ target, duration = 2000, label }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
  }, [target]);

  useEffect(() => {
    if (target === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, rotate: -1 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200 }}
      className="stat-card px-6 py-8 text-center"
    >
      <div className="font-display text-4xl font-bold text-accent md:text-5xl">
        {count.toLocaleString()}
      </div>
      <div className="mt-2 font-display text-xs font-semibold uppercase tracking-widest text-accent/80">
        {label}
      </div>
    </motion.div>
  );
};

export default AnimatedCounter;
