import { motion } from "framer-motion";
import { MapPin, TrendingUp, Ruler } from "lucide-react";
import { ROUTES, type Route } from "@/data/routes";

const DIFFICULTY_CONFIG = {
  flat: { label: "Flat", colour: "bg-blue-100 text-blue-700 border-blue-300" },
  rolling: { label: "Rolling", colour: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  hilly: { label: "Hilly", colour: "bg-red-100 text-red-700 border-red-300" },
};

interface RouteSelectorProps {
  selected: Route | null;
  onSelect: (route: Route) => void;
}

export default function RouteSelector({ selected, onSelect }: RouteSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROUTES.map(route => {
          const isSelected = selected?.id === route.id;
          const diff = DIFFICULTY_CONFIG[route.difficulty];
          return (
            <motion.button
              key={route.id}
              type="button"
              onClick={() => onSelect(route)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left border-[3px] p-4 transition-all shadow-[3px_3px_0px_hsl(var(--brand-dark))] ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-secondary bg-card hover:border-primary/60'
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-2xl leading-none">{route.emoji}</span>
                <span className={`border px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${diff.colour}`}>
                  {diff.label}
                </span>
              </div>
              <p className="font-display text-sm uppercase tracking-wider text-foreground leading-tight">
                {route.name}
              </p>
              <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-1">
                {route.description}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Ruler className="h-3 w-3" />
                  {route.distance_km} km
                </span>
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {route.elevation_m} m
                </span>
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {route.region}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
