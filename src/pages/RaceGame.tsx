/**
 * RaceGame.tsx — Cycle Cup
 * Drop-in page for Freewheeler (Lovable).
 *
 * HOW TO ADD TO LOVABLE
 * ─────────────────────
 * 1. Create this file at  src/pages/RaceGame.tsx
 * 2. In src/App.tsx add:
 *      import RaceGame from "./pages/RaceGame";
 *      // inside <Routes>:
 *      <Route path="/race" element={<ProtectedRoute><RaceGame /></ProtectedRoute>} />
 * 3. Add a "Play Race" button anywhere (e.g. Dashboard):
 *      <Link to="/race"><Button>🚲 Play Race</Button></Link>
 * 4. npm install three   (if not already installed)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchStudents,
  createSessionReflection,
  updateSessionReflection,
} from "@/lib/airtable";
import { recordSessionPoints } from "@/lib/points";
import {
  calculateSessionPoints,
  getLevelName,
} from "@/lib/gamification";
import { toast } from "@/hooks/use-toast";

// ─── FTMS Bluetooth UUIDs ─────────────────────────────────────────────────────
const FTMS_SVC        = "00001826-0000-1000-8000-00805f9b34fb";
const BIKE_DATA_CHAR  = "00002ad2-0000-1000-8000-00805f9b34fb"; // notify (cadence/power)
const FTMS_CP_CHAR    = "00002ad9-0000-1000-8000-00805f9b34fb"; // write  (resistance)

// ─── FTMS helpers ─────────────────────────────────────────────────────────────
function parseFTMS(dv: DataView) {
  const flags = dv.getUint16(0, true);
  let off = 2, speed = 0, cadence = 0, power = 0;
  if (flags & 0x01) { speed   = dv.getUint16(off, true) * 0.01; off += 2; }
  if (flags & 0x02) off += 2;
  if (flags & 0x04) { cadence = dv.getUint16(off, true) * 0.5;  off += 2; }
  if (flags & 0x08) off += 2;
  if (flags & 0x10) off += 3;
  if (flags & 0x20) off += 2;
  if (flags & 0x40) power = dv.getInt16(off, true);
  return { speed, cadence, power };
}

/** Request control of the bike's resistance system */
async function requestFTMSControl(cp: any) {
  const buf = new ArrayBuffer(1);
  new DataView(buf).setUint8(0, 0x00);
  try { await cp.writeValue(buf); } catch (_) { /* some bikes auto-grant */ }
}

/**
 * Send grade (slope %) to the smart bike.
 * This is what MyWhoosh uses — opcode 0x11 "Set Indoor Bike Simulation Parameters"
 * grade is in percent (e.g. 5.0 = 5% incline → real resistance increase)
 */
async function setFTMSGrade(
  cp: any,
  gradePct: number
) {
  const buf = new ArrayBuffer(7);
  const dv  = new DataView(buf);
  dv.setUint8(0,  0x11);                              // opcode: Set Sim Params
  dv.setInt16(1,  0, true);                           // wind speed = 0
  dv.setInt16(3,  Math.round(gradePct * 100), true);  // grade in 0.01% units
  dv.setUint8(5,  4);                                 // Crr = 0.0004 (rolling resist)
  dv.setUint8(6,  51);                                // CW  = 0.51 kg/m (air drag)
  try { await cp.writeValue(buf); } catch (_) { /* ignore mid-race write errors */ }
}

// ─── Track profiles ────────────────────────────────────────────────────────────
interface TrackProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Grade % at 10 evenly-spaced checkpoints around the circuit (0–360°) */
  gradeProfile: number[];
  avgElevationM: number; // used for Freewheeler points calc
  ptsMultiplier: number;
  cpuSpeedMult: number;  // CPU slows on harder tracks to keep races competitive
  skyColor: number;
  fogColor: number;
  groundColor: number;
  difficultyLabel: string;
  difficultyColor: string;
  accentColor: string;
}

const TRACKS: TrackProfile[] = [
  {
    id: "flat",
    name: "Flat City Circuit",
    emoji: "🏙️",
    description: "Smooth roads, zero elevation. Perfect for a fast race.",
    gradeProfile: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    avgElevationM: 0,
    ptsMultiplier: 1.0,
    cpuSpeedMult: 1.0,
    skyColor: 0x77bbdd, fogColor: 0x99ddee, groundColor: 0x33aa22,
    difficultyLabel: "EASY",   difficultyColor: "#00cc44", accentColor: "#00eeff",
  },
  {
    id: "hills",
    name: "Rolling Hills",
    emoji: "🌄",
    description: "Gentle 3–4% climbs. Earns 1.2× points — bike resistance increases on climbs.",
    gradeProfile: [1, 3, 4, 3, 1, 0, 2, 4, 3, 1],
    avgElevationM: 55,
    ptsMultiplier: 1.2,
    cpuSpeedMult: 0.92,
    skyColor: 0x88cc99, fogColor: 0xaaddbb, groundColor: 0x44aa33,
    difficultyLabel: "MEDIUM",  difficultyColor: "#ffaa00", accentColor: "#ffdd00",
  },
  {
    id: "mountain",
    name: "Mountain Pass",
    emoji: "⛰️",
    description: "Steep 6–9% climbs. Earns 1.5× points — legs will burn!",
    gradeProfile: [2, 5, 8, 7, 4, 1, 6, 9, 6, 2],
    avgElevationM: 120,
    ptsMultiplier: 1.5,
    cpuSpeedMult: 0.82,
    skyColor: 0x9999cc, fogColor: 0xbbbbdd, groundColor: 0x558833,
    difficultyLabel: "HARD",   difficultyColor: "#ff7700", accentColor: "#ff9900",
  },
  {
    id: "alpine",
    name: "Alpine Challenge",
    emoji: "🏔️",
    description: "Brutal 10–12% gradients. Earns 2× points — maximum effort required!",
    gradeProfile: [3, 7, 10, 12, 8, 3, 9, 12, 10, 5],
    avgElevationM: 220,
    ptsMultiplier: 2.0,
    cpuSpeedMult: 0.72,
    skyColor: 0x7788bb, fogColor: 0x8899cc, groundColor: 0x667755,
    difficultyLabel: "EXTREME", difficultyColor: "#ff2244", accentColor: "#ff4466",
  },
];

/** Sample track grade at position t (0–1) using the profile checkpoints */
function gradeAtT(profile: number[], t: number): number {
  const n = profile.length;
  const scaled = t * n;
  const i = Math.floor(scaled) % n;
  const frac = scaled - Math.floor(scaled);
  const j = (i + 1) % n;
  return profile[i] * (1 - frac) + profile[j] * frac;
}

