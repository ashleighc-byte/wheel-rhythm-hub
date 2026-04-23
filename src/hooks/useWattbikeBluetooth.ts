import { useState, useRef, useCallback } from "react";

// ── Minimal Web Bluetooth type declarations ───────────────────────────────────
interface BLECharacteristic extends EventTarget {
  startNotifications(): Promise<BLECharacteristic>;
  stopNotifications(): Promise<BLECharacteristic>;
  value?: DataView;
}
interface BLEService {
  getCharacteristic(uuid: number | string): Promise<BLECharacteristic>;
}
interface BLEServer {
  connected: boolean;
  connect(): Promise<BLEServer>;
  disconnect(): void;
  getPrimaryService(uuid: number | string): Promise<BLEService>;
}
interface BLEDevice extends EventTarget {
  name?: string;
  gatt?: BLEServer;
}
interface WebBluetooth {
  requestDevice(options: {
    filters?: Array<{ services?: (number | string)[] }>;
    optionalServices?: (number | string)[];
    acceptAllDevices?: boolean;
  }): Promise<BLEDevice>;
}
declare global {
  interface Navigator { bluetooth?: WebBluetooth; }
}

// ── FTMS UUIDs ────────────────────────────────────────────────────────────────
const FTMS_SERVICE = 0x1826;
const INDOOR_BIKE_DATA = 0x2AD2;

// ── Public types ──────────────────────────────────────────────────────────────
export type BluetoothStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'riding'
  | 'disconnected'
  | 'error'
  | 'unsupported';

export interface LiveMetrics {
  speed: number;      // km/h
  cadence: number;    // rpm
  power: number;      // watts
  distance: number;   // km (cumulative since connect)
  heartRate: number;  // bpm (0 if not available)
}

export interface SessionSummary {
  duration_minutes: number;
  distance_km: number;
  avg_speed_kmh: number;
  avg_power_watts: number;
}

export interface UseWattbikeBluetoothReturn {
  status: BluetoothStatus;
  deviceName: string;
  metrics: LiveMetrics;
  sessionSummary: SessionSummary | null;
  error: string;
  isSupported: boolean;
  connect: () => Promise<void>;
  startRide: () => void;
  endRide: () => SessionSummary;
  disconnect: () => void;
}

