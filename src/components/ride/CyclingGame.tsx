import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWattbikeBluetooth } from '@/hooks/useWattbikeBluetooth';

// All GLB/OBJ assets served from /public/assets/game/
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
  trafficSign:   A('trafficSign.glb'),
  fence:         A('fence.glb'),
  roadStraight:  A('roadStraight.glb'),
  cone:          A('cone.glb'),
  grandStand:    A('grandStand.glb'),
  flagFinish:    A('flagFinish.glb'),
  raceCarGreen:  A('raceCarGreen.glb'),
  raceCarRed:    A('raceCarRed.glb'),
  cyclistObj:    A('cyclist.obj'),
  cyclistTex:    A('cyclist_texture.png'),
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

// Read three consecutive bytes as a little-endian 24-bit unsigned int
function getUint24LE(view: DataView, offset: number): number {
  return view.getUint8(offset) + (view.getUint8(offset + 1) << 8) + (view.getUint8(offset + 2) << 16);
}

export default function CyclingGame({ route, playerName = 'Rider', onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const miniRef      = useRef<HTMLCanvasElement>(null);

  // Three.js objects — refs only, no state (60fps without React re-renders)
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clock       = useRef(new THREE.Clock());
  const bikeGroup   = useRef(new THREE.Group());
  const hbarGroup   = useRef(new THREE.Group());
  const frontWheel  = useRef<THREE.Object3D | null>(null);
  const backWheel   = useRef<THREE.Object3D | null>(null);
  const dustPts     = useRef<THREE.Points | null>(null);
  const splashPts   = useRef<THREE.Points | null>(null);
  const envObjs     = useRef<THREE.Object3D[]>([]);
  const rafId       = useRef(0);

  // Game logic refs
  const gameActive   = useRef(false);
  const simMode      = useRef(true);
  const metrics      = useRef<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const terrainPts   = useRef<{ x: number; y: number }[]>([]);
  const totalDist    = useRef(route.dist);
  const startTime    = useRef(0);
  const bleDevice    = useRef<BluetoothDevice | null>(null);
  const bleChar      = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Multiplayer
  const playerId    = useRef(Math.random().toString(36).substr(2, 9));
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const otherRiders = useRef<Record<string, { group: THREE.Group; lastDist: number; name: string }>>({});

  // React state — HUD + lobby only
  const [hud, setHud]           = useState<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const [active, setActive]     = useState(false);
  const [sim, setSim]           = useState(true);
  const [status, setStatus]     = useState(`Route: ${route.name} – ${route.desc}`);
  const [name, setName]         = useState(playerName);
  const [roomInput, setRoomInput] = useState('');
  const [roomLabel, setRoomLabel] = useState('');

  // ── Terrain ──────────────────────────────────────────────────────────────
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

  // ── Particles ─────────────────────────────────────────────────────────────
  function initParticles(s: THREE.Scene) {
    const mkPts = (count: number, color: number, size: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 2;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55 }));
      pts.visible = false;
      s.add(pts);
      return pts;
    };
    dustPts.current   = mkPts(120, 0xccaa88, 0.08);
    splashPts.current = mkPts(60,  0x88ccff, 0.12);
  }

  // ── Rider model ───────────────────────────────────────────────────────────
  function loadRider(group: THREE.Group) {
    const tex = new THREE.TextureLoader().load(ASSETS.cyclistTex);
    new OBJLoader().load(ASSETS.cyclistObj, (obj) => {
      obj.scale.set(0.008, 0.008, 0.008);
      obj.position.set(0, 0.5, 0.2);
      obj.traverse(c => {
        if (c instanceof THREE.Mesh) {
          c.castShadow = true;
          c.material   = new THREE.MeshLambertMaterial({ map: tex });
        }
      });
      group.add(obj);
      addPrimitiveWheels(group);   // wheels always added on top
    }, undefined, () => {
      fallbackRider(group);
      addPrimitiveWheels(group);
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
    add(new THREE.BoxGeometry(0.2, 0.1, 1.2),            0xdd3333, 0.6);
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6),  0x3355aa, 0.9);
    add(new THREE.SphereGeometry(0.15),                   0xffccaa, 1.25);
  }

  function buildHandlebars(): THREE.Group {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -0.4, -0.8),
      new THREE.Vector3(0,    -0.3, -0.8),
      new THREE.Vector3( 0.3, -0.4, -0.8),
    ]);
    const bar = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 8, 0.02, 4, false),
      new THREE.MeshStandardMaterial({ color: 0xcccccc }),
    );
    g.add(bar);
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

  // ── GLB helper ────────────────────────────────────────────────────────────
  function place(
    s: THREE.Scene,
    url: string,
    scale: number,
    pos: THREE.Vector3,
    rotY = 0,
    onLoad?: (obj: THREE.Object3D) => void,
  ) {
    new GLTFLoader().load(url, (gltf) => {
      const obj = gltf.scene;
      obj.scale.setScalar(scale);
      obj.position.copy(pos);
      obj.rotation.y = rotY;
      obj.traverse(c => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });
      s.add(obj);
      envObjs.current.push(obj);
      onLoad?.(obj);
    });
  }

  // ── Special geometry helpers ───────────────────────────────────────────────
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
    mesh.name = 'sandRipple';
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

  function addMountain(s: THREE.Scene, zOff: number, volcanic: boolean) {
    const h = 15 + Math.random() * (volcanic ? 25 : 30);
    const r = (volcanic ? 8 : 6) + Math.random() * 12;
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, volcanic ? 10 : 12),
      new THREE.MeshLambertMaterial({ color: volcanic ? 0x3a2a2a : 0x6b5b4b }),
    );
    peak.position.set(-50 + Math.random() * 100, h / 2 - 2, zOff);
    peak.castShadow = true; peak.receiveShadow = true;
    s.add(peak); envObjs.current.push(peak);
    if (volcanic) {
      const lava = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.25),
        new THREE.MeshBasicMaterial({ color: 0xff3300 }),
      );
      lava.position.y = h * 0.45;
      peak.add(lava);
    } else {
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.4, h * 0.2, 8),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
      );
      snow.position.y = h * 0.4;
      peak.add(snow);
    }
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
    const showWater = (hex: number, z = 120) => {
      if (!water) return;
      water.visible = true;
      water.position.setZ(z);
      (water.material as THREE.MeshPhongMaterial).color.set(hex);
    };

    switch (route.theme) {
      case 'river':
        setGround(0x3b6b3b); showWater(0x2e8b57);
        for (let z = -40; z < 200; z += 15) {
          place(s, ASSETS.treeOak,   0.5, new THREE.Vector3(-12, 0, z));
          place(s, ASSETS.treeOak,   0.5, new THREE.Vector3( 12, 0, z));
        }
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'lake':
        setGround(0x6b8e6b); showWater(0x4682b4);
        for (let z = -30; z < 180; z += 12) {
          place(s, ASSETS.treePine, 0.5, new THREE.Vector3(-10, 0, z));
          place(s, ASSETS.treePine, 0.5, new THREE.Vector3( 10, 0, z));
        }
        if (splashPts.current) splashPts.current.visible = true;
        break;

      case 'city':
        setGround(0x808080);
        if (s.fog) (s.fog as THREE.Fog).color.set(0xa0a0a0);
        for (let z = 10; z < 200; z += 20) {
          place(s, ASSETS.buildingLarge, 0.7, new THREE.Vector3(-14, 0, z));
          place(s, ASSETS.buildingSmall, 0.6, new THREE.Vector3( 14, 0, z));
          place(s, ASSETS.lampPost,      0.5, new THREE.Vector3( -5, 0, z));
          place(s, ASSETS.lampPost,      0.5, new THREE.Vector3(  5, 0, z));
        }
        // Finish line grandstand + flag
        place(s, ASSETS.grandStand, 0.5, new THREE.Vector3(-20, 0, 180));
        place(s, ASSETS.flagFinish, 0.4, new THREE.Vector3(  0, 0, 190));
        break;

      case 'farmland':
        setGround(0x6b8e23);
        for (let z = 0; z < 180; z += 20) {
          place(s, ASSETS.treeOak, 0.5, new THREE.Vector3(-8, 0, z));
          place(s, ASSETS.treeOak, 0.5, new THREE.Vector3( 8, 0, z));
          if (z % 40 === 0) place(s, ASSETS.fence, 0.4, new THREE.Vector3(-6, 0, z + 10), Math.PI / 2);
        }
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'forest':
        setGround(0x2d5a27);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x228b22);
        for (let z = -20; z < 200; z += 8) {
          place(s, ASSETS.treePine,  0.6, new THREE.Vector3(-7 + Math.random() * 4, 0, z));
          place(s, ASSETS.treePine,  0.6, new THREE.Vector3( 7 - Math.random() * 4, 0, z));
          if (z % 24 === 0) place(s, ASSETS.treeLarge, 0.5, new THREE.Vector3(-14 + Math.random() * 28, 0, z));
        }
        break;

      case 'coastal': case 'beach':
        setGround(0xc2b280); showWater(0x1e90ff, 60);
        createSandRipples(s);
        for (let z = 0; z < 180; z += 12) {
          place(s, ASSETS.treePalm, 0.5, new THREE.Vector3(-10, 0, z));
          place(s, ASSETS.treePalm, 0.5, new THREE.Vector3( 10, 0, z));
        }
        if (splashPts.current) splashPts.current.visible = true;
        break;

      case 'vineyard':
        setGround(0x8f9b4e);
        createVineyardRows(s);
        for (let z = 0; z < 180; z += 30) place(s, ASSETS.treeSmall, 0.4, new THREE.Vector3(-14, 0, z));
        if (dustPts.current) dustPts.current.visible = true;
        break;

      case 'mountain':
        setGround(0x5a4a3a);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x808080);
        for (let z = -20; z < 200; z += 10) {
          place(s, ASSETS.treePine, 0.4, new THREE.Vector3(-9 + Math.random() * 4, 0, z));
          place(s, ASSETS.treePine, 0.4, new THREE.Vector3( 9 - Math.random() * 4, 0, z));
        }
        for (let i = 0; i < 10; i++) addMountain(s, -60 + i * 15, false);
        break;

      case 'volcanic':
        setGround(0x4a3a3a);
        if (s.fog) (s.fog as THREE.Fog).color.set(0x706060);
        for (let z = -20; z < 200; z += 10) {
          place(s, ASSETS.treePine, 0.4, new THREE.Vector3(-9 + Math.random() * 4, 0, z));
          place(s, ASSETS.treePine, 0.4, new THREE.Vector3( 9 - Math.random() * 4, 0, z));
        }
        for (let i = 0; i < 10; i++) addMountain(s, -60 + i * 15, true);
        break;
    }

    // Finish line flag for all routes
    place(s, ASSETS.flagFinish, 0.4, new THREE.Vector3(0, 0, 192));
  }

  // ── Mini-map ──────────────────────────────────────────────────────────────
  function drawMiniMap() {
    const canvas = miniRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const d = metrics.current.distance;
    ctx.clearRect(0, 0, 160, 100);
    ctx.beginPath(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 160, y = 50 + Math.sin(i * 0.3) * 20;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    const prog = d / totalDist.current;
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.arc(prog * 160, 50 + Math.sin(prog * 100 * 0.3) * 20, 4, 0, Math.PI * 2); ctx.fill();
    Object.values(otherRiders.current).forEach(r => {
      const rp = r.lastDist / totalDist.current;
      const rx = rp * 160, ry = 50 + Math.sin(rp * 100 * 0.3) * 20;
      ctx.fillStyle = '#4488ff';
      ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = '7px sans-serif'; ctx.fillText(r.name || '?', rx + 5, ry - 5);
    });
  }

  // ── BLE ──────────────────────────────────────────────────────────────────────
  async function connectBike() {
    if (!navigator.bluetooth) { alert('Web Bluetooth is not supported in this browser'); return; }
    try {
      setStatus('Searching for bike...');
      bleDevice.current = await navigator.bluetooth.requestDevice({ filters: [{ services: [0x1826] }] });
      const server = await bleDevice.current.gatt!.connect();
      const svc    = await server.getPrimaryService(0x1826);
      bleChar.current  = await svc.getCharacteristic(0x2AD2);
      await bleChar.current.startNotifications();
      bleChar.current.addEventListener('characteristicvaluechanged', handleBleData as EventListener);
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
    if (flags & 0x01) { m.speed   = v.getUint16(idx, true) / 100;          idx += 2; }
    if (flags & 0x02)                                                        idx += 2;
    if (flags & 0x04) { m.cadence = v.getUint16(idx, true) * 0.5;          idx += 2; }
    if (flags & 0x08)                                                        idx += 2;
    if (flags & 0x10) { m.distance = getUint24LE(v, idx) / 1000;           idx += 3; }
    if (flags & 0x20)                                                        idx += 2;
    if (flags & 0x40)   m.power    = v.getInt16(idx, true);
    m.elevation = elevAt(m.distance);
  }

  // Reflect BLE status in the on-screen status pill
  useEffect(() => {
    if (ble.status === 'connecting')   setStatus('Searching for bike...');
    else if (ble.status === 'connected' || ble.status === 'riding')
      setStatus(`Connected: ${ble.deviceName || 'Wattbike'}`);
    else if (ble.status === 'error' || ble.status === 'unsupported')
      setStatus(ble.error || 'BLE unavailable — simulation active');
    else if (ble.status === 'disconnected') setStatus('Bike disconnected — simulation active');
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

  // ── Multiplayer via Supabase Realtime ─────────────────────────────────────
  function joinOrCreateRoom(code: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`cycling:${code}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'pos' }, ({ payload }: { payload: { id: string; name: string; dist: number } }) => {
        const id = payload.id;
        const s  = sceneRef.current; if (!s) return;
        if (!otherRiders.current[id]) {
          const group = new THREE.Group();
          new GLTFLoader().load(ASSETS.raceCarGreen, (gltf) => {
            const m = gltf.scene; m.scale.setScalar(0.3);
            m.traverse(c => {
              if (c instanceof THREE.Mesh) {
                const mat = (c.material as THREE.MeshStandardMaterial).clone();
                mat.color.set(0x4444ff); c.material = mat;
              }
            });
            group.add(m);
          }, undefined, () => {
            group.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1), new THREE.MeshStandardMaterial({ color: 0x4444ff })));
          });
          group.position.set(1.5, 0.5, 10); // offset left so you can see them
          s.add(group);
          otherRiders.current[id] = { group, lastDist: 0, name: payload.name };
        }
        otherRiders.current[id].lastDist = payload.dist;
        otherRiders.current[id].group.position.z = 10 + (payload.dist / totalDist.current) * 180;
        otherRiders.current[id].group.position.y = 0.5 + elevAt(payload.dist) * 0.05;
      })
      .subscribe();
    channelRef.current = ch;
    setRoomLabel(`Room: ${code}`);
    setStatus('Multiplayer connected — share the code!');
  }

  // ── Game controls ─────────────────────────────────────────────────────────
  function startRide() {
    metrics.current.distance = 0;
    gameActive.current = true; setActive(true);
    startTime.current  = Date.now();
    setStatus('Riding...');
  }
  function stopRide() {
    gameActive.current = false; setActive(false);
    setStatus('Paused');
  }

  // ── Three.js init (runs once) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    genTerrain();

    // Scene
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x87CEEB);
    s.fog = new THREE.Fog(0x87CEEB, 50, 500);
    sceneRef.current = s;

    // Camera
    const cam = new THREE.PerspectiveCamera(65, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.5, 600);
    cameraRef.current = cam;

    // Renderer
    const ren = new THREE.WebGLRenderer({ antialias: true });
    ren.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(ren.domElement);
    rendererRef.current = ren;

    // Lights
    s.add(new THREE.AmbientLight(0x404066));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 150, 50); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    s.add(sun);

    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x4a7c4f }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2; ground.receiveShadow = true; ground.name = 'ground';
    s.add(ground);

    // Water (hidden until theme activates it)
    const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 400), new THREE.MeshPhongMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.6 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -1.8, 120); water.visible = false; water.name = 'water';
    s.add(water);

    // Road
    const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 300), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, -1.99, 60); road.receiveShadow = true; road.name = 'road';
    s.add(road);

    // Rider + handlebars
    loadRider(bikeGroup.current);
    s.add(bikeGroup.current);
    bikeGroup.current.position.set(0, 0.5, 10);

    hbarGroup.current = buildHandlebars();

    initParticles(s);
    buildEnv(s);

    // First-person camera
    bikeGroup.current.add(cam);
    cam.position.set(0, 1.6, 0.5);
    cam.lookAt(new THREE.Vector3(0, 1.6, 20));
    cam.add(hbarGroup.current);
    hbarGroup.current.position.set(0, 0, 0); // already positioned by buildHandlebars

    const onResize = () => {
      if (!containerRef.current) return;
      cam.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cam.updateProjectionMatrix();
      ren.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let lastBroadcast = 0;
    const animate = () => {
      rafId.current = requestAnimationFrame(animate);
      const dt = clock.current.getDelta();
      const m  = metrics.current;

      if (gameActive.current) {
        if (simMode.current) simulate(dt);

        if (m.distance >= totalDist.current) {
          m.distance = totalDist.current;
          gameActive.current = false; setActive(false);
          setStatus('Route complete! 🎉');
          const duration = Math.round((Date.now() - startTime.current) / 1000);
          onComplete?.({ ...m, duration });
        }

        const prog = m.distance / totalDist.current;
        const elev = elevAt(m.distance);
        bikeGroup.current.position.z = 10 + prog * 180;
        bikeGroup.current.position.y = 0.5 + elev * 0.05;

        const roadMesh = s.getObjectByName('road') as THREE.Mesh | null;
        if (roadMesh) roadMesh.position.y = -1.99 + elev * 0.05;

        // Particles follow bike
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

        if (now - lastUpload.current > 5000 && m.distance > 0) {
          lastUpload.current = now;
        }
      }

      ren.render(s, cam);
    };
    animate();

    // Sync metrics to React at 10fps (HUD)
    const hudInterval = setInterval(() => setHud({ ...metrics.current }), 100);

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
  const hudItems: [string, string | number, string][] = [
    ['Speed',    hud.speed.toFixed(1),    'km/h'],
    ['Power',    Math.round(hud.power),   'W'],
    ['Distance', hud.distance.toFixed(2), 'km'],
    ['Cadence',  Math.round(hud.cadence), 'rpm'],
    ['Elevation',Math.round(hud.elevation),'m'],
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0f1e', overflow: 'hidden', fontFamily: "'Segoe UI',sans-serif", color: 'white' }}>
      {/* Three.js canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD — top left */}
      <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '12px 20px', display: 'flex', gap: 25, border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 10 }}>
        {hudItems.map(([label, val, unit]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#a0b5d0' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', textShadow: '0 0 12px rgba(0,160,255,0.5)' }}>{val}</div>
            <div style={{ fontSize: 13, color: '#7e93aa' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Mini-map */}
      <canvas ref={miniRef} width={160} height={100}
        style={{ position: 'absolute', top: 120, right: 20, background: 'rgba(0,0,0,0.7)', border: '2px solid #3f6188', borderRadius: 10, zIndex: 15 }} />

      {/* Status */}
      <div style={{ position: 'absolute', top: 120, left: 20, background: 'rgba(0,0,0,0.7)', padding: '6px 15px', borderRadius: 20, fontSize: '0.85rem', color: '#aac8ff', zIndex: 10, maxWidth: 300 }}>
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
      <div style={{ position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10, alignItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)' }}>
        <Button variant="outline" size="sm" onClick={connectBike}>🔗 Connect Bike</Button>
        <Button size="sm" onClick={startRide} disabled={active}>▶ Start</Button>
        <Button variant="destructive" size="sm" onClick={stopRide} disabled={!active}>⏹ Pause</Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={sim} onChange={e => { setSim(e.target.checked); simMode.current = e.target.checked; }} /> Sim
        </label>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>}
      </div>

      {/* Multiplayer lobby */}
      <div style={{ position: 'absolute', top: 240, right: 20, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 12, zIndex: 15, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 175 }}>
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
