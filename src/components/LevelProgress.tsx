import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const LEVELS = [
  { name: "Kickstand", min: 0, icon: "🚲" },
  { name: "Pedal Pusher", min: 50, icon: "🦵" },
  { name: "Chain Breaker", min: 150, icon: "⛓️" },
  { name: "Hill Climber", min: 300, icon: "⛰️" },
  { name: "Sprint King", min: 500, icon: "👑" },
  { name: "Tour Legend", min: 800, icon: "🏆" },
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

  const progress = next
    ? ((totalPoints - current.min) / (next.min - current.min)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
    >
      <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        Level Progress
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl">{current.icon}</span>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl font-bold uppercase text-primary">
              {current.name}
            </span>
            <span className="font-body text-sm text-muted-foreground">
              {totalPoints} pts
            </span>
          </div>

          {/* XP bar */}
          <div className="mt-2 h-4 w-full overflow-hidden border-[2px] border-secondary bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-primary"
            />
          </div>

          <div className="mt-1 flex justify-between font-body text-xs text-muted-foreground">
            <span>{current.min} pts</span>
            {next ? (
              <span>
                {next.icon} {next.name} — {next.min} pts
              </span>
            ) : (
              <span>MAX LEVEL 🎉</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LevelProgress;
