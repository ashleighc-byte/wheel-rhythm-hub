import { motion } from "framer-motion";
import { Trophy, Bike, Cog, Mountain, Gauge, Timer, Crown, Zap } from "lucide-react";
import {
  getLevel as getGameLevel,
  getLevelName as getGameLevelName,
  LEVELS,
  type LevelInfo,
} from "@/lib/gamification";

// Re-export for backward compatibility
export function getLevel(totalPoints: number) {
  return getGameLevel(totalPoints);
}
export function getLevelName(totalPoints: number) {
  return getGameLevelName(totalPoints);
}

const LEVEL_ICONS = [Bike, Cog, Mountain, Zap, Gauge, Timer, Crown];

interface LevelProgressProps {
  totalPoints: number;
}

const LevelProgress = ({ totalPoints }: LevelProgressProps) => {
  const { current, next } = getLevel(totalPoints);
  const CurrentIcon = LEVEL_ICONS[current.index] ?? Bike;

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

      {/* Level roadmap dots */}
      <div className="mt-4 flex items-center justify-between px-1">
        {LEVELS.map((lvl, i) => {
          const Icon = LEVEL_ICONS[i];
          const reached = totalPoints >= lvl.min;
          return (
            <div key={lvl.name} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: "spring" }}
                className={`flex h-8 w-8 items-center justify-center border-[2px] ${
                  reached
                    ? "border-primary bg-secondary shadow-[0_0_8px_hsl(var(--brand-neon)/0.3)]"
                    : "border-muted bg-muted"
                }`}
              >
                <Icon className={`h-4 w-4 ${reached ? "text-accent" : "text-muted-foreground"}`} />
              </motion.div>
              <span className={`font-display text-[7px] font-bold uppercase tracking-wider ${
                reached ? "text-primary" : "text-muted-foreground"
              }`}>
                {lvl.min}
              </span>
            </div>
          );
        })}
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
                {(() => { const NextIcon = LEVEL_ICONS[next.index]; return <NextIcon className="h-3 w-3" />; })()}
                {next.name} — {next.min} pts
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
