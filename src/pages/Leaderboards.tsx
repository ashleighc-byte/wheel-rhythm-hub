import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Zap, MapPin, Mountain, ChevronDown, ChevronUp, Trophy, Map, Gamepad2 } from "lucide-react";
import brandPedalPath from "@/assets/brand-pedal-your-path.png";
import Navbar from "@/components/Navbar";
import BrandBikeIcon from "@/components/BrandBikeIcon";
import stripeBg from "@/assets/stripe-bg-2.png";
import StatsBar from "@/components/StatsBar";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { getCachedTopRiders, getCachedSchoolRankings, getCachedPopularTracks, getCachedGlobalStats, type CachedRider, type CachedPopularTrack } from "@/lib/leaderboardCache";
import { pluraliseUnit } from "@/lib/dateFormat";
import { supabase } from "@/integrations/supabase/client";

function formatTime(timeStr: string): string {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const hPart = hours > 0 ? pluraliseUnit(hours, "hour") : "";
  const mPart = pluraliseUnit(minutes, "minute");
  return hPart ? `${hPart} ${mPart}` : mPart;
}

const PAGE_SIZE = 10;

interface RiderRow {
  rank: number;
  name: string;
  sessions: number;
  totalPoints: number;
  totalDistance: number;
  avgSpeed: number;
  totalElevation: number;
  isCurrentUser: boolean;
  gender?: string;
}

