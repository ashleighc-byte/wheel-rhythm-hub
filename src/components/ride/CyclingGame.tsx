import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWattbikeBluetooth } from '@/hooks/useWattbikeBluetooth';

type BluetoothDevice = any;
type BluetoothRemoteGATTCharacteristic = any;

const A = (f: string) => `/assets/game/${f}`;

const ASSETS = {
  treePine:      A('treePine.glb'),
  treeOak:       A('treeOak.glb'),
  treePalm:      A('treePalm.glb'),
  treeLarge:     A('treeLarge.glb'),
  treeSmall:     A('treeSmall.glb'),
  buildingSmall: A('buildingSmall.glb'),
  buildingLarge: A('buildingLarge.glb'),
  lampPost:      A('lampPost.glb'),
  fence:         A('fence.glb'),
  grandStand:    A('grandStand.glb'),
  flagFinish:    A('flagFinish.glb'),
  bicycle:       A('Bicycle.glb'),
};

export interface GameRoute {
  id: string;
  name: string;
  desc: string;
  dist: number;
  elevGain: number;
  terrain: 'flat' | 'rolling' | 'hilly';
  region: string;
  theme: string;
}

type Metrics = { speed: number; power: number; cadence: number; distance: number; elevation: number };

interface Props {
  route: GameRoute;
  playerName?: string;
  onComplete?: (data: Metrics & { duration: number }) => void;
  onBack?: () => void;
}

function getUint24LE(view: DataView, offset: number): number {
  return view.getUint8(offset) + (view.getUint8(offset + 1) << 8) + (view.getUint8(offset + 2) << 16);
}

// ── Nametag sprite ────────────────────────────────────────────────────────────
function makeNametag(text: string, color = '#4af'): THREE.Sprite {
  const W = 256, H = 56;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  (ctx as any).roundRect?.(3, 3, W - 6, H - 6, 10) ?? ctx.rect(3, 3, W - 6, H - 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  (ctx as any).roundRect?.(3, 3, W - 6, H - 6, 10) ?? ctx.rect(3, 3, W - 6, H - 6);
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 14), W / 2, H / 2);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.8, 0.62, 1);
  sprite.position.set(0, 2.4, 0);
  return sprite;
}

