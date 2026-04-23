import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Flag, StopCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWattbikeBluetooth } from "@/hooks/useWattbikeBluetooth";
import BluetoothConnect from "@/components/ride/BluetoothConnect";
import RouteSelector from "@/components/ride/RouteSelector";
import LiveMetricsDisplay from "@/components/ride/LiveMetrics";
import ElevationProfile from "@/components/ride/ElevationProfile";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import { getElevationForDistance, type Route } from "@/data/routes";
import logoSrc from "@/assets/fw-logo-oval.png";

type Stage = 'pre-ride' | 'riding' | 'complete';

export default function RidePage() {
  const { nfcSession, user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('pre-ride');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    duration_minutes: number;
    distance_km: number;
    avg_speed_kmh: number;
    avg_power_watts: number;
    elevation_m: number;
    courseMap: string;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ble = useWattbikeBluetooth();
  const isConnected = ble.status === 'connected' || ble.status === 'riding';
  const riderName = nfcSession?.firstName ?? user?.email?.split('@')[0] ?? 'Rider';

  // Tick timer while riding
  useEffect(() => {
    if (stage === 'riding') {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  const handleStartRide = () => {
    ble.startRide();
    setElapsedSeconds(0);
    setStage('riding');
  };

  const handleEndRide = () => {
    const summary = ble.endRide();
    const elevation_m = selectedRoute
      ? getElevationForDistance(selectedRoute, summary.distance_km)
      : 0;
    setCompletedSummary({
      ...summary,
      elevation_m,
      courseMap: selectedRoute?.name ?? '',
    });
    setStage('complete');
    setShowEndConfirm(false);
  };

  const handleFeedbackClose = (open: boolean) => {
    setShowFeedback(open);
    if (!open) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b-[3px] border-secondary bg-card shadow-[0_3px_0px_hsl(var(--brand-dark))]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/tap" className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex flex-1 items-center justify-center">
            <Link to="/">
              <img src={logoSrc} alt="Freewheeler" className="h-10 object-contain" />
            </Link>
          </div>
          <span className="font-display text-sm uppercase tracking-wider text-muted-foreground w-16 text-right">
            {riderName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── Pre-ride: Route + BLE connect ── */}
          {stage === 'pre-ride' && (
            <motion.div
              key="pre-ride"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                  Ready to Ride, {riderName}?
                </h1>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                  Choose your route and connect your Wattbike, then hit Start.
                </p>
              </div>

              {/* Step 1: Route */}
              <section>
                <h2 className="mb-3 font-display text-sm uppercase tracking-wider text-foreground">
                  1 — Choose a Route
                </h2>
                <RouteSelector selected={selectedRoute} onSelect={setSelectedRoute} />
              </section>

              {/* Step 2: Bluetooth */}
              <section>
                <h2 className="mb-3 font-display text-sm uppercase tracking-wider text-foreground">
                  2 — Connect Your Bike
                </h2>
                <BluetoothConnect
                  status={ble.status}
                  deviceName={ble.deviceName}
                  error={ble.error}
                  isSupported={ble.isSupported}
                  onConnect={ble.connect}
                  onDisconnect={ble.disconnect}
                />
              </section>

              {/* Start */}
              <Button
                onClick={handleStartRide}
                disabled={!selectedRoute || !isConnected}
                className="tape-element-green w-full py-5 font-display text-lg uppercase tracking-wider gap-2"
              >
                <Flag className="h-5 w-5" />
                Start Ride
              </Button>

              {!ble.isSupported && (
                <p className="text-center font-body text-sm text-muted-foreground">
                  On an iPad?{" "}
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="underline text-foreground"
                  >
                    Log manually instead
                  </button>
                </p>
              )}
            </motion.div>
          )}

          {/* ── Riding ── */}
          {stage === 'riding' && (
            <motion.div
              key="riding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xs uppercase tracking-wider text-primary">
                    Ride in Progress
                  </p>
                  {selectedRoute && (
                    <p className="font-body text-sm text-muted-foreground">
                      {selectedRoute.emoji} {selectedRoute.name}
                    </p>
                  )}
                </div>
              </div>

              <LiveMetricsDisplay metrics={ble.metrics} elapsedSeconds={elapsedSeconds} />

              {selectedRoute && (
                <ElevationProfile
                  route={selectedRoute}
                  distanceRiddenKm={ble.metrics.distance}
                />
              )}

              {/* End ride */}
              {!showEndConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowEndConfirm(true)}
                  className="w-full border-[2px] border-destructive font-display uppercase tracking-wider text-destructive hover:bg-destructive/10 gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  End Ride
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-[3px] border-destructive bg-destructive/10 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="font-body text-sm text-foreground">
                      Are you sure? Your ride data will be saved.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleEndRide}
                      className="flex-1 bg-destructive font-display uppercase tracking-wider text-white hover:bg-destructive/90"
                    >
                      Yes, End Ride
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEndConfirm(false)}
                      className="flex-1 border-2 border-secondary font-display uppercase tracking-wider"
                    >
                      Keep Going
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Complete ── */}
          {stage === 'complete' && completedSummary && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280 }}
              className="space-y-6 text-center"
            >
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
                >
                  <CheckCircle className="h-10 w-10 text-primary" />
                </motion.div>
                <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                  Ride Complete!
                </h1>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                  Great effort, {riderName}. Log your ride to bank your points.
                </p>
              </div>

              {/* Summary card */}
              <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] text-left">
                <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
                  Ride Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Distance", value: `${completedSummary.distance_km} km` },
                    { label: "Duration", value: `${Math.round(completedSummary.duration_minutes)} min` },
                    { label: "Avg Speed", value: `${completedSummary.avg_speed_kmh} km/h` },
                    { label: "Elevation", value: `${completedSummary.elevation_m} m` },
                    { label: "Avg Power", value: `${completedSummary.avg_power_watts} W` },
                    { label: "Route", value: completedSummary.courseMap || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-display text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                      <p className="font-display text-xl text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setShowFeedback(true)}
                className="tape-element-green w-full py-5 font-display text-lg uppercase tracking-wider"
              >
                Log This Ride + Earn Points
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full border-2 border-secondary font-display uppercase tracking-wider"
              >
                Skip to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Feedback form — receives pre-filled data from BLE */}
      <SessionFeedbackForm
        open={showFeedback}
        onOpenChange={handleFeedbackClose}
        prefilledData={completedSummary ? {
          distance_km: completedSummary.distance_km,
          duration_minutes: completedSummary.duration_minutes,
          avg_speed_kmh: completedSummary.avg_speed_kmh,
          elevation_m: completedSummary.elevation_m,
          avg_power_watts: completedSummary.avg_power_watts,
          courseMap: completedSummary.courseMap,
          rideSource: 'bluetooth',
        } : undefined}
      />
    </div>
  );
}