// ─── Game constants ────────────────────────────────────────────────────────────
const LAPS        = 3;
const TRACK_HW    = 5;
const NS          = 280;
const CPU_NAMES   = ["Bolt", "Zippy", "Turbo"];
const CPU_COLS    = [0xff4422, 0x33cc55, 0xcc44ff];
const CPU_BASE_SPD= [9.2, 10.8, 12.4];
const P_MAX_SPD   = 16;
const BOOST_SPD   = 26;
const BOOST_DUR   = 2.2;
const ACCEL       = 13;
const DECEL       = 20;
const COAST_FRIC  = 9;
const STEER_SPD   = 2.8;
const BOOST_TS    = [0.1, 0.28, 0.5, 0.72, 0.9];
const ITEM_TS     = [0.06, 0.19, 0.35, 0.44, 0.58, 0.67, 0.81, 0.94];
const PLAYER_COL  = 0x00bbff;
const DEMO_RPM    = 75;
const CAM_HEIGHT  = 2.05;
const CAM_FOV     = 72;
const LOOK_AHEAD  = 18;
const LOOK_DOWN   = 0.28;
const MAP_W = 155, MAP_H = 125;
const MX0=-65, MX1=65, MZ0=-40, MZ1=40;
const toMX = (x: number) => ((x-MX0)/(MX1-MX0))*(MAP_W-16)+8;
const toMZ = (z: number) => ((z-MZ0)/(MZ1-MZ0))*(MAP_H-16)+8;

const ITEMS = [
  { id:"boost",      label:"⚡ BOOST",      color:"#ffee00", dur:2.5, speed:BOOST_SPD },
  { id:"nitro",      label:"🔵 NITRO",       color:"#00aaff", dur:4.0, speed:BOOST_SPD*1.15 },
  { id:"slipstream", label:"💨 SLIPSTREAM",  color:"#00ffaa", dur:3.5, speed:BOOST_SPD*0.85 },
  { id:"headwind",   label:"🌀 HEADWIND",    color:"#ff6600", dur:3.0, speed:0, cpuSlow:true },
];

function fmtTime(sec: number) {
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

// ─── Three.js helpers ──────────────────────────────────────────────────────────
function makeCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i=0; i<24; i++) {
    const a = (i/24)*Math.PI*2;
    pts.push(new THREE.Vector3(Math.cos(a)*52+Math.sin(2*a)*8, 0, Math.sin(a)*34));
  }
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
}
function sampleCurve(curve: THREE.CatmullRomCurve3) {
  return Array.from({length:NS}, (_,i) => {
    const t = i/NS, pos = curve.getPoint(t), tan = curve.getTangent(t).normalize();
    return { pos, tan, right: new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0,1,0)).normalize() };
  });
}
function buildRoadGeo(smp: ReturnType<typeof sampleCurve>) {
  const N=smp.length, v: number[]=[], idx: number[]=[];
  smp.forEach(({pos,right}) => {
    const L=pos.clone().addScaledVector(right,-TRACK_HW), R=pos.clone().addScaledVector(right,TRACK_HW);
    v.push(L.x,0.01,L.z, R.x,0.01,R.z);
  });
  for(let i=0;i<N;i++){const a=i*2,b=((i+1)%N)*2;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildKerbGeo(smp: ReturnType<typeof sampleCurve>, sign: number) {
  const N=smp.length, v: number[]=[], idx: number[]=[];
  smp.forEach(({pos,right}) => {
    const I=pos.clone().addScaledVector(right,sign*TRACK_HW), O=pos.clone().addScaledVector(right,sign*(TRACK_HW+1.2));
    v.push(I.x,0.04,I.z, O.x,0.04,O.z);
  });
  for(let i=0;i<N;i++){const a=i*2,b=((i+1)%N)*2;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function mkBike(col: number) {
  const g=new THREE.Group(), B=new THREE.MeshLambertMaterial({color:col}), D=new THREE.MeshLambertMaterial({color:0x111122}), Sk=new THREE.MeshLambertMaterial({color:0xffcc88});
  const box=(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat as THREE.MeshLambertMaterial);m.position.set(x,y,z);g.add(m);return m;};
  box(0.28,0.5,1.0,B,0,0.56,0); box(0.70,0.1,0.14,D,0,0.96,-0.42); box(0.35,0.5,0.32,B,0,1.12,0.06);
  box(0.26,0.26,0.26,Sk,0,1.52,-0.08); box(0.30,0.18,0.30,B,0,1.67,-0.08); box(0.18,0.4,0.14,D,0,0.35,0);
  const wG=new THREE.CylinderGeometry(0.33,0.33,0.12,10);
  const fw=new THREE.Mesh(wG,D); fw.rotation.z=Math.PI/2; fw.position.set(0,0.33,-0.49); g.add(fw);
  const rw=new THREE.Mesh(wG,D); rw.rotation.z=Math.PI/2; rw.position.set(0,0.33,0.49);  g.add(rw);
  g.scale.setScalar(0.88); g.userData={fw,rw}; return g;
}
function mkHandlebarRig() {
  const g=new THREE.Group(), metal=new THREE.MeshLambertMaterial({color:0x7799bb,emissive:0x112233}), dark=new THREE.MeshLambertMaterial({color:0x111122}), skin=new THREE.MeshLambertMaterial({color:0xd4956a}), glove=new THREE.MeshLambertMaterial({color:0x223355});
  const stem=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.18,0.055),metal); stem.position.set(0,0,-0.14); g.add(stem);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.60,0.055,0.055),metal); bar.position.set(0,0.065,-0.14); g.add(bar);
  [-0.26,0.26].forEach(x=>{const grip=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.075,0.15),dark); grip.position.set(x,0.065,-0.14); g.add(grip);});
  [-0.26,0.26].forEach((x,side)=>{
    const hand=new THREE.Group();
    const palm=new THREE.Mesh(new THREE.BoxGeometry(0.085,0.07,0.13),skin); hand.add(palm);
    for(let f=0;f<4;f++){const k=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.028,0.03),skin); k.position.set(-0.032+f*0.021,0.04,-0.05); hand.add(k);}
    const thumb=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.04,0.025),skin); thumb.position.set(side===0?-0.05:0.05,0.02,0.01); hand.add(thumb);
    const cuff=new THREE.Mesh(new THREE.BoxGeometry(0.092,0.05,0.07),glove); cuff.position.set(0,-0.035,0.05); hand.add(cuff);
    hand.position.set(x,0.062,-0.14); hand.rotation.x=-0.15; g.add(hand);
  });
  const fork=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.14,0.55),dark); fork.position.set(0,-0.18,-0.20); g.add(fork);
  g.position.set(0,-0.46,-0.48); g.scale.setScalar(0.72); return g;
}

// ─── Main Component ────────────────────────────────────────────────────────────
type GamePhase = "loading" | "trackSelect" | "race" | "results";
type InputMode = "keyboard" | "demo" | "ftms";

interface RaceResult {
  position: number;
  timeSec: number;
  avgSpeedKph: number;
  distKm: number;
  ptsBase: number;
  ptsFinal: number;
  track: TrackProfile;
}