export default function CyclingGame({ route, playerName = 'Rider', onComplete, onBack }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const miniRef       = useRef<HTMLCanvasElement>(null);

  // Three.js refs — never trigger React re-renders
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const camera2Ref    = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const clock         = useRef(new THREE.Clock());
  const bikeGroup     = useRef(new THREE.Group());
  const hbarGroup     = useRef(new THREE.Group());
  const frontWheel    = useRef<THREE.Object3D | null>(null);
  const backWheel     = useRef<THREE.Object3D | null>(null);
  const dustPts       = useRef<THREE.Points | null>(null);
  const splashPts     = useRef<THREE.Points | null>(null);
  const envObjs       = useRef<THREE.Object3D[]>([]);
  const rafId         = useRef(0);

  // Spline path
  const pathCurve     = useRef<THREE.CatmullRomCurve3 | null>(null);

  // Game logic
  const gameActive      = useRef(false);
  const simMode         = useRef(true);
  const metrics         = useRef<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const terrainPts      = useRef<{ x: number; y: number }[]>([]);
  const totalDist       = useRef(route.dist);
  const startTime       = useRef(0);
  const bleDevice       = useRef<BluetoothDevice | null>(null);
  const bleChar         = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const lastUpload      = useRef(0);
  const distanceBaseRef = useRef(0);
  const elapsedRef      = useRef(0);

  // Multiplayer
  const playerId      = useRef(Math.random().toString(36).substr(2, 9));
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const otherRiders   = useRef<Record<string, { group: THREE.Group; lastDist: number; name: string }>>({});
  const splitRef      = useRef(false);

  const ble = useWattbikeBluetooth();

  // React state — HUD + lobby only
  const [hud, setHud]             = useState<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const [elapsed, setElapsed]     = useState(0);
  const [active, setActive]       = useState(false);
  const [sim, setSim]             = useState(true);
  const [splitScreen, setSplitScreen] = useState(false);
  const [status, setStatus]       = useState(`Route: ${route.name} – ${route.desc}`);
  const [name, setName]           = useState(playerName);
  const [roomInput, setRoomInput] = useState('');
  const [roomLabel, setRoomLabel] = useState('');

  // ── Terrain elevation profile ─────────────────────────────────────────────
  function genTerrain() {
    const n = 200;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      let y = 0;
      if      (route.terrain === 'flat')    y = Math.sin(i * 0.5) * 2 + Math.cos(i * 0.3);
      else if (route.terrain === 'rolling') y = Math.sin(i * 0.8) * 8 + Math.cos(i * 0.4) * 5;
      else                                  y = Math.sin(i * 0.7) * 20 + Math.cos(i * 0.2) * 15;
      pts.push({ x: i * (route.dist / n), y });
    }
    const gain = pts.reduce((g, p, i) => (i > 0 && p.y > pts[i - 1].y ? g + p.y - pts[i - 1].y : g), 0);
    if (gain > 0) { const s = route.elevGain / gain; pts.forEach(p => (p.y *= s)); }
    let run = 0; pts.forEach(p => { run += p.y; p.y = run; });
    terrainPts.current = pts;
    totalDist.current  = route.dist;
  }

  function elevAt(d: number): number {
    const pts = terrainPts.current;
    if (pts.length < 2) return 0;
    const raw = (d / totalDist.current) * (pts.length - 1);
    const idx  = Math.min(Math.floor(raw), pts.length - 2);
    return pts[idx].y + (pts[idx + 1].y - pts[idx].y) * (raw - idx);
  }

  // ── Spline path — gives the track its corners ─────────────────────────────
  function genSplinePath(): THREE.CatmullRomCurve3 {
    // Turn amplitude by terrain type — flat = gentle bends, hilly = tight switchbacks
    const amp = route.terrain === 'flat' ? 10 : route.terrain === 'rolling' ? 22 : 40;
    // Use route id as a seed so each route has a unique shape
    const seed = route.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 0.07;
    const N = 22;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const t  = i / N;
      const fw = t * 220;                                     // forward (world Z)
      const lat = Math.sin(t * Math.PI * 3.5 + seed) * amp   // primary turn wave
                + Math.cos(t * Math.PI * 2.1 + seed) * amp * 0.35; // secondary
      const elev = elevAt(t * route.dist) * 0.03;             // subtle hill in Y
      pts.push(new THREE.Vector3(lat, elev, fw));
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }

  // ── Particles ─────────────────────────────────────────────────────────────
  function initParticles(s: THREE.Scene) {
    const mkPts = (count: number, color: number, size: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 2;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55 }));
      pts.visible = false; s.add(pts); return pts;
    };
    dustPts.current   = mkPts(120, 0xccaa88, 0.08);
    splashPts.current = mkPts(60,  0x88ccff, 0.12);
  }

  // ── Rider model (Bicycle.glb) ─────────────────────────────────────────────
  function loadRider(group: THREE.Group, tagName: string, tagColor?: string) {
    new GLTFLoader().load(ASSETS.bicycle, (gltf) => {
      const obj = gltf.scene;
      obj.scale.setScalar(0.9);
      obj.position.set(0, 0, 0);
      obj.traverse(c => {
        if (!(c instanceof THREE.Mesh)) return;
        c.castShadow = true;
        c.receiveShadow = true;
        const n = c.name.toLowerCase();
        // Identify wheels for spin animation
        if (n.includes('wheel') || n.includes('tyre') || n.includes('tire')) {
          if (!frontWheel.current) frontWheel.current = c;
          else if (!backWheel.current) backWheel.current = c;
        }
      });
      group.add(obj);
      group.add(makeNametag(tagName, tagColor));
    }, undefined, () => {
      // Fallback if GLB fails to load
      fallbackRider(group);
      addPrimitiveWheels(group);
      group.add(makeNametag(tagName, tagColor));
    });
  }

  function addPrimitiveWheels(group: THREE.Group) {
    const geo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const fw  = new THREE.Mesh(geo, mat); fw.position.set(0, 0.3,  0.6); fw.castShadow = true;
    const bw  = new THREE.Mesh(geo, mat); bw.position.set(0, 0.3, -0.6); bw.castShadow = true;
    group.add(fw); group.add(bw);
    frontWheel.current = fw; backWheel.current = bw;
  }

  function fallbackRider(group: THREE.Group) {
    const add = (geo: THREE.BufferGeometry, color: number, y: number) => {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
      m.position.y = y; m.castShadow = true; group.add(m);
    };
    add(new THREE.BoxGeometry(0.2, 0.1, 1.2),           0xdd3333, 0.6);
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6), 0x3355aa, 0.9);
    add(new THREE.SphereGeometry(0.15),                  0xffccaa, 1.25);
  }

  function buildHandlebars(): THREE.Group {
    const g = new THREE.Group();
    const hcurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -0.4, -0.8),
      new THREE.Vector3(0,    -0.3, -0.8),
      new THREE.Vector3( 0.3, -0.4, -0.8),
    ]);
    g.add(new THREE.Mesh(
      new THREE.TubeGeometry(hcurve, 8, 0.02, 4, false),
      new THREE.MeshStandardMaterial({ color: 0xcccccc }),
    ));
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const gripGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
    [-0.3, 0.3].forEach(x => {
      const grip = new THREE.Mesh(gripGeo, gripMat);
      grip.position.set(x, -0.4, -0.8); g.add(grip);
    });
    return g;
  }

  function animatePedalling(dt: number) {
    const angle = (metrics.current.cadence / 60) * Math.PI * 2 * dt;
    if (frontWheel.current) frontWheel.current.rotation.x += angle;
    if (backWheel.current)  backWheel.current.rotation.x  += angle;
  }

  // ── GLB placement helper ──────────────────────────────────────────────────
  function place(s: THREE.Scene, url: string, scale: number, pos: THREE.Vector3, rotY = 0) {
    new GLTFLoader().load(url, (gltf) => {
      const obj = gltf.scene;
      obj.scale.setScalar(scale);
      obj.position.copy(pos);
      obj.rotation.y = rotY;
      obj.traverse(c => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });
      s.add(obj); envObjs.current.push(obj);
    });
  }

  // Place a GLB object laterally off the spline at progress t (0–1)
  function placeAlongCurve(
    s: THREE.Scene,
    url: string,
    scale: number,
    t: number,
    lateral: number,   // positive = rider's left, negative = right
    yOffset = 0,
  ) {
    const curve = pathCurve.current; if (!curve) return;
    const pos     = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const normal  = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const finalPos = pos.clone().addScaledVector(normal, lateral);
    finalPos.y += yOffset;
    const rotY = Math.atan2(tangent.x, tangent.z);
    place(s, url, scale, finalPos, rotY);
  }

  // ── Curved road ribbon along the spline ───────────────────────────────────
  function createCurvedRoad(s: THREE.Scene, curve: THREE.CatmullRomCurve3) {
    const N = 240, roadW = 6;
    const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t       = i / N;
      const pt      = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const normal  = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const L = pt.clone().addScaledVector(normal, -roadW / 2);
      const R = pt.clone().addScaledVector(normal,  roadW / 2);
      L.y = pt.y - 0.01; R.y = pt.y - 0.01;
      positions.push(L.x, L.y, L.z, R.x, R.y, R.z);
      uvs.push(0, t, 1, t);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x555566 }));
    mesh.receiveShadow = true; mesh.name = 'road';
    s.add(mesh); envObjs.current.push(mesh);
  }

  // ── Special decorative geometry ───────────────────────────────────────────
  function createSandRipples(s: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(200, 400, 50, 100);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.8) * 0.1 + Math.cos(y * 0.6) * 0.1);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xc2b280 }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = -1.95; mesh.receiveShadow = true;
    s.add(mesh); envObjs.current.push(mesh);
  }

  function createVineyardRows(s: THREE.Scene) {
    for (let z = 0; z < 180; z += 15) {
      for (const x of [-8, 8]) {
        for (let i = 0; i < 6; i++) {
          const pz = z + i * 2;
          const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 2),
            new THREE.MeshLambertMaterial({ color: 0x6B4226 }),
          );
          post.position.set(x, 1, pz); post.castShadow = true;
          s.add(post); envObjs.current.push(post);
          const vine = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.8, 6),
            new THREE.MeshLambertMaterial({ color: 0x4a6b2a }),
          );
          vine.position.set(x, 0.4, pz);
          s.add(vine); envObjs.current.push(vine);
        }
        for (const wy of [0.5, 1.15, 1.8]) {
          const wire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 12, 4),
            new THREE.MeshLambertMaterial({ color: 0xaaaaaa }),
          );
          wire.rotation.z = Math.PI / 2; wire.position.set(x, wy, z + 5);
          s.add(wire); envObjs.current.push(wire);
        }
      }
    }
  }

  function addMountain(s: THREE.Scene, pos: THREE.Vector3, volcanic: boolean) {
    const h = 15 + Math.random() * (volcanic ? 25 : 30);
    const r = (volcanic ? 8 : 6) + Math.random() * 12;
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, volcanic ? 10 : 12),
      new THREE.MeshLambertMaterial({ color: volcanic ? 0x3a2a2a : 0x6b5b4b }),
    );
    peak.position.set(pos.x, pos.y + h / 2 - 2, pos.z);
    peak.castShadow = true; peak.receiveShadow = true;
    s.add(peak); envObjs.current.push(peak);
    const capGeo = volcanic
      ? new THREE.SphereGeometry(r * 0.25)
      : new THREE.ConeGeometry(r * 0.4, h * 0.2, 8);
    const capMat = new THREE.MeshLambertMaterial({ color: volcanic ? 0xff3300 : 0xffffff });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = h * (volcanic ? 0.45 : 0.4);
    peak.add(cap);
  }

  // ── Environment builder ────────────────────────────────────────────────────
  function clearEnv(s: THREE.Scene) {
    envObjs.current.forEach(o => s.remove(o));
    envObjs.current = [];
    const water = s.getObjectByName('water');
    if (water) (water as THREE.Mesh).visible = false;
    const ground = s.getObjectByName('ground');
    if (ground) ((ground as THREE.Mesh).material as THREE.MeshLambertMaterial).color.set(0x4a7c4f);
    if (s.fog) (s.fog as THREE.Fog).color.set(0x87CEEB);
    if (dustPts.current)   dustPts.current.visible   = false;
    if (splashPts.current) splashPts.current.visible = false;
    Object.values(otherRiders.current).forEach(r => s.remove(r.group));
    otherRiders.current = {};
  }

  function buildEnv(s: THREE.Scene) {
    clearEnv(s);
    const ground = s.getObjectByName('ground') as THREE.Mesh | null;
    const water  = s.getObjectByName('water')  as THREE.Mesh | null;
    const setGround = (hex: number) => ground && ((ground.material as THREE.MeshLambertMaterial).color.set(hex));
    const showWater = (hex: number) => {
      if (!water) return;
      water.visible = true;
      (water.material as THREE.MeshPhongMaterial).color.set(hex);
    };
    const curve = pathCurve.current;
    if (!curve) return;

    // Rebuild curved road for this route
    createCurvedRoad(s, curve);

    // Finish line at the end of the path
    const endPos = curve.getPoint(0.97);
    place(s, ASSETS.flagFinish, 0.4, new THREE.Vector3(endPos.x, endPos.y, endPos.z));

    const steps = 18; // number of environment object placements per side

    switch (route.theme) {
      case 'river':
        setGround(0x3b6b3b); showWater(0x2e8b57);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treeOak, 0.5, i / steps, -12);
          placeAlongCurve(s, ASSETS.treeOak, 0.5, i / steps,  12);
        }
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'lake':
        setGround(0x6b8e6b); showWater(0x4682b4);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treePine, 0.5, i / steps, -10);
          placeAlongCurve(s, ASSETS.treePine, 0.5, i / steps,  10);
        }
        if (splashPts.current) splashPts.current.visible = true;
        break;

      case 'city':
        setGround(0x808080);
        if (s.fog) (s.fog as THREE.Fog).color.set(0xa0a0a0);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.buildingLarge, 0.7, i / steps, -14);
          placeAlongCurve(s, ASSETS.buildingSmall, 0.6, i / steps,  14);
          placeAlongCurve(s, ASSETS.lampPost,      0.5, i / steps,  -5);
          placeAlongCurve(s, ASSETS.lampPost,      0.5, i / steps,   5);
        }
        place(s, ASSETS.grandStand, 0.5, new THREE.Vector3(endPos.x - 20, endPos.y, endPos.z));
        break;

      case 'farmland':
        setGround(0x6b8e23);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treeOak, 0.5, i / steps, -8);
          placeAlongCurve(s, ASSETS.treeOak, 0.5, i / steps,  8);
          if (i % 3 === 0) placeAlongCurve(s, ASSETS.fence, 0.4, i / steps, -6);
        }
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'forest':
        setGround(0x2d5a27);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x228b22);
        for (let i = 1; i < steps * 2; i++) {
          placeAlongCurve(s, ASSETS.treePine, 0.6, i / (steps * 2), -7 + Math.random() * 4);
          placeAlongCurve(s, ASSETS.treePine, 0.6, i / (steps * 2),  7 - Math.random() * 4);
          if (i % 3 === 0) placeAlongCurve(s, ASSETS.treeLarge, 0.5, i / (steps * 2), -14 + Math.random() * 28);
        }
        break;

      case 'coastal': case 'beach':
        setGround(0xc2b280); showWater(0x1e90ff);
        createSandRipples(s);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treePalm, 0.5, i / steps, -10);
          placeAlongCurve(s, ASSETS.treePalm, 0.5, i / steps,  10);
        }
        if (splashPts.current) splashPts.current.visible = true;
        break;

      case 'vineyard':
        setGround(0x8f9b4e);
        createVineyardRows(s);
        for (let i = 1; i < steps; i++) {
          if (i % 2 === 0) placeAlongCurve(s, ASSETS.treeSmall, 0.4, i / steps, -14);
        }
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'mountain': {
        setGround(0x5a4a3a);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x808080);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treePine, 0.4, i / steps, -9 + Math.random() * 4);
          placeAlongCurve(s, ASSETS.treePine, 0.4, i / steps,  9 - Math.random() * 4);
        }
        for (let i = 0; i < 10; i++) {
          const mp = curve.getPoint(Math.random());
          addMountain(s, new THREE.Vector3(mp.x + (-50 + Math.random() * 100), mp.y, mp.z), false);
        }
        break;
      }

      case 'volcanic': {
        setGround(0x4a3a3a);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x706060);
        for (let i = 1; i < steps; i++) {
          placeAlongCurve(s, ASSETS.treePine, 0.4, i / steps, -9 + Math.random() * 4);
          placeAlongCurve(s, ASSETS.treePine, 0.4, i / steps,  9 - Math.random() * 4);
        }
        for (let i = 0; i < 10; i++) {
          const mp = curve.getPoint(Math.random());
          addMountain(s, new THREE.Vector3(mp.x + (-50 + Math.random() * 100), mp.y, mp.z), true);
        }
        break;
      }
    }
  }

  // ── Mini-map ──────────────────────────────────────────────────────────────
  function drawMiniMap() {
    const canvas = miniRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const d   = metrics.current.distance;
    const pts = terrainPts.current;
    const W = 160, H = 100, pad = 8;

    ctx.clearRect(0, 0, W, H);

    const toMapY = (() => {
      if (pts.length < 2) return (_: number) => H / 2;
      const elevs = pts.map(p => p.y);
      const minE  = Math.min(...elevs), maxE = Math.max(...elevs);
      const range = maxE - minE || 1;
      return (e: number) => pad + (1 - (e - minE) / range) * (H - pad * 2);
    })();

    ctx.beginPath(); ctx.strokeStyle = '#4a8fbf'; ctx.lineWidth = 1.5;
    pts.forEach((p, i) => {
      const x = (p.x / totalDist.current) * W;
      const y = toMapY(p.y);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    const prog = d / totalDist.current;
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.arc(prog * W, toMapY(elevAt(d)), 4, 0, Math.PI * 2); ctx.fill();

    Object.values(otherRiders.current).forEach(r => {
      const rp = r.lastDist / totalDist.current;
      const rx = rp * W, ry = toMapY(elevAt(r.lastDist));
      ctx.fillStyle = '#4488ff';
      ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = '7px sans-serif'; ctx.fillText(r.name || '?', rx + 5, ry - 5);
    });
  }

  // ── BLE ───────────────────────────────────────────────────────────────────
  async function connectBike() {
    if (!navigator.bluetooth) { alert('Web Bluetooth is not supported in this browser'); return; }
    try {
      setStatus('Searching for bike...');
      bleDevice.current = await (navigator as any).bluetooth.requestDevice({ filters: [{ services: [0x1826] }] });
      const server = await bleDevice.current.gatt!.connect();
      const svc    = await server.getPrimaryService(0x1826);
      bleChar.current  = await svc.getCharacteristic(0x2AD2);
      await bleChar.current.startNotifications();
      bleChar.current.addEventListener('characteristicvaluechanged', handleBleData as EventListener);
      distanceBaseRef.current = 0;
      simMode.current = false; setSim(false);
      setStatus(`Connected: ${bleDevice.current.name ?? 'Bike'}`);
    } catch { setStatus('BLE failed — simulation active'); }
  }

  function handleBleData(event: Event) {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (!char.value) return;
    const v = char.value;
    const flags = v.getUint16(0, true);
    let idx = 2;
    const m = metrics.current;
    // Bit 0 = "More Data": when 0 speed IS present (FTMS spec §4.9.1)
    if ((flags & 0x01) === 0) { m.speed   = v.getUint16(idx, true) / 100;                 idx += 2; }
    if  (flags & 0x02)                                                                     idx += 2;
    if  (flags & 0x04)        { m.cadence = v.getUint16(idx, true) * 0.5;                 idx += 2; }
    if  (flags & 0x08)                                                                     idx += 2;
    if  (flags & 0x10)        { const raw = getUint24LE(v, idx) / 1000;
                                if (distanceBaseRef.current === 0) distanceBaseRef.current = raw;
                                m.distance = Math.max(0, raw - distanceBaseRef.current);  idx += 3; }
    if  (flags & 0x20)                                                                     idx += 2;
    if  (flags & 0x40)        { m.power   = v.getInt16(idx, true);                         idx += 2; }
    m.elevation = elevAt(m.distance);
  }

  useEffect(() => {
    if (ble.status === 'connecting')                        setStatus('Searching for bike...');
    else if (ble.status === 'connected' || ble.status === 'riding')
      setStatus(`Connected: ${ble.deviceName || 'Bike'}`);
    else if (ble.status === 'error' || ble.status === 'unsupported')
      setStatus(ble.error || 'BLE unavailable — simulation active');
    else if (ble.status === 'disconnected')                 setStatus('Bike disconnected — simulation active');
  }, [ble.status, ble.deviceName, ble.error]);

  // ── Simulation ────────────────────────────────────────────────────────────
  function simulate(dt: number) {
    const m = metrics.current;
    m.power    = 150 + Math.sin(Date.now() / 3000) * 30 + Math.random() * 10;
    m.speed    = (m.power / 250) * 35 * (0.9 + Math.random() * 0.2);
    m.cadence  = 80 + Math.sin(Date.now() / 2000) * 10;
    m.distance += (m.speed * dt) / 3600;
    m.elevation = elevAt(m.distance);
  }

  // ── Multiplayer ───────────────────────────────────────────────────────────
  function spawnOtherRider(id: string, riderName: string, s: THREE.Scene) {
    const group = new THREE.Group();
    new GLTFLoader().load(ASSETS.bicycle, (gltf) => {
      const obj = gltf.scene; obj.scale.setScalar(0.9);
      obj.traverse(c => { if (c instanceof THREE.Mesh) c.castShadow = true; });
      group.add(obj);
    }, undefined, () => {
      // Fallback blue capsule
      group.add(new THREE.Mesh(
        new THREE.CapsuleGeometry(0.3, 0.9, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x4444ff }),
      ));
    });
    group.add(makeNametag(riderName, '#4af'));
    s.add(group);
    otherRiders.current[id] = { group, lastDist: 0, name: riderName };
    // Activate split-screen on first join
    if (!splitRef.current) { splitRef.current = true; setSplitScreen(true); }
  }

  function joinOrCreateRoom(code: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`cycling:${code}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'pos' }, ({ payload }: { payload: { id: string; name: string; dist: number } }) => {
        const { id, name: riderName, dist } = payload;
        const s = sceneRef.current; if (!s) return;
        if (!otherRiders.current[id]) spawnOtherRider(id, riderName, s);

        const rider = otherRiders.current[id];
        rider.lastDist = dist;

        // Position other rider along the same spline
        const curve = pathCurve.current;
        if (curve) {
          const t = Math.min(dist / totalDist.current, 1);
          const pt      = curve.getPoint(t);
          const tangent = curve.getTangent(t);
          const normal  = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
          // Offset 2 m to the side so bikes don't overlap
          rider.group.position.copy(pt).addScaledVector(normal, 2);
          rider.group.position.y = pt.y + 0.5;
          rider.group.rotation.y = Math.atan2(tangent.x, tangent.z);
        }
      })
      .subscribe();
    channelRef.current = ch;
    setRoomLabel(`Room: ${code}`);
    setStatus('Multiplayer connected — share the code!');
  }

  // ── Game controls ─────────────────────────────────────────────────────────
  function startRide() {
    metrics.current.distance = 0;
    distanceBaseRef.current  = 0;
    elapsedRef.current       = 0;
    gameActive.current = true; setActive(true);
    startTime.current  = Date.now();
    setStatus('Riding...');
  }
  function stopRide() {
    gameActive.current = false; setActive(false);
    setStatus('Paused');
  }

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    genTerrain();

    const curve = genSplinePath();
    pathCurve.current = curve;

    // Scene
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x87CEEB);
    s.fog = new THREE.Fog(0x87CEEB, 60, 500);
    sceneRef.current = s;

    const W = containerRef.current.clientWidth;
    const H = containerRef.current.clientHeight;

    // Player 1 camera (first-person, child of bikeGroup)
    const cam = new THREE.PerspectiveCamera(65, W / H, 0.3, 600);
    cameraRef.current = cam;

    // Player 2 camera (free-floating, follows first other rider)
    const cam2 = new THREE.PerspectiveCamera(65, W / H, 0.3, 600);
    camera2Ref.current = cam2;

    // Renderer
    const ren = new THREE.WebGLRenderer({ antialias: true });
    ren.setSize(W, H);
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(ren.domElement);
    rendererRef.current = ren;

    // Lights
    s.add(new THREE.AmbientLight(0x606080, 1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 150, 50); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    s.add(sun);

    // Ground — large flat plane, road ribbon is drawn on top via createCurvedRoad
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x4a7c4f }),
    );
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2;
    ground.receiveShadow = true; ground.name = 'ground';
    s.add(ground);

    // Water plane (hidden until a water-themed route activates it)
    const waterStart = curve.getPoint(0.3);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 600),
      new THREE.MeshPhongMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.6 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(waterStart.x + 30, -1.8, waterStart.z);
    water.visible = false; water.name = 'water';
    s.add(water);

    // Rider model + handlebars
    loadRider(bikeGroup.current, name, '#f80');
    s.add(bikeGroup.current);

    hbarGroup.current = buildHandlebars();

    initParticles(s);
    buildEnv(s);

    // Mount first-person camera inside the bike group
    bikeGroup.current.add(cam);
    cam.position.set(0, 1.6, -0.5);
    cam.rotation.set(0, Math.PI, 0); // face forward (+Z of group = direction of travel)

    cam.add(hbarGroup.current);
    hbarGroup.current.position.set(0, 0, 0);

    const onResize = () => {
      if (!containerRef.current) return;
      const nW = containerRef.current.clientWidth;
      const nH = containerRef.current.clientHeight;
      ren.setSize(nW, nH);
      if (splitRef.current) {
        cam.aspect  = (nW / 2) / nH;
        cam2.aspect = (nW / 2) / nH;
      } else {
        cam.aspect = nW / nH;
      }
      cam.updateProjectionMatrix();
      cam2.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ────────────────────────────────────────────────────
    let lastBroadcast = 0;
    const _up    = new THREE.Vector3(0, 1, 0);
    const _q     = new THREE.Quaternion();
    const _prevTangent = new THREE.Vector3(0, 0, 1);

    const animate = () => {
      rafId.current = requestAnimationFrame(animate);
      const dt = clock.current.getDelta();
      const m  = metrics.current;

      if (gameActive.current) {
        if (simMode.current) simulate(dt);
        elapsedRef.current += dt;

        if (m.distance >= totalDist.current) {
          m.distance = totalDist.current;
          gameActive.current = false; setActive(false);
          setStatus('Route complete! 🎉');
          onComplete?.({ ...m, duration: Math.round((Date.now() - startTime.current) / 1000) });
        }

        // Move bike along spline ─────────────────────────────────────────
        const t = Math.min(m.distance / totalDist.current, 1);
        const pt      = curve.getPoint(t);
        const tangent = curve.getTangent(t);

        bikeGroup.current.position.set(pt.x, pt.y + 0.5, pt.z);

        // Orient bike to face along the tangent
        _q.setFromUnitVectors(_up, _up); // reset
        bikeGroup.current.rotation.y = Math.atan2(tangent.x, tangent.z);

        // Camera bank (lean into corners) ───────────────────────────────
        const lateralChange = tangent.x - _prevTangent.x;
        cam.rotation.z = THREE.MathUtils.lerp(cam.rotation.z, -lateralChange * 14, 0.12);
        _prevTangent.copy(tangent);

        // Dynamic FOV: widen slightly at high speed
        const targetFov = 65 + Math.min(m.speed, 50) * 0.3;
        cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.05);
        cam.updateProjectionMatrix();

        // Particles follow bike ─────────────────────────────────────────
        const bpos = bikeGroup.current.position;
        const pOff = new THREE.Vector3(0, 0.2, -1);
        if (dustPts.current?.visible)   { dustPts.current.position.copy(bpos).add(pOff);   dustPts.current.rotation.y   += 0.02; }
        if (splashPts.current?.visible) { splashPts.current.position.copy(bpos).add(pOff); splashPts.current.rotation.y += 0.01; }

        animatePedalling(dt);
        drawMiniMap();

        const now = Date.now();
        if (channelRef.current && now - lastBroadcast > 200) {
          channelRef.current.send({ type: 'broadcast', event: 'pos', payload: { id: playerId.current, name, dist: m.distance } });
          lastBroadcast = now;
        }
        if (now - lastUpload.current > 5000 && m.distance > 0) lastUpload.current = now;
      }

      // ── Split-screen or single render ─────────────────────────────────
      if (splitRef.current && Object.keys(otherRiders.current).length > 0) {
        const rW = containerRef.current?.clientWidth  ?? W;
        const rH = containerRef.current?.clientHeight ?? H;
        const half = Math.floor(rW / 2);

        ren.setScissorTest(true);

        // Left — Player 1
        ren.setViewport(0, 0, half, rH);
        ren.setScissor(0, 0, half, rH);
        cam.aspect = half / rH;
        cam.updateProjectionMatrix();
        ren.render(s, cam);

        // Right — Player 2: follow first other rider along the spline
        ren.setViewport(half, 0, half, rH);
        ren.setScissor(half, 0, half, rH);
        cam2.aspect = half / rH;
        cam2.updateProjectionMatrix();

        const otherId = Object.keys(otherRiders.current)[0];
        if (otherId) {
          const other  = otherRiders.current[otherId];
          const ot     = Math.min(other.lastDist / totalDist.current, 1);
          const oPos   = curve.getPoint(ot);
          const oTan   = curve.getTangent(ot);
          // Position cam2 above+behind the other rider, looking forward
          cam2.position.set(oPos.x - oTan.x * 1.5, oPos.y + 2.2, oPos.z - oTan.z * 1.5);
          cam2.lookAt(oPos.x + oTan.x * 8, oPos.y + 1.5, oPos.z + oTan.z * 8);
        }

        ren.render(s, cam2);
        ren.setScissorTest(false);
      } else {
        if (containerRef.current) {
          const rW = containerRef.current.clientWidth, rH = containerRef.current.clientHeight;
          cam.aspect = rW / rH; cam.updateProjectionMatrix();
        }
        ren.render(s, cam);
      }
    };
    animate();

    // HUD sync at 10 fps
    const hudInterval = setInterval(() => {
      setHud({ ...metrics.current });
      setElapsed(Math.floor(elapsedRef.current));
    }, 100);

    return () => {
      cancelAnimationFrame(rafId.current);
      clearInterval(hudInterval);
      window.removeEventListener('resize', onResize);
      bleChar.current?.removeEventListener('characteristicvaluechanged', handleBleData as EventListener);
      if (bleDevice.current?.gatt?.connected) bleDevice.current.gatt.disconnect();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      ren.dispose();
      ren.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const progressPct = Math.min((hud.distance / totalDist.current) * 100, 100);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const hudItems: [string, string | number, string][] = [
    ['Time',      fmtTime(elapsed),          ''],
    ['Speed',     hud.speed.toFixed(1),      'km/h'],
    ['Power',     Math.round(hud.power),     'W'],
    ['Distance',  hud.distance.toFixed(2),   'km'],
    ['Cadence',   Math.round(hud.cadence),   'rpm'],
    ['Elevation', Math.round(hud.elevation), 'm'],
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0f1e', overflow: 'hidden', fontFamily: "'Segoe UI',sans-serif", color: 'white' }}>
      {/* Three.js canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Split-screen divider line */}
      {splitScreen && (
        <div style={{ position: 'absolute', top: 0, left: '50%', width: 3, height: '100%', background: 'rgba(255,255,255,0.3)', zIndex: 20, pointerEvents: 'none' }} />
      )}

      {/* Split-screen player labels */}
      {splitScreen && (
        <>
          <div style={{ position: 'absolute', top: 8, left: 12, background: 'rgba(255,140,0,0.85)', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', zIndex: 21, pointerEvents: 'none' }}>
            P1 — {name}
          </div>
          <div style={{ position: 'absolute', top: 8, left: 'calc(50% + 12px)', background: 'rgba(68,170,255,0.85)', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', zIndex: 21, pointerEvents: 'none' }}>
            P2 — {Object.values(otherRiders.current)[0]?.name ?? ''}
          </div>
        </>
      )}

      {/* HUD — top left */}
      <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(10,15,30,0.88)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '10px 18px', display: 'flex', gap: 22, border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 10 }}>
        {hudItems.map(([label, val, unit]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#a0b5d0' }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 'bold', textShadow: '0 0 12px rgba(0,160,255,0.5)' }}>{val}</div>
            {unit && <div style={{ fontSize: 11, color: '#7e93aa' }}>{unit}</div>}
          </div>
        ))}
      </div>

      {/* Mini-map */}
      <canvas ref={miniRef} width={160} height={100}
        style={{ position: 'absolute', top: 120, right: 20, background: 'rgba(0,0,0,0.7)', border: '2px solid #3f6188', borderRadius: 10, zIndex: 15 }} />

      {/* Status pill */}
      <div style={{ position: 'absolute', top: 232, right: 20, background: 'rgba(0,0,0,0.7)', padding: '5px 13px', borderRadius: 20, fontSize: '0.8rem', color: '#aac8ff', zIndex: 10, maxWidth: 200, textAlign: 'center' }}>
        {status}
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 340, zIndex: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#1e90ff,#00d4ff)', width: `${progressPct}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aac8ff', fontSize: 11, marginTop: 4 }}>
          <span>{hud.distance.toFixed(2)} km</span>
          <span>{route.name}</span>
          <span>{totalDist.current} km</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10, alignItems: 'center', background: 'rgba(0,0,0,0.65)', padding: '10px 20px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)' }}>
        <Button variant="outline" size="sm" onClick={connectBike}>🔗 Connect Bike</Button>
        <Button size="sm" onClick={startRide} disabled={active}>▶ Start</Button>
        <Button variant="destructive" size="sm" onClick={stopRide} disabled={!active}>⏹ Pause</Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={sim} onChange={e => { setSim(e.target.checked); simMode.current = e.target.checked; }} /> Sim
        </label>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>}
      </div>

      {/* Multiplayer lobby */}
      <div style={{ position: 'absolute', top: 270, right: 20, background: 'rgba(0,0,0,0.82)', padding: 15, borderRadius: 12, zIndex: 15, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 175 }}>
        <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3f6188', color: 'white' }} />
        <Input placeholder="Room code" value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3f6188', color: 'white' }} />
        <Button size="sm" onClick={() => {
          const code = 'RACE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          setRoomInput(code); joinOrCreateRoom(code);
        }}>🎮 Create Room</Button>
        <Button size="sm" variant="outline" onClick={() => { if (roomInput) joinOrCreateRoom(roomInput); }}>
          🚪 Join Room
        </Button>
        {roomLabel && <div style={{ color: '#aac8ff', fontSize: 12 }}>{roomLabel}</div>}
      </div>
    </div>
  );
}
