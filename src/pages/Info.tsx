import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Circle, Bike, ClipboardList, Heart, AlertTriangle, Target, BarChart3, Calendar, Zap, Flame, BoltIcon, Trophy } from "lucide-react";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import { useState, useEffect } from "react";
import ReportIssueForm from "@/components/ReportIssueForm";
import { fetchStudents } from "@/lib/airtable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import artSmartBike from "@/assets/art-smart-bike.jpeg";
import artEcycling from "@/assets/art-ecycling.jpeg";

const timelinePhases = [
  {
    phase: "Phase 1",
    title: "Registration & Onboarding",
    items: [
      "Student permission forms completed",
      "Students registered in the system",
      "Intro sessions delivered",
    ],
  },
  {
    phase: "Phase 2",
    title: "Active Pilot Period",
    items: [
      "Weekly cycling sessions",
      "Students log session data",
      "Post-session feedback collected",
      "Ongoing observation and participation tracking",
    ],
  },
  {
    phase: "Phase 3",
    title: "Evaluation & Review",
    items: [
      "Survey analysis",
      "Student voice feedback review",
      "Teacher feedback collected",
      "Data summary report created",
    ],
  },
  {
    phase: "Phase 4",
    title: "Future Planning",
    items: [
      "Refinements based on evidence",
      "Decision on scale-up",
    ],
  },
];

// ── Student-facing Info page ──────────────────────────────────────────────────

