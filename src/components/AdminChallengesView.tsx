import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Users, CheckCircle2, Bike, Clock, MapPin, Mountain,
  Target, Medal, BarChart3, ChevronDown, ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type ChallengeProgress,
  type TeamRanking,
  type ChallengeDefinition,
  CHALLENGE_DEFINITIONS,
  formatProgressValue,
  formatTargetValue,
  formatChallengeDate,
  formatDurationHHMM,
} from "@/lib/challenges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchoolChallengeStats {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  completionsByChallenge: Record<string, number>; // challengeId -> count completed
}

interface AdminChallengesViewProps {
  /** Per-student challenge progress grouped by school */
  schoolStats: SchoolChallengeStats[];
  /** Team rankings for Challenge 5 */
  teamRankings: TeamRanking[];
  /** All challenge definitions */
  definitions?: ChallengeDefinition[];
}

export default function AdminChallengesView({
  schoolStats,
  teamRankings,
  definitions = CHALLENGE_DEFINITIONS,
}: AdminChallengesViewProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('all');

  const individualDefs = definitions.filter(d => d.mode !== 'team');
  const teamDef = definitions.find(d => d.mode === 'team');

  // Aggregate totals
  const totalStudents = schoolStats.reduce((s, r) => s + r.totalStudents, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-accent">
            <Trophy className="h-4 w-4 text-accent-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Term 2 Challenge Tracker
          </h2>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Monitor challenge participation and completion rates across schools.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {individualDefs.map(def => {
          const totalCompleted = schoolStats.reduce(
            (s, r) => s + (r.completionsByChallenge[def.id] ?? 0), 0
          );
          const rate = totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;

          return (
            <div
              key={def.id}
              className="border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
            >
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {def.name}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {totalCompleted}
                </span>
                <span className="font-body text-sm text-muted-foreground">
                  / {totalStudents}
                </span>
              </div>
              <div className="mt-2 h-2 w-full border border-secondary bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <p className="mt-1 font-display text-xs text-primary font-bold">{rate}%</p>
            </div>
          );
        })}
      </div>

      {/* Per-school breakdown */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
            School Breakdown
          </h3>
          <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
            <SelectTrigger className="w-[220px] border-2 border-secondary font-display text-xs uppercase">
              <SelectValue placeholder="All Challenges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Challenges</SelectItem>
              {individualDefs.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <table className="w-full font-body text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">
                  School
                </th>
                <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                  Students
                </th>
                {(selectedChallenge === 'all' ? individualDefs : individualDefs.filter(d => d.id === selectedChallenge)).map(def => (
                  <th key={def.id} className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">
                    {def.name.split(' ').slice(0, 2).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/40 bg-card">
              {schoolStats.map((school) => (
                <tr key={school.schoolId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-display text-sm font-bold text-foreground">
                    {school.schoolName}
                  </td>
                  <td className="px-4 py-3 text-center font-display text-sm text-foreground">
                    {school.totalStudents}
                  </td>
                  {(selectedChallenge === 'all' ? individualDefs : individualDefs.filter(d => d.id === selectedChallenge)).map(def => {
                    const completed = school.completionsByChallenge[def.id] ?? 0;
                    const rate = school.totalStudents > 0 ? Math.round((completed / school.totalStudents) * 100) : 0;
                    return (
                      <td key={def.id} className="px-4 py-3 text-center">
                        <span className="font-display text-sm font-bold text-foreground">{completed}</span>
                        <span className="ml-1 font-body text-xs text-muted-foreground">({rate}%)</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Challenge Rankings */}
      {teamDef && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Medal className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              {teamDef.name} — Rankings
            </h3>
          </div>

          {teamRankings.length === 0 ? (
            <div className="border-[3px] border-secondary bg-card p-8 shadow-[4px_4px_0px_hsl(var(--brand-dark))] text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="font-display text-sm uppercase text-muted-foreground">
                No team data yet
              </p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                {formatChallengeDate(teamDef.startDate)} — {formatChallengeDate(teamDef.endDate)}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
              <div className="leaderboard-header flex items-center justify-between px-5 py-3">
                <h4 className="flex items-center gap-2 text-sm tracking-wider">
                  <Trophy className="h-4 w-4" /> School Rankings
                </h4>
                <span className="font-body text-xs text-primary-foreground/70">
                  Top {teamDef.teamSize ?? 10} riders per school
                </span>
              </div>
              <div className="divide-y divide-muted">
                {teamRankings.map((team, i) => (
                  <motion.div
                    key={team.schoolId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 px-5 py-4 ${i === 0 ? 'bg-accent/10' : ''}`}
                  >
                    <div className={`rank-badge text-lg ${
                      i === 0
                        ? 'bg-accent text-accent-foreground'
                        : i === 1
                        ? 'bg-primary text-primary-foreground'
                        : i === 2
                        ? 'bg-secondary text-secondary-foreground'
                        : ''
                    }`}>
                      {i === 0 ? '🏆' : `#${team.rank}`}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                        {team.schoolName}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {team.riderCount} riders contributing
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-extrabold text-accent">
                        {formatDurationHHMM(team.totalValue)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
