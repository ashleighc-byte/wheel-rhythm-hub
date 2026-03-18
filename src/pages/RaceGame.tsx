/**
 * RaceGame.tsx — Cycle Cup v6
 * ─────────────────────────────────────────────────────────────────
 * TWO MODES:
 *
 *  🚴 SESSION MODE  (primary — replaces MyWhoosh)
 *     Student pedals for a full session (default 30 min).
 *     Track loops continuously. Points earned every lap.
 *     Live HUD: time remaining, laps, distance, avg watts, cadence.
 *     FTMS resistance changes with elevation every lap, just like MyWhoosh.
 *     Auto-saves full session to Airtable on finish.
 *     A steady "pacer" bike rides alongside for motivation.
 *
 *  🏁 CHALLENGE MODE  (secondary — fun / competitive)
 *     3-lap race vs 3 CPU opponents.
 *     Same as before.
 *
 * DROP INTO LOVABLE:
 *   1. src/pages/RaceGame.tsx          ← this file
 *   2. src/components/AvatarSetup.tsx  ← avatar creator (separate file)
 *   3. App.tsx: add route /race (see INSTALL.md)
 *   4. npm install three @avaturn/sdk
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchStudents,
  createSessionReflection,
  updateSessionReflection,
  callAirtable,
} from "@/lib/airtable";
import { recordSessionPoints } from "@/lib/points";
import { calculateSessionPoints, getLevelName } from "@/lib/gamification";
import { toast } from "@/hooks/use-toast";
import AvatarSetup from "@/components/AvatarSetup";

// ─── FTMS ──────────────────────────────────────────────────────────
const FTMS_SVC       = "00001826-0000-1000-8000-00805f9b34fb";
const BIKE_DATA_CHAR = "00002ad2-0000-1000-8000-00805f9b34fb";
const FTMS_CP_CHAR   = "00002ad9-0000-1000-8000-00805f9b34fb";

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
async function requestFTMSControl(cp: any) {
  try { await cp.writeValue(new Uint8Array([0x00]).buffer); } catch (_) {}
}
async function setFTMSGrade(cp: any, grade: number) {
  const buf = new ArrayBuffer(7);
  const dv  = new DataView(buf);
  dv.setUint8(0, 0x11);
  dv.setInt16(1, 0, true);
  dv.setInt16(3, Math.round(grade * 100), true);
  dv.setUint8(5, 4);
  dv.setUint8(6, 51);
  try { await cp.writeValue(buf); } catch (_) {}
}

// ─── Tracks ────────────────────────────────────────────────────────
interface TrackProfile {
  id: string; name: string; emoji: string; description: string;
  gradeProfile: number[];
  avgElevationM: number; ptsMultiplier: number; cpuSpeedMult: number;
  skyColor: number; fogColor: number; groundColor: number;
  difficultyLabel: string; difficultyColor: string; accentColor: string;
  // Session mode: per-lap point bonus
  lapBonusPts: number;
}
const TRACKS: TrackProfile[] = [
  { id:"flat",     name:"Flat City Circuit",  emoji:"🏙️",
    description:"Smooth roads, zero elevation. Great for building cadence.",
    gradeProfile:[0,0,0,0,0,0,0,0,0,0], avgElevationM:0,   ptsMultiplier:1.0,
    cpuSpeedMult:1.00, lapBonusPts:3,
    skyColor:0x77bbdd, fogColor:0x99ddee, groundColor:0x33aa22,
    difficultyLabel:"EASY",    difficultyColor:"#00cc44", accentColor:"#00eeff" },
  { id:"hills",    name:"Rolling Hills",       emoji:"🌄",
    description:"Gentle 3–4% climbs. Resistance increases on the way up.",
    gradeProfile:[1,3,4,3,1,0,2,4,3,1], avgElevationM:55,  ptsMultiplier:1.2,
    cpuSpeedMult:0.92, lapBonusPts:5,
    skyColor:0x88cc99, fogColor:0xaaddbb, groundColor:0x44aa33,
    difficultyLabel:"MEDIUM",  difficultyColor:"#ffaa00", accentColor:"#ffdd00" },
  { id:"mountain", name:"Mountain Pass",       emoji:"⛰️",
    description:"Steep 6–9% climbs. Legs will burn — earns 1.5× points.",
    gradeProfile:[2,5,8,7,4,1,6,9,6,2], avgElevationM:120, ptsMultiplier:1.5,
    cpuSpeedMult:0.82, lapBonusPts:8,
    skyColor:0x9999cc, fogColor:0xbbbbdd, groundColor:0x558833,
    difficultyLabel:"HARD",    difficultyColor:"#ff7700", accentColor:"#ff9900" },
  { id:"alpine",   name:"Alpine Challenge",    emoji:"🏔️",
    description:"Brutal 10–12% gradients. Maximum effort — earns 2× points!",
    gradeProfile:[3,7,10,12,8,3,9,12,10,5], avgElevationM:220, ptsMultiplier:2.0,
    cpuSpeedMult:0.72, lapBonusPts:12,
    skyColor:0x7788bb, fogColor:0x8899cc, groundColor:0x667755,
    difficultyLabel:"EXTREME", difficultyColor:"#ff2244", accentColor:"#ff4466" },
];
function gradeAtT(profile: number[], t: number) {
  const n=profile.length, sc=t*n, i=Math.floor(sc)%n, frac=sc-Math.floor(sc);
  return profile[i]*(1-frac)+profile[(i+1)%n]*frac;
}

// ─── Session durations a teacher can choose ────────────────────────
const SESSION_DURATIONS = [
  { label: "10 min",  secs: 600  },
  { label: "20 min",  secs: 1200 },
  { label: "30 min",  secs: 1800 },
  { label: "45 min",  secs: 2700 },
];
const DEFAULT_SESSION_SECS = 1800; // 30 minutes

// ─── Game constants ────────────────────────────────────────────────
const TRACK_HW=5, NS=280;
const CPU_NAMES=["Bolt","Zippy","Turbo"];
const CPU_COLS=[0xff4422,0x33cc55,0xcc44ff];
const CPU_BASE_SPD=[9.2,10.8,12.4];
const PACER_SPEED = 8.5; // pacer in session mode — steady and beatable
const P_MAX_SPD=16, BOOST_SPD=26, BOOST_DUR=2.2;
const ACCEL=13, DECEL=20, COAST_FRIC=9, STEER_SPD=2.8;
const BOOST_TS=[0.1,0.28,0.5,0.72,0.9];
const ITEM_TS=[0.06,0.19,0.35,0.44,0.58,0.67,0.81,0.94];
const CHALLENGE_LAPS = 3;
const DEMO_RPM=75, CAM_HEIGHT=2.05, CAM_FOV=72, LOOK_AHEAD=18, LOOK_DOWN=0.28;
const MAP_W=155, MAP_H=125, MX0=-65, MX1=65, MZ0=-40, MZ1=40;
const toMX=(x:number)=>((x-MX0)/(MX1-MX0))*(MAP_W-16)+8;
const toMZ=(z:number)=>((z-MZ0)/(MZ1-MZ0))*(MAP_H-16)+8;
const PLAYER_COL=0x00bbff;
const ITEMS=[
  {id:"boost",label:"⚡ BOOST",color:"#ffee00",dur:2.5,speed:BOOST_SPD,cpuSlow:false},
  {id:"nitro",label:"🔵 NITRO",color:"#00aaff",dur:4.0,speed:BOOST_SPD*1.15,cpuSlow:false},
  {id:"slipstream",label:"💨 SLIP",color:"#00ffaa",dur:3.5,speed:BOOST_SPD*0.85,cpuSlow:false},
  {id:"headwind",label:"🌀 WIND",color:"#ff6600",dur:3.0,speed:0,cpuSlow:true},
];

const fmtTime=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
const fmtMins=(s:number)=>{
  const m=Math.floor(s/60),sec=Math.floor(s%60);
  return sec>0?`${m}m ${sec}s`:`${m}m`;
};

// ─── Three.js helpers ───────────────────────────────────────────────
function makeCurve(){
  const p:THREE.Vector3[]=[];
  for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2;p.push(new THREE.Vector3(Math.cos(a)*52+Math.sin(2*a)*8,0,Math.sin(a)*34));}
  return new THREE.CatmullRomCurve3(p,true,"catmullrom",0.5);
}
function sampleCurve(c:THREE.CatmullRomCurve3){
  return Array.from({length:NS},(_,i)=>{
    const t=i/NS,pos=c.getPoint(t),tan=c.getTangent(t).normalize();
    return{pos,tan,right:new THREE.Vector3().crossVectors(tan,new THREE.Vector3(0,1,0)).normalize()};
  });
}
type Smp=ReturnType<typeof sampleCurve>;
function roadGeo(s:Smp){const N=s.length,v:number[]=[],idx:number[]=[];s.forEach(({pos,right})=>{const L=pos.clone().addScaledVector(right,-TRACK_HW),R=pos.clone().addScaledVector(right,TRACK_HW);v.push(L.x,0.01,L.z,R.x,0.01,R.z);});for(let i=0;i<N;i++){const a=i*2,b=((i+1)%N)*2;idx.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function kerbGeo(s:Smp,sg:number){const N=s.length,v:number[]=[],idx:number[]=[];s.forEach(({pos,right})=>{const I=pos.clone().addScaledVector(right,sg*TRACK_HW),O=pos.clone().addScaledVector(right,sg*(TRACK_HW+1.2));v.push(I.x,0.04,I.z,O.x,0.04,O.z);});for(let i=0;i<N;i++){const a=i*2,b=((i+1)%N)*2;idx.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}

function mkBoxBike(col:number){
  const g=new THREE.Group(),B=new THREE.MeshLambertMaterial({color:col}),D=new THREE.MeshLambertMaterial({color:0x111122}),Sk=new THREE.MeshLambertMaterial({color:0xffcc88});
  const box=(w:number,h:number,d:number,m:THREE.MeshLambertMaterial,x:number,y:number,z:number)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);g.add(mesh);return mesh;};
  box(0.28,0.5,1.0,B,0,0.56,0);box(0.70,0.1,0.14,D,0,0.96,-0.42);box(0.35,0.5,0.32,B,0,1.12,0.06);
  box(0.26,0.26,0.26,Sk,0,1.52,-0.08);box(0.30,0.18,0.30,B,0,1.67,-0.08);box(0.18,0.4,0.14,D,0,0.35,0);
  const wG=new THREE.CylinderGeometry(0.33,0.33,0.12,10);
  const fw=new THREE.Mesh(wG,D);fw.rotation.z=Math.PI/2;fw.position.set(0,0.33,-0.49);g.add(fw);
  const rw=new THREE.Mesh(wG,D);rw.rotation.z=Math.PI/2;rw.position.set(0,0.33,0.49);g.add(rw);
  g.scale.setScalar(0.88);g.userData={fw,rw};return g;
}

async function loadRPMAvatar(url:string):Promise<THREE.Group>{
  return new Promise((resolve,reject)=>{
    new GLTFLoader().load(url,(gltf)=>{
      const root=gltf.scene;
      const box=new THREE.Box3().setFromObject(root);
      root.position.y=-box.min.y;
      root.traverse(c=>{if((c as THREE.Mesh).isMesh){c.castShadow=true;}});
      const w=new THREE.Group();w.add(root);w.userData={fw:null,rw:null};resolve(w);
    },undefined,reject);
  });
}

function mkHandlebarRig(){
  const g=new THREE.Group(),metal=new THREE.MeshLambertMaterial({color:0x7799bb,emissive:0x112233}),dark=new THREE.MeshLambertMaterial({color:0x111122}),skin=new THREE.MeshLambertMaterial({color:0xd4956a}),glove=new THREE.MeshLambertMaterial({color:0x223355});
  const stem=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.18,0.055),metal);stem.position.set(0,0,-0.14);g.add(stem);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.60,0.055,0.055),metal);bar.position.set(0,0.065,-0.14);g.add(bar);
  [-0.26,0.26].forEach(x=>{const grip=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.075,0.15),dark);grip.position.set(x,0.065,-0.14);g.add(grip);});
  [-0.26,0.26].forEach((x,side)=>{const hand=new THREE.Group();const palm=new THREE.Mesh(new THREE.BoxGeometry(0.085,0.07,0.13),skin);hand.add(palm);for(let f=0;f<4;f++){const k=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.028,0.03),skin);k.position.set(-0.032+f*0.021,0.04,-0.05);hand.add(k);}const thumb=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.04,0.025),skin);thumb.position.set(side===0?-0.05:0.05,0.02,0.01);hand.add(thumb);const cuff=new THREE.Mesh(new THREE.BoxGeometry(0.092,0.05,0.07),glove);cuff.position.set(0,-0.035,0.05);hand.add(cuff);hand.position.set(x,0.062,-0.14);hand.rotation.x=-0.15;g.add(hand);});
  const fork=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.14,0.55),dark);fork.position.set(0,-0.18,-0.20);g.add(fork);
  g.position.set(0,-0.46,-0.48);g.scale.setScalar(0.72);return g;
}

// ─── Types ─────────────────────────────────────────────────────────
type GamePhase = "loading"|"avatar"|"modeSelect"|"trackSelect"|"race"|"results";
type InputMode = "keyboard"|"demo"|"ftms";
type GameType  = "session"|"challenge";

interface SessionStats {
  laps: number;
  distKm: number;
  durationSecs: number;
  avgWatts: number;
  maxWatts: number;
  avgCadence: number;
  totalPts: number;
  lapPts: number[];        // points per lap
  elevationM: number;
  track: TrackProfile;
}

interface ChallengeResult {
  position: number;
  timeSec: number;
  avgSpeedKph: number;
  distKm: number;
  ptsFinal: number;
  track: TrackProfile;
}

// ─── Component ─────────────────────────────────────────────────────
export default function RaceGame() {
  const navigate = useNavigate();
  const { user, nfcSession, loading: authLoading } = useAuth();

  const [phase,            setPhase]           = useState<GamePhase>("loading");
  const [inputMode,        setInputMode]        = useState<InputMode>("keyboard");
  const [gameType,         setGameType]         = useState<GameType>("session");
  const [selectedTrack,    setSelectedTrack]    = useState<TrackProfile>(TRACKS[0]);
  const [sessionDuration,  setSessionDuration]  = useState(DEFAULT_SESSION_SECS);
  const [riderName,        setRiderName]        = useState("");
  const [studentRecordId,  setStudentRecordId]  = useState<string|null>(null);
  const [prevPoints,       setPrevPoints]       = useState(0);
  const [avatarUrl,        setAvatarUrl]        = useState<string|null>(null);
  const [ftmsOk,           setFtmsOk]           = useState(false);
  const [liveStats,        setLiveStats]        = useState({cadence:0,power:0});

  // Results
  const [sessionStats,     setSessionStats]     = useState<SessionStats|null>(null);
  const [challengeResult,  setChallengeResult]  = useState<ChallengeResult|null>(null);
  const [ranks,            setRanks]            = useState<{pos:number;name:string;isPlayer:boolean;time:string}[]>([]);
  const [postFeel,         setPostFeel]         = useState(0);
  const [submitting,       setSubmitting]       = useState(false);
  const [submitted,        setSubmitted]        = useState(false);

  const mountRef      = useRef<HTMLDivElement>(null);
  const minimapRef    = useRef<HTMLCanvasElement>(null);
  const keysRef       = useRef<Record<string,boolean>>({});
  const touchRef      = useRef({left:false,right:false,accel:false});
  const ftmsLiveRef   = useRef({speed:0,cadence:0,power:0});
  const ftmsCPRef     = useRef<any>(null);
  const ftmsOkRef     = useRef(false);
  const lastGradeRef  = useRef(0);
  const gradeTimerRef = useRef(0);
  const modeRef       = useRef<InputMode>("keyboard");
  const avatarUrlRef  = useRef<string|null>(null);

  useEffect(()=>{modeRef.current=inputMode;},[inputMode]);
  useEffect(()=>{avatarUrlRef.current=avatarUrl;},[avatarUrl]);

  // ── Keys ────────────────────────────────────────────────────────
  useEffect(()=>{
    const dn=(e:KeyboardEvent)=>{keysRef.current[e.key]=true;if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();};
    const up=(e:KeyboardEvent)=>{keysRef.current[e.key]=false;};
    window.addEventListener("keydown",dn);window.addEventListener("keyup",up);
    return()=>{window.removeEventListener("keydown",dn);window.removeEventListener("keyup",up);};
  },[]);

  // ── Resolve rider ────────────────────────────────────────────────
  useEffect(()=>{
    if(authLoading)return;
    async function resolve(){
      let name="Rider",recId:string|null=null,pts=0,savedAvatar:string|null=null;
      if(nfcSession){
        name=nfcSession.firstName||nfcSession.fullName;recId=nfcSession.studentId;
      } else if(user?.email){
        try{
          const res=await fetchStudents(user.email);
          if(res.records.length>0){
            const rec=res.records[0];
            name=String(rec.fields["Full Name"]??user.email);recId=rec.id;
            savedAvatar=rec.fields["Avatar URL"]?String(rec.fields["Avatar URL"]):null;
            const sessions=await callAirtable("Session Reflections","GET",{filterByFormula:`FIND("${rec.id}",ARRAYJOIN({Student Registration}))`,maxRecords:"200"});
            pts=sessions.records.reduce((s:number,r:any)=>s+Number(r.fields["Points Earned"]||0),0);
          } else {name=user.email??name;}
        }catch(_){name=user.email??name;}
      } else {navigate("/auth");return;}
      setRiderName(name);setStudentRecordId(recId);setPrevPoints(pts);
      if(savedAvatar){setAvatarUrl(savedAvatar);setPhase("modeSelect");}
      else{setPhase("avatar");}
    }
    resolve();
  },[authLoading,user,nfcSession,navigate]);

  // ── FTMS ─────────────────────────────────────────────────────────
  const connectFTMS=useCallback(async()=>{
    try{
      const dev=await navigator.bluetooth.requestDevice({filters:[{services:[FTMS_SVC]}],optionalServices:[FTMS_SVC]});
      const srv=await dev.gatt!.connect();const svc=await srv.getPrimaryService(FTMS_SVC);
      const dataChr=await svc.getCharacteristic(BIKE_DATA_CHAR);await dataChr.startNotifications();
      dataChr.addEventListener("characteristicvaluechanged",(e:any)=>{const d=parseFTMS(e.target.value);ftmsLiveRef.current=d;setLiveStats({cadence:Math.round(d.cadence),power:Math.round(d.power)});});
      try{const cp=await svc.getCharacteristic(FTMS_CP_CHAR);await requestFTMSControl(cp);ftmsCPRef.current=cp;}catch(_){}
      ftmsOkRef.current=true;setFtmsOk(true);setInputMode("ftms");
      toast({title:"🚲 Smart bike connected!"});
    }catch(err:any){toast({title:"Bluetooth error",description:err.message,variant:"destructive"});}
  },[]);

  // ── Submit session to Airtable ───────────────────────────────────
  const submitSession=useCallback(async()=>{
    if(!sessionStats&&!challengeResult)return;
    setSubmitting(true);
    const nfcToken=nfcSession?.nfcToken;
    try{
      let fields:Record<string,any>;
      if(sessionStats){
        const{laps,distKm,durationSecs,avgWatts,avgCadence,totalPts,track,elevationM}=sessionStats;
        fields={
          "How did you feel before you jumped on the bike?":3,
          "How did you feel after your bike session today?":postFeel||4,
          "What did you enjoy or not enjoy about today's session?":
            `Cycle Cup Session – ${track.name} (${track.difficultyLabel}). `+
            `${laps} laps in ${fmtMins(durationSecs)}. `+
            `Avg ${Math.round(avgWatts)}W · ${Math.round(avgCadence)} rpm · ${Math.round(distKm*10)/10} km · ${totalPts} pts.`,
          "Points Earned":totalPts,
          "Session Data Table":JSON.stringify({
            distance_km:Math.round(distKm*10)/10,
            duration_hh_mm_ss:`0:${fmtTime(durationSecs)}`,
            speed_kmh:durationSecs>0?Math.round((distKm/durationSecs*3600)*10)/10:0,
            elevation_m:elevationM,
          }),
        };
      } else if(challengeResult){
        const{track,timeSec,avgSpeedKph,distKm,ptsFinal,position}=challengeResult;
        const posLabel=["1st","2nd","3rd","4th"][position-1]??`${position}th`;
        fields={
          "How did you feel before you jumped on the bike?":3,
          "How did you feel after your bike session today?":postFeel||4,
          "What did you enjoy or not enjoy about today's session?":
            `Cycle Cup Challenge – ${track.name}. Finished ${posLabel} in ${fmtTime(timeSec)}. `+
            `Avg ${Math.round(avgSpeedKph)} km/h · ${ptsFinal} pts.`,
          "Points Earned":ptsFinal,
          "Session Data Table":JSON.stringify({
            distance_km:Math.round(distKm*10)/10,
            duration_hh_mm_ss:`0:${fmtTime(timeSec)}`,
            speed_kmh:Math.round(avgSpeedKph*10)/10,
            elevation_m:track.avgElevationM,
          }),
        };
      } else return;

      if(studentRecordId)fields["Student Registration"]=[studentRecordId];
      else fields["Student Name"]=riderName;
      const pts=sessionStats?.totalPts??challengeResult?.ptsFinal??0;
      const res=await createSessionReflection(fields,nfcToken);
      const newId=res?.records?.[0]?.id;
      if(user?.id&&studentRecordId){try{await recordSessionPoints(user.id,studentRecordId,new Date().toISOString().slice(0,10));}catch(_){}}
      if(newId){try{await updateSessionReflection(newId,{"Points Earned":pts},nfcToken);}catch(_){}}
      setSubmitted(true);
      toast({title:`✅ Saved! +${pts} points added to Freewheeler`});
    }catch(err:any){toast({title:"Save failed",description:err.message,variant:"destructive"});}
    finally{setSubmitting(false);}
  },[sessionStats,challengeResult,riderName,studentRecordId,postFeel,user,nfcSession]);

  // ── Race engine ──────────────────────────────────────────────────
  useEffect(()=>{
    if(phase!=="race")return;
    const mount=mountRef.current;if(!mount)return;
    keysRef.current={};touchRef.current={left:false,right:false,accel:false};
    while(mount.firstChild)mount.removeChild(mount.firstChild);

    const track=selectedTrack,isSession=gameType==="session";
    const W=mount.clientWidth,H=mount.clientHeight;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(track.skyColor);
    scene.fog=new THREE.FogExp2(track.fogColor,0.005);
    const cam=new THREE.PerspectiveCamera(CAM_FOV,W/H,0.05,400);
    const ren=new THREE.WebGLRenderer({antialias:true});
    ren.setSize(W,H);ren.setPixelRatio(Math.min(devicePixelRatio,2));
    mount.appendChild(ren.domElement);
    scene.add(new THREE.AmbientLight(0xbbccdd,2.0));
    const sun=new THREE.DirectionalLight(0xfffaee,2.8);sun.position.set(60,120,80);scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x88ccff,0x446622,0.6));
    const gnd=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshLambertMaterial({color:track.groundColor}));
    gnd.rotation.x=-Math.PI/2;gnd.position.y=-0.05;scene.add(gnd);

    const curve=makeCurve(),smp=sampleCurve(curve),trackLen=curve.getLength();
    scene.add(new THREE.Mesh(roadGeo(smp),new THREE.MeshLambertMaterial({color:0x1e1e2e})));
    scene.add(new THREE.Mesh(kerbGeo(smp,1),new THREE.MeshLambertMaterial({color:0xff2244})));
    scene.add(new THREE.Mesh(kerbGeo(smp,-1),new THREE.MeshLambertMaterial({color:0xffffff})));
    for(let i=0;i<NS;i+=4){const s=smp[i],d=new THREE.Mesh(new THREE.PlaneGeometry(0.18,2.6),new THREE.MeshBasicMaterial({color:0xffee88}));d.rotation.x=-Math.PI/2;d.position.set(s.pos.x,0.02,s.pos.z);d.rotation.y=-Math.atan2(s.tan.x,s.tan.z);scene.add(d);}
    const s0=smp[0];for(let c=0;c<10;c++){const ck=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_HW*2/10,2.4),new THREE.MeshBasicMaterial({color:c%2===0?0xffffff:0x222222}));ck.rotation.x=-Math.PI/2;ck.position.set(s0.pos.x+s0.right.x*(TRACK_HW*2/10)*(c-4.5),0.03,s0.pos.z+s0.right.z*(TRACK_HW*2/10)*(c-4.5));ck.rotation.y=-Math.atan2(s0.tan.x,s0.tan.z);scene.add(ck);}

    const bpMeshes=BOOST_TS.map(bt=>{const si=Math.floor(bt*NS),s=smp[si];const pad=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_HW*1.5,3.2),new THREE.MeshBasicMaterial({color:0xffee00,transparent:true,opacity:0.8,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(s.pos.x,0.04,s.pos.z);pad.rotation.y=-Math.atan2(s.tan.x,s.tan.z);scene.add(pad);const arrow=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.7,0.5),new THREE.MeshBasicMaterial({color:0xff8800}));arrow.position.set(s.pos.x,1.0,s.pos.z);scene.add(arrow);return{t:bt,pad,arrow};});
    const ITEM_BOX_COLS=[0xffdd00,0x00aaff,0x00ffaa,0xff6600];
    const itemBoxes=ITEM_TS.map((it,ix)=>{const si=Math.floor(it*NS),s=smp[si];const outer=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),new THREE.MeshLambertMaterial({color:ITEM_BOX_COLS[ix%4],emissive:new THREE.Color(ITEM_BOX_COLS[ix%4]).multiplyScalar(0.3),transparent:true,opacity:0.9}));const inner=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),new THREE.MeshBasicMaterial({color:0xffffff}));const grp=new THREE.Group();grp.add(outer);grp.add(inner);grp.position.set(s.pos.x,1.4,s.pos.z);scene.add(grp);return{t:it,grp,alive:true,respawnAt:0};});

    const SCOL=[0xff5533,0x3388ff,0xffaa00,0xff44aa,0x00ccaa,0x8833ff,0xff8844,0x33aaff];
    const rng=(a:number,b:number)=>a+Math.random()*(b-a);
    for(let i=0;i<120;i++){const si=Math.floor((i/120)*NS),s=smp[si],side=i%2===0?1:-1,dist=rng(9,22),ox=s.pos.x+s.right.x*side*dist+rng(-3,3),oz=s.pos.z+s.right.z*side*dist+rng(-3,3);if(Math.random()>0.4){const th=rng(2,5+(track.avgElevationM*0.03));const tr=new THREE.Mesh(new THREE.BoxGeometry(0.5,th,0.5),new THREE.MeshLambertMaterial({color:0x774411}));const lf=new THREE.Mesh(new THREE.BoxGeometry(rng(2.5,4.5),rng(2,4),rng(2.5,4.5)),new THREE.MeshLambertMaterial({color:0x226622}));tr.position.set(ox,th/2,oz);lf.position.set(ox,th+1.2,oz);scene.add(tr);scene.add(lf);}else{const h=rng(5,14),w=rng(3,7),col=SCOL[i%SCOL.length];const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshLambertMaterial({color:col}));const r=new THREE.Mesh(new THREE.BoxGeometry(w+0.6,0.7,w+0.6),new THREE.MeshLambertMaterial({color:0x111122}));b.position.set(ox,h/2,oz);r.position.set(ox,h+0.35,oz);scene.add(b);scene.add(r);}}

    // Other bikes
    // Session: 1 pacer + 2 background riders for atmosphere
    // Challenge: 3 CPU racers
    const otherMeshes:{id:string,mesh:THREE.Group,t:number,speed:number,lane:number,lap:number,finished:boolean,ft:number}[]=[];

    if(isSession){
      // Pacer bike — steady speed, gives student something to chase
      const pacerMesh=mkBoxBike(0xffaa00);scene.add(pacerMesh);
      otherMeshes.push({id:"pacer",mesh:pacerMesh,t:0.05,speed:PACER_SPEED,lane:-0.3,lap:0,finished:false,ft:0});
      // Two background atmosphere riders
      [0.4,0.7].forEach((startT,i)=>{
        const atm=mkBoxBike(0x554466);scene.add(atm);
        otherMeshes.push({id:`atm${i}`,mesh:atm,t:startT,speed:rng(5,7),lane:rng(-0.6,0.6),lap:0,finished:false,ft:0});
      });
    } else {
      CPU_NAMES.forEach((name,i)=>{
        const bk=mkBoxBike(CPU_COLS[i]);scene.add(bk);
        otherMeshes.push({id:`c${i}`,mesh:bk,t:(i+1)*0.012,speed:CPU_BASE_SPD[i]*0.85*track.cpuSpeedMult,lane:[0.3,-0.4,0.55][i],lap:0,finished:false,ft:0});
      });
    }

    // Player mesh
    let playerMesh:THREE.Group=mkBoxBike(PLAYER_COL);
    playerMesh.visible=false;scene.add(playerMesh);
    const curAvatarUrl=avatarUrlRef.current;
    if(curAvatarUrl){
      loadRPMAvatar(curAvatarUrl).then(av=>{scene.remove(playerMesh);playerMesh=av;playerMesh.visible=false;scene.add(playerMesh);}).catch(()=>{});
    }
    const hbRig=mkHandlebarRig();cam.add(hbRig);scene.add(cam);

    // ── Player state ──────────────────────────────────────────────
    const player={
      t:0, lap:0, speed:0, lane:0,
      boostTimer:0, boostSpeed:BOOST_SPD,
      finished:false, ft:0,
      item:null as any, cpuSlowTimer:0,
      distTravelled:0,
      // Session tracking
      totalSessionPts:0,
      lapPts:[] as number[],
      powerSamples:[] as number[],
      cadenceSamples:[] as number[],
      sessionElapsed:0,       // seconds elapsed
      prevT:0,                // used for lap detection
    };

    const hudEl=document.createElement("div");hudEl.style.cssText="position:absolute;inset:0;pointer-events:none;font-family:'Courier New',monospace;";mount.appendChild(hudEl);

    let raceGo=false,raceOver=false,startTime=0,countdown=3,lastTS=0,raf=0,cdTO=0;
    let demoCadence=0,camBobPhase=0;
    const cdColors=["#ff4444","#ffaa00","#ffee00"];
    const ORDS=["1st","2nd","3rd","4th"];

    // Countdown
    const tick=()=>{
      if(countdown>0){
        hudEl.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:90px;font-weight:bold;color:${cdColors[3-countdown]};text-shadow:4px 4px 20px #000,0 0 50px ${cdColors[3-countdown]};font-family:'Courier New',monospace">${countdown}</div></div>`;
        countdown--;cdTO=window.setTimeout(tick,1000);
      } else {
        const goMsg=isSession?"RIDE!":"GO!";
        hudEl.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:90px;font-weight:bold;color:#00ff88;text-shadow:4px 4px 20px #000,0 0 60px #00ff88;font-family:'Courier New',monospace">${goMsg}</div></div>`;
        raceGo=true;startTime=performance.now();cdTO=window.setTimeout(()=>updateHUD(),900);
      }
    };
    cdTO=window.setTimeout(tick,600);

    // Challenge ranking
    function getChallengeRanked(){
      const all=[{id:"p",...player},...otherMeshes.map(o=>({id:o.id,t:o.t,lap:o.lap,finished:o.finished,ft:o.ft}))];
      return all.sort((a,b)=>{if(a.finished&&!b.finished)return-1;if(!a.finished&&b.finished)return 1;if(a.finished&&b.finished)return a.ft-b.ft;return(b.lap+b.t)-(a.lap+a.t);});
    }

    function updateHUD(){
      if(raceOver)return;
      const m=modeRef.current,fl=ftmsLiveRef.current;
      const spd=Math.round(player.speed*5.5);
      const curGrade=Math.round(gradeAtT(track.gradeProfile,player.t)*10)/10;
      const gradeBar=curGrade>0?`<div style="color:${track.accentColor};font-size:12px">▲ ${curGrade}% grade${ftmsOkRef.current?" · resistance active":""}</div>`:"";
      const mTag=m==="demo"?`<div style="color:#ffaa00;font-size:11px">🎮 ${Math.round(demoCadence)} rpm</div>`:m==="ftms"?`<div style="color:#00cc44;font-size:11px">🚴 ${fl.cadence|0} rpm · ${fl.power|0}W</div>`:`<div style="color:#9aabbc;font-size:11px">⌨️ hold ↑ to pedal</div>`;
      const itemHtml=player.item?`<div style="padding:3px 9px;background:rgba(0,0,0,0.5);border-radius:6px;color:${player.item.color};font-size:13px;font-weight:bold">${player.item.label}</div>`:"";
      const spdPct=Math.min(Math.round((player.speed/P_MAX_SPD)*18),18);
      const spdBar="█".repeat(spdPct)+"░".repeat(18-spdPct);

      if(isSession){
        // ── Session HUD ─────────────────────────────────────────
        const remaining=Math.max(0,sessionDuration-player.sessionElapsed);
        const distKm=Math.round(player.distTravelled/100)/10;
        const avgW=player.powerSamples.length>0?Math.round(player.powerSamples.reduce((a,b)=>a+b,0)/player.powerSamples.length):0;
        const lastLapPts=player.lapPts.length>0?player.lapPts[player.lapPts.length-1]:0;
        const urgentColor=remaining<120?"#ff4444":remaining<300?"#ffaa00":"#fff";
        const pacerData=otherMeshes.find(o=>o.id==="pacer");
        const pacerAhead=pacerData?(pacerData.t+pacerData.lap)>(player.t+player.lap):false;

        hudEl.innerHTML=`
          <!-- Top left: timer + session stats -->
          <div style="position:absolute;top:14px;left:16px;color:#fff;text-shadow:1px 1px 6px #000;line-height:2.0">
            <div style="font-size:38px;font-weight:bold;color:${urgentColor};letter-spacing:2px">${fmtTime(remaining)}</div>
            <div style="font-size:13px;color:#aabbcc">Lap <b>${player.lap+1}</b> · ${distKm} km</div>
            <div style="font-size:13px;color:${track.accentColor}">${avgW > 0 ? avgW+"W avg" : ""}</div>
            ${player.boostTimer>0?`<div style="color:#ffee00;font-size:16px;font-weight:bold">⚡ BOOST!</div>`:""}
            ${gradeBar}${mTag}${itemHtml}
          </div>
          <!-- Top right: points + laps -->
          <div style="position:absolute;top:14px;right:14px;text-align:right;text-shadow:1px 1px 4px #000">
            <div style="font-size:28px;font-weight:bold;color:#00ffcc">${player.totalSessionPts} pts</div>
            <div style="font-size:12px;color:#445566">${player.lapPts.length} laps complete</div>
            ${lastLapPts>0?`<div style="font-size:12px;color:#ffdd00">+${lastLapPts} last lap</div>`:""}
            ${pacerAhead?`<div style="font-size:11px;color:#ffaa00;margin-top:2px">🟠 Pacer ahead!</div>`:`<div style="font-size:11px;color:#00cc44;margin-top:2px">✓ Ahead of pacer</div>`}
          </div>
          <!-- Centre timer label -->
          <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px">SESSION</div>
          <!-- Speed bar bottom -->
          <div style="position:absolute;bottom:${window.innerWidth<700?170:22}px;left:50%;transform:translateX(-50%);text-align:center">
            <div style="font-size:20px;color:${player.boostTimer>0?"#ffee00":"rgba(255,255,255,0.75)"};text-shadow:1px 1px 4px #000">${spd} km/h</div>
            <div style="font-size:9px;color:rgba(0,200,255,0.45)">${spdBar}</div>
          </div>`;
      } else {
        // ── Challenge HUD ────────────────────────────────────────
        const ranked=getChallengeRanked();
        const pPos=ranked.findIndex(r=>r.id==="p")+1;
        const elapsed=((performance.now()-startTime)/1000).toFixed(1);
        hudEl.innerHTML=`
          <div style="position:absolute;top:14px;left:16px;color:#fff;text-shadow:1px 1px 6px #000;line-height:1.85">
            <div style="font-size:34px;font-weight:bold;color:${pPos===1?"#ffdd00":"#fff"}">${ORDS[pPos-1]||pPos+"th"}</div>
            <div style="font-size:15px">Lap <b>${Math.min(player.lap+1,CHALLENGE_LAPS)}</b> / ${CHALLENGE_LAPS}</div>
            <div style="font-size:11px;color:${track.accentColor}">${track.emoji} ${track.name}</div>
            ${player.boostTimer>0?`<div style="color:#ffee00;font-size:17px;font-weight:bold">⚡ BOOST!</div>`:""}
            ${gradeBar}${mTag}${itemHtml}
          </div>
          <div style="position:absolute;top:14px;right:14px;text-align:right;font-size:13px;line-height:2.0">
            ${ranked.map((r,i)=>`<div style="color:${r.id==="p"?"#00eeff":i===0?"#ffdd00":"#aabbcc"};font-weight:${r.id==="p"?"bold":"normal"};text-shadow:1px 1px 4px #000">${ORDS[i]} ${r.id==="p"?riderName:CPU_NAMES[+r.id[1]]??r.id}</div>`).join("")}
          </div>
          <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.8);font-size:14px;letter-spacing:2px;text-shadow:1px 1px 4px #000">${elapsed}s</div>
          <div style="position:absolute;bottom:${window.innerWidth<700?170:22}px;left:50%;transform:translateX(-50%);text-align:center">
            <div style="font-size:20px;color:${player.boostTimer>0?"#ffee00":"rgba(255,255,255,0.75)"};text-shadow:1px 1px 4px #000">${spd} km/h</div>
            <div style="font-size:9px;color:rgba(0,200,255,0.45)">${spdBar}</div>
          </div>`;
      }
    }

    function drawMinimap(ts:number){
      const cv=minimapRef.current;if(!cv)return;
      const ctx=cv.getContext("2d")!;ctx.clearRect(0,0,MAP_W,MAP_H);
      ctx.fillStyle="rgba(5,15,30,0.82)";ctx.roundRect(0,0,MAP_W,MAP_H,10);ctx.fill();
      ctx.strokeStyle="rgba(0,187,255,0.3)";ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();smp.forEach((s,i)=>{const mx=toMX(s.pos.x),mz=toMZ(s.pos.z);i===0?ctx.moveTo(mx,mz):ctx.lineTo(mx,mz);});ctx.closePath();
      ctx.strokeStyle="rgba(80,80,120,0.8)";ctx.lineWidth=5;ctx.stroke();
      BOOST_TS.forEach(bt=>{const si=Math.floor(bt*NS),s=smp[si];ctx.fillStyle="#ffee00";ctx.fillRect(toMX(s.pos.x)-3,toMZ(s.pos.z)-3,6,6);});
      itemBoxes.forEach(ib=>{if(!ib.alive)return;const si=Math.floor(ib.t*NS),s=smp[si];ctx.fillStyle="#fff";ctx.fillRect(toMX(s.pos.x)-2,toMZ(s.pos.z)-2,5,5);});
      otherMeshes.forEach((o,i)=>{const si=Math.floor(o.t*NS)%NS,s=smp[si];ctx.beginPath();ctx.arc(toMX(s.pos.x),toMZ(s.pos.z),o.id==="pacer"?5:4,0,Math.PI*2);ctx.fillStyle=o.id==="pacer"?"#ffaa00":["#ff5533","#33cc55","#cc44ff","#888888"][i%4];ctx.fill();});
      const psi=Math.floor(player.t*NS)%NS,ps=smp[psi],pulse=4+1.5*Math.sin(ts*0.008);
      ctx.beginPath();ctx.arc(toMX(ps.pos.x),toMZ(ps.pos.z),pulse,0,Math.PI*2);ctx.fillStyle="#00eeff";ctx.fill();
      ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle="rgba(0,187,255,0.7)";ctx.font="bold 9px monospace";
      ctx.fillText(riderName.split(" ")[0],toMX(ps.pos.x)+6,toMZ(ps.pos.z)+4);
    }

    // ── Lap complete popup ──────────────────────────────────────────
    let lapPopupTimeout=0;
    function showLapPopup(lap:number,pts:number){
      const popEl=document.createElement("div");
      popEl.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        text-align:center;pointer-events:none;z-index:99;animation:none;`;
      popEl.innerHTML=`
        <div style="font-size:28px;font-weight:bold;color:#00ffcc;font-family:'Courier New',monospace;
          text-shadow:0 0 20px #00ffcc,2px 2px 6px #000">
          ✓ LAP ${lap}
        </div>
        <div style="font-size:20px;color:#ffdd00;font-family:'Courier New',monospace;text-shadow:2px 2px 6px #000">
          +${pts} pts
        </div>`;
      mount.appendChild(popEl);
      clearTimeout(lapPopupTimeout);
      lapPopupTimeout=window.setTimeout(()=>{if(mount.contains(popEl))mount.removeChild(popEl);},2000);
    }

    // ── Main loop ───────────────────────────────────────────────────
    function loop(ts:number){
      raf=requestAnimationFrame(loop);
      const dt=Math.min((ts-(lastTS||ts))/1000,0.06);lastTS=ts;
      if(!raceGo||raceOver){ren.render(scene,cam);return;}

      const k=keysRef.current,tc=touchRef.current,m=modeRef.current;
      const accel=!!(k.ArrowUp||k.w||k.W||tc.accel),brake=!!(k.ArrowDown||k.s||k.S);
      const left=!!(k.ArrowLeft||k.a||k.A||tc.left),right=!!(k.ArrowRight||k.d||k.D||tc.right);

      // Session elapsed
      if(isSession) player.sessionElapsed=(performance.now()-startTime)/1000;

      // Grade + FTMS resistance
      const curGrade=gradeAtT(track.gradeProfile,player.t);
      if(ts-gradeTimerRef.current>2000&&Math.abs(curGrade-lastGradeRef.current)>0.4){
        lastGradeRef.current=curGrade;gradeTimerRef.current=ts;
        if(ftmsCPRef.current)setFTMSGrade(ftmsCPRef.current,curGrade);
      }

      if(!player.finished){
        const gradeSpeedMult=Math.max(1-(curGrade*0.035),0.4);
        const maxSpd=(player.boostTimer>0?player.boostSpeed:P_MAX_SPD)*gradeSpeedMult;

        if(m==="ftms"){
          const fl=ftmsLiveRef.current;
          const target=Math.min(fl.cadence*0.14+fl.power*0.018,player.boostTimer>0?player.boostSpeed:P_MAX_SPD);
          player.speed+=(target-player.speed)*Math.min(dt*3,1);
          if(fl.cadence<5&&fl.speed<0.5)player.speed=Math.max(player.speed-COAST_FRIC*dt,0);
          // Sample watts and cadence for session stats
          if(fl.power>0)player.powerSamples.push(fl.power);
          if(fl.cadence>0)player.cadenceSamples.push(fl.cadence);
        } else if(m==="demo"){
          demoCadence=accel?Math.min(demoCadence+70*dt,DEMO_RPM):Math.max(demoCadence-45*dt,0);
          const target=Math.min(demoCadence*0.14,maxSpd);
          player.speed+=(target-player.speed)*Math.min(dt*4,1);
          if(brake)player.speed=Math.max(player.speed-DECEL*dt,0);
        } else {
          if(accel)player.speed=Math.min(player.speed+ACCEL*dt,maxSpd);
          else if(brake)player.speed=Math.max(player.speed-DECEL*dt,0);
          else player.speed=Math.max(player.speed-COAST_FRIC*dt,0);
        }

        if(player.boostTimer>0){player.boostTimer-=dt;if(m!=="ftms")player.speed=Math.min(player.speed+ACCEL*dt*1.5,player.boostSpeed);}
        if(player.cpuSlowTimer>0)player.cpuSlowTimer-=dt;

        if(left)player.lane=Math.max(player.lane-STEER_SPD*dt,-0.88);
        else if(right)player.lane=Math.min(player.lane+STEER_SPD*dt,0.88);
        else player.lane+=(-player.lane)*3.5*dt;

        player.distTravelled+=player.speed*dt;
        player.prevT=player.t;
        player.t+=(player.speed*dt)/trackLen;

        // Lap detection
        if(player.t>=1){
          player.t-=1;player.lap++;

          if(isSession){
            // Award per-lap points
            const lapPts=Math.round(track.lapBonusPts*track.ptsMultiplier);
            player.lapPts.push(lapPts);
            player.totalSessionPts+=lapPts;
            showLapPopup(player.lap,lapPts);
          } else {
            // Challenge: check finish
            if(player.lap>=CHALLENGE_LAPS&&!player.finished){
              player.finished=true;player.ft=performance.now()-startTime;
              endChallenge();
            }
          }
        }

        // Session time up
        if(isSession&&player.sessionElapsed>=sessionDuration&&!player.finished){
          player.finished=true;
          endSession();
        }

        // Boost pads
        if(player.boostTimer<=0){for(const bt of BOOST_TS){const d=Math.abs(player.t-bt);if(d<0.015||d>1-0.015){player.boostTimer=BOOST_DUR;player.boostSpeed=BOOST_SPD;break;}}}
        // Items
        for(const ib of itemBoxes){if(!ib.alive)continue;const d=Math.abs(player.t-ib.t);if(d<0.016||d>1-0.016){ib.alive=false;ib.grp.visible=false;ib.respawnAt=ts+8000;const item=ITEMS[Math.floor(Math.random()*ITEMS.length)];player.item=item;if(item.speed>0){player.boostTimer=item.dur;player.boostSpeed=item.speed;}if(item.cpuSlow)player.cpuSlowTimer=item.dur;break;}}
        for(const ib of itemBoxes){if(!ib.alive&&ts>ib.respawnAt){ib.alive=true;ib.grp.visible=true;}}

        if(player.speed>0.5)camBobPhase+=player.speed*dt*2.8;
      }

      // Other bikes
      const cpuSlowed=player.cpuSlowTimer>0;
      otherMeshes.forEach((o,ci)=>{
        if(o.finished)return;
        let spd=o.speed;
        if(o.id==="pacer"){
          // Pacer maintains steady pace — no variance
          spd=PACER_SPEED;
        } else if(!isSession){
          const v=0.88+0.14*Math.sin(ts*0.001+ci*1.9),bl=1;
          const sl=cpuSlowed?0.65:1;
          const cg=Math.max(1-gradeAtT(track.gradeProfile,o.t)*0.025,0.5);
          spd=o.speed*v*bl*sl*cg;
        } else {
          // Atmosphere riders meander gently
          spd=o.speed*0.9;
        }
        o.t+=(spd*dt)/trackLen;
        if(o.t>=1){o.t-=1;o.lap++;
          if(!isSession&&o.lap>=CHALLENGE_LAPS&&!o.finished){o.finished=true;o.ft=performance.now()-startTime;}
        }
        if(o.id!=="pacer")o.lane=0.5*Math.sin(ts*0.0006+ci*2.1);
        const si=Math.floor(o.t*NS)%NS,s=smp[si],lat=o.lane*TRACK_HW*0.72;
        o.mesh.position.set(s.pos.x+s.right.x*lat,0,s.pos.z+s.right.z*lat);
        o.mesh.rotation.y=-Math.atan2(s.tan.x,s.tan.z);o.mesh.rotation.z=-o.lane*0.18;
        const{fw,rw}=o.mesh.userData;if(fw)fw.rotation.x+=spd*dt*3.5;if(rw)rw.rotation.x+=spd*dt*3.5;
      });

      // POV camera
      const psi=Math.floor(player.t*NS)%NS,ps=smp[psi],lat=player.lane*TRACK_HW*0.72;
      const bobY=player.speed>0.5?Math.sin(camBobPhase)*0.04:0;
      cam.position.set(ps.pos.x+ps.right.x*lat,CAM_HEIGHT+bobY,ps.pos.z+ps.right.z*lat);
      const li=(psi+LOOK_AHEAD)%NS,ls=smp[li];
      cam.lookAt(ls.pos.x+ls.right.x*player.lane*TRACK_HW*0.35,CAM_HEIGHT-LOOK_DOWN+bobY*0.3,ls.pos.z+ls.right.z*player.lane*TRACK_HW*0.35);
      cam.rotation.z+=-player.lane*0.035;
      hbRig.rotation.y=player.lane*0.14;hbRig.rotation.x=(player.speed/P_MAX_SPD)*-0.03;

      bpMeshes.forEach(bp=>{bp.pad.material.opacity=0.55+0.3*Math.sin(ts*0.006);bp.arrow.rotation.y+=dt*3;bp.arrow.position.y=0.8+0.28*Math.sin(ts*0.005);});
      itemBoxes.forEach(ib=>{if(!ib.alive)return;ib.grp.rotation.y+=dt*1.8;ib.grp.rotation.x+=dt*0.9;ib.grp.position.y=1.2+0.35*Math.sin(ts*0.003+ib.t*10);});

      drawMinimap(ts);updateHUD();ren.render(scene,cam);
    }

    function endSession(){
      raceOver=true;
      if(ftmsCPRef.current)setFTMSGrade(ftmsCPRef.current,0);
      hudEl.innerHTML+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)"><div style="text-align:center;font-family:'Courier New',monospace"><div style="font-size:52px;font-weight:bold;color:#00ffcc;text-shadow:4px 4px 14px #000">🏁 SESSION COMPLETE!</div><div style="font-size:22px;color:#ffdd00;margin-top:8px">+${player.totalSessionPts} points</div></div></div>`;
      const avgW=player.powerSamples.length>0?Math.round(player.powerSamples.reduce((a,b)=>a+b,0)/player.powerSamples.length):0;
      const avgC=player.cadenceSamples.length>0?Math.round(player.cadenceSamples.reduce((a,b)=>a+b,0)/player.cadenceSamples.length):0;
      const distKm=player.distTravelled/1000;
      const ptsBase=calculateSessionPoints({duration_minutes:player.sessionElapsed/60,distance_km:distKm,elevation_m:track.avgElevationM*(player.lap+1),avg_speed_kmh:distKm/(player.sessionElapsed/3600)||0});
      const finalPts=Math.max(player.totalSessionPts,Math.round(ptsBase*track.ptsMultiplier));
      setTimeout(()=>{
        setSessionStats({laps:player.lap,distKm,durationSecs:player.sessionElapsed,avgWatts:avgW,maxWatts:player.powerSamples.length>0?Math.max(...player.powerSamples):0,avgCadence:avgC,totalPts:finalPts,lapPts:player.lapPts,elevationM:track.avgElevationM*(player.lap+1),track});
        setPhase("results");
      },2800);
    }

    function endChallenge(){
      raceOver=true;
      if(ftmsCPRef.current)setFTMSGrade(ftmsCPRef.current,0);
      hudEl.innerHTML+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)"><div style="font-size:52px;font-weight:bold;color:#ffdd00;text-shadow:4px 4px 14px #000;font-family:'Courier New',monospace">🏁 FINISHED!</div></div>`;
      const ranked=getChallengeRanked();
      const position=ranked.findIndex(r=>r.id==="p")+1;
      const timeSec=player.ft/1000;
      const distKm=player.distTravelled/1000;
      const avgSpeedKph=timeSec>0?(distKm/timeSec)*3600:0;
      const ptsBase=calculateSessionPoints({duration_minutes:timeSec/60,distance_km:distKm,elevation_m:track.avgElevationM,avg_speed_kmh:avgSpeedKph});
      const ptsFinal=Math.round(ptsBase*track.ptsMultiplier)+([15,10,5,2][position-1]??0);
      setTimeout(()=>{
        setChallengeResult({position,timeSec,avgSpeedKph,distKm,ptsFinal,track});
        setRanks(ranked.map((r,i)=>({pos:i+1,name:r.id==="p"?riderName:CPU_NAMES[+r.id[1]]??r.id,isPlayer:r.id==="p",time:r.finished?(r.ft/1000).toFixed(2):"—"})));
        setPhase("results");
      },2600);
    }

    raf=requestAnimationFrame(loop);
    const onResize=()=>{cam.aspect=mount.clientWidth/mount.clientHeight;cam.updateProjectionMatrix();ren.setSize(mount.clientWidth,mount.clientHeight);};
    window.addEventListener("resize",onResize);
    return()=>{clearTimeout(cdTO);clearTimeout(lapPopupTimeout);cancelAnimationFrame(raf);window.removeEventListener("resize",onResize);ren.dispose();while(mount.firstChild)mount.removeChild(mount.firstChild);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase,selectedTrack,gameType,sessionDuration,riderName]);

  // ── Touch handlers ──────────────────────────────────────────────
  const mkTouch=(key:string)=>({
    onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();(touchRef.current as any)[key]=true;},
    onPointerUp:(e:React.PointerEvent)=>{e.preventDefault();(touchRef.current as any)[key]=false;},
    onPointerLeave:(e:React.PointerEvent)=>{e.preventDefault();(touchRef.current as any)[key]=false;},
    onPointerCancel:(e:React.PointerEvent)=>{e.preventDefault();(touchRef.current as any)[key]=false;},
  });

  // ── Shared styles ────────────────────────────────────────────────
  const M=`"Courier New",monospace`;
  const OV:React.CSSProperties={position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(2,8,20,0.96)",fontFamily:M,overflowY:"auto",padding:"20px 12px"};
  const btn=(bg:string,fg:string="#fff",ex:React.CSSProperties={})=>({padding:"11px 20px",marginTop:9,fontSize:14,fontWeight:"bold" as const,background:bg,color:fg,border:"none",fontFamily:M,cursor:"pointer",borderRadius:6,letterSpacing:2,...ex});
  const podiumCols=["#ffdd00","#cccccc","#cc7722","#778899"];
  const newPts=sessionStats?.totalPts??challengeResult?.ptsFinal??0;

  // ── Loading ──────────────────────────────────────────────────────
  if(phase==="loading")return(<div style={{...OV,gap:12}}><div style={{color:"#00bbff",fontSize:13,letterSpacing:4}}>🚲 CYCLE CUP</div><div style={{color:"#1a2e3e",fontSize:11}}>Loading…</div></div>);

  // ── Avatar ───────────────────────────────────────────────────────
  if(phase==="avatar")return(<div style={{width:"100%",height:"100vh",position:"relative",overflow:"hidden",background:"#030a19"}}><AvatarSetup studentRecordId={studentRecordId} existingUrl={avatarUrl} onDone={(url)=>{setAvatarUrl(url);setPhase("modeSelect");}} onSkip={()=>setPhase("modeSelect")}/></div>);

  // ── Mode Select ──────────────────────────────────────────────────
  if(phase==="modeSelect")return(
    <div style={OV}>
      <div style={{fontSize:10,color:"#00ffcc",letterSpacing:6,marginBottom:4}}>FREE WHEELER LEAGUE</div>
      <h1 style={{fontSize:48,margin:"0 0 4px",fontFamily:M,background:"linear-gradient(135deg,#00bbff,#00ffcc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:3,lineHeight:1.05}}>CYCLE CUP</h1>

      {/* Rider card */}
      <div style={{display:"flex",alignItems:"center",gap:10,border:"1px solid #00bbff33",borderRadius:10,padding:"10px 16px",marginBottom:18,background:"rgba(0,187,255,0.06)"}}>
        <div style={{width:46,height:46,borderRadius:"50%",border:"2px solid #334455",background:"#0a1a2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🚲</div>
        <div><div style={{color:"#00eeff",fontSize:14,fontWeight:"bold"}}>🚲 {riderName}</div><div style={{color:"#00ffcc",fontSize:11,marginTop:1}}>{getLevelName(prevPoints)} · {prevPoints} pts</div></div>
        <button onClick={()=>setPhase("avatar")} style={btn("transparent","#334455",{marginTop:0,fontSize:11,padding:"4px 10px",border:"1px solid #0a1e33"})}>{avatarUrl?"Change Avatar":"Create Avatar"}</button>
      </div>

      {/* Mode cards */}
      <div style={{width:340,marginBottom:16}}>
        <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:4,marginBottom:10}}>SELECT MODE</div>

        {/* Session Mode */}
        <div onClick={()=>setGameType("session")} style={{padding:"14px 16px",marginBottom:8,borderRadius:10,cursor:"pointer",background:gameType==="session"?"rgba(0,255,204,0.1)":"rgba(255,255,255,0.02)",border:`2px solid ${gameType==="session"?"#00ffcc":"#0a1e33"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:gameType==="session"?"#00ffcc":"#889aaa",fontWeight:"bold",fontSize:15}}>🚴 Session Ride</span>
            <span style={{color:"#00ffcc",fontSize:10,fontWeight:"bold",border:"1px solid #00ffcc44",padding:"2px 8px",borderRadius:4}}>PRIMARY</span>
          </div>
          <div style={{color:"#1a2a3a",fontSize:12,marginTop:4,lineHeight:1.6}}>
            Ride for a full session — track loops continuously.<br/>
            Points earned every lap. Auto-saves to Freewheeler.<br/>
            A pacer bike keeps you company. 🟠
          </div>
          {gameType==="session"&&(
            <div style={{marginTop:10}}>
              <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:3,marginBottom:6}}>SESSION LENGTH</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {SESSION_DURATIONS.map(d=>(
                  <button key={d.secs} onClick={(e)=>{e.stopPropagation();setSessionDuration(d.secs);}} style={{padding:"6px 14px",fontSize:12,fontWeight:"bold",background:sessionDuration===d.secs?"#00ffcc":"rgba(0,255,204,0.08)",color:sessionDuration===d.secs?"#000":"#00ffcc",border:`1px solid ${sessionDuration===d.secs?"#00ffcc":"#0a2233"}`,borderRadius:6,cursor:"pointer",fontFamily:M}}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Challenge Mode */}
        <div onClick={()=>setGameType("challenge")} style={{padding:"14px 16px",marginBottom:8,borderRadius:10,cursor:"pointer",background:gameType==="challenge"?"rgba(255,221,0,0.08)":"rgba(255,255,255,0.02)",border:`2px solid ${gameType==="challenge"?"#ffdd00":"#0a1e33"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:gameType==="challenge"?"#ffdd00":"#889aaa",fontWeight:"bold",fontSize:15}}>🏁 Challenge Race</span>
            <span style={{color:"#ffaa00",fontSize:10,fontWeight:"bold",border:"1px solid #ffaa0044",padding:"2px 8px",borderRadius:4}}>FUN MODE</span>
          </div>
          <div style={{color:"#1a2a3a",fontSize:12,marginTop:4,lineHeight:1.6}}>
            3-lap race vs Bolt, Zippy & Turbo.<br/>
            ~2–3 mins. First across the line wins!
          </div>
        </div>
      </div>

      {/* Track select */}
      <div style={{width:340,marginBottom:12}}>
        <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:4,marginBottom:8}}>CHOOSE TRACK</div>
        {TRACKS.map(tr=>(
          <div key={tr.id} onClick={()=>setSelectedTrack(tr)} style={{padding:"10px 14px",marginBottom:6,borderRadius:8,cursor:"pointer",background:selectedTrack.id===tr.id?"rgba(0,187,255,0.12)":"rgba(255,255,255,0.02)",border:`2px solid ${selectedTrack.id===tr.id?"#00bbff":"#0a1e33"}`,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{tr.emoji}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:selectedTrack.id===tr.id?"#00bbff":"#889aaa",fontWeight:"bold",fontSize:13}}>{tr.name}</span>
                <span style={{color:tr.difficultyColor,fontSize:10,border:`1px solid ${tr.difficultyColor}44`,padding:"1px 6px",borderRadius:4}}>{tr.difficultyLabel}</span>
              </div>
              <div style={{display:"flex",gap:10,marginTop:2,fontSize:11}}>
                <span style={{color:"#334455"}}>📈 {tr.avgElevationM}m</span>
                <span style={{color:tr.accentColor}}>×{tr.ptsMultiplier} pts</span>
                {gameType==="session"&&<span style={{color:"#00ffcc"}}>+{tr.lapBonusPts} per lap</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input mode + bike */}
      <div style={{width:340,border:"1px solid #0a1e33",borderRadius:8,padding:"12px 14px",marginBottom:12,background:"rgba(0,187,255,0.03)"}}>
        <div style={{color:"#2a3a4a",fontSize:9,letterSpacing:4,marginBottom:8}}>INPUT MODE</div>
        {[{id:"keyboard",l:"⌨️ Keyboard",d:"Hold ↑ to go"},{id:"demo",l:"🎮 Demo",d:"Simulates pedalling"},...(ftmsOk?[{id:"ftms",l:"🚴 Smart Bike",d:"Just pedal!"}]:[])].map(o=>(
          <div key={o.id} onClick={()=>setInputMode(o.id as InputMode)} style={{padding:"7px 11px",marginBottom:4,borderRadius:6,cursor:"pointer",background:inputMode===o.id?"rgba(0,187,255,0.14)":"rgba(255,255,255,0.02)",border:`1px solid ${inputMode===o.id?"#00bbff":"#0a1e33"}`}}>
            <span style={{color:inputMode===o.id?"#00bbff":"#556677",fontWeight:"bold",fontSize:13}}>{inputMode===o.id?"✓ ":"  "}{o.l}</span>
            <span style={{color:"#1a2a3a",fontSize:11,marginLeft:8}}>{o.d}</span>
          </div>
        ))}
        <button style={btn("#0a1a2a","#334455",{width:"100%",marginTop:6,fontSize:11})} onClick={connectFTMS} disabled={ftmsOk}>
          {ftmsOk?`✓ Bike linked · ${liveStats.cadence} rpm · ${liveStats.power}W`:"🔗 Link Smart Bike (FTMS Bluetooth)"}
        </button>
        {ftmsOk&&selectedTrack.avgElevationM>0&&<div style={{color:"#00cc44",fontSize:11,marginTop:5,textAlign:"center"}}>✓ Resistance changes automatically with track grade</div>}
      </div>

      <button style={btn("#00bbff","#000",{fontSize:18,padding:"14px 52px"})} onClick={()=>setPhase("race")}>
        {gameType==="session"?"🚴 START RIDING":"🏁 RACE!"}
      </button>
      <button style={btn("transparent","#223344",{fontSize:11,marginTop:6})} onClick={()=>navigate("/dashboard")}>← Dashboard</button>
    </div>
  );

  // ── Results ──────────────────────────────────────────────────────
  if(phase==="results")return(
    <div style={OV}>
      {/* ── SESSION RESULTS ──────────────────────────────────── */}
      {sessionStats&&(
        <>
          <div style={{fontSize:10,color:"#00ffcc",letterSpacing:5,marginBottom:6}}>🏁 SESSION COMPLETE</div>
          <div style={{border:"1px solid #00ffcc44",borderRadius:14,padding:"20px 24px",marginBottom:14,width:340,background:"rgba(0,255,204,0.05)",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#00ffcc",letterSpacing:4,marginBottom:10}}>YOUR RIDE</div>

            {/* Big stats row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {v:`${sessionStats.laps}`,l:"LAPS"},
                {v:`${Math.round(sessionStats.distKm*10)/10} km`,l:"DISTANCE"},
                {v:fmtMins(sessionStats.durationSecs),l:"TIME"},
                {v:`${sessionStats.avgWatts}W`,l:"AVG WATTS"},
                {v:`${sessionStats.avgCadence}`,l:"AVG RPM"},
                {v:`${Math.round(sessionStats.elevationM)}m`,l:"ELEVATION"},
              ].map(({v,l})=>(
                <div key={l} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 6px"}}>
                  <div style={{color:"#00ffcc",fontSize:20,fontWeight:"bold"}}>{v||"—"}</div>
                  <div style={{color:"#334455",fontSize:9,letterSpacing:2,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Points */}
            <div style={{fontSize:38,fontWeight:"bold",color:"#00ffcc",textShadow:"0 0 20px #00ffcc"}}>{sessionStats.totalPts} pts</div>
            <div style={{fontSize:13,color:"#334455",marginTop:3}}>{prevPoints} → <span style={{color:"#00eeff",fontWeight:"bold"}}>{prevPoints+sessionStats.totalPts}</span> total</div>
            {getLevelName(prevPoints)!==getLevelName(prevPoints+sessionStats.totalPts)&&(
              <div style={{marginTop:8,padding:"6px 14px",background:"rgba(255,221,0,0.15)",border:"1px solid #ffdd0055",borderRadius:8,color:"#ffdd00",fontWeight:"bold",fontSize:13}}>🎉 Level Up → {getLevelName(prevPoints+sessionStats.totalPts)}</div>
            )}

            {/* Lap breakdown */}
            {sessionStats.lapPts.length>0&&(
              <div style={{marginTop:12,fontSize:11,color:"#334455"}}>
                {sessionStats.lapPts.map((pts,i)=>`Lap ${i+1}: +${pts}`).join("  ·  ")}
              </div>
            )}

            {/* Feel + save */}
            {!submitted?(
              <>
                <div style={{fontSize:11,color:"#2a3a4a",marginTop:14,marginBottom:8}}>How do you feel after that session?</div>
                <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>
                  {["😞","😕","😐","😊","🤩"].map((em,i)=>(
                    <button key={i} onClick={()=>setPostFeel(i+1)} style={{fontSize:24,background:postFeel===i+1?"rgba(0,255,204,0.2)":"transparent",border:postFeel===i+1?"2px solid #00ffcc":"2px solid transparent",borderRadius:8,padding:"4px 6px",cursor:"pointer"}}>{em}</button>
                  ))}
                </div>
                <button style={btn("#00ffcc","#000",{width:"100%",marginTop:0,fontSize:14,opacity:postFeel===0?0.4:1})} onClick={submitSession} disabled={submitting||postFeel===0}>
                  {submitting?"Saving to Freewheeler…":"💾 Save to Freewheeler"}
                </button>
              </>
            ):<div style={{color:"#00cc44",fontSize:14,fontWeight:"bold",marginTop:12}}>✓ Saved to Freewheeler! Points on leaderboard.</div>}
          </div>
        </>
      )}

      {/* ── CHALLENGE RESULTS ────────────────────────────────── */}
      {challengeResult&&(
        <>
          <div style={{fontSize:10,color:"#ffdd00",letterSpacing:5,marginBottom:6}}>🏁 RACE COMPLETE</div>
          <div style={{width:340,marginBottom:12}}>
            {ranks.map((r,i)=>(
              <div key={r.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",marginBottom:7,background:r.isPlayer?"rgba(0,187,255,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${r.isPlayer?"#00bbff":"#0a1e33"}`,borderRadius:6}}>
                <span style={{fontSize:17,fontWeight:"bold",color:podiumCols[i],minWidth:56}}>{["1st 🥇","2nd 🥈","3rd 🥉","4th 🎖"][i]}</span>
                <span style={{fontSize:14,color:r.isPlayer?"#00eeff":"#99aabb",fontWeight:r.isPlayer?"bold":"normal"}}>{r.isPlayer?"🚲 ":""}{r.name}</span>
                <span style={{fontSize:12,color:"#223344"}}>{r.time!=="—"?`${r.time}s`:"—"}</span>
              </div>
            ))}
          </div>
          <div style={{border:`1px solid ${challengeResult.track.accentColor}44`,borderRadius:12,padding:"16px 20px",marginBottom:12,width:340,background:"rgba(0,255,204,0.04)",textAlign:"center"}}>
            <div style={{display:"flex",justifyContent:"space-around",marginBottom:8}}>
              <div><div style={{fontSize:30,fontWeight:"bold",color:"#00ffcc"}}>{challengeResult.ptsFinal}</div><div style={{fontSize:10,color:"#334455"}}>EARNED</div></div>
              <div><div style={{fontSize:30,fontWeight:"bold",color:challengeResult.track.accentColor}}>×{challengeResult.track.ptsMultiplier}</div><div style={{fontSize:10,color:"#334455"}}>{challengeResult.track.difficultyLabel}</div></div>
              <div><div style={{fontSize:30,fontWeight:"bold",color:"#aabbcc"}}>{prevPoints+newPts}</div><div style={{fontSize:10,color:"#334455"}}>NEW TOTAL</div></div>
            </div>
            {getLevelName(prevPoints)!==getLevelName(prevPoints+newPts)&&<div style={{padding:"6px 14px",background:"rgba(255,221,0,0.15)",border:"1px solid #ffdd0055",borderRadius:8,color:"#ffdd00",fontWeight:"bold",fontSize:13,marginBottom:8}}>🎉 Level Up → {getLevelName(prevPoints+newPts)}</div>}
            {!submitted?(
              <>
                <div style={{fontSize:11,color:"#2a3a4a",marginBottom:8}}>How do you feel?</div>
                <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:10}}>
                  {["😞","😕","😐","😊","🤩"].map((em,i)=>(
                    <button key={i} onClick={()=>setPostFeel(i+1)} style={{fontSize:22,background:postFeel===i+1?"rgba(0,255,204,0.2)":"transparent",border:postFeel===i+1?"2px solid #00ffcc":"2px solid transparent",borderRadius:8,padding:"4px 6px",cursor:"pointer"}}>{em}</button>
                  ))}
                </div>
                <button style={btn("#00ffcc","#000",{width:"100%",marginTop:0,fontSize:14,opacity:postFeel===0?0.4:1})} onClick={submitSession} disabled={submitting||postFeel===0}>
                  {submitting?"Saving…":"💾 Save to Freewheeler"}
                </button>
              </>
            ):<div style={{color:"#00cc44",fontSize:14,fontWeight:"bold",marginTop:8}}>✓ Saved!</div>}
          </div>
          {ranks[0]?.isPlayer&&<div style={{color:"#ffdd00",fontSize:18,fontWeight:"bold"}}>🏆 YOU WIN!</div>}
        </>
      )}

      <div style={{display:"flex",gap:12,marginTop:14}}>
        <button style={btn("#00bbff","#000")} onClick={()=>{setSessionStats(null);setChallengeResult(null);setRanks([]);setSubmitted(false);setPostFeel(0);setPhase("modeSelect");}}>↺ Ride Again</button>
        <button style={btn("#0a1a2a")} onClick={()=>navigate("/dashboard")}>Dashboard</button>
      </div>
    </div>
  );

  // ── Race canvas ──────────────────────────────────────────────────
  return(
    <div style={{width:"100%",height:"100vh",background:"#030a19",position:"relative",overflow:"hidden"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
      <canvas ref={minimapRef} width={MAP_W} height={MAP_H} style={{position:"absolute",bottom:20,right:20,borderRadius:10,pointerEvents:"none",boxShadow:"0 0 18px rgba(0,0,0,0.7)"}}/>
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
