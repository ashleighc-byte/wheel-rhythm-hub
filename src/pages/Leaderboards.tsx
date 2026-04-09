import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Zap, MapPin, Mountain, ChevronDown, ChevronUp, Trophy, Map } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { getCachedTopRiders, getCachedSchoolRankings, getCachedPopularTracks, type CachedRider, type CachedPopularTrack } from "@/lib/leaderboardCache";
import { pluraliseUnit } from "@/lib/dateFormat";
import artRideCompleteNew from "@/assets/art-ride-complete-new.png";

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
  totalTime: string;
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
              <th className="hidden md:table-cell px-4 py-3 text-center font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</th>
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
                <td className="hidden md:table-cell px-4 py-3 text-center font-body text-sm text-muted-foreground">{formatTime(rider.totalTime)}</td>
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
  const [schoolName, setSchoolName] = useState("");
  const [userSchoolId, setUserSchoolId] = useState("");
  const [userAirtableId, setUserAirtableId] = useState("");
  const [popularTracks, setPopularTracks] = useState<CachedPopularTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [riders, tracks] = await Promise.all([
          getCachedTopRiders(),
          getCachedPopularTracks(),
        ]);
        setAllRiders(riders);
        setPopularTracks(tracks);

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
          const schoolIds = studentRec.fields["School"] as string[] | undefined;
          if (schoolIds?.length) {
            setUserSchoolId(schoolIds[0]);
            const match = riders.find(r => r.schoolId === schoolIds[0]);
            setSchoolName(match?.school ?? "");
          }
        }
      } catch (err) {
        console.error("Leaderboards load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email, nfcSession?.studentId]);

  // All riders sorted by points for rank
  const sortedAll = useMemo(() =>
    [...allRiders].sort((a, b) => b.totalPoints - a.totalPoints),
  [allRiders]);

  // User's global rank
  const userGlobalRank = useMemo(() => {
    if (!userAirtableId) return null;
    const idx = sortedAll.findIndex(r => r.airtableId === userAirtableId);
    return idx >= 0 ? idx + 1 : null;
  }, [sortedAll, userAirtableId]);

  // School riders
  const schoolRiders = useMemo(() => {
    if (!userSchoolId) return [];
    return sortedAll
      .filter(r => r.schoolId === userSchoolId)
      .map((r, i): RiderRow => ({
        rank: i + 1,
        name: r.name,
        sessions: r.sessions,
        totalPoints: r.totalPoints,
        totalDistance: Math.round((r.totalDistance ?? 0) * 10) / 10,
        totalTime: r.totalTime ?? "0:00",
        totalElevation: Math.round(r.totalElevation ?? 0),
        isCurrentUser: r.airtableId === userAirtableId,
        gender: r.gender,
      }));
  }, [sortedAll, userSchoolId, userAirtableId]);

  const femaleRiders = useMemo(() =>
    schoolRiders.filter(r => r.gender?.toLowerCase() === "female").map((r, i) => ({ ...r, rank: i + 1 })),
  [schoolRiders]);

  const maleRiders = useMemo(() =>
    schoolRiders.filter(r => r.gender?.toLowerCase() === "male").map((r, i) => ({ ...r, rank: i + 1 })),
  [schoolRiders]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StatsBar />

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
                out of {sortedAll.length} riders
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Engagement stats moved here */}
      <section className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-4 text-center font-display text-lg font-bold uppercase tracking-wider text-foreground">
              School Rankings
            </h3>
            <SchoolRankingsCompact />
          </div>
        </div>
      </section>

      {/* Tables */}
      <section className="bg-background pb-20 pt-8">
        <div className="container mx-auto space-y-8 px-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Bike className="h-6 w-6 animate-pulse text-primary" />
              <span className="ml-2 font-display text-lg uppercase text-foreground">Loading...</span>
            </div>
          ) : (
            <>
              <RiderTable
                title={schoolName ? `Top Riders – ${schoolName}` : "Top Riders"}
                riders={schoolRiders}
                icon={<Trophy className="h-5 w-5" />}
              />
              <RiderTable title="Top Female Riders" riders={femaleRiders} />
              <RiderTable title="Top Male Riders" riders={maleRiders} />

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
            </>
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

// Compact school rankings component (replaces SchoolLeaderboard in sidebar)
function SchoolRankingsCompact() {
  const [schools, setSchools] = useState<{ rank: number; name: string; riders: number; totalPoints: number }[]>([]);

  useEffect(() => {
    getCachedSchoolRankings().then(setSchools).catch(console.error);
  }, []);

  if (schools.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {schools.map((school, i) => (
        <motion.div
          key={school.name}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce"
        >
          <div className="flex items-center gap-3">
            <div className={`rank-badge ${i < 3 ? "bg-accent text-accent-foreground" : ""}`}>
              {school.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold uppercase text-foreground truncate">{school.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{school.riders} riders</span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" /> {school.totalPoints} pts
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default Leaderboards;
