import { motion } from "framer-motion";
import { Bike, MapPin } from "lucide-react";

const riders = [
  { rank: 1, name: "Sarah Martinez", school: "Lincoln High", rides: 156, miles: 782 },
  { rank: 2, name: "Jake Thompson", school: "Roosevelt Middle", rides: 142, miles: 698 },
  { rank: 3, name: "Emily Chen", school: "Washington Elementary", rides: 138, miles: 654 },
  { rank: 4, name: "Marcus Johnson", school: "Jefferson Academy", rides: 127, miles: 612 },
  { rank: 5, name: "Aisha Patel", school: "Madison Prep", rides: 119, miles: 578 },
];

const TopRiders = () => {
  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">Top Individual Riders</h3>
      </div>
      <div className="divide-y divide-muted">
        {riders.map((rider, i) => (
          <motion.div
            key={rider.rank}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted"
          >
            <div className="rank-badge flex-shrink-0">{rider.rank}</div>
            <div className="flex-1">
              <div className="font-display text-base font-bold uppercase text-foreground">
                {rider.name}
              </div>
              <div className="font-body text-sm font-medium text-primary">
                {rider.school}
              </div>
              <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bike className="h-3 w-3" /> {rider.rides} rides
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {rider.miles} mi
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TopRiders;
