import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike, MapPin, Clock, Mountain, Trophy, Gift, Calendar,
  CheckCircle2, ChevronDown, ChevronUp, Timer, Flame, Medal,
  Users, Award, Target, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  type ChallengeProgress,
  type TeamRanking,
  type ChallengeDefinition,
  formatProgressValue,
  formatTargetValue,
  formatChallengeDate,
  formatDurationHHMM,
} from "@/lib/challenges";

// ── Icons per metric type ─────────────────────────────────
const metricIcons: Record<string, any> = {
  ride_count: Bike,
  distance: MapPin,
  duration: Clock,
  elevation: Mountain,
  team_time: Users,
};

const rewardIcons: Record<string, string> = {
  Bracelet: '🔗',
  'Drink Bottle': '🍶',
  'Training T-Shirt (quick-dry)': '👕',
  'FreeWheeler Trophy': '🏆',
};

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status, completed }: { status: string; completed: boolean }) {
  if (completed) {
    return (
      <Badge className="bg-primary text-primary-foreground border-primary font-display text-[10px] uppercase tracking-wider">
        ✅ Complete
      </Badge>
    );
  }
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-accent text-accent-foreground border-accent font-display text-[10px] uppercase tracking-wider animate-pulse">
          🔥 Active
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge variant="secondary" className="font-display text-[10px] uppercase tracking-wider">
          ⏳ Upcoming
        </Badge>
      );
    case 'ended':
      return (
        <Badge variant="outline" className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
          Ended
        </Badge>
      );
    default:
      return null;
  }
}

