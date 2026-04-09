import { motion } from "framer-motion";
import { Mountain, Bike, Flag } from "lucide-react";

const MT_RUAPEHU_HEIGHT = 2797;

interface MtRuapehuTrackerProps {
  totalElevation: number;
}

export default function MtRuapehuTracker({ totalElevation }: MtRuapehuTrackerProps) {
  const pct = Math.min((totalElevation / MT_RUAPEHU_HEIGHT) * 100, 100);
  const completed = pct >= 100;

  // Mountain path points - a stylised mountain silhouette
  // The mountain goes from bottom-left to peak top-center to bottom-right
  const mountainPath = "M 0,300 L 40,280 L 80,260 L 120,220 L 160,200 L 200,160 L 240,120 L 260,90 L 280,60 L 300,40 L 310,25 L 320,15 L 330,10 L 340,15 L 350,25 L 360,40 L 380,60 L 400,90 L 420,130 L 440,160 L 460,200 L 480,230 L 520,260 L 560,280 L 600,290 L 640,300 L 0,300 Z";

  // Snow cap path
  const snowPath = "M 280,60 L 300,40 L 310,25 L 320,15 L 330,10 L 340,15 L 350,25 L 360,40 L 380,60 L 370,65 L 355,55 L 345,62 L 335,50 L 325,58 L 310,52 L 295,60 Z";

  // Calculate bike position along the mountain slope
  // Map percentage to x,y along left side of mountain
  const getBikePosition = (percent: number) => {
    const t = percent / 100;
    // Interpolate along left slope from (0,300) to (330,10)
    const x = t * 330;
    const y = 300 - t * 290;
    return { x, y };
  };

  const bikePos = getBikePosition(pct);

  // Trail path from bottom to current bike position
  const trailPoints = Array.from({ length: 20 }, (_, i) => {
    const t = (i / 19) * pct / 100;
    return `${t * 330},${300 - t * 290}`;
  }).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42 }}
      className="mb-6 border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Mountain className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
          Climb Mt Ruapehu
        </h3>
        <span className="ml-auto font-display text-xs text-muted-foreground">
          {Math.round(totalElevation)}m / {MT_RUAPEHU_HEIGHT}m
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-sm" style={{ aspectRatio: "640/320" }}>
        <svg
          viewBox="0 0 640 320"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Sky gradient */}
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand-dark))" />
              <stop offset="60%" stopColor="hsl(var(--secondary))" />
              <stop offset="100%" stopColor="hsl(var(--muted))" />
            </linearGradient>
            <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--brand-dark))" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="trailGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--brand-neon))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--brand-neon))" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="640" height="300" fill="url(#skyGrad)" />

          {/* Ground */}
          <rect x="0" y="290" width="640" height="30" fill="hsl(var(--brand-dark))" opacity="0.5" />

          {/* Mountain body */}
          <motion.path
            d={mountainPath}
            fill="url(#mountainGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Snow cap */}
          <motion.path
            d={snowPath}
            fill="white"
            opacity="0.85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Elevation markers */}
          {[500, 1000, 1500, 2000, 2500].map(m => {
            const t = m / MT_RUAPEHU_HEIGHT;
            const y = 300 - t * 290;
            return (
              <g key={m}>
                <line
                  x1={t * 330 - 20}
                  y1={y}
                  x2={t * 330 + 30}
                  y2={y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="0.5"
                  strokeDasharray="3,3"
                  opacity="0.4"
                />
                <text
                  x={t * 330 + 35}
                  y={y + 3}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="8"
                  fontFamily="Oswald, sans-serif"
                  opacity="0.6"
                >
                  {m}m
                </text>
              </g>
            );
          })}

          {/* Trail / path travelled */}
          {pct > 0 && (
            <motion.polyline
              points={trailPoints}
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          )}

          {/* Flag at summit */}
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <line x1="330" y1="10" x2="330" y2="-5" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <polygon points="330,-5 348,-1 330,3" fill="hsl(var(--primary))" />
            <text
              x="330"
              y="-10"
              textAnchor="middle"
              fill="hsl(var(--primary))"
              fontSize="8"
              fontFamily="Oswald, sans-serif"
              fontWeight="bold"
            >
              {MT_RUAPEHU_HEIGHT}m
            </text>
          </motion.g>

          {/* Bike icon climbing */}
          <motion.g
            initial={{ x: 0, y: 300 }}
            animate={{ x: bikePos.x, y: bikePos.y }}
            transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
          >
            {/* Glow behind bike */}
            <circle r="12" fill="hsl(var(--brand-neon))" opacity="0.3">
              <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Bike circle */}
            <circle r="8" fill="hsl(var(--brand-dark))" stroke="hsl(var(--brand-neon))" strokeWidth="2" />
            {/* Bike icon - simplified */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fill="hsl(var(--brand-neon))"
            >
              🚴
            </text>
          </motion.g>

          {/* Completed celebration */}
          {completed && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3, type: "spring" }}
            >
              {[0, 1, 2, 3, 4, 5].map(i => (
                <motion.circle
                  key={i}
                  cx={330 + Math.cos(i * 60 * Math.PI / 180) * 25}
                  cy={10 + Math.sin(i * 60 * Math.PI / 180) * 25}
                  r="3"
                  fill="hsl(var(--brand-neon))"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 3 + i * 0.15, duration: 1, repeat: Infinity, repeatDelay: 2 }}
                />
              ))}
            </motion.g>
          )}
        </svg>

        {/* Percentage overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-sm bg-background/80 px-3 py-1.5 backdrop-blur-sm">
          <Bike className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold text-foreground">
            {Math.round(pct)}% climbed
          </span>
        </div>

        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-sm bg-primary px-3 py-1.5"
          >
            <Flag className="h-3 w-3 text-primary-foreground" />
            <span className="font-display text-xs font-bold uppercase text-primary-foreground">
              Summit reached!
            </span>
          </motion.div>
        )}
      </div>

      <p className="mt-2 font-body text-xs text-muted-foreground">
        Track your total elevation gain as you climb to the summit of Mt Ruapehu ({MT_RUAPEHU_HEIGHT}m) — New Zealand's largest active volcano!
      </p>
    </motion.div>
  );
}