// ── Indoor Bike Data packet parser ────────────────────────────────────────────
function parseIndoorBikeData(dv: DataView): Partial<LiveMetrics> {
  if (dv.byteLength < 2) return {};
  const flags = dv.getUint16(0, true);
  let offset = 2;
  const result: Partial<LiveMetrics> = {};

  // Bit 0 (More Data): 0 = Instantaneous Speed present
  if ((flags & 0x01) === 0 && offset + 2 <= dv.byteLength) {
    result.speed = dv.getUint16(offset, true) / 100;
    offset += 2;
  }
  // Bit 1: Average Speed present — skip
  if (flags & 0x02) offset += 2;
  // Bit 2: Instantaneous Cadence present
  if (flags & 0x04 && offset + 2 <= dv.byteLength) {
    result.cadence = dv.getUint16(offset, true) / 2;
    offset += 2;
  }
  // Bit 3: Average Cadence — skip
  if (flags & 0x08) offset += 2;
  // Bit 4: Total Distance (uint24, metres)
  if (flags & 0x10 && offset + 3 <= dv.byteLength) {
    const lo = dv.getUint8(offset);
    const mid = dv.getUint8(offset + 1);
    const hi = dv.getUint8(offset + 2);
    result.distance = (lo | (mid << 8) | (hi << 16)) / 1000;
    offset += 3;
  }
  // Bit 5: Resistance Level — skip
  if (flags & 0x20) offset += 2;
  // Bit 6: Instantaneous Power (sint16, watts)
  if (flags & 0x40 && offset + 2 <= dv.byteLength) {
    result.power = dv.getInt16(offset, true);
    offset += 2;
  }
  // Bit 7: Average Power — skip
  if (flags & 0x80) offset += 2;
  // Bit 8: Expended Energy (5 bytes) — skip
  if (flags & 0x100) offset += 5;
  // Bit 9: Heart Rate (uint8, bpm)
  if (flags & 0x200 && offset + 1 <= dv.byteLength) {
    result.heartRate = dv.getUint8(offset);
    offset += 1;
  }

  return result;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
const ZERO_METRICS: LiveMetrics = { speed: 0, cadence: 0, power: 0, distance: 0, heartRate: 0 };

export function useWattbikeBluetooth(): UseWattbikeBluetoothReturn {
  const [status, setStatus] = useState<BluetoothStatus>('idle');
  const [deviceName, setDeviceName] = useState('');
  const [metrics, setMetrics] = useState<LiveMetrics>(ZERO_METRICS);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState('');

  const deviceRef = useRef<BLEDevice | null>(null);
  const charRef = useRef<BLECharacteristic | null>(null);
  const rideStartRef = useRef<number | null>(null);
  const distanceStartRef = useRef<number>(0);

  // Running averages
  const speedSumRef = useRef(0);
  const powerSumRef = useRef(0);
  const sampleCountRef = useRef(0);
  const peakDistanceRef = useRef(0);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleDisconnect = useCallback(() => {
    setStatus('disconnected');
    charRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError("Web Bluetooth isn't supported in this browser. Use Chrome on a Chromebook or Android device.");
      setStatus('unsupported');
      return;
    }
    setError('');
    setStatus('connecting');
    setMetrics(ZERO_METRICS);
    setSessionSummary(null);
    speedSumRef.current = 0;
    powerSumRef.current = 0;
    sampleCountRef.current = 0;
    peakDistanceRef.current = 0;

    try {
      const bluetooth = navigator.bluetooth!;
      const device = await bluetooth.requestDevice({
        filters: [{ services: [FTMS_SERVICE] }],
        optionalServices: [FTMS_SERVICE],
      });
      deviceRef.current = device;
      setDeviceName(device.name ?? 'Wattbike');
      device.addEventListener('gattserverdisconnected', handleDisconnect);

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(FTMS_SERVICE);
      const char = await service.getCharacteristic(INDOOR_BIKE_DATA);
      charRef.current = char;

      char.addEventListener('characteristicvaluechanged', (e: Event) => {
        const val = (e.target as BLECharacteristic).value;
        if (!val) return;
        const parsed = parseIndoorBikeData(val);

        setMetrics(prev => {
          const next: LiveMetrics = {
            speed:    parsed.speed    ?? prev.speed,
            cadence:  parsed.cadence  ?? prev.cadence,
            power:    parsed.power    ?? prev.power,
            distance: parsed.distance !== undefined
              ? Math.max(0, parsed.distance - distanceStartRef.current)
              : prev.distance,
            heartRate: parsed.heartRate ?? prev.heartRate,
          };

          if (rideStartRef.current !== null) {
            speedSumRef.current += next.speed;
            powerSumRef.current += next.power;
            sampleCountRef.current += 1;
            if (next.distance > peakDistanceRef.current) {
              peakDistanceRef.current = next.distance;
            }
          }

          return next;
        });
      });

      await char.startNotifications();
      setStatus('connected');
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.message?.includes('cancelled')) {
        setStatus('idle');
      } else {
        setError(err?.message ?? 'Connection failed');
        setStatus('error');
      }
    }
  }, [isSupported, handleDisconnect]);

  const startRide = useCallback(() => {
    rideStartRef.current = Date.now();
    // Record the current distance as the baseline so we start from 0
    setMetrics(prev => {
      distanceStartRef.current = prev.distance + distanceStartRef.current;
      return { ...prev, distance: 0 };
    });
    speedSumRef.current = 0;
    powerSumRef.current = 0;
    sampleCountRef.current = 0;
    peakDistanceRef.current = 0;
    setStatus('riding');
  }, []);

  const endRide = useCallback((): SessionSummary => {
    const durationMs = rideStartRef.current ? Date.now() - rideStartRef.current : 0;
    const duration_minutes = Math.round((durationMs / 60000) * 10) / 10;
    const samples = sampleCountRef.current || 1;
    const avg_speed_kmh = Math.round((speedSumRef.current / samples) * 10) / 10;
    const avg_power_watts = Math.round(powerSumRef.current / samples);
    const distance_km = Math.round(peakDistanceRef.current * 100) / 100;

    const summary: SessionSummary = {
      duration_minutes,
      distance_km,
      avg_speed_kmh,
      avg_power_watts,
    };
    setSessionSummary(summary);
    setStatus('connected');
    rideStartRef.current = null;
    return summary;
  }, []);

  const disconnect = useCallback(() => {
    try { charRef.current?.stopNotifications(); } catch { /* ignore */ }
    try { deviceRef.current?.gatt?.disconnect(); } catch { /* ignore */ }
    charRef.current = null;
    deviceRef.current = null;
    setStatus('idle');
    setDeviceName('');
    setMetrics(ZERO_METRICS);
  }, []);

  return {
    status,
    deviceName,
    metrics,
    sessionSummary,
    error,
    isSupported,
    connect,
    startRide,
    endRide,
    disconnect,
  };
}
