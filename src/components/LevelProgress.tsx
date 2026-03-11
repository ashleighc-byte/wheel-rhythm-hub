import { motion } from "framer-motion";
import { Trophy, Bike, Cog, Link2, Award } from "lucide-react";

const LEVELS = [
  { name: "Kickstand", min: 0, icon: Bike },
  { name: "Pedal Pusher", min: 50, icon: Cog },
  { name: "Gear Shifter", min: 150, icon: Link2 },
  { name: "Chain Breaker", min: 300, icon: Award },
  { name: "Freewheeler", min: 500, icon: Trophy },
];

export function getLevel(totalPoints: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
      break;
    }
  }
  return { current, next };
}

export function getLevelName(totalPoints: number) {
  return getLevel(totalPoints).current.name;
}

interface LevelProgressProps {
  totalPoints: number;
}

const LevelProgress = ({ totalPoints }: LevelProgressProps) => {
  const { current, next } = getLevel(totalPoints);
  const CurrentIcon = current.icon;

  const progress = next
    ? ((totalPoints - current.min) / (next.min - current.min)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))] relative overflow-hidden speed-lines"
    >
      <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        Level Progress
      </div>

      <div className="mt-4 flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="flex h-12 w-12 items-center justify-center bg-secondary"
        >
          <CurrentIcon className="h-6 w-6 text-accent" />
        </motion.div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl font-bold uppercase text-primary">
              {current.name}
            </span>
            <span className="font-body text-sm text-muted-foreground">
              {totalPoints} pts
            </span>
          </div>

          {/* Glowing XP bar */}
          <div className="glow-bar mt-2 h-5 w-full border-[2px] border-secondary bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="glow-bar-fill h-full"
            />
          </div>

          <div className="mt-1 flex justify-between font-body text-xs text-muted-foreground">
            <span>{current.min} pts</span>
            {next ? (
              <span className="flex items-center gap-1">
                <next.icon className="h-3 w-3" /> {next.name} — {next.min} pts
              </span>
            ) : (
              <span className="font-bold text-primary">MAX LEVEL</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LevelProgress;
