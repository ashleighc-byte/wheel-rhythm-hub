import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedEvent {
  id: string;
  event_type: string;
  rider_name: string;
  school_name: string;
  message: string;
  created_at: string;
}

const EVENT_ICONS: Record<string, any> = {
  ride: Bike,
  streak: Flame,
  rank_change: Trophy,
  level_up: Zap,
};

const EVENT_EMOJI: Record<string, string> = {
  ride: "🚴",
  streak: "🔥",
  rank_change: "🏆",
  level_up: "⚡",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const LiveActivityFeed = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    // Fetch recent events
    const fetchRecent = async () => {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("id, event_type, rider_name, school_name, message, created_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) {
        setEvents(data);
      }
    };

    fetchRecent();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("activity-feed-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        (payload) => {
          const newEvent = payload.new as FeedEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 12));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-secondary shadow-[6px_6px_0px_hsl(var(--brand-green))]">
      <div className="flex items-center gap-2 px-6 py-4">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </div>
        <h3 className="font-display text-xl font-bold uppercase tracking-wider text-accent md:text-2xl">
          Live Feed
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto px-2 pb-3">
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bike className="mx-auto mb-2 h-8 w-8 text-accent/30" />
            <p className="font-body text-sm text-accent/60">
              No activity yet — be the first to log a ride!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const Icon = EVENT_ICONS[event.event_type] ?? Bike;
              const emoji = EVENT_EMOJI[event.event_type] ?? "🚴";
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                  className="border-b border-primary/10 last:border-b-0"
                >
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-primary/20">
                      <Icon className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-accent leading-relaxed">
                        <span className="font-display font-bold uppercase tracking-wider">
                          {event.rider_name}
                        </span>{" "}
                        {event.message} {emoji}
                      </p>
                      <p className="mt-0.5 font-body text-[10px] text-accent/50">
                        {event.school_name && `${event.school_name} · `}
                        {timeAgo(event.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;