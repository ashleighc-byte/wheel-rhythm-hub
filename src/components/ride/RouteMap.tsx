/**
 * RouteMap — Leaflet/OpenStreetMap map showing the route polyline and an
 * animated rider marker.  Uses Option B (hand-placed key waypoints).
 * To upgrade to Option A, replace each route's `waypoints` array with a
 * real GPX/GeoJSON polyline — this component needs no changes.
 */
import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Route } from "@/data/routes";
import { interpolateWaypoint } from "@/data/routes";

// ── Rider emoji icon (avoids the default Leaflet icon URL bug in Vite) ────────
const RIDER_ICON = L.divIcon({
  html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))">🚴</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 22],
  className: "",
});

// ── Sub-component: fit bounds on mount, then pan to follow the rider ──────────
function MapController({
  waypoints,
  riderPos,
  frac,
}: {
  waypoints: [number, number][];
  riderPos: [number, number];
  frac: number;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!fitted.current && waypoints.length > 1) {
      map.fitBounds(L.latLngBounds(waypoints as L.LatLngTuple[]), {
        padding: [28, 28],
        maxZoom: 15,
      });
      fitted.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the rider once they start moving
  useEffect(() => {
    if (frac > 0.005) {
      map.panTo(riderPos, { animate: true, duration: 0.6, easeLinearity: 0.4 });
    }
  }, [map, riderPos[0], riderPos[1], frac]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface RouteMapProps {
  route: Route;
  distanceRiddenKm: number;
}

export default function RouteMap({ route, distanceRiddenKm }: RouteMapProps) {
  const frac = Math.min(distanceRiddenKm / route.distance_km, 1);
  const riderPos = interpolateWaypoint(route.waypoints, frac);

  // Stable initial centre — midpoint of the route
  const initialCenter = useMemo<[number, number]>(
    () => route.waypoints[Math.floor(route.waypoints.length / 2)] ?? [
      -38.5, 176.0,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.id],
  );

  return (
    <div className="overflow-hidden border-[2px] border-secondary shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ height: 260, width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Full route polyline */}
        <Polyline
          positions={route.waypoints as L.LatLngTuple[]}
          pathOptions={{ color: "#4ade80", weight: 5, opacity: 0.85 }}
        />

        {/* Rider marker */}
        <Marker position={riderPos as L.LatLngTuple} icon={RIDER_ICON} />

        <MapController
          waypoints={route.waypoints}
          riderPos={riderPos}
          frac={frac}
        />
      </MapContainer>

      {/* Minimal attribution below the map */}
      <p className="bg-card px-2 py-0.5 text-right font-body text-[9px] text-muted-foreground">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
      </p>
    </div>
  );
}
