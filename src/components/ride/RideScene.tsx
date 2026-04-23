/**
 * RideScene — Canvas-based animated ride environment.
 *
 * Layers (back → front):
 *   Sky gradient  →  drifting clouds  →  distant mountains  →
 *   mid hills  →  terrain (actual route profile)  →  speed lines  →
 *   🚴 rider  →  km markers  →  thin progress bar
 *
 * Mountains are procedural sinusoidal waves so they tile naturally at
 * any parallax offset without storing extra data.
 */
import { useEffect, useRef, useMemo } from "react";
import type { Route } from "@/data/routes";
import { getPowerZone } from "@/components/ride/LiveMetrics";

// ── Canvas coordinate constants ───────────────────────────────────────────────
const CW = 800;           // logical canvas width  (CSS scales to 100%)
const CH = 260;           // logical canvas height
const RIDER_X = CW * 0.28; // rider sits 28% from left edge
const PX_PER_KM = 100;    // terrain pixels per km of route

// ── Sky palette per power zone ────────────────────────────────────────────────
const ZONE_SKY: Record<string, [string, string, string]> = {
  Easy:       ["#bfdbfe", "#7dd3fc", "#e0f7fa"],
  Endurance:  ["#93c5fd", "#3b82f6", "#dbeafe"],
  Tempo:      ["#fcd34d", "#fb923c", "#fef3c7"],
  Threshold:  ["#f97316", "#dc2626", "#fed7aa"],
  Max:        ["#a855f7", "#7c3aed", "#fce7f3"],
};

// ── Cloud shapes ──────────────────────────────────────────────────────────────
const CLOUD_DEFS = [
  { bx: 90,  by: 28, r: 20 },
  { bx: 280, by: 16, r: 16 },
  { bx: 460, by: 32, r: 22 },
  { bx: 640, by: 20, r: 18 },
  { bx: 820, by: 38, r: 14 },
];

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.85, cy - r * 0.2, r * 0.72, 0, Math.PI * 2);
  ctx.arc(cx - r * 0.75, cy + r * 0.1, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

// ── Procedural mountain / hill layer ─────────────────────────────────────────
function drawMountainLayer(
  ctx: CanvasRenderingContext2D,
  baseY: number,     // vertical centre of the layer
  amplitude: number, // vertical swing height
  freq: number,      // horizontal frequency (radians per pixel)
  phaseShift: number,// parallax phase offset
  fillColour: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, CH);
  for (let x = 0; x <= CW; x += 3) {
    const p = (x + phaseShift) * freq;
    const y = baseY - amplitude * (
      0.50 * Math.sin(p) +
      0.30 * Math.sin(p * 2.1 + 1.7) +
      0.20 * Math.sin(p * 3.9 + 3.1)
    );
    ctx.lineTo(x, Math.max(0, y));
  }
  ctx.lineTo(CW, CH);
  ctx.closePath();
  ctx.fillStyle = fillColour;
  ctx.fill();
  ctx.restore();
}

// ── Terrain helpers ───────────────────────────────────────────────────────────
const TERRAIN_BOTTOM = CH - 6;
const TERRAIN_TOP    = CH * 0.42;

function buildTerrainPoints(profile: number[], totalPx: number): [number, number][] {
  const STEPS = 200;
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const range = max - min || 1;
  const pts: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const frac = i / STEPS;
    const idx  = frac * (profile.length - 1);
    const lo   = Math.floor(idx);
    const hi   = Math.min(lo + 1, profile.length - 1);
    const t    = idx - lo;
    const elev = profile[lo] * (1 - t) + profile[hi] * t;
    const norm = (elev - min) / range;
    pts.push([frac * totalPx, TERRAIN_BOTTOM - norm * (TERRAIN_BOTTOM - TERRAIN_TOP)]);
  }
  return pts;
}

function terrainYAt(pts: [number, number][], frac: number): number {
  if (!pts.length) return CH * 0.6;
  const idx = Math.round(Math.min(frac, 1) * (pts.length - 1));
  return pts[idx][1];
}

// ── Component ─────────────────────────────────────────────────────────────────
interface RideSceneProps {
  route: Route;
  distanceRiddenKm: number;
  speedKmh: number;
  powerW: number;
}

