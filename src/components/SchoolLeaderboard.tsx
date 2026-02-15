import { motion } from "framer-motion";

const schools = [
  { rank: 1, name: "Lincoln High School", sessions: 2847 },
  { rank: 2, name: "Roosevelt Middle School", sessions: 2634 },
  { rank: 3, name: "Washington Elementary", sessions: 2156 },
  { rank: 4, name: "Jefferson Academy", sessions: 1923 },
  { rank: 5, name: "Madison Prep", sessions: 1687 },
  { rank: 6, name: "Hamilton Charter", sessions: 1544 },
  { rank: 7, name: "Franklin Institute", sessions: 1423 },
  { rank: 8, name: "Kennedy High School", sessions: 1298 },
];

const SchoolLeaderboard = () => {
  return (
    <div className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="leaderboard-header px-6 py-4">
        <h3 className="text-xl tracking-wider md:text-2xl">Engagement Stats</h3>
      </div>
      <div className="border-b-[3px] border-secondary bg-accent px-6 py-3">
        <div className="flex items-center font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">
          <span className="w-16">Rank</span>
          <span className="flex-1">School</span>
          <span className="text-right">Sessions Logged</span>
        </div>
      </div>
      <div className="divide-y divide-muted">
        {schools.map((school, i) => (
          <motion.div
            key={school.rank}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center px-6 py-5 transition-colors hover:bg-muted"
          >
            <div className="w-16">
              <div className="rank-badge">{school.rank}</div>
            </div>
            <span className="flex-1 font-body text-base font-medium text-foreground">
              {school.name}
            </span>
            <span className="font-display text-2xl font-bold text-primary">
              {school.sessions.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SchoolLeaderboard;