// ── Individual Challenge Card ─────────────────────────────
function ChallengeCard({ progress, index }: { progress: ChallengeProgress; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { definition: def, current, target, percentage, completed, rewardEarned, daysRemaining, status } = progress;
  const MetricIcon = metricIcons[def.metricType] ?? Target;
  const rewardEmoji = Object.entries(rewardIcons).find(([k]) => def.reward.includes(k))?.[1] ?? '🎁';

  const isActive = status === 'active';
  const isTeam = def.mode === 'team';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className={`border-[3px] bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))] overflow-hidden transition-all ${
        completed
          ? 'border-primary'
          : isActive
          ? 'border-accent'
          : 'border-secondary'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 md:p-5"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center ${
            completed ? 'bg-primary' : isActive ? 'bg-accent' : 'bg-secondary'
          }`}>
            {completed ? (
              <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            ) : (
              <MetricIcon className={`h-6 w-6 ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground'}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                {def.name}
              </h4>
              <StatusBadge status={status} completed={completed} />
            </div>

            {/* Dates */}
            <p className="mt-1 font-body text-xs text-muted-foreground">
              {formatChallengeDate(def.startDate)} — {formatChallengeDate(def.endDate)}
              {isActive && daysRemaining > 0 && (
                <span className={`ml-2 font-display font-bold ${daysRemaining <= 3 ? 'text-destructive' : 'text-primary'}`}>
                  {daysRemaining}d left
                </span>
              )}
            </p>

            {/* Progress bar (individual only) */}
            {!isTeam && target > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs font-bold text-foreground">
                    {formatProgressValue(current, def)}
                  </span>
                  <span className="font-display text-xs text-muted-foreground">
                    {formatTargetValue(def)}
                  </span>
                </div>
                <div className="h-4 w-full border-[2px] border-secondary bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.08 }}
                    className={`h-full ${completed ? 'bg-primary' : 'bg-accent'}`}
                  />
                </div>
                <p className="mt-1 text-right font-display text-[10px] font-bold text-muted-foreground">
                  {percentage}%
                </p>
              </div>
            )}

            {/* Team challenge note */}
            {isTeam && (
              <p className="mt-2 font-body text-xs text-primary">
                🏫 School vs School — Top {def.teamSize ?? 10} riders per school
              </p>
            )}

            {/* Reward */}
            {def.reward && def.reward !== 'None (Part of T-Shirt combo)' && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-sm">{rewardEmoji}</span>
                <span className={`font-display text-[10px] font-bold uppercase tracking-wider ${
                  rewardEarned ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {rewardEarned ? '🎉 Reward Earned: ' : 'Reward: '}
                  {def.reward}
                </span>
              </div>
            )}

            {/* T-shirt combo note */}
            {def.rewardDependsOn?.length ? (
              <p className="mt-1 font-body text-[10px] text-muted-foreground italic">
                ⚡ Complete both the Endurance & Climbing challenges to unlock the T-shirt
              </p>
            ) : null}
          </div>

          {/* Expand toggle */}
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-secondary"
          >
            <div className="p-4 bg-muted/30">
              <p className="font-body text-sm text-foreground/80">
                {def.description ?? 'No description available.'}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                  <p className="font-display text-sm font-bold text-foreground capitalize">{def.mode}</p>
                </div>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Metric</p>
                  <p className="font-display text-sm font-bold text-foreground capitalize">{def.metricType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
                  <p className="font-display text-sm font-bold text-foreground">{progress.daysTotal} days</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Team Leaderboard ──────────────────────────────────────
function TeamLeaderboard({ rankings, definition }: { rankings: TeamRanking[]; definition: ChallengeDefinition }) {
  if (!rankings.length) {
    return (
      <div className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))] text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="font-display text-sm uppercase text-muted-foreground">No team data yet</p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          Rides within {formatChallengeDate(definition.startDate)} — {formatChallengeDate(definition.endDate)} will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header flex items-center justify-between px-5 py-3">
        <h3 className="flex items-center gap-2 text-base tracking-wider">
          <Trophy className="h-4 w-4" /> Team Rankings
        </h3>
        <span className="font-body text-xs text-primary-foreground/70">
          Top {definition.teamSize ?? 10} riders per school
        </span>
      </div>
      <div className="divide-y divide-muted">
        {rankings.map((team, i) => (
          <motion.div
            key={team.schoolId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`flex items-center gap-4 px-5 py-3 ${i === 0 ? 'bg-primary/5' : ''}`}
          >
            <div className={`rank-badge ${
              i === 0 ? 'bg-accent text-accent-foreground' : ''
            }`}>
              {i === 0 ? '🏆' : `#${team.rank}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground truncate">
                {team.schoolName}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {team.riderCount} riders
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-accent">
                {formatDurationHHMM(team.totalValue)}
              </p>
              <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                combined
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
interface ChallengesDashboardProps {
  challengeProgress: ChallengeProgress[];
  teamRankings?: TeamRanking[];
  studentSchoolId?: string;
}

export default function ChallengesDashboard({
  challengeProgress,
  teamRankings,
  studentSchoolId,
}: ChallengesDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const activeChallenges = challengeProgress.filter(p => p.status === 'active');
  const upcomingChallenges = challengeProgress.filter(p => p.status === 'upcoming');
  const completedChallenges = challengeProgress.filter(p => p.completed);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active': return challengeProgress.filter(p => p.status === 'active');
      case 'completed': return challengeProgress.filter(p => p.completed);
      default: return challengeProgress;
    }
  }, [challengeProgress, filter]);

  // Find the team challenge for leaderboard
  const teamChallenge = challengeProgress.find(p => p.definition.mode === 'team');
  const mySchoolRank = teamRankings?.find(r => r.schoolId === studentSchoolId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-accent">
            <Trophy className="h-4 w-4 text-accent-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Term 2 Challenges
          </h2>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-display text-[10px]">
            {activeChallenges.length} Active
          </Badge>
          <Badge className="bg-primary text-primary-foreground font-display text-[10px]">
            {completedChallenges.length} Done
          </Badge>
          {upcomingChallenges.length > 0 && (
            <Badge variant="outline" className="font-display text-[10px]">
              {upcomingChallenges.length} Upcoming
            </Badge>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-display text-xs font-bold uppercase tracking-wider px-4 py-2 border-[2px] transition-all ${
              filter === f
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-secondary bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="grid gap-4">
        {filtered
          .filter(p => p.definition.mode !== 'team')
          .map((progress, i) => (
            <ChallengeCard key={progress.definition.id} progress={progress} index={i} />
          ))}
      </div>

      {/* Team Challenge Section */}
      {teamChallenge && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              {teamChallenge.definition.name}
            </h3>
            <StatusBadge status={teamChallenge.status} completed={teamChallenge.completed} />
          </div>

          <p className="font-body text-sm text-muted-foreground">
            {teamChallenge.definition.description}
          </p>

          {/* My school position */}
          {mySchoolRank && (
            <div className="border-[3px] border-accent bg-accent/10 p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
              <p className="font-display text-xs uppercase tracking-wider text-muted-foreground">Your School</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-display text-3xl font-extrabold text-accent">
                  #{mySchoolRank.rank}
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-foreground">{mySchoolRank.schoolName}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {formatDurationHHMM(mySchoolRank.totalValue)} combined · {mySchoolRank.riderCount} riders
                  </p>
                </div>
              </div>
            </div>
          )}

          <TeamLeaderboard
            rankings={teamRankings ?? []}
            definition={teamChallenge.definition}
          />
        </div>
      )}
    </motion.div>
  );
}
