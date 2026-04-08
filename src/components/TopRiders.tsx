import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Zap, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { pluraliseUnit } from "@/lib/dateFormat";
import { getCachedTopRiders, type CachedRider } from "@/lib/leaderboardCache";
import { fetchTeacherOrgFull, isSuperAdmin, fetchOrgsInRegion, fetchStudents, callAirtable } from "@/lib/airtable";

/** Format "h:mm" string with correct pluralisation */
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

interface Rider {
  rank: number;
  name: string;
  school: string;
  sessions: number;
  totalTime: string;
  totalPoints: number;
  totalMinutes: number;
  totalDistance: number;
  level: string;
}

const TopRiders = () => {
  const { user, role, nfcSession } = useAuth();
  const isAdmin = role === 'admin';
  const [riders, setRiders] = useState<Rider[]>([]);
  const [titleText, setTitleText] = useState("");

  const hasIdentity = !!user?.email || !!nfcSession;

  useEffect(() => {
    if (!hasIdentity) return;

    const load = async () => {
      try {
        const allRiders = await getCachedTopRiders();

        let schoolFilterIds: Set<string> | null = null;
        let regionName = "";
        let schoolName = "";

        if (isAdmin && user?.email) {
          const orgInfo = await fetchTeacherOrgFull(user.email);
          if (orgInfo && isSuperAdmin(orgInfo)) {
            regionName = orgInfo.region;
            if (orgInfo.region.toLowerCase() !== "all") {
              const regionOrgs = await fetchOrgsInRegion(orgInfo.region);
              schoolFilterIds = new Set(regionOrgs.records.map((o) => o.id));
            }
          }
        } else {
          let currentStudentRec;
          if (user?.email) {
            const currentStudentRes = await fetchStudents(user.email);
            currentStudentRec = currentStudentRes.records[0];
          } else if (nfcSession?.studentId) {
            const currentStudentRes = await callAirtable('Student Registration', 'GET', {
              filterByFormula: `RECORD_ID()='${nfcSession.studentId}'`,
              maxRecords: 1,
            });
            currentStudentRec = currentStudentRes.records[0];
          }
          if (!currentStudentRec) return;
          const userSchoolIds = currentStudentRec.fields["School"] as string[] | undefined;
          if (!userSchoolIds?.length) return;
          schoolFilterIds = new Set([userSchoolIds[0]]);
          const matchingRider = allRiders.find(r => r.schoolId === userSchoolIds[0]);
          schoolName = matchingRider?.school ?? "";
        }

        const mapped = allRiders
          .filter((r) => {
            if (!schoolFilterIds) return true;
            return r.schoolId ? schoolFilterIds.has(r.schoolId) : false;
          })
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 10)
          .map((r, i) => ({
            rank: i + 1,
            name: r.name,
            school: r.school,
            sessions: r.sessions,
            totalTime: r.totalTime,
            totalPoints: r.totalPoints,
            totalMinutes: r.totalMinutes,
            totalDistance: r.totalDistance,
            level: r.level,
          }));

        setRiders(mapped);

        if (!isAdmin && schoolName) {
          setTitleText(`Top Riders – ${schoolName}`);
        } else if (isAdmin && regionName && regionName.toLowerCase() !== "all") {
          setTitleText(`Top Riders – ${regionName}`);
        } else {
          setTitleText(`Top Riders – All Schools`);
        }
      } catch (err) {
        console.error("TopRiders load error:", err);
      }
    };

    load();
  }, [hasIdentity, isAdmin, user?.email, nfcSession?.studentId]);

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">
          {titleText}
        </h3>
      </div>
      <div className="divide-y divide-muted">
        {riders.length === 0 ? (
          <div className="px-6 py-8 text-center font-body text-muted-foreground">
            No riders with sessions yet.
          </div>
        ) : (
          riders.map((rider, i) => (
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
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold uppercase text-foreground">
                    {rider.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {rider.level}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3 w-3" /> {rider.sessions} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {rider.totalPoints} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {rider.totalDistance} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatTime(rider.totalTime)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopRiders;