export default function RideScene({ route, distanceRiddenKm, speedKmh, powerW }: RideSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // These refs let the rAF loop read fresh values without stale-closure issues
  const distRef  = useRef(distanceRiddenKm);
  const speedRef = useRef(speedKmh);
  const powerRef = useRef(powerW);
  distRef.current  = distanceRiddenKm;
  speedRef.current = speedKmh;
  powerRef.current = powerW;

  const cloudOffRef = useRef(0);
  const rafRef      = useRef(0);
  const lastRef     = useRef(0);

  const totalPx = route.distance_km * PX_PER_KM;

  const terrainPts = useMemo(
    () => buildTerrainPoints(route.elevationProfile, totalPx),
    [route.id, totalPx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Size canvas once (DPR-aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);
  }, []);

  // rAF draw loop (~20 fps is enough — clouds move slowly)
  useEffect(() => {
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastRef.current < 50) return; // ~20 fps cap
      lastRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dist  = distRef.current;
      const speed = speedRef.current;
      const power = powerRef.current;
      const zone  = getPowerZone(power);
      const sky   = ZONE_SKY[zone.label] ?? ZONE_SKY.Easy;
      const prog  = Math.min(dist / route.distance_km, 1);
      const riderTerrX  = prog * totalPx;
      const terrainOffX = -(riderTerrX - RIDER_X);

      cloudOffRef.current += 0.6;

      // 1 — Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CH * 0.7);
      skyGrad.addColorStop(0, sky[0]);
      skyGrad.addColorStop(0.55, sky[1]);
      skyGrad.addColorStop(1, sky[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CW, CH);

      // 2 — Clouds
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      for (const c of CLOUD_DEFS) {
        const cx = ((c.bx - cloudOffRef.current * 0.25) % (CW + 240) + CW + 240) % (CW + 240) - 120;
        drawCloud(ctx, cx, c.by, c.r);
      }
      ctx.globalAlpha = 1;

      // 3 — Distant mountains (parallax 0.07×)
      drawMountainLayer(ctx, CH * 0.45, CH * 0.22, 0.0018, terrainOffX * 0.07, "#1e3a5f", 0.65);

      // 4 — Mid hills (parallax 0.22×)
      drawMountainLayer(ctx, CH * 0.62, CH * 0.09, 0.005, terrainOffX * 0.22, "#1a4731", 0.82);

      // 5 — Terrain
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, CW, CH);
      ctx.clip();

      if (terrainPts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(terrainPts[0][0] + terrainOffX, CH);
        for (const [tx, ty] of terrainPts) ctx.lineTo(tx + terrainOffX, ty);
        ctx.lineTo(terrainPts[terrainPts.length - 1][0] + terrainOffX, CH);
        ctx.closePath();

        const tGrad = ctx.createLinearGradient(0, TERRAIN_TOP, 0, CH);
        tGrad.addColorStop(0, "#4ade80");
        tGrad.addColorStop(0.3, "#16a34a");
        tGrad.addColorStop(1, "#14532d");
        ctx.fillStyle = tGrad;
        ctx.fill();

        // Surface edge
        ctx.beginPath();
        ctx.moveTo(terrainPts[0][0] + terrainOffX, terrainPts[0][1]);
        for (const [tx, ty] of terrainPts) ctx.lineTo(tx + terrainOffX, ty);
        ctx.strokeStyle = "#86efac";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // 6 — Speed lines
      if (speed > 22) {
        const rY = terrainYAt(terrainPts, prog);
        const intensity = Math.min((speed - 22) / 18, 1);
        ctx.save();
        ctx.globalAlpha = intensity * 0.45;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
          const len = 18 + i * 10;
          const ly  = rY - 28 + i * 8;
          ctx.beginPath();
          ctx.moveTo(RIDER_X - 52 - len, ly);
          ctx.lineTo(RIDER_X - 52, ly);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7 — Rider emoji (with a subtle shadow for depth)
      const riderY = terrainYAt(terrainPts, prog);
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillText("🚴", RIDER_X, riderY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 8 — km markers
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let km = 0; km <= route.distance_km; km++) {
        const tx = (km / route.distance_km) * totalPx + terrainOffX;
        if (tx < -10 || tx > CW + 10) continue;
        const ty = terrainYAt(terrainPts, km / route.distance_km);
        ctx.fillText(`${km}km`, tx, ty + 3);
      }

      // 9 — Top progress bar
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, CW, 5);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(0, 0, prog * CW, 5);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [route.id, route.distance_km, totalPx, terrainPts]);

  return (
    <div className="overflow-hidden border-[2px] border-secondary shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-hidden
      />
    </div>
  );
}
