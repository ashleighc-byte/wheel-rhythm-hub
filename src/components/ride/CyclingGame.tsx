import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWattbikeBluetooth } from '@/hooks/useWattbikeBluetooth';

const KENNEY = 'https://raw.githubusercontent.com/KenneyNL/Starter-Kit-Racing/master/Models/GLTF%20format/';
const ASSETS = {
  rider:    KENNEY + 'bike.glb',
  treePine: KENNEY + 'treePine.glb',
  treePalm: KENNEY + 'treePalm.glb',
  treeOak:  KENNEY + 'treeOak.glb',
};

export interface GameRoute {
  id: string;
  name: string;
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

export default function CyclingGame({ route, playerName = 'Rider', onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const miniRef      = useRef<HTMLCanvasElement>(null);

  // Three.js refs — not React state; avoids per-frame re-renders
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clock       = useRef(new THREE.Clock());
  const bikeGroup   = useRef(new THREE.Group());
  const handlebarGroup = useRef(new THREE.Group());
  const frontWheel  = useRef<THREE.Object3D | null>(null);
  const backWheel   = useRef<THREE.Object3D | null>(null);
  const dustPts     = useRef<THREE.Points | null>(null);
  const splashPts   = useRef<THREE.Points | null>(null);
  const waterMesh   = useRef<THREE.Mesh | null>(null);
  const groundMesh  = useRef<THREE.Mesh | null>(null);
  const envObjs     = useRef<THREE.Object3D[]>([]);
  const rafId       = useRef(0);

  // Game logic refs
  const gameActive   = useRef(false);
  const simMode      = useRef(true);
  const metrics      = useRef<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const terrainPts   = useRef<{ x: number; y: number }[]>([]);
  const totalDist    = useRef(route.dist);
  const startTime    = useRef(0);

  // Multiplayer refs
  const playerId    = useRef(Math.random().toString(36).substr(2, 9));
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const otherRiders = useRef<Record<string, { group: THREE.Group; lastDist: number; name: string }>>({});

  // React state — HUD + UI only
  const [hud, setHud]           = useState<Metrics>({ speed: 0, power: 0, cadence: 0, distance: 0, elevation: 0 });
  const [active, setActive]     = useState(false);
  const [sim, setSim]           = useState(true);
  const [status, setStatus]     = useState('Select Start to ride');
  const [name, setName]         = useState(playerName);
  const [roomInput, setRoomInput] = useState('');
  const [roomLabel, setRoomLabel] = useState('');

  // ── Terrain ─────────────────────────────────────────────────────────────────
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
    const frac = raw - idx;
    return pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
  }

  // ── Particles ────────────────────────────────────────────────────────────────
  function initParticles(s: THREE.Scene) {
    const mkGeo = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 2;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return g;
    };
    dustPts.current   = new THREE.Points(mkGeo(100), new THREE.PointsMaterial({ color: 0xccaa88, size: 0.1,  transparent: true, opacity: 0.6 }));
    splashPts.current = new THREE.Points(mkGeo(50),  new THREE.PointsMaterial({ color: 0x88ccff, size: 0.15, transparent: true, opacity: 0.7 }));
    dustPts.current.visible   = false;
    splashPts.current.visible = false;
    s.add(dustPts.current);
    s.add(splashPts.current);
  }

  function updateParticles() {
    if (!dustPts.current || !splashPts.current) return;
    const onWater = ['river', 'lake', 'beach', 'coastal'].includes(route.theme);
    const active  = onWater ? splashPts.current : dustPts.current;
    const inactive = onWater ? dustPts.current  : splashPts.current;
    inactive.visible = false;
    active.visible   = true;
    active.position.copy(bikeGroup.current.position).add(new THREE.Vector3(0, 0.2, -1));
    active.rotation.y += onWater ? 0.01 : 0.02;
  }

