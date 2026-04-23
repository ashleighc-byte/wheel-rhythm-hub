import { normaliseProfile, type Route } from "@/data/routes";

interface ElevationProfileProps {
  route: Route;
  distanceRiddenKm: number;
}

export default function ElevationProfile({ route, distanceRiddenKm }: ElevationProfileProps) {
  const profile = normaliseProfile(route.elevationProfile);
  const W = 320;
  const H = 80;
  const PAD = 4;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // Build SVG path points
  const points = profile.map((v, i) => {
    const x = PAD + (i / (profile.length - 1)) * innerW;
    const y = PAD + (1 - v) * innerH;
    return `${x},${y}`;
  });

  const areaPath =
    `M${PAD},${PAD + innerH} ` +
    points.map(p => `L${p}`).join(' ') +
    ` L${PAD + innerW},${PAD + innerH} Z`;

  const linePath = `M${points.join(' L')}`;

  // Progress marker position
  const frac = Math.min(distanceRiddenKm / route.distance_km, 1);
  const markerIdx = frac * (profile.length - 1);
  const loIdx = Math.floor(markerIdx);
  const hiIdx = Math.min(loIdx + 1, profile.length - 1);
  const t = markerIdx - loIdx;
  const markerNorm = profile[loIdx] * (1 - t) + profile[hiIdx] * t;
  const markerX = PAD + frac * innerW;
  const markerY = PAD + (1 - markerNorm) * innerH;

  return (
    <div className="border-[2px] border-secondary bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
          {route.name}
        </span>
        <span className="font-body text-xs text-muted-foreground">
          {distanceRiddenKm.toFixed(2)} / {route.distance_km} km
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        aria-hidden
      >
        {/* Filled area */}
        <path d={areaPath} fill="hsl(var(--primary) / 0.15)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
        {/* Progress fill — slightly brighter */}
        {frac > 0 && (() => {
          const progressPoints = profile
            .slice(0, Math.ceil(markerIdx) + 1)
            .map((v, i) => {
              const x = PAD + (i / (profile.length - 1)) * innerW;
              const y = PAD + (1 - v) * innerH;
              return `${x},${y}`;
            });
          const progressArea =
            `M${PAD},${PAD + innerH} ` +
            progressPoints.map(p => `L${p}`).join(' ') +
            ` L${markerX},${PAD + innerH} Z`;
          return (
            <path d={progressArea} fill="hsl(var(--primary) / 0.4)" />
          );
        })()}
        {/* Rider dot */}
        <circle cx={markerX} cy={markerY} r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
      </svg>

      <div className="mt-1 flex items-center justify-between">
        <span className="font-body text-[10px] text-muted-foreground">Start</span>
        <span className="font-body text-[10px] text-muted-foreground">
          {route.elevation_m} m elevation
        </span>
        <span className="font-body text-[10px] text-muted-foreground">Finish</span>
      </div>
    </div>
  );
}