const RiderTable = ({ title, riders, icon }: { title: string; riders: RiderRow[]; icon?: React.ReactNode }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? riders : riders.slice(0, PAGE_SIZE);
  const hasMore = riders.length > PAGE_SIZE;

  if (riders.length === 0) return null;

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header flex items-center gap-2 px-6 py-4">
        {icon}
        <h3 className="text-lg tracking-wider md:text-xl">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[2px] border-secondary bg-muted">
              <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rider</th>
              <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sessions</th>
              <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Points</th>
              <th className="hidden sm:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Distance</th>
              <th className="hidden sm:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Speed</th>
              <th className="hidden md:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Elevation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {visible.map((rider, i) => (
              <motion.tr
                key={`${rider.rank}-${rider.name}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={`transition-colors ${rider.isCurrentUser ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <td className="px-4 py-3">
                  <div className={`rank-badge text-xs ${rider.rank <= 3 ? "bg-accent text-accent-foreground" : ""}`}>
                    {rider.rank}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-display text-sm font-bold uppercase ${rider.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                    {rider.name} {rider.isCurrentUser && "(You)"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-body text-sm text-muted-foreground">{rider.sessions}</td>
                <td className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 font-display text-sm font-bold text-primary">
                    <Zap className="h-3 w-3" /> {rider.totalPoints}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{rider.totalDistance} km</td>
                <td className="hidden sm:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{rider.avgSpeed} km/h</td>
                <td className="hidden md:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{rider.totalElevation} m</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex w-full items-center justify-center gap-1 border-t-[2px] border-secondary py-3 font-display text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-muted"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show All ({riders.length}) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

const Leaderboards = () => {
  const { user, nfcSession } = useAuth();
  const [allRiders, setAllRiders] = useState<CachedRider[]>([]);
  const [totalActiveRiders, setTotalActiveRiders] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [userAirtableId, setUserAirtableId] = useState("");
  const [popularTracks, setPopularTracks] = useState<CachedPopularTrack[]>([]);
  const [genderMap, setGenderMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [riders, tracks, globalStats] = await Promise.all([
          getCachedTopRiders(),
          getCachedPopularTracks(),
          getCachedGlobalStats(),
        ]);
        setAllRiders(riders);
        setPopularTracks(tracks);
        setTotalActiveRiders(globalStats?.totalRiders ?? riders.length);

        // Find current user's school
        let studentRec;
        if (user?.email) {
          const res = await fetchStudents(user.email);
          studentRec = res.records[0];
        } else if (nfcSession?.studentId) {
          const res = await callAirtable('Student Registration', 'GET', {
            filterByFormula: `RECORD_ID()='${nfcSession.studentId}'`,
            maxRecords: 1,
          });
          studentRec = res.records[0];
        }

        if (studentRec) {
          setUserAirtableId(studentRec.id);
          const rawSchool = studentRec.fields["School"];
          const sName = rawSchool ? String(Array.isArray(rawSchool) ? rawSchool[0] : rawSchool) : "";
          setSchoolName(sName);
        }

        // Fetch gender data from Airtable Student Registration
        try {
          const allStudents = await callAirtable("Student Registration", "GET");
          const gObj: Record<string, string> = {};
          for (const s of allStudents.records) {
            const gender = String(s.fields["Gender (optional)"] ?? "").toUpperCase().trim();
            if (gender) gObj[s.id] = gender;
          }
          setGenderMap(gObj);
        } catch {
          // Non-fatal
        }
      } catch (err) {
        console.error("Leaderboards load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email, nfcSession?.studentId]);

  // All riders sorted by points
  const sortedAll = useMemo(() =>
    [...allRiders].sort((a, b) => b.totalPoints - a.totalPoints),
  [allRiders]);

  // User's global rank
  const userGlobalRank = useMemo(() => {
    if (!userAirtableId) return null;
    const idx = sortedAll.findIndex(r => r.airtableId === userAirtableId);
    return idx >= 0 ? idx + 1 : null;
  }, [sortedAll, userAirtableId]);

  // School riders — match by school name (cached `school` field)
  const schoolRiders = useMemo(() => {
    if (!schoolName) return [];
    return sortedAll
      .filter(r => r.school === schoolName)
      .map((r, i): RiderRow => ({
        rank: i + 1,
        name: r.name,
        sessions: r.sessions,
        totalPoints: r.totalPoints,
        totalDistance: Math.round((r.totalDistance ?? 0) * 10) / 10,
        avgSpeed: r.totalMinutes > 0 && r.totalDistance > 0
          ? Math.round(((r.totalDistance ?? 0) / ((r.totalMinutes ?? 1) / 60)) * 10) / 10
          : 0,
        totalElevation: Math.round(r.totalElevation ?? 0),
        isCurrentUser: r.airtableId === userAirtableId,
        gender: genderMap[r.airtableId] ?? "",
      }));
  }, [sortedAll, schoolName, userAirtableId, genderMap]);

  // All Schools league-wide riders (mask names from other schools for privacy)
  const allSchoolRiders = useMemo(() =>
    sortedAll.map((r, i): RiderRow => ({
      rank: i + 1,
      name: r.school === schoolName ? r.name : `Rider ${i + 1}`,
      sessions: r.sessions,
      totalPoints: r.totalPoints,
      totalDistance: Math.round((r.totalDistance ?? 0) * 10) / 10,
      avgSpeed: r.totalMinutes > 0 && r.totalDistance > 0
        ? Math.round(((r.totalDistance ?? 0) / ((r.totalMinutes ?? 1) / 60)) * 10) / 10
        : 0,
      totalElevation: Math.round(r.totalElevation ?? 0),
      isCurrentUser: r.airtableId === userAirtableId,
      gender: genderMap[r.airtableId] ?? "",
    })),
  [sortedAll, schoolName, userAirtableId, genderMap]);

  const femaleRiders = useMemo(() =>
    allSchoolRiders.filter(r => r.gender === "F").map((r, i) => ({ ...r, rank: i + 1 })),
  [allSchoolRiders]);

  const maleRiders = useMemo(() =>
    allSchoolRiders.filter(r => r.gender === "M").map((r, i) => ({ ...r, rank: i + 1 })),
  [allSchoolRiders]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StatsBar />

      {/* Decorative brand divider */}
      <div className="relative bg-background overflow-hidden">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <motion.img
            src={brandPedalPath}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 0.08, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-48 md:w-72"
          />
          <motion.img
            src={brandPedalPath}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 0.06, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-32 md:w-48"
          />
        </div>
      </div>

      {/* User rank banner */}
      {userGlobalRank && (
        <section className="bg-secondary py-6">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block border-[3px] border-accent bg-secondary px-8 py-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
            >
              <p className="font-display text-sm uppercase tracking-wider text-secondary-foreground/70">Your Rank</p>
              <p className="font-display text-4xl font-bold text-accent md:text-5xl">
                #{userGlobalRank}
              </p>
              <p className="font-body text-sm text-secondary-foreground/60">
                out of {totalActiveRiders} riders across all schools
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Rider Tables + School Rankings side by side */}
      <section className="bg-background pb-20 pt-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <BrandBikeIcon variant="black" className="h-8 w-8 animate-pulse" />
              <span className="ml-2 font-display text-lg uppercase text-foreground">Loading...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left: stacked rider tables */}
              <div className="flex-1 space-y-8 min-w-0">
                <RiderTable
                  title="Top Riders – All Schools"
                  riders={allSchoolRiders}
                  icon={<Trophy className="h-5 w-5" />}
                />
                <RiderTable
                  title={schoolName ? `Top Riders – ${schoolName}` : "Top Riders – Your School"}
                  riders={schoolRiders}
                />
                <RiderTable title="Top Riders – Female" riders={femaleRiders} />
                <RiderTable title="Top Riders – Male" riders={maleRiders} />

                {/* Popular Tracks */}
                {popularTracks.length > 0 && (
                  <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
                    <div className="leaderboard-header flex items-center gap-2 px-6 py-4">
                      <Map className="h-5 w-5" />
                      <h3 className="text-lg tracking-wider md:text-xl">Most Popular Tracks</h3>
                    </div>
                    <div className="divide-y divide-muted">
                      {popularTracks.slice(0, 10).map((track, i) => (
                        <motion.div
                          key={track.name}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted"
                        >
                          <div className="rank-badge flex-shrink-0 text-xs">{i + 1}</div>
                          <div className="flex-1">
                            <span className="font-display text-sm font-bold uppercase text-foreground">{track.name}</span>
                          </div>
                          <span className="flex items-center gap-1 font-display text-sm text-muted-foreground">
                            <Bike className="h-3 w-3" /> {track.rides} rides
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3D Game Rides */}
                <GameRidesTable />
              </div>

              {/* Right: School Rankings sidebar */}
              <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
                <div className="lg:sticky lg:top-4 space-y-6">
                  <SchoolRankingsTable />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-center"
                  >
                    <img
                      src={brandPedalPath}
                      alt="Pedal Your Own Path"
                      className="w-full max-w-[280px] object-contain"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

// School Rankings as a proper table
function SchoolRankingsTable() {
  const [schools, setSchools] = useState<{ rank: number; name: string; riders: number; totalPoints: number }[]>([]);

  useEffect(() => {
    getCachedSchoolRankings().then(setSchools).catch(console.error);
  }, []);

  if (schools.length === 0) return null;

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header flex items-center gap-2 px-6 py-4">
        <Trophy className="h-5 w-5" />
        <h3 className="text-lg tracking-wider md:text-xl">School Rankings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[2px] border-secondary bg-muted">
              <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">School</th>
              <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Riders</th>
              <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {schools.map((school, i) => (
              <motion.tr
                key={school.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <div className={`rank-badge text-xs ${i < 3 ? "bg-accent text-accent-foreground" : ""}`}>
                    {school.rank}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-display text-sm font-bold uppercase text-foreground">{school.name}</span>
                </td>
                <td className="px-4 py-3 text-center font-body text-sm text-muted-foreground">{school.riders}</td>
                <td className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 font-display text-sm font-bold text-primary">
                    <Zap className="h-3 w-3" /> {school.totalPoints}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Game Rides leaderboard (3D cycling game) ───────────────────────────────────
interface GameRideRow {
  id: string;
  user_id: string;
  route_id: string;
  route_name: string;
  distance_km: number;
  avg_speed_kmh: number;
  avg_power_watts: number;
  duration_seconds: number;
  completed_at: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function GameRidesTable() {
  const [rides, setRides] = useState<GameRideRow[]>([]);
  const [riderNames, setRiderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [routeFilter, setRouteFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase.from("game_rides" as any) as any)
          .select("id, user_id, route_id, route_name, distance_km, avg_speed_kmh, avg_power_watts, duration_seconds, completed_at")
          .order("avg_speed_kmh", { ascending: false })
          .limit(50);
        if (error) throw error;
        setRides((data ?? []) as GameRideRow[]);
      } catch (err) {
        console.error("GameRidesTable load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Resolve user_id → email/name via Airtable Student Registration when possible
  useEffect(() => {
    if (!rides.length) return;
    (async () => {
      try {
        const all = await callAirtable("Student Registration", "GET");
        const map: Record<string, string> = {};
        for (const r of all.records) {
          const email = String(r.fields["Email"] ?? "").toLowerCase().trim();
          const first = String(r.fields["First Name"] ?? "").trim();
          const lastI = String(r.fields["Last Name Initial"] ?? "").trim().replace(/\.$/, "");
          const name = first ? (lastI ? `${first} ${lastI}.` : first) : email;
          if (email) map[email] = name;
        }
        setRiderNames(map);
      } catch {
        /* non-fatal */
      }
    })();
  }, [rides.length]);

  const routeOptions = useMemo(() => {
    const set = new Map<string, string>();
    rides.forEach(r => set.set(r.route_id, r.route_name));
    return Array.from(set.entries());
  }, [rides]);

  const filtered = useMemo(
    () => (routeFilter === "all" ? rides : rides.filter(r => r.route_id === routeFilter)),
    [rides, routeFilter],
  );

  if (!loading && rides.length === 0) return null;

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header flex items-center gap-2 px-6 py-4">
        <Gamepad2 className="h-5 w-5" />
        <h3 className="text-lg tracking-wider md:text-xl">3D Game Rides</h3>
      </div>

      {routeOptions.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b-[2px] border-secondary bg-muted px-3 py-2">
          <button
            type="button"
            onClick={() => setRouteFilter("all")}
            className={`border-[2px] px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-colors ${
              routeFilter === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-secondary bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All Routes
          </button>
          {routeOptions.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRouteFilter(id)}
              className={`border-[2px] px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-colors ${
                routeFilter === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-secondary bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center px-6 py-8 font-body text-sm text-muted-foreground">
            Loading game rides...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-[2px] border-secondary bg-muted">
                <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rider</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Route</th>
                <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dist</th>
                <th className="px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg km/h</th>
                <th className="hidden sm:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg W</th>
                <th className="hidden sm:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="hidden lg:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {filtered.map((r, i) => {
                const name = riderNames[r.user_id?.toLowerCase?.() ?? ""] ?? `Rider ${i + 1}`;
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <div className={`rank-badge text-xs ${i < 3 ? "bg-accent text-accent-foreground" : ""}`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-display text-sm font-bold uppercase text-foreground">{name}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-body text-sm text-muted-foreground">{r.route_name}</td>
                    <td className="px-4 py-3 text-center font-body text-sm text-muted-foreground">{Number(r.distance_km).toFixed(2)} km</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-display text-sm font-bold text-primary">
                        <Zap className="h-3 w-3" /> {Number(r.avg_speed_kmh).toFixed(1)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{r.avg_power_watts} W</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{formatDuration(r.duration_seconds)}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-center font-body text-xs text-muted-foreground">{formatDateShort(r.completed_at)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Leaderboards;