  // ── Rider model ──────────────────────────────────────────────────────────────
  function loadRider(group: THREE.Group) {
    new GLTFLoader().load(ASSETS.rider, (gltf) => {
      const m = gltf.scene;
      m.scale.set(0.5, 0.5, 0.5);
      m.position.y = 0.4;
      m.traverse(c => {
        if (!(c instanceof THREE.Mesh)) return;
        c.castShadow = true; c.receiveShadow = true;
        const n = c.name.toLowerCase();
        if (n.includes('wheel')) {
          if (n.includes('front') || !frontWheel.current) frontWheel.current = c;
          else backWheel.current = c;
        }
      });
      if (!frontWheel.current) addPrimitiveWheels(group);
      group.add(m);
    }, undefined, () => { fallbackRider(group); addPrimitiveWheels(group); });
  }

  function addPrimitiveWheels(group: THREE.Group) {
    const geo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const fw = new THREE.Mesh(geo, mat); fw.position.set(0, 0.3,  0.6); group.add(fw);
    const bw = new THREE.Mesh(geo, mat); bw.position.set(0, 0.3, -0.6); group.add(bw);
    frontWheel.current = fw; backWheel.current = bw;
  }

  function fallbackRider(group: THREE.Group) {
    const parts: [THREE.BufferGeometry, number, [number, number, number]][] = [
      [new THREE.BoxGeometry(0.2, 0.1, 1.2),         0xdd3333, [0, 0.6,  0]],
      [new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6), 0x3355aa, [0, 0.9,  0]],
      [new THREE.SphereGeometry(0.15),                0xffccaa, [0, 1.25, 0]],
    ];
    parts.forEach(([geo, color, pos]) => {
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
      mesh.position.set(...pos); mesh.castShadow = true; group.add(mesh);
    });
  }

  function animatePedalling(dt: number) {
    const angle = (metrics.current.cadence / 60) * Math.PI * 2 * dt;
    if (frontWheel.current) frontWheel.current.rotation.x += angle;
    if (backWheel.current)  backWheel.current.rotation.x  += angle;
  }

  // ── Environment ──────────────────────────────────────────────────────────────
  function buildEnv(s: THREE.Scene) {
    envObjs.current.forEach(o => s.remove(o));
    envObjs.current = [];
    if (waterMesh.current)  waterMesh.current.visible = false;

    const loader = new GLTFLoader();
    const placeTree = (type: string, x: number, z: number) => {
      const url = type === 'pine' ? ASSETS.treePine : type === 'palm' ? ASSETS.treePalm : ASSETS.treeOak;
      loader.load(url, (gltf) => {
        const t = gltf.scene; t.scale.set(0.4, 0.4, 0.4); t.position.set(x, 0, z);
        t.traverse(c => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });
        s.add(t); envObjs.current.push(t);
      }, undefined, () => {
        const trunk  = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2),   new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 8),           new THREE.MeshLambertMaterial({ color: 0x2d5a27 }));
        trunk.position.set(x, 1, z); leaves.position.set(x, 2.5, z);
        s.add(trunk); s.add(leaves); envObjs.current.push(trunk, leaves);
      });
    };

    const setGround = (hex: number) => {
      if (groundMesh.current) (groundMesh.current.material as THREE.MeshLambertMaterial).color.set(hex);
    };
    const showWater = (hex: number, posZ = 100) => {
      if (waterMesh.current) {
        waterMesh.current.visible = true;
        waterMesh.current.position.set(0, -1.8, posZ);
        (waterMesh.current.material as THREE.MeshPhongMaterial).color.set(hex);
      }
    };
    const addBox = (x: number, y: number, z: number, w: number, h: number, d: number, color: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      m.position.set(x, y, z); m.castShadow = true; s.add(m); envObjs.current.push(m);
    };

    switch (route.theme) {
      case 'river':
        setGround(0x3b6b3b); showWater(0x228B22);
        for (let z = -50; z < 200; z += 15) { placeTree('oak', -15, z); placeTree('oak', 15, z); }
        break;
      case 'lake':
        setGround(0x6b8e6b); showWater(0x4682b4);
        for (let z = -30; z < 180; z += 12) { placeTree('pine', -12, z); placeTree('pine', 12, z); }
        break;
      case 'city':
        setGround(0x808080);
        if (sceneRef.current?.fog) (sceneRef.current.fog as THREE.Fog).color.set(0xa0a0a0);
        for (let z = 10; z < 180; z += 20) { addBox(-10, 3, z, 4, 6, 4, 0x8898aa); addBox(10, 2, z, 3, 4, 3, 0x99aabb); }
        break;
      case 'forest':
        setGround(0x2d5a27);
        if (sceneRef.current?.fog) (sceneRef.current.fog as THREE.Fog).color.set(0x228b22);
        for (let z = -20; z < 200; z += 10) { placeTree('pine', -7 + Math.random() * 4, z); placeTree('pine', 7 - Math.random() * 4, z); }
        break;
      case 'coastal': case 'beach':
        setGround(0xc2b280); showWater(0x1e90ff, 0);
        for (let z = 0; z < 180; z += 12) { placeTree('palm', -10, z); placeTree('palm', 10, z); }
        break;
      case 'farmland': case 'vineyard':
        setGround(0x6b8e23);
        for (let z = 0; z < 180; z += 20) { placeTree('oak', -8, z); placeTree('oak', 8, z); }
        break;
      case 'mountain': case 'volcanic':
        setGround(0x5a4a3a);
        if (sceneRef.current?.fog) (sceneRef.current.fog as THREE.Fog).color.set(0x808080);
        for (let z = -20; z < 200; z += 12) { placeTree('pine', -9, z); placeTree('pine', 9, z); }
        for (let i = 0; i < 8; i++) {
          const rock = new THREE.Mesh(
            new THREE.ConeGeometry(5 + Math.random() * 10, 15 + Math.random() * 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x6b5b4b }),
          );
          rock.position.set(-30 + Math.random() * 60, 5, -40 + i * 15);
          rock.castShadow = true; s.add(rock); envObjs.current.push(rock);
        }
        break;
    }
  }

  // ── Mini-map ─────────────────────────────────────────────────────────────────
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
    const px = prog * 160, py = 50 + Math.sin(prog * 100 * 0.3) * 20;
    ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    Object.values(otherRiders.current).forEach(r => {
      const rp = r.lastDist / totalDist.current;
      const rx = rp * 160, ry = 50 + Math.sin(rp * 100 * 0.3) * 20;
      ctx.fillStyle = '#4466ff'; ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = '7px sans-serif'; ctx.fillText(r.name || '?', rx + 5, ry - 5);
    });
  }

  // ── BLE — uses the shared Wattbike hook ──────────────────────────────────────
  const ble = useWattbikeBluetooth();
  const bleConnected = ble.status === 'connected' || ble.status === 'riding';

  // Whenever live BLE metrics change, push them into the game refs so the
  // animation loop picks them up. Simulation is only used when no device is connected.
  useEffect(() => {
    if (!bleConnected) return;
    simMode.current = false;
    setSim(false);
    const m = metrics.current;
    m.speed    = ble.metrics.speed;
    m.power    = ble.metrics.power;
    m.cadence  = ble.metrics.cadence;
    m.distance = ble.metrics.distance;
    m.elevation = elevAt(m.distance);
  }, [bleConnected, ble.metrics.speed, ble.metrics.power, ble.metrics.cadence, ble.metrics.distance]);

  async function connectBike() {
    setStatus('Searching for bike...');
    await ble.connect();
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

  // ── Simulation ───────────────────────────────────────────────────────────────
  function simulate(dt: number) {
    const m = metrics.current;
    m.power    = 150 + Math.sin(Date.now() / 3000) * 30 + Math.random() * 10;
    m.speed    = (m.power / 250) * 35 * (0.9 + Math.random() * 0.2);
    m.cadence  = 80 + Math.sin(Date.now() / 2000) * 10;
    m.distance += (m.speed * dt) / 3600;
    m.elevation = elevAt(m.distance);
  }

  // ── Multiplayer via Supabase Realtime broadcast ───────────────────────────────
  function joinOrCreateRoom(code: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase
      .channel(`cycling:${code}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'pos' }, ({ payload }: { payload: { id: string; name: string; dist: number } }) => {
        const id = payload.id;
        const s  = sceneRef.current; if (!s) return;
        if (!otherRiders.current[id]) {
          const group = new THREE.Group();
          new GLTFLoader().load(ASSETS.rider, (gltf) => {
            const m = gltf.scene; m.scale.set(0.4, 0.4, 0.4);
            m.traverse(c => {
              if (c instanceof THREE.Mesh) {
                const mat = (c.material as THREE.MeshStandardMaterial).clone();
                mat.color.set(0x4444ff); c.material = mat;
              }
            });
            group.add(m);
          }, undefined, () => {
            group.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1), new THREE.MeshStandardMaterial({ color: 0x4444ff })));
          });
          group.position.set(0, 0.5, 10);
          s.add(group);
          otherRiders.current[id] = { group, lastDist: 0, name: payload.name };
        }
        otherRiders.current[id].lastDist = payload.dist;
        otherRiders.current[id].group.position.z = 10 + (payload.dist / totalDist.current) * 180;
        otherRiders.current[id].group.position.y = 0.5 + elevAt(payload.dist) * 0.05;
      })
      .subscribe();

    channelRef.current = ch;
    setRoomLabel(`Room: ${code} — share this code`);
    setStatus('Multiplayer connected');
  }

  // ── Game lifecycle ────────────────────────────────────────────────────────────
  function startRide() {
    metrics.current.distance = 0;
    gameActive.current = true;
    setActive(true);
    startTime.current = Date.now();
    setStatus('Riding...');
  }

  function stopRide() {
    gameActive.current = false;
    setActive(false);
    setStatus('Paused');
  }

  // ── Three.js bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    genTerrain();

    // Scene
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x87CEEB);
    s.fog = new THREE.Fog(0x87CEEB, 50, 300);
    sceneRef.current = s;

    // Camera
    const cam = new THREE.PerspectiveCamera(65, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.5, 500);
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
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x4a7c4f }));
    gm.rotation.x = -Math.PI / 2; gm.position.y = -2; gm.receiveShadow = true;
    s.add(gm); groundMesh.current = gm;

    // Water (hidden until theme activates it)
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(100, 300), new THREE.MeshPhongMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.6 }));
    wm.rotation.x = -Math.PI / 2; wm.position.set(0, -1.8, 100); wm.visible = false;
    s.add(wm); waterMesh.current = wm;

    // Road
    const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 200), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, -1.99, 50); road.receiveShadow = true;
    s.add(road);

    // Rider
    loadRider(bikeGroup.current);
    s.add(bikeGroup.current);
    bikeGroup.current.position.set(0, 0.5, 10);

    initParticles(s);
    buildEnv(s);

    // First-person camera attached to bike
    bikeGroup.current.add(cam);
    cam.position.set(0, 1.6, 0.5);
    cam.lookAt(new THREE.Vector3(0, 1.6, 20));

    // Handlebar attached to camera
    cam.add(handlebarGroup.current);
    handlebarGroup.current.position.set(0.2, -0.4, -0.8);

    // Resize handler
    const onResize = () => {
      if (!containerRef.current) return;
      cam.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cam.updateProjectionMatrix();
      ren.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Game loop — metrics are refs so no React re-renders per frame
    let lastBroadcast = 0;
    const animate = () => {
      rafId.current = requestAnimationFrame(animate);
      const dt = clock.current.getDelta();
      const m  = metrics.current;

      if (gameActive.current) {
        if (simMode.current) simulate(dt);

        if (m.distance >= totalDist.current) {
          m.distance = totalDist.current;
          gameActive.current = false;
          setActive(false);
          setStatus('Route complete! 🎉');
          const duration = Math.round((Date.now() - startTime.current) / 1000);
          onComplete?.({ ...m, duration });
        }

        const prog = m.distance / totalDist.current;
        bikeGroup.current.position.z = 10 + prog * 180;
        bikeGroup.current.position.y = 0.5 + elevAt(m.distance) * 0.05;

        animatePedalling(dt);
        updateParticles();
        drawMiniMap();

        const now = Date.now();
        if (channelRef.current && now - lastBroadcast > 200) {
          channelRef.current.send({ type: 'broadcast', event: 'pos', payload: { id: playerId.current, name, dist: m.distance } });
          lastBroadcast = now;
        }
      }

      ren.render(s, cam);
    };
    animate();

    // Sync metrics to React state for HUD at 10 fps — not every frame
    const hudInterval = setInterval(() => setHud({ ...metrics.current }), 100);

    return () => {
      cancelAnimationFrame(rafId.current);
      clearInterval(hudInterval);
      window.removeEventListener('resize', onResize);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      ren.dispose();
      ren.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  const progressPct = Math.min((hud.distance / totalDist.current) * 100, 100);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0f1e', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif", color: 'white' }}>
      {/* Three.js canvas mount point */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD — top left */}
      <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '12px 20px', display: 'flex', gap: 25, border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 10 }}>
        {([['Speed', hud.speed.toFixed(1), 'km/h'], ['Power', Math.round(hud.power), 'W'], ['Dist', hud.distance.toFixed(2), 'km'], ['Cadence', Math.round(hud.cadence), 'rpm'], ['Elev', Math.round(hud.elevation), 'm']] as [string, string | number, string][]).map(([label, val, unit]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#a0b5d0' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', textShadow: '0 0 12px rgba(0,160,255,0.5)' }}>{val}</div>
            <div style={{ fontSize: 13, color: '#7e93aa' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Mini-map — top right */}
      <canvas ref={miniRef} width={160} height={100} style={{ position: 'absolute', top: 120, right: 20, background: 'rgba(0,0,0,0.7)', border: '2px solid #3f6188', borderRadius: 10, zIndex: 15 }} />

      {/* Status bar */}
      <div style={{ position: 'absolute', top: 120, left: 20, background: 'rgba(0,0,0,0.7)', padding: '6px 15px', borderRadius: 20, fontSize: '0.85rem', color: '#aac8ff', zIndex: 10 }}>{status}</div>

      {/* Route progress bar */}
      <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 320, zIndex: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#1e90ff', width: `${progressPct}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ textAlign: 'center', color: '#aac8ff', fontSize: 12, marginTop: 4 }}>
          {hud.distance.toFixed(2)} / {totalDist.current} km
        </div>
      </div>

      {/* Controls — bottom centre */}
      <div style={{ position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10, alignItems: 'center' }}>
        <Button variant="outline" size="sm" onClick={connectBike}>🔗 Connect Bike</Button>
        <Button size="sm" onClick={startRide} disabled={active}>▶ Start</Button>
        <Button variant="destructive" size="sm" onClick={stopRide} disabled={!active}>⏹ Pause</Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={sim} onChange={e => { setSim(e.target.checked); simMode.current = e.target.checked; }} />
          Sim
        </label>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>}
      </div>

      {/* Multiplayer lobby — right panel */}
      <div style={{ position: 'absolute', top: 240, right: 20, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 12, zIndex: 15, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 170 }}>
        <Input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3f6188', color: 'white' }}
        />
        <Input
          placeholder="Room code"
          value={roomInput}
          onChange={e => setRoomInput(e.target.value.toUpperCase())}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3f6188', color: 'white' }}
        />
        <Button size="sm" onClick={() => {
          const code = 'RACE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          setRoomInput(code);
          joinOrCreateRoom(code);
        }}>🎮 Create Room</Button>
        <Button size="sm" variant="outline" onClick={() => { if (roomInput) joinOrCreateRoom(roomInput); }}>
          🚪 Join Room
        </Button>
        {roomLabel && <div style={{ color: '#aac8ff', fontSize: 12 }}>{roomLabel}</div>}
      </div>
    </div>
  );
}
