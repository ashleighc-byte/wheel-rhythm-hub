import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Flame, TrendingUp, Trophy, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import AnimatedCounter from "@/components/AnimatedCounter";

// Mock data for now - will be replaced with Airtable data
const mockStudent = {
  name: "Sarah Martinez",
  school: "Lincoln High School",
  totalMinutes: 2340,
  totalSessions: 156,
  totalCalories: 18720,
  totalDistance: 782,
  rank: 1,
  feelingTrend: "+12%",
};

const mockSessions = [
  { id: 1, date: "2026-02-14", minutes: 30, distance: 12.5, calories: 280, feelingBefore: 3, feelingAfter: 5 },
  { id: 2, date: "2026-02-12", minutes: 25, distance: 10.2, calories: 230, feelingBefore: 2, feelingAfter: 4 },
  { id: 3, date: "2026-02-10", minutes: 35, distance: 14.8, calories: 320, feelingBefore: 4, feelingAfter: 5 },
  { id: 4, date: "2026-02-08", minutes: 20, distance: 8.1, calories: 180, feelingBefore: 2, feelingAfter: 4 },
  { id: 5, date: "2026-02-06", minutes: 40, distance: 16.3, calories: 360, feelingBefore: 3, feelingAfter: 5 },
];

const moodEmojis = ["😞", "😕", "😐", "🙂", "😁"];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl text-foreground md:text-5xl">
            Hey, {mockStudent.name.split(" ")[0]}! 👋
          </h1>
          <p className="mt-2 font-body text-lg text-muted-foreground">
            {mockStudent.school} · Rank #{mockStudent.rank}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Clock, value: mockStudent.totalMinutes, label: "Total Minutes", color: "text-primary" },
            { icon: Bike, value: mockStudent.totalSessions, label: "Sessions", color: "text-primary" },
            { icon: Flame, value: mockStudent.totalCalories, label: "Calories", color: "text-primary" },
            { icon: TrendingUp, value: mockStudent.totalDistance, label: "Miles", color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card flex flex-col items-center px-4 py-6"
            >
              <stat.icon className={`mb-2 h-6 w-6 ${stat.color}`} />
              <div className="font-display text-3xl font-bold text-accent md:text-4xl">
                {stat.value.toLocaleString()}
              </div>
              <div className="mt-1 font-display text-[10px] font-semibold uppercase tracking-widest text-accent/70">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mood trend + Rank card */}
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Mood Improvement
            </div>
            <div className="mt-4 font-display text-5xl font-bold text-primary">
              {mockStudent.feelingTrend}
            </div>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Your mood after sessions has been consistently improving!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
          >
            <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              Your Rank
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-primary">#{mockStudent.rank}</span>
              <span className="font-body text-muted-foreground">at {mockStudent.school}</span>
            </div>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Keep riding to climb the leaderboard!
            </p>
          </motion.div>
        </div>

        {/* Recent sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="overflow-hidden border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <div className="leaderboard-header flex items-center justify-between px-6 py-4">
            <h3 className="text-xl tracking-wider">Recent Sessions</h3>
            <a href="/log" className="tape-element py-1 px-4 text-xs no-underline">
              LOG NEW SESSION
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[3px] border-secondary bg-accent">
                  <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Minutes</th>
                  <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Distance</th>
                  <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Calories</th>
                  <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-widest text-accent-foreground">Mood</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {mockSessions.map((session, i) => (
                  <motion.tr
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="transition-colors hover:bg-muted"
                  >
                    <td className="px-4 py-4 font-body text-sm text-foreground">{session.date}</td>
                    <td className="px-4 py-4 font-display text-lg font-bold text-primary">{session.minutes}</td>
                    <td className="px-4 py-4 font-body text-sm text-foreground">{session.distance} mi</td>
                    <td className="px-4 py-4 font-body text-sm text-foreground">{session.calories}</td>
                    <td className="px-4 py-4 text-lg">
                      {moodEmojis[session.feelingBefore - 1]} → {moodEmojis[session.feelingAfter - 1]}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
