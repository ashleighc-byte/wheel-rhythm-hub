import { motion } from "framer-motion";
import { Gauge, Zap, Activity, MapPin } from "lucide-react";
import type { LiveMetrics } from "@/hooks/useWattbikeBluetooth";

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border-[3px] p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))] ${
      highlight ? 'border-primary bg-primary/10' : 'border-secondary bg-card'
    }`}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <motion.div
        key={String(value)}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-baseline gap-1"
      >
        <span className={`font-display text-4xl font-bold leading-none ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </span>
        <span className="font-body text-sm text-muted-foreground">{unit}</span>
      </motion.div>
    </div>
  );
}

interface LiveMetricsProps {
  metrics: LiveMetrics;
  elapsedSeconds: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveMetricsDisplay({ metrics, elapsedSeconds }: LiveMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="border-[3px] border-secondary bg-card px-4 py-3 shadow-[4px_4px_0px_hsl(var(--brand-dark))] text-center">
        <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">Elapsed Time</p>
        <p className="font-display text-5xl font-bold text-foreground tabular-nums">
          {formatTime(elapsedSeconds)}
        </p>
      </div>

      {/* 2×2 metric grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Gauge}
          label="Speed"
          value={metrics.speed.toFixed(1)}
          unit="km/h"
          highlight
        />
        <MetricCard
          icon={Zap}
          label="Power"
          value={Math.round(metrics.power)}
          unit="W"
        />
        <MetricCard
          icon={Activity}
          label="Cadence"
          value={Math.round(metrics.cadence)}
          unit="rpm"
        />
        <MetricCard
          icon={MapPin}
          label="Distance"
          value={metrics.distance.toFixed(2)}
          unit="km"
        />
      </div>

      {metrics.heartRate > 0 && (
        <div className="flex items-center gap-2 border-[2px] border-secondary bg-card px-3 py-2">
          <span className="animate-pulse text-red-500">♥</span>
          <span className="font-body text-sm text-foreground">{metrics.heartRate} bpm</span>
        </div>
      )}
    </div>
  );
}
