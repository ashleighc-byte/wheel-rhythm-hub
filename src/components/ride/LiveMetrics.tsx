import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, MapPin, Heart } from "lucide-react";
import type { LiveMetrics } from "@/hooks/useWattbikeBluetooth";

// ── Power zones ───────────────────────────────────────────────────────────────
interface PowerZone {
  label: string;
  minW: number;
  colour: string;
  bg: string;
  ring: string;
  motivational: string;
}

const POWER_ZONES: PowerZone[] = [
  { label: "Easy",      minW: 0,   colour: "text-blue-400",   bg: "bg-blue-950",   ring: "border-blue-500",   motivational: "Warm up — find your rhythm" },
  { label: "Endurance", minW: 80,  colour: "text-green-400",  bg: "bg-green-950",  ring: "border-green-500",  motivational: "Good pace — you can hold this" },
  { label: "Tempo",     minW: 130, colour: "text-yellow-400", bg: "bg-yellow-950", ring: "border-yellow-500", motivational: "Pushing hard — stay focused!" },
  { label: "Threshold", minW: 180, colour: "text-orange-400", bg: "bg-orange-950", ring: "border-orange-500", motivational: "Near max — incredible effort!" },
  { label: "Max",       minW: 230, colour: "text-red-400",    bg: "bg-red-950",    ring: "border-red-400",    motivational: "🔥 EVERYTHING YOU HAVE!" },
];

export function getPowerZone(watts: number): PowerZone {
  for (let i = POWER_ZONES.length - 1; i >= 0; i--) {
    if (watts >= POWER_ZONES[i].minW) return POWER_ZONES[i];
  }
  return POWER_ZONES[0];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface LiveMetricsProps {
  metrics: LiveMetrics;
  elapsedSeconds: number;
}

export default function LiveMetricsDisplay({ metrics, elapsedSeconds }: LiveMetricsProps) {
  const zone = getPowerZone(metrics.power);

  return (
    <div className="space-y-3">
      {/* Power zone banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={zone.label}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center justify-between border-[2px] px-4 py-2 ${zone.ring} ${zone.bg}`}
        >
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${zone.colour}`} />
            <span className={`font-display text-sm uppercase tracking-widest ${zone.colour}`}>
              {zone.label} Zone
            </span>
          </div>
          <span className="font-body text-xs text-slate-400">{zone.motivational}</span>
        </motion.div>
      </AnimatePresence>

      {/* Giant speed */}
      <div className="border-[3px] border-secondary bg-card px-4 py-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))] text-center">
        <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">Speed</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={Math.round(metrics.speed * 10)}
            initial={{ scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="font-display text-8xl font-bold leading-none text-foreground tabular-nums"
          >
            {metrics.speed.toFixed(1)}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 font-display text-lg text-muted-foreground">km/h</p>
      </div>

      {/* 3-column secondary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border-[2px] border-secondary bg-card p-3 text-center">
          <Zap className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="font-display text-2xl font-bold text-foreground">{Math.round(metrics.power)}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Watts</p>
        </div>
        <div className="border-[2px] border-secondary bg-card p-3 text-center">
          <Activity className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="font-display text-2xl font-bold text-foreground">{Math.round(metrics.cadence)}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">RPM</p>
        </div>
        <div className="border-[2px] border-secondary bg-card p-3 text-center">
          <MapPin className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="font-display text-2xl font-bold text-foreground">{metrics.distance.toFixed(2)}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">km</p>
        </div>
      </div>

      {/* Timer + HR row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-[2px] border-secondary bg-card px-3 py-2 text-center">
          <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Time</p>
          <p className="font-display text-3xl font-bold text-foreground tabular-nums">
            {formatTime(elapsedSeconds)}
          </p>
        </div>
        {metrics.heartRate > 0 && (
          <div className="flex items-center gap-1.5 border-[2px] border-secondary bg-card px-3 py-2">
            <Heart className="h-4 w-4 animate-pulse text-red-500" />
            <div>
              <p className="font-display text-xl font-bold text-foreground">{metrics.heartRate}</p>
              <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">bpm</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