export default function RaceGame() {
  const navigate = useNavigate();
  const { user, nfcSession, loading: authLoading } = useAuth();

  // Rider identity (resolved from NFC or Supabase)
  const [riderName,      setRiderName]      = useState("");
  const [studentRecordId,setStudentRecordId]= useState<string | null>(null);
  const [prevPoints,     setPrevPoints]     = useState(0);

  // Game UI state
  const [phase,       setPhase]       = useState<GamePhase>("loading");
  const [inputMode,   setInputMode]   = useState<InputMode>("keyboard");
  const [selectedTrack, setSelectedTrack] = useState<TrackProfile>(TRACKS[0]);
  const [ranks,       setRanks]       = useState<{pos:number;name:string;isPlayer:boolean;time:string}[]>([]);
  const [raceResult,  setRaceResult]  = useState<RaceResult | null>(null);
  const [postFeel,    setPostFeel]    = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  // FTMS
  const [ftmsOk,      setFtmsOk]      = useState(false);
  const [liveStats,   setLiveStats]   = useState({cadence:0, power:0});
  const ftmsLiveRef = useRef({speed:0, cadence:0, power:0});
  const ftmsCPRef   = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const ftmsOkRef   = useRef(false);
  const lastGradeRef= useRef(0);
  const gradeTimerRef=useRef(0);

  const mountRef    = useRef<HTMLDivElement>(null);
  const minimapRef  = useRef<HTMLCanvasElement>(null);
  const keysRef     = useRef<Record<string,boolean>>({});
  const touchRef    = useRef({left:false, right:false, accel:false});
  const modeRef     = useRef<InputMode>("keyboard");

  useEffect(() => { modeRef.current = inputMode; }, [inputMode]);

  // ── Resolve rider identity ─────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    async function resolve() {
      // NFC bracelet login
      if (nfcSession) {
        setRiderName(nfcSession.firstName || nfcSession.fullName);
        setStudentRecordId(nfcSession.studentId);
        setPhase("trackSelect");
        return;
      }
      // Supabase email login
      if (user?.email) {
        try {
          const res = await fetchStudents(user.email);
          if (res.records.length > 0) {
            const rec = res.records[0];
            setRiderName(String(rec.fields["Full Name"] ?? user.email));
            setStudentRecordId(rec.id);
            // Fetch previous points total
            const { callAirtable } = await import("@/lib/airtable");
            const sessions = await callAirtable("Session Reflections", "GET", {
              filterByFormula: `FIND("${rec.id}",ARRAYJOIN({Student Registration}))`,
              maxRecords: 200,
            });
            const total = sessions.records.reduce(
              (s: number, r: any) => s + Number(r.fields["Points Earned"] || 0), 0
            );
            setPrevPoints(total);
          } else {
            setRiderName(user.email);
          }
        } catch (_) {
          setRiderName(user.email ?? "Rider");
        }
        setPhase("trackSelect");
        return;
      }
      // Not logged in — send to auth
      navigate("/auth");
    }
    resolve();
  }, [authLoading, user, nfcSession, navigate]);

  // ── Keyboard listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if ([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // ── FTMS connect ───────────────────────────────────────────────────────────
  const connectFTMS = useCallback(async () => {
    try {
      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ services: [FTMS_SVC] }],
        optionalServices: [FTMS_SVC],
      });
      const srv = await dev.gatt!.connect();
      const svc = await srv.getPrimaryService(FTMS_SVC);

      // Data characteristic (cadence / power)
      const dataChr = await svc.getCharacteristic(BIKE_DATA_CHAR);
      await dataChr.startNotifications();
      dataChr.addEventListener("characteristicvaluechanged", (e: any) => {
        const d = parseFTMS(e.target.value);
        ftmsLiveRef.current = d;
        setLiveStats({ cadence: Math.round(d.cadence), power: Math.round(d.power) });
      });

      // Control point (resistance)
      try {
        const cp = await svc.getCharacteristic(FTMS_CP_CHAR);
        await requestFTMSControl(cp);
        ftmsCPRef.current = cp;
      } catch (_) {
        console.warn("FTMS CP not available — resistance control disabled");
      }

      ftmsOkRef.current = true;
      setFtmsOk(true);
      setInputMode("ftms");
      toast({ title: "🚲 Smart bike connected!" });
    } catch (err: any) {
      toast({ title: "Bluetooth error", description: err.message, variant: "destructive" });
    }
  }, []);

  // ── Submit race result to Airtable + Supabase ──────────────────────────────
  const submitResult = useCallback(async () => {
    if (!raceResult) return;
    setSubmitting(true);
    const { track, timeSec, avgSpeedKph, distKm, ptsFinal, position } = raceResult;
    const posLabel = ["1st","2nd","3rd","4th"][position-1] ?? `${position}th`;
    const nfcToken = nfcSession?.nfcToken;

    try {
      const sessionDataJSON = JSON.stringify({
        distance_km:      Math.round(distKm * 10) / 10,
        duration_hh_mm_ss:`0:${fmtTime(timeSec)}`,
        speed_kmh:        Math.round(avgSpeedKph * 10) / 10,
        elevation_m:      track.avgElevationM,
      });

      const fields: Record<string, any> = {
        "How did you feel before you jumped on the bike?": 3,
        "How did you feel after your bike session today?": postFeel || 4,
        "What did you enjoy or not enjoy about today's session?":
          `Cycle Cup – ${track.name} (${track.difficultyLabel}). ` +
          `Finished ${posLabel} in ${fmtTime(timeSec)}. ` +
          `Avg ${Math.round(avgSpeedKph)} km/h · ${track.avgElevationM}m elevation · ` +
          `${ptsFinal} pts (${track.ptsMultiplier}× multiplier).`,
        "Points Earned":      ptsFinal,
        
      };
      if (studentRecordId) fields["Student Registration"] = [studentRecordId];
      else                 fields["Student Name"]         = riderName;

      const res = await createSessionReflection(fields, nfcToken);
      const newId = res?.records?.[0]?.id;

      // Record to Supabase leaderboard too (if Supabase user)
      if (user?.id && studentRecordId) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          await recordSessionPoints(user.id, studentRecordId, today);
        } catch (_) {}
      }

      // Patch Points Earned back to the Airtable record (in case formula differs)
      if (newId) {
        try { await updateSessionReflection(newId, { "Points Earned": ptsFinal }, nfcToken); } catch (_) {}
      }

      setSubmitted(true);
      toast({ title: `✅ Saved! +${ptsFinal} points added to Freewheeler` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [raceResult, riderName, studentRecordId, postFeel, user, nfcSession]);

  // ── Race engine ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "race") return;
    const mount = mountRef.current;
    if (!mount) return;

    // Reset input on every race start
    keysRef.current  = {};
    touchRef.current = { left:false, right:false, accel:false };
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const track = selectedTrack;
    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(track.skyColor);
    scene.fog = new THREE.FogExp2(track.fogColor, 0.005);

    const cam = new THREE.PerspectiveCamera(CAM_FOV, W/H, 0.05, 400);
    const ren = new THREE.WebGLRenderer({ antialias:true });
    ren.setSize(W, H); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(ren.domElement);

    scene.add(new THREE.AmbientLight(0xbbccdd, 2.0));
    const sun = new THREE.DirectionalLight(0xfffaee, 2.8);
    sun.position.set(60, 120, 80); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x88ccff, 0x446622, 0.6));

    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 800),
      new THREE.MeshLambertMaterial({ color: track.groundColor })
    );
    gnd.rotation.x = -Math.PI/2; gnd.position.y = -0.05; scene.add(gnd);

    const curve = makeCurve(), smp = sampleCurve(curve), trackLen = curve.getLength();

    scene.add(new THREE.Mesh(buildRoadGeo(smp), new THREE.MeshLambertMaterial({ color:0x1e1e2e })));
    scene.add(new THREE.Mesh(buildKerbGeo(smp, 1),  new THREE.MeshLambertMaterial({ color:0xff2244 })));
    scene.add(new THREE.Mesh(buildKerbGeo(smp,-1), new THREE.MeshLambertMaterial({ color:0xffffff })));

    // Dashed centre line
    for (let i=0; i<NS; i+=4) {
      const s=smp[i], d=new THREE.Mesh(new THREE.PlaneGeometry(0.18,2.6),new THREE.MeshBasicMaterial({color:0xffee88}));
      d.rotation.x=-Math.PI/2; d.position.set(s.pos.x,0.02,s.pos.z); d.rotation.y=-Math.atan2(s.tan.x,s.tan.z); scene.add(d);
    }

    // Start/finish
    const s0=smp[0];
    for (let c=0; c<10; c++) {
      const ck=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_HW*2/10,2.4),new THREE.MeshBasicMaterial({color:c%2===0?0xffffff:0x222222}));
      ck.rotation.x=-Math.PI/2;
      ck.position.set(s0.pos.x+s0.right.x*(TRACK_HW*2/10)*(c-4.5),0.03,s0.pos.z+s0.right.z*(TRACK_HW*2/10)*(c-4.5));
      ck.rotation.y=-Math.atan2(s0.tan.x,s0.tan.z); scene.add(ck);
    }

    // Boost pads
    const bpMeshes = BOOST_TS.map(bt => {
      const si=Math.floor(bt*NS), s=smp[si];
      const pad=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_HW*1.5,3.2),new THREE.MeshBasicMaterial({color:0xffee00,transparent:true,opacity:0.8,side:THREE.DoubleSide}));
      pad.rotation.x=-Math.PI/2; pad.position.set(s.pos.x,0.04,s.pos.z); pad.rotation.y=-Math.atan2(s.tan.x,s.tan.z); scene.add(pad);
      const arrow=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.7,0.5),new THREE.MeshBasicMaterial({color:0xff8800}));
      arrow.position.set(s.pos.x,1.0,s.pos.z); scene.add(arrow);
      return { t:bt, pad, arrow };
    });

    // Item boxes
    const ITEM_BOX_COLS=[0xffdd00,0x00aaff,0x00ffaa,0xff6600];
    const itemBoxes = ITEM_TS.map((it, ix) => {
      const si=Math.floor(it*NS), s=smp[si];
      const outer=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),new THREE.MeshLambertMaterial({color:ITEM_BOX_COLS[ix%4],emissive:new THREE.Color(ITEM_BOX_COLS[ix%4]).multiplyScalar(0.3),transparent:true,opacity:0.9}));
      const inner=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),new THREE.MeshBasicMaterial({color:0xffffff}));
      const grp=new THREE.Group(); grp.add(outer); grp.add(inner);
      grp.position.set(s.pos.x,1.4,s.pos.z); scene.add(grp);
      return { t:it, grp, alive:true, respawnAt:0 };
    });

    // Scenery — harder tracks get darker, rockier buildings
    const SCOL=[0xff5533,0x3388ff,0xffaa00,0xff44aa,0x00ccaa,0x8833ff,0xff8844,0x33aaff];
    const rng=(a:number,b:number)=>a+Math.random()*(b-a);
    for (let i=0; i<120; i++) {
      const si=Math.floor((i/120)*NS), s=smp[si], side=i%2===0?1:-1, dist=rng(9,22);
      const ox=s.pos.x+s.right.x*side*dist+rng(-3,3), oz=s.pos.z+s.right.z*side*dist+rng(-3,3);
      if (Math.random()>0.4) {
        const th=rng(2,5+(track.avgElevationM*0.03));
        const tr=new THREE.Mesh(new THREE.BoxGeometry(0.5,th,0.5),new THREE.MeshLambertMaterial({color:0x774411}));
        const lf=new THREE.Mesh(new THREE.BoxGeometry(rng(2.5,4.5),rng(2,4),rng(2.5,4.5)),new THREE.MeshLambertMaterial({color:0x226622}));
        tr.position.set(ox,th/2,oz); lf.position.set(ox,th+1.2,oz); scene.add(tr); scene.add(lf);
      } else {
        const h=rng(5,14), w=rng(3,7), col=SCOL[i%SCOL.length];
        const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshLambertMaterial({color:col}));
        const r=new THREE.Mesh(new THREE.BoxGeometry(w+0.6,0.7,w+0.6),new THREE.MeshLambertMaterial({color:0x111122}));
        b.position.set(ox,h/2,oz); r.position.set(ox,h+0.35,oz); scene.add(b); scene.add(r);
      }
    }

    // CPU bikes
    const cpuMeshes: Record<string,THREE.Group> = {};
    CPU_NAMES.forEach((_,i) => { const bk=mkBike(CPU_COLS[i]); scene.add(bk); cpuMeshes[`c${i}`]=bk; });

    // Handlebar rig (attached to camera)
    const hbRig = mkHandlebarRig();
    cam.add(hbRig); scene.add(cam);

    // Racers
    const racers = [
      { id:"p", name:riderName, t:0, lap:0, speed:0, lane:0, boostTimer:0, boostSpeed:BOOST_SPD,
        finished:false, ft:0, item:null as any, cpuSlowTimer:0, distTravelled:0 },
      ...CPU_NAMES.map((name,i) => ({
        id:`c${i}`, name, t:(i+1)*0.012, lap:0, speed:CPU_BASE_SPD[i]*0.85*track.cpuSpeedMult,
        lane:[0.3,-0.4,0.55][i], boostTimer:0, boostSpeed:BOOST_SPD,
        finished:false, ft:0, item:null, cpuSlowTimer:0, distTravelled:0,
      })),
    ];

    const hudEl = document.createElement("div");
    hudEl.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:'Courier New',monospace;";
    mount.appendChild(hudEl);

    let raceGo=false, raceOver=false, startTime=0, countdown=3, lastTS=0, raf=0, cdTO=0;
    let demoCadence=0, camBobPhase=0;
    const ORDS=["1st","2nd","3rd","4th"], cdColors=["#ff4444","#ffaa00","#ffee00"];

    // Countdown
    const tick = () => {
      if (countdown > 0) {
        hudEl.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:90px;font-weight:bold;color:${cdColors[3-countdown]};text-shadow:4px 4px 20px #000,0 0 50px ${cdColors[3-countdown]};font-family:'Courier New',monospace">${countdown}</div></div>`;
        countdown--; cdTO=window.setTimeout(tick, 1000);
      } else {
        hudEl.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:90px;font-weight:bold;color:#00ff88;text-shadow:4px 4px 20px #000,0 0 60px #00ff88;font-family:'Courier New',monospace">GO!</div></div>`;
        raceGo=true; startTime=performance.now(); cdTO=window.setTimeout(()=>updateHUD(), 900);
      }
    };
    cdTO = window.setTimeout(tick, 600);

    function getRanked() {
      return [...racers].sort((a,b)=>{
        if(a.finished&&!b.finished)return-1; if(!a.finished&&b.finished)return 1;
        if(a.finished&&b.finished)return a.ft-b.ft;
        return(b.lap+b.t)-(a.lap+a.t);
      });
    }

    function updateHUD() {
      if (raceOver) return;
      const p=racers[0], ranked=getRanked(), pPos=ranked.findIndex(r=>r.id==="p")+1;
      const spd=Math.round(p.speed*5.5), lap=Math.min(p.lap+1,LAPS);
      const elapsed=((performance.now()-startTime)/1000).toFixed(1);
      const m=modeRef.current, fl=ftmsLiveRef.current;
      const currentGrade=Math.round(gradeAtT(track.gradeProfile, p.t)*10)/10;
      const gradeBar=currentGrade>0?`<div style="color:${track.accentColor};font-size:12px">▲ ${currentGrade}% grade</div>`:"";
      const mTag=m==="demo"?`<div style="color:#ffaa00;font-size:11px">🎮 ${Math.round(demoCadence)} rpm</div>`
        :m==="ftms"?`<div style="color:#00cc44;font-size:11px">🚴 ${fl.cadence|0} rpm · ${fl.power|0}W</div>`
        :`<div style="color:#9aabbc;font-size:11px">⌨️ hold ↑ to pedal</div>`;
      const itemHtml=p.item?`<div style="margin-top:3px;padding:4px 9px;background:rgba(0,0,0,0.5);border-radius:6px;color:${p.item.color};font-size:13px;font-weight:bold">${p.item.label}</div>`:``;
      const spdPct=Math.min(Math.round((p.speed/P_MAX_SPD)*18),18);
      const spdBar="█".repeat(spdPct)+"░".repeat(18-spdPct);
      hudEl.innerHTML=`
        <div style="position:absolute;top:14px;left:16px;color:#fff;text-shadow:1px 1px 6px #000;line-height:1.85">
          <div style="font-size:34px;font-weight:bold;color:${pPos===1?"#ffdd00":"#fff"}">${ORDS[pPos-1]||pPos+"th"}</div>
          <div style="font-size:15px">Lap <b>${lap}</b> / ${LAPS}</div>
          <div style="font-size:12px;color:${track.accentColor}">${track.emoji} ${track.name}</div>
          ${p.boostTimer>0?`<div style="color:#ffee00;font-size:17px;font-weight:bold">⚡ BOOST!</div>`:""}
          ${gradeBar}${mTag}${itemHtml}
        </div>
        <div style="position:absolute;top:14px;right:14px;text-align:right;font-size:13px;line-height:2.0">
          ${ranked.map((r,i)=>`<div style="color:${r.id==="p"?"#00eeff":i===0?"#ffdd00":"#aabbcc"};font-weight:${r.id==="p"?"bold":"normal"};text-shadow:1px 1px 4px #000">${ORDS[i]} ${r.name}</div>`).join("")}
        </div>
        <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.8);font-size:14px;letter-spacing:2px;text-shadow:1px 1px 4px #000">${elapsed}s</div>
        <div style="position:absolute;bottom:${window.innerWidth<700?170:22}px;left:50%;transform:translateX(-50%);text-align:center">
          <div style="font-size:20px;color:${p.boostTimer>0?"#ffee00":"rgba(255,255,255,0.75)"};text-shadow:1px 1px 4px #000">${spd} km/h</div>
          <div style="font-size:9px;color:rgba(0,200,255,0.45)">${spdBar}</div>
        </div>`;
    }

    function drawMinimap(p: typeof racers[0], ts: number) {
      const cv = minimapRef.current; if (!cv) return;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0,0,MAP_W,MAP_H);
      ctx.fillStyle="rgba(5,15,30,0.82)"; ctx.roundRect(0,0,MAP_W,MAP_H,10); ctx.fill();
      ctx.strokeStyle="rgba(0,187,255,0.3)"; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath();
      smp.forEach((s,i) => { const mx=toMX(s.pos.x),mz=toMZ(s.pos.z); i===0?ctx.moveTo(mx,mz):ctx.lineTo(mx,mz); });
      ctx.closePath(); ctx.strokeStyle="rgba(80,80,120,0.8)"; ctx.lineWidth=5; ctx.stroke();
      BOOST_TS.forEach(bt=>{const si=Math.floor(bt*NS),s=smp[si];ctx.fillStyle="#ffee00";ctx.fillRect(toMX(s.pos.x)-3,toMZ(s.pos.z)-3,6,6);});
      itemBoxes.forEach(ib=>{if(!ib.alive)return;const si=Math.floor(ib.t*NS),s=smp[si];ctx.fillStyle="#ffffff";ctx.fillRect(toMX(s.pos.x)-2,toMZ(s.pos.z)-2,5,5);});
      racers.slice(1).forEach((r,i)=>{const si=Math.floor(r.t*NS)%NS,s=smp[si];ctx.beginPath();ctx.arc(toMX(s.pos.x),toMZ(s.pos.z),4,0,Math.PI*2);ctx.fillStyle=["#ff5533","#33cc55","#cc44ff"][i];ctx.fill();});
      const psi=Math.floor(p.t*NS)%NS,ps=smp[psi],pulse=4+1.5*Math.sin(ts*0.008);
      ctx.beginPath();ctx.arc(toMX(ps.pos.x),toMZ(ps.pos.z),pulse,0,Math.PI*2);ctx.fillStyle="#00eeff";ctx.fill();
      ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle="rgba(0,187,255,0.7)";ctx.font="bold 9px monospace";
      ctx.fillText(riderName.split(" ")[0],toMX(ps.pos.x)+6,toMZ(ps.pos.z)+4);
    }

    // ── Main loop ──────────────────────────────────────────────────────────
    function loop(ts: number) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((ts-(lastTS||ts))/1000, 0.06); lastTS=ts;
      if (!raceGo || raceOver) { ren.render(scene,cam); return; }

      const k=keysRef.current, tc=touchRef.current, p=racers[0], m=modeRef.current;
      const accel=!!(k.ArrowUp  ||k.w||k.W||tc.accel);
      const brake=!!(k.ArrowDown||k.s||k.S);
      const left =!!(k.ArrowLeft||k.a||k.A||tc.left);
      const right=!!(k.ArrowRight||k.d||k.D||tc.right);

      // Current track grade (affects FTMS resistance + player physics)
      const curGrade = gradeAtT(track.gradeProfile, p.t);
      // Grade penalty: climbing slows player (more realistic), downhill is a small bonus
      const gradeSpeedMult = 1 - (curGrade * 0.035);

      // Send grade to bike every 2 seconds
      if (ts - gradeTimerRef.current > 2000 && Math.abs(curGrade - lastGradeRef.current) > 0.4) {
        lastGradeRef.current = curGrade;
        gradeTimerRef.current = ts;
        if (ftmsCPRef.current) setFTMSGrade(ftmsCPRef.current, curGrade);
      }

      if (!p.finished) {
        const maxSpd = (p.boostTimer>0 ? p.boostSpeed : P_MAX_SPD) * Math.max(gradeSpeedMult, 0.4);

        if (m==="ftms") {
          const fl=ftmsLiveRef.current;
          // Real bike: grade is handled by physical resistance, so no software speed penalty
          const target=Math.min(fl.cadence*0.14+fl.power*0.018, p.boostTimer>0?p.boostSpeed:P_MAX_SPD);
          p.speed+=(target-p.speed)*Math.min(dt*3,1);
          if(fl.cadence<5&&fl.speed<0.5)p.speed=Math.max(p.speed-COAST_FRIC*dt,0);
        } else if (m==="demo") {
          demoCadence=accel?Math.min(demoCadence+70*dt,DEMO_RPM):Math.max(demoCadence-45*dt,0);
          const target=Math.min(demoCadence*0.14, maxSpd);
          p.speed+=(target-p.speed)*Math.min(dt*4,1);
          if(brake)p.speed=Math.max(p.speed-DECEL*dt,0);
        } else {
          if(accel)      p.speed=Math.min(p.speed+ACCEL*dt, maxSpd);
          else if(brake) p.speed=Math.max(p.speed-DECEL*dt, 0);
          else           p.speed=Math.max(p.speed-COAST_FRIC*dt, 0);
        }

        if(p.boostTimer>0){p.boostTimer-=dt;if(m!=="ftms")p.speed=Math.min(p.speed+ACCEL*dt*1.5,p.boostSpeed);}
        if(p.cpuSlowTimer>0)p.cpuSlowTimer-=dt;
        if(left) p.lane=Math.max(p.lane-STEER_SPD*dt,-0.88);
        else if(right) p.lane=Math.min(p.lane+STEER_SPD*dt,0.88);
        else p.lane+=(-p.lane)*3.5*dt;

        p.distTravelled+=p.speed*dt;
        p.t+=(p.speed*dt)/trackLen;
        if(p.t>=1){p.t-=1;p.lap++;
          if(p.lap>=LAPS&&!p.finished){p.finished=true;p.ft=performance.now()-startTime;endRace();}}

        // Boost pad
        if(p.boostTimer<=0){for(const bt of BOOST_TS){const d=Math.abs(p.t-bt);if(d<0.015||d>1-0.015){p.boostTimer=BOOST_DUR;p.boostSpeed=BOOST_SPD;break;}}}
        // Item box
        for(const ib of itemBoxes){if(!ib.alive)continue;const d=Math.abs(p.t-ib.t);if(d<0.016||d>1-0.016){ib.alive=false;ib.grp.visible=false;ib.respawnAt=ts+8000;const item=ITEMS[Math.floor(Math.random()*ITEMS.length)];p.item=item;if((item as any).speed>0){p.boostTimer=item.dur;p.boostSpeed=(item as any).speed;}if((item as any).cpuSlow)p.cpuSlowTimer=item.dur;break;}}
        for(const ib of itemBoxes){if(!ib.alive&&ts>ib.respawnAt){ib.alive=true;ib.grp.visible=true;}}
        if(p.speed>0.5)camBobPhase+=p.speed*dt*2.8;
      }

      const cpuSlowed = racers[0].cpuSlowTimer>0;
      racers.slice(1).forEach((cpu,ci)=>{
        if(cpu.finished)return;
        const v=0.88+0.14*Math.sin(ts*0.001+ci*1.9), b=cpu.boostTimer>0?1.4:1, sl=cpuSlowed?0.65:1;
        const cGrade=gradeAtT(track.gradeProfile,cpu.t);
        const cgMult=Math.max(1-(cGrade*0.025),0.5);
        cpu.t+=(CPU_BASE_SPD[ci]*track.cpuSpeedMult*v*b*sl*cgMult*dt)/trackLen;
        if(cpu.t>=1){cpu.t-=1;cpu.lap++;if(cpu.lap>=LAPS&&!cpu.finished){cpu.finished=true;cpu.ft=performance.now()-startTime;}}
        cpu.lane=0.5*Math.sin(ts*0.0006+ci*2.1);
        if(cpu.boostTimer<=0){for(const bt of BOOST_TS){const d=Math.abs(cpu.t-bt);if((d<0.012||d>1-0.012)&&Math.random()>0.55){cpu.boostTimer=BOOST_DUR;break;}}}
        if(cpu.boostTimer>0)cpu.boostTimer-=dt;
        const si=Math.floor(cpu.t*NS)%NS,s=smp[si],lat=cpu.lane*TRACK_HW*0.72,bk=cpuMeshes[cpu.id];
        bk.position.set(s.pos.x+s.right.x*lat,0,s.pos.z+s.right.z*lat);
        bk.rotation.y=-Math.atan2(s.tan.x,s.tan.z); bk.rotation.z=-cpu.lane*0.18;
        const{fw,rw}=bk.userData;if(fw)fw.rotation.x+=cpu.speed*dt*3.5;if(rw)rw.rotation.x+=cpu.speed*dt*3.5;
      });

      // POV camera
      const psi=Math.floor(p.t*NS)%NS, ps=smp[psi], lat=p.lane*TRACK_HW*0.72;
      const bobY=p.speed>0.5?Math.sin(camBobPhase)*0.04:0;
      cam.position.set(ps.pos.x+ps.right.x*lat, CAM_HEIGHT+bobY, ps.pos.z+ps.right.z*lat);
      const li=(psi+LOOK_AHEAD)%NS, ls=smp[li];
      cam.lookAt(ls.pos.x+ls.right.x*p.lane*TRACK_HW*0.35, CAM_HEIGHT-LOOK_DOWN+bobY*0.3, ls.pos.z+ls.right.z*p.lane*TRACK_HW*0.35);
      cam.rotation.z+=-p.lane*0.035;
      hbRig.rotation.y=p.lane*0.14; hbRig.rotation.x=(p.speed/P_MAX_SPD)*-0.03;

      bpMeshes.forEach(bp=>{bp.pad.material.opacity=0.55+0.3*Math.sin(ts*0.006);bp.arrow.rotation.y+=dt*3;bp.arrow.position.y=0.8+0.28*Math.sin(ts*0.005);});
      itemBoxes.forEach(ib=>{if(!ib.alive)return;ib.grp.rotation.y+=dt*1.8;ib.grp.rotation.x+=dt*0.9;ib.grp.position.y=1.2+0.35*Math.sin(ts*0.003+ib.t*10);});

      drawMinimap(p, ts);
      updateHUD();
      ren.render(scene, cam);
    }

    function endRace() {
      raceOver=true;
      // Reset bike to flat grade
      if (ftmsCPRef.current) setFTMSGrade(ftmsCPRef.current, 0);

      hudEl.innerHTML+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)"><div style="font-size:52px;font-weight:bold;color:#ffdd00;text-shadow:4px 4px 14px #000;font-family:'Courier New',monospace">🏁 FINISHED!</div></div>`;
      const ranked=getRanked(), p=racers[0];
      const position=ranked.findIndex(r=>r.id==="p")+1;
      const timeSec=(p.ft||0)/1000;
      const avgSpeedKph=timeSec>0?(p.distTravelled/timeSec)*3.6:0;
      const distKm=p.distTravelled/1000;
      // Points: use Freewheeler's own formula + track multiplier
      const ptsBase=calculateSessionPoints({
        duration_minutes: timeSec/60,
        distance_km: distKm,
        elevation_m: track.avgElevationM,
        avg_speed_kmh: avgSpeedKph,
      });
      const ptsFinal=Math.round(ptsBase*track.ptsMultiplier);
      // Position bonus on top
      const posBonuses=[15,10,5,2];
      const ptsFinalWithPos=ptsFinal+(posBonuses[position-1]??0);

      setTimeout(()=>{
        setRaceResult({ position, timeSec, avgSpeedKph, distKm, ptsBase, ptsFinal:ptsFinalWithPos, track });
        setRanks(ranked.map((r,i)=>({pos:i+1,name:r.name,isPlayer:r.id==="p",time:r.finished?(r.ft/1000).toFixed(2):"—"})));
        setPhase("results");
      },2600);
    }

    raf = requestAnimationFrame(loop);
    const onResize=()=>{cam.aspect=mount.clientWidth/mount.clientHeight;cam.updateProjectionMatrix();ren.setSize(mount.clientWidth,mount.clientHeight);};
    window.addEventListener("resize",onResize);
    return()=>{clearTimeout(cdTO);cancelAnimationFrame(raf);window.removeEventListener("resize",onResize);ren.dispose();while(mount.firstChild)mount.removeChild(mount.firstChild);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase, selectedTrack, riderName]);

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const mkTouch=(key:string)=>({
    onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();touchRef.current[key as keyof typeof touchRef.current]=true;},
    onPointerUp:  (e:React.PointerEvent)=>{e.preventDefault();touchRef.current[key as keyof typeof touchRef.current]=false;},
    onPointerLeave:(e:React.PointerEvent)=>{e.preventDefault();touchRef.current[key as keyof typeof touchRef.current]=false;},
    onPointerCancel:(e:React.PointerEvent)=>{e.preventDefault();touchRef.current[key as keyof typeof touchRef.current]=false;},
  });

  // ── Shared styles ──────────────────────────────────────────────────────────
  const M=`"Courier New",monospace`;
  const OV:React.CSSProperties={position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(2,8,20,0.96)",fontFamily:M,overflowY:"auto",padding:"24px 12px"};
  const btnStyle=(bg:string,fg:string="#fff",extra:React.CSSProperties={}) => ({padding:"12px 22px",marginTop:10,fontSize:14,fontWeight:"bold" as const,background:bg,color:fg,border:"none",fontFamily:M,cursor:"pointer",borderRadius:6,letterSpacing:2,...extra});
  const ORDS=["1st","2nd","3rd","4th"];
  const podiumCols=["#ffdd00","#cccccc","#cc7722","#778899"];

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (phase==="loading") return (
    <div style={{...OV,gap:12}}>
      <div style={{color:"#00bbff",fontSize:13,letterSpacing:4}}>🚲 CYCLE CUP</div>
      <div style={{color:"#1a2e3e",fontSize:11}}>Loading rider data…</div>
    </div>
  );

  // ── Track select ───────────────────────────────────────────────────────────
  if (phase==="trackSelect") return (
    <div style={OV}>
      <div style={{fontSize:10,color:"#00ffcc",letterSpacing:6,marginBottom:4}}>FREE WHEELER LEAGUE</div>
      <h1 style={{fontSize:52,margin:"0 0 2px",fontFamily:M,background:"linear-gradient(135deg,#00bbff,#00ffcc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:3,lineHeight:1.05}}>
        CYCLE CUP
      </h1>
      <div style={{color:"#00eeff",fontSize:13,marginBottom:16}}>🚲 {riderName} &nbsp;·&nbsp; {getLevelName(prevPoints)} &nbsp;·&nbsp; {prevPoints} pts</div>

      {/* Track cards */}
      <div style={{width:340,marginBottom:16}}>
        <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:4,marginBottom:10}}>CHOOSE YOUR TRACK</div>
        {TRACKS.map(tr=>(
          <div key={tr.id} onClick={()=>setSelectedTrack(tr)} style={{
            padding:"12px 16px",marginBottom:8,borderRadius:8,cursor:"pointer",
            background:selectedTrack.id===tr.id?"rgba(0,187,255,0.12)":"rgba(255,255,255,0.02)",
            border:`2px solid ${selectedTrack.id===tr.id?"#00bbff":"#0a1e33"}`,
            display:"flex",alignItems:"center",gap:12,
          }}>
            <span style={{fontSize:28}}>{tr.emoji}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:selectedTrack.id===tr.id?"#00bbff":"#889aaa",fontWeight:"bold",fontSize:13}}>{tr.name}</span>
                <span style={{color:tr.difficultyColor,fontSize:10,fontWeight:"bold",letterSpacing:1,border:`1px solid ${tr.difficultyColor}44`,padding:"2px 6px",borderRadius:4}}>{tr.difficultyLabel}</span>
              </div>
              <div style={{color:"#1a2a3a",fontSize:11,marginTop:2}}>{tr.description}</div>
              <div style={{display:"flex",gap:10,marginTop:4,fontSize:11}}>
                <span style={{color:"#445566"}}>📈 {tr.avgElevationM}m elevation</span>
                <span style={{color:tr.accentColor}}>×{tr.ptsMultiplier} points</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mode + bike */}
      <div style={{width:340,border:"1px solid #0a1e33",borderRadius:8,padding:"12px 16px",marginBottom:14,background:"rgba(0,187,255,0.03)"}}>
        <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:4,marginBottom:8}}>INPUT MODE</div>
        {[{id:"keyboard",label:"⌨️ Keyboard",desc:"Hold ↑ to go · ←→ steer"},
          {id:"demo",    label:"🎮 Demo",    desc:"Simulates pedalling — hold ↑"},
          ...(ftmsOk?[{id:"ftms",label:"🚴 Smart Bike",desc:"FTMS connected — just pedal!"}]:[])
        ].map(o=>(
          <div key={o.id} onClick={()=>setInputMode(o.id as InputMode)} style={{padding:"8px 12px",marginBottom:5,borderRadius:6,cursor:"pointer",background:inputMode===o.id?"rgba(0,187,255,0.14)":"rgba(255,255,255,0.02)",border:`1px solid ${inputMode===o.id?"#00bbff":"#0a1e33"}`}}>
            <span style={{color:inputMode===o.id?"#00bbff":"#556677",fontWeight:"bold",fontSize:13}}>{inputMode===o.id?"✓ ":"  "}{o.label}</span>
            <span style={{color:"#1a2a3a",fontSize:11,marginLeft:8}}>{o.desc}</span>
          </div>
        ))}
        <button style={btnStyle("#0a1a2a","#334455",{width:"100%",marginTop:6,fontSize:11})} onClick={connectFTMS} disabled={ftmsOk}>
          {ftmsOk?`✓ Smart Bike linked · ${liveStats.cadence} rpm · ${liveStats.power}W`:"🔗 Link Smart Bike (FTMS Bluetooth)"}
        </button>
        {ftmsOk&&selectedTrack.avgElevationM>0&&(
          <div style={{color:"#00cc44",fontSize:11,marginTop:6,textAlign:"center"}}>
            ✓ Resistance will change automatically with track elevation
          </div>
        )}
      </div>

      <button style={btnStyle("#00bbff","#000",{fontSize:18,padding:"15px 52px"})} onClick={()=>setPhase("race")}>
        ▶ RACE!
      </button>
      <button style={btnStyle("transparent","#223344",{fontSize:11,marginTop:6})} onClick={()=>navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase==="results") return (
    <div style={OV}>
      <div style={{fontSize:10,color:"#ffdd00",letterSpacing:5,marginBottom:6}}>🏁 RACE COMPLETE</div>
      <div style={{width:340,marginBottom:14}}>
        {ranks.map((r,i)=>(
          <div key={r.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",marginBottom:7,background:r.isPlayer?"rgba(0,187,255,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${r.isPlayer?"#00bbff":"#0a1e33"}`,borderRadius:6}}>
            <span style={{fontSize:17,fontWeight:"bold",color:podiumCols[i],minWidth:56}}>{["1st 🥇","2nd 🥈","3rd 🥉","4th 🎖"][i]}</span>
            <span style={{fontSize:14,color:r.isPlayer?"#00eeff":"#99aabb",fontWeight:r.isPlayer?"bold":"normal"}}>{r.isPlayer?"🚲 ":""}{r.name}</span>
            <span style={{fontSize:12,color:"#223344"}}>{r.time!=="—"?`${r.time}s`:"—"}</span>
          </div>
        ))}
      </div>

      {/* Freewheeler points card */}
      {raceResult&&(
        <div style={{border:`1px solid ${raceResult.track.accentColor}44`,borderRadius:12,padding:"18px 22px",marginBottom:14,width:340,background:`rgba(0,255,204,0.05)`,textAlign:"center"}}>
          <div style={{fontSize:9,color:"#00ffcc",letterSpacing:4,marginBottom:6}}>FREEWHEELER POINTS</div>
          <div style={{display:"flex",justifyContent:"space-around",marginBottom:10}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:"bold",color:"#00ffcc"}}>{raceResult.ptsFinal}</div>
              <div style={{fontSize:10,color:"#334455"}}>POINTS EARNED</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:"bold",color:raceResult.track.accentColor}}>×{raceResult.track.ptsMultiplier}</div>
              <div style={{fontSize:10,color:"#334455"}}>{raceResult.track.difficultyLabel} BONUS</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:"bold",color:"#aabbcc"}}>{prevPoints+raceResult.ptsFinal}</div>
              <div style={{fontSize:10,color:"#334455"}}>NEW TOTAL</div>
            </div>
          </div>
          <div style={{fontSize:12,color:"#445566",marginBottom:4}}>
            {raceResult.track.emoji} {raceResult.track.name} · {Math.round(raceResult.avgSpeedKph)} km/h avg · {fmtTime(raceResult.timeSec)} · {ORDS[raceResult.position-1]}
          </div>
          {getLevelName(prevPoints)!==getLevelName(prevPoints+raceResult.ptsFinal)&&(
            <div style={{marginTop:8,padding:"6px 14px",background:"rgba(255,221,0,0.15)",border:"1px solid #ffdd0055",borderRadius:8,color:"#ffdd00",fontWeight:"bold",fontSize:13}}>
              🎉 Level Up! → {getLevelName(prevPoints+raceResult.ptsFinal)}
            </div>
          )}

          {!submitted?(
            <>
              <div style={{fontSize:11,color:"#2a3a4a",marginTop:14,marginBottom:8}}>How do you feel after that race?</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>
                {["😞","😕","😐","😊","🤩"].map((em,i)=>(
                  <button key={i} onClick={()=>setPostFeel(i+1)} style={{fontSize:24,background:postFeel===i+1?"rgba(0,255,204,0.2)":"transparent",border:postFeel===i+1?"2px solid #00ffcc":"2px solid transparent",borderRadius:8,padding:"4px 6px",cursor:"pointer"}}>
                    {em}
                  </button>
                ))}
              </div>
              <button style={btnStyle("#00ffcc","#000",{width:"100%",marginTop:0,fontSize:14,opacity:postFeel===0?0.4:1})} onClick={submitResult} disabled={submitting||postFeel===0}>
                {submitting?"Saving to Freewheeler…":"💾 Save to Freewheeler"}
              </button>
            </>
          ):(
            <div style={{color:"#00cc44",fontSize:14,fontWeight:"bold",marginTop:12}}>✓ Saved to Freewheeler!</div>
          )}
        </div>
      )}

      {ranks[0]?.isPlayer&&<div style={{color:"#ffdd00",fontSize:18,fontWeight:"bold"}}>🏆 YOU WIN! Amazing ride!</div>}
      <div style={{display:"flex",gap:12,marginTop:16}}>
        <button style={btnStyle("#00bbff","#000")} onClick={()=>{setRanks([]);setRaceResult(null);setSubmitted(false);setPostFeel(0);setPhase("trackSelect");}}>↺ Race Again</button>
        <button style={btnStyle("#0a1a2a")} onClick={()=>navigate("/dashboard")}>Dashboard</button>
      </div>
    </div>
  );

  // ── Race (Three.js canvas) ─────────────────────────────────────────────────
  return (
    <div style={{width:"100%",height:"100vh",background:"#030a19",position:"relative",overflow:"hidden"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%"}} />
      <canvas ref={minimapRef} width={MAP_W} height={MAP_H}
        style={{position:"absolute",bottom:20,right:20,borderRadius:10,pointerEvents:"none",boxShadow:"0 0 18px rgba(0,0,0,0.7)"}}
      />
      {/* Touch controls */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <button style={{position:"absolute",bottom:38,left:20,width:86,height:86,borderRadius:"50%",background:"rgba(0,187,255,0.2)",border:"2.5px solid rgba(0,187,255,0.55)",color:"#fff",fontSize:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"all",touchAction:"none",userSelect:"none"}} {...mkTouch("left")}>◀</button>
        <button style={{position:"absolute",bottom:38,left:126,width:86,height:86,borderRadius:"50%",background:"rgba(0,187,255,0.2)",border:"2.5px solid rgba(0,187,255,0.55)",color:"#fff",fontSize:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"all",touchAction:"none",userSelect:"none"}} {...mkTouch("right")}>▶</button>
        {(inputMode==="demo"||inputMode==="keyboard")&&(
          <button style={{position:"absolute",bottom:38,left:"50%",transform:"translateX(-50%)",width:120,height:86,borderRadius:18,background:inputMode==="demo"?"rgba(255,160,0,0.25)":"rgba(0,255,140,0.18)",border:`2.5px solid ${inputMode==="demo"?"rgba(255,160,0,0.6)":"rgba(0,255,140,0.45)"}`,color:"#fff",fontSize:13,fontWeight:"bold",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,pointerEvents:"all",touchAction:"none",userSelect:"none",fontFamily:M}} {...mkTouch("accel")}>
            <span style={{fontSize:28}}>🚲</span>
            <span style={{letterSpacing:2}}>{inputMode==="demo"?"PEDAL":"GO"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