const StudentInfo = () => {
  const { user } = useAuth();
  const [logOpen, setLogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!user?.email) return;
    fetchStudents(user.email)
      .then((res) => {
        if (res.records.length > 0) {
          setSessionCount(Number(res.records[0].fields["Count (Session Reflections)"] ?? 0));
        }
      })
      .catch(console.error);
  }, [user?.email]);

  const rideStatus: "done" | "in-progress" | "empty" = sessionCount >= 10 ? "done" : sessionCount >= 1 ? "in-progress" : "empty";

  const checklist = [
    {
      status: "done" as const,
      label: "Pre-Pilot Survey",
      description: "Completed on sign-up — you're good!",
      action: null,
    },
    {
      status: "empty" as const,
      label: "4 Week Check-In",
      description: "A quick mid-pilot check-in — due around week 4.",
      action: { type: "link" as const, to: "/four-week-check-in", text: "Start Check-In" },
    },
    {
      status: "empty" as const,
      label: "Post-Pilot Survey",
      description: "Coming Term 4 2026 — we'll remind you when it's time.",
      action: { type: "disabled-link" as const, text: "Start Survey" },
    },
    {
      status: rideStatus,
      label: "Log Your Ride After Every Session",
      description: "Every time you jump on the bike, log your data — it keeps your stats up and helps the programme.",
      action: { type: "button" as const, text: "Log a Ride", onClick: () => setLogOpen(true) },
    },
  ];

  const renderStatusIcon = (status: "done" | "in-progress" | "empty") => {
    if (status === "done") return <CheckCircle2 className="h-6 w-6 text-primary" />;
    if (status === "in-progress") return <div className="h-6 w-6 rounded-full border-[3px] border-primary bg-primary/30" />;
    return <Circle className="h-6 w-6 text-muted-foreground/40" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-14 md:py-20 relative overflow-hidden speed-lines">
        <div className="absolute inset-0">
          <img src={artSmartBike} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-secondary/75" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-6xl">
            What's This All About?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-secondary-foreground/70">
            Everything you need to know — and everything you need to do.
          </p>
        </div>
      </section>

      {/* What is Free Wheeler */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl space-y-6 font-body text-base leading-relaxed text-foreground/90">
            <p className="text-xl font-bold text-foreground">
              Free Wheeler Bike League is a new way to do sport.
            </p>
            <p>
              No teams. No trials. No pressure. Just jump on a bike and ride. Track your sessions, build your streak, and see how your school ranks on the leaderboard. Every ride counts.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Bike, label: "Ride at your own pace" },
                { icon: BarChart3, label: "Track your progress" },
                { icon: Trophy, label: "Compete with your school" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-[3px] border-secondary bg-card p-4 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce"
                >
                  <item.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <div className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <p>
              This is a pilot — meaning we're trialling it to see how it works and whether it should grow into more schools. Your participation, data, and feedback directly shapes what happens next.
            </p>
            <p className="tape-element-green inline-block px-4 py-2 font-display text-lg font-bold uppercase">
              Go hard — without having to go anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Points System */}
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                How Points Work
              </h2>
            </div>
            <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/90">
              <p className="text-base font-semibold text-foreground">Every ride counts — and earns you points.</p>
              <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Bike className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><strong>10 points</strong> for every completed ride session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Flame className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><strong>+5 bonus</strong> when you log 3 sessions in a single week</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span><strong>+10 bonus</strong> when you ride on 5 different days in a week</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-foreground/60">
                That means a full week of riding earns up to <strong>65 points</strong> (5x10 + 5 + 10).
              </p>
              <div className="border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-primary">Level Up</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { name: "Kickstand", pts: "0" },
                    { name: "Pedal Pusher", pts: "50" },
                    { name: "Gear Shifter", pts: "150" },
                    { name: "Chain Breaker", pts: "300" },
                    { name: "Freewheeler", pts: "500" },
                  ].map((lvl) => (
                    <div key={lvl.name} className="bg-muted px-2 py-2 text-center hover-bounce">
                      <div className="font-display text-[10px] font-bold uppercase tracking-wider text-foreground">{lvl.name}</div>
                      <div className="font-body text-xs text-primary font-semibold">{lvl.pts} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Checklist */}
      <section className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <ClipboardList className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground">
                Your Checklist
              </h2>
            </div>

            <div className="space-y-4">
              {checklist.map((item, i) => (
                <div
                  key={i}
                  className={`border-[3px] bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce ${
                    item.status === "done" ? "border-primary/40 opacity-75" : "border-secondary"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {renderStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                          {i + 1}. {item.label}
                        </span>
                        {item.status === "done" && (
                          <span className="bg-primary px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            Done
                          </span>
                        )}
                        {item.status === "in-progress" && (
                          <span className="bg-accent px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-body text-sm text-foreground/70">{item.description}</p>
                      {item.action && item.status !== "done" && (
                        <div className="mt-3">
                          {item.action.type === "link" ? (
                            <Link
                              to={item.action.to}
                              className="inline-block border-[2px] border-primary bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5"
                            >
                              {item.action.text}
                            </Link>
                          ) : item.action.type === "disabled-link" ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="inline-block cursor-not-allowed border-[2px] border-muted bg-muted px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-60"
                                  >
                                    {item.action.text}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Opens Term 4 2026 — we'll let you know when it's time</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <button
                              onClick={item.action.onClick}
                              className="inline-block border-[2px] border-primary bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5"
                            >
                              {item.action.text}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hardware issue button */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent">
                  <AlertTriangle className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                    Something Not Working?
                  </h3>
                  <p className="mt-1 font-body text-sm text-foreground/70">
                    Bike broken? App glitch? Hardware issue? Let us know and we'll sort it.
                  </p>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="mt-4 inline-block border-[2px] border-accent bg-accent px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Report an Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
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

      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />
      <ReportIssueForm open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

// ── Teacher-facing Info page ──────────────────────────────────────────────────

const TeacherInfo = () => {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-16 md:py-24 relative overflow-hidden speed-lines">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-6xl">
            Pilot Programme Information
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-secondary-foreground/70">
            Everything you need to know about the Free Wheeler Bike League pilot.
          </p>
        </div>
      </section>

      {/* Pilot Purpose */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
                Pilot Purpose
              </h2>
            </div>
            <div className="space-y-5 font-body text-base leading-relaxed text-foreground/90">
              <p className="text-lg font-semibold">
                Free Wheeler Bike League is reimagining how rangatahi experience sport.
              </p>
              <p>
                Traditional sport can feel rigid, rule-bound, and limited to certain students. Free Wheeler breaks away from those conventions and offers an option that works on their terms.
              </p>
              <p className="font-semibold">This pilot is designed to:</p>
              <ul className="space-y-2 pl-1">
                {[
                  "Increase participation in physical activity — especially for students who are currently less active",
                  "Provide a flexible, non-traditional way to engage in sport",
                  "Build confidence through individual progress and achievement",
                  "Create a sense of belonging through shared movement and friendly competition",
                  "Gather measurable data to shape the future of the programme",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="tape-element-green inline-block px-4 py-2 font-display text-lg font-bold uppercase">
                Go hard — without having to go anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Pilot Matters */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground">
                Why This Pilot Matters
              </h2>
            </div>
            <div className="space-y-5 font-body text-base leading-relaxed text-secondary-foreground/90">
              <p>Many rangatahi disengage from traditional sport due to structure, pressure, or lack of perceived ability.</p>
              <p className="font-semibold text-accent">Free Wheeler offers:</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {["Low barrier to entry", "Self-paced challenge", "Individual progress tracking", "Inclusive participation", "A new pathway into physical activity"].map((item) => (
                  <div key={item} className="border-2 border-accent/30 bg-secondary px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-accent hover-bounce">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-6 font-semibold text-accent">This pilot will measure:</p>
              <ul className="space-y-2 pl-1">
                {[
                  "Changes in student confidence",
                  "Changes in enjoyment of physical activity",
                  "Engagement levels across sessions",
                  "Participation rates of previously inactive students",
                  "Student voice and feedback",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Points System */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
                Points System
              </h2>
            </div>
            <div className="space-y-5 font-body text-base leading-relaxed text-foreground/90">
              <p className="text-lg font-semibold">
                Students earn points to gamify participation and reward consistency.
              </p>
              <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Bike className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><strong>10 points</strong> for every completed ride session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Flame className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><strong>+5 bonus</strong> when a student logs 3 sessions in a single week</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span><strong>+10 bonus</strong> when a student rides on 5 different days in a week</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-foreground/60">
                A full week of riding earns up to <strong>65 points</strong> (5x10 + 5 + 10). Points are tracked on the student dashboard and leaderboards.
              </p>
              <div className="border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-primary">Level Thresholds</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { name: "Kickstand", pts: "0" },
                    { name: "Pedal Pusher", pts: "50" },
                    { name: "Gear Shifter", pts: "150" },
                    { name: "Chain Breaker", pts: "300" },
                    { name: "Freewheeler", pts: "500" },
                  ].map((lvl) => (
                    <div key={lvl.name} className="bg-muted px-2 py-2 text-center hover-bounce">
                      <div className="font-display text-[10px] font-bold uppercase tracking-wider text-foreground">{lvl.name}</div>
                      <div className="font-body text-xs text-primary font-semibold">{lvl.pts} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Timeline */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
                Pilot Timeline
              </h2>
            </div>
            <div className="relative space-y-0">
              <div className="absolute left-5 top-0 h-full w-1 bg-primary/30" />
              {timelinePhases.map((phase) => (
                <div key={phase.phase} className="relative pb-10 pl-14 last:pb-0">
                  <div className="absolute left-3 top-1 h-5 w-5 border-[3px] border-primary bg-background" />
                  <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
                    <div className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-primary">{phase.phase}</div>
                    <h3 className="mb-3 font-display text-lg font-bold uppercase text-foreground">{phase.title}</h3>
                    <ul className="space-y-1.5 font-body text-sm text-foreground/80">
                      {phase.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hardware / issue reporting */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="border-[3px] border-secondary bg-card p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))] hover-bounce">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent">
                  <AlertTriangle className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                    Something Not Working?
                  </h3>
                  <p className="mt-1 font-body text-sm text-foreground/70">
                    Equipment issue? Technical problem? Let us know.
                  </p>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="mt-4 inline-block border-[2px] border-accent bg-accent px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Report an Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-accent">
              The Vision
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-foreground/80">
              Free Wheeler aims to create a scalable model for inclusive school sport — one that uses technology, data, and student voice to break barriers and build confidence.
            </p>
            <p className="tape-element-green mt-6 inline-block px-4 py-2 font-display text-lg font-bold uppercase">
              Go hard — without having to go anywhere.
            </p>
          </div>
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

      <ReportIssueForm open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

// ── Route selector ────────────────────────────────────────────────────────────

const Info = () => {
  const { role } = useAuth();
  return role === "admin" ? <TeacherInfo /> : <StudentInfo />;
};

export default Info;
