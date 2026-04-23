import { Bluetooth, BluetoothConnected, BluetoothOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BluetoothStatus } from "@/hooks/useWattbikeBluetooth";

interface BluetoothConnectProps {
  status: BluetoothStatus;
  deviceName: string;
  error: string;
  isSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const STATUS_CONFIG = {
  idle: { icon: Bluetooth, label: "Connect Wattbike", colour: "text-muted-foreground", bg: "bg-muted" },
  connecting: { icon: Loader2, label: "Connecting…", colour: "text-primary", bg: "bg-primary/10" },
  connected: { icon: BluetoothConnected, label: "Connected", colour: "text-green-600", bg: "bg-green-50" },
  riding: { icon: BluetoothConnected, label: "Connected", colour: "text-green-600", bg: "bg-green-50" },
  disconnected: { icon: BluetoothOff, label: "Disconnected — tap to reconnect", colour: "text-destructive", bg: "bg-destructive/10" },
  error: { icon: AlertCircle, label: "Connection failed", colour: "text-destructive", bg: "bg-destructive/10" },
  unsupported: { icon: BluetoothOff, label: "Bluetooth not supported", colour: "text-muted-foreground", bg: "bg-muted" },
};

export default function BluetoothConnect({
  status, deviceName, error, isSupported, onConnect, onDisconnect,
}: BluetoothConnectProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const isConnected = status === 'connected' || status === 'riding';
  const isConnecting = status === 'connecting';
  const canConnect = !isConnected && !isConnecting && isSupported;

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-3 border-[2px] border-secondary px-4 py-3 ${cfg.bg}`}>
        <Icon className={`h-5 w-5 flex-shrink-0 ${cfg.colour} ${isConnecting ? 'animate-spin' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className={`font-display text-sm uppercase tracking-wider ${cfg.colour}`}>
            {isConnected && deviceName ? deviceName : cfg.label}
          </p>
          {isConnected && (
            <p className="font-body text-xs text-muted-foreground">via Bluetooth FTMS</p>
          )}
        </div>
        {isConnected && (
          <button
            type="button"
            onClick={onDisconnect}
            className="font-body text-xs text-muted-foreground underline hover:text-foreground"
          >
            Disconnect
          </button>
        )}
      </div>

      {canConnect && (
        <Button
          type="button"
          variant="outline"
          onClick={onConnect}
          className="w-full border-[2px] border-secondary font-display uppercase tracking-wider gap-2"
        >
          <Bluetooth className="h-4 w-4" />
          Connect Wattbike
        </Button>
      )}

      {!isSupported && (
        <p className="font-body text-xs text-muted-foreground">
          Web Bluetooth needs Chrome on a Chromebook or Android.
          Use <strong>Log Manually</strong> if you're on an iPad.
        </p>
      )}

      {error && status === 'error' && (
        <p className="font-body text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
