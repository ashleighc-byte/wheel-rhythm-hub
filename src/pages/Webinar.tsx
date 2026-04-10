import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileDown, Trophy, BarChart3, Users, Bike, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import brandLogo from "@/assets/fw-logo-oval.png";

const TOTAL_SLIDES = 6;

const SlideWrapper = ({ children, title, icon: Icon, slideNum }: { children: React.ReactNode; title: string; icon: any; slideNum: number }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center bg-primary">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Slide {slideNum} of {TOTAL_SLIDES}
        </p>
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground md:text-2xl">
          {title}
        </h2>
      </div>
    </div>
    {children}
  </div>
);

const Slide1 = () => (
  <SlideWrapper title="Getting Started" icon={Users} slideNum={1}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p className="text-base font-semibold text-foreground">
        Welcome to the Free Wheeler Bike League teacher onboarding!
      </p>
      <div className="border-[3px] border-secondary bg-card p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-primary">
          Step 1 — School Registration
        </p>
        <p>Fill out the school registration form and e-sign the MoU:</p>
        <a
          href="https://bit.ly/Freewheelerschoolreg"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-semibold text-primary underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> bit.ly/Freewheelerschoolreg
        </a>
      </div>
      <div className="border-[3px] border-secondary bg-card p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-primary">
          Step 2 — Create Your Account
        </p>
        <ol className="list-inside list-decimal space-y-2 pl-1">
          <li>
            Go to{" "}
            <a href="https://freewheeler.lovable.app/auth" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
              freewheeler.lovable.app
            </a>
          </li>
          <li>Sign up with your <span className="font-bold">school email address</span></li>
          <li>Check your inbox and click the verification link</li>
          <li>Sign back in — you're all set!</li>
        </ol>
      </div>
      <div className="border-l-4 border-accent bg-card px-4 py-3">
        <p className="font-semibold text-foreground">Only approved school emails can sign up</p>
        <p className="mt-1 text-foreground/70">
          Your email must be registered in our system (via the school registration form) before you can create an account.
        </p>
      </div>
    </div>
  </SlideWrapper>
);

const Slide2 = () => (
  <SlideWrapper title="Home Page & Logging" icon={Bike} slideNum={2}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p>Once you're signed in, here's what you'll see on the home page:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">Track Your Students</p>
          <p className="mt-2 text-foreground/70">View your Teacher Dashboard to monitor student progress, sessions, and survey completion.</p>
        </div>
        <div className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">Something Not Working?</p>
          <p className="mt-2 text-foreground/70">Report issues with bikes, the app, or hardware. We'll get it sorted.</p>
        </div>
      </div>
      <div className="border-l-4 border-accent bg-card px-4 py-3">
        <p className="font-semibold text-foreground">Try it now!</p>
        <p className="mt-1 text-foreground/70">
          Click the "Something Not Working?" button on the home page and submit a test entry to see how issue reporting works.
        </p>
      </div>
    </div>
  </SlideWrapper>
);

const Slide3 = () => (
  <SlideWrapper title="About the Pilot" icon={ClipboardList} slideNum={3}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p>The About the Pilot page contains everything students and teachers need to know about the programme.</p>
      <div className="space-y-3">
        {[
          { title: "Your Checklist", desc: "Students see their progress — pre-pilot survey, 4-week check-in, and post-pilot survey status." },
          { title: "How Points Work", desc: "Explains the points system — 10 base points per session, +5 for 3 sessions/week, +10 for 5 distinct days/week." },
          { title: "Level Progression", desc: "Shows the 5 levels: Kickstand → Pedal Pusher → Gear Shifter → Chain Breaker → Freewheeler." },
          { title: "What the Pilot Measures", desc: "Covers what data is collected and how it helps improve the programme." },
        ].map((s) => (
          <div key={s.title} className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">{s.title}</p>
            <p className="mt-1 text-foreground/70">{s.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-foreground/60 italic">
        Click through each section in the About the Pilot page to familiarise yourself.
      </p>
    </div>
  </SlideWrapper>
);

const Slide4 = () => (
  <SlideWrapper title="Setup Instructions" icon={FileDown} slideNum={4}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p>
        The Setup Instructions page (found under the "About the Pilot" dropdown) has a complete
        step-by-step guide for getting students onboard.
      </p>
      <div className="border-[3px] border-primary bg-card p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">
          Download as PDF
        </p>
        <p className="mt-2 text-foreground/70">
          Click the <span className="font-bold">"Download as PDF"</span> button at the top of the Setup Instructions page.
          This opens a print-ready version — use your browser's <span className="font-bold">Print → Save as PDF</span> option.
        </p>
        <p className="mt-2 text-foreground/70">
          Print this out and keep it in the room with the bikes as a quick reference for students and support staff.
        </p>
      </div>
      <div className="border-l-4 border-accent bg-card px-4 py-3">
        <p className="text-foreground/70">
          The instructions cover: student registration, permission forms, account creation, the pre-pilot survey,
          and how to log each riding session.
        </p>
      </div>
    </div>
  </SlideWrapper>
);

const Slide5 = () => (
  <SlideWrapper title="Leaderboards" icon={Trophy} slideNum={5}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p>
        As a teacher, you can see <span className="font-bold">all schools</span> in the league and the top riders across the programme.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">Time View</p>
          <p className="mt-2 text-foreground/70">See total time on the bike for each school and rider.</p>
        </div>
        <div className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">Points View</p>
          <p className="mt-2 text-foreground/70">See accumulated points — default view, sorted by total points.</p>
        </div>
      </div>
      <div className="border-l-4 border-accent bg-card px-4 py-3">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">How Points Are Earned</p>
        <ul className="mt-2 space-y-1 text-foreground/70">
          <li>• <span className="font-semibold">10 points</span> per logged session</li>
          <li>• <span className="font-semibold">+5 bonus</span> for 3 sessions in a week</li>
          <li>• <span className="font-semibold">+10 bonus</span> for 5 distinct days in a week</li>
        </ul>
      </div>
    </div>
  </SlideWrapper>
);

const Slide6 = () => (
  <SlideWrapper title="Teacher Dashboard" icon={BarChart3} slideNum={6}>
    <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
      <p>Your Teacher Dashboard gives you a complete view of your school's students.</p>
      <div className="space-y-3">
        {[
          { title: "Student Overview", desc: "See all registered students, their total sessions, total time, and points at a glance." },
          { title: "Survey Tracking", desc: "Check which students have completed their pre-pilot survey, 4-week check-in, and post-pilot survey." },
          { title: "Recent Sessions", desc: "View the latest ride submissions from your students." },
          { title: "Teacher Observations", desc: "Submit observations about student attitude, confidence, and engagement changes." },
          { title: "Nudge Inactive Students", desc: "Send a gentle reminder to students who haven't logged a session recently." },
        ].map((s) => (
          <div key={s.title} className="border-[3px] border-secondary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">{s.title}</p>
            <p className="mt-1 text-foreground/70">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="border-l-4 border-accent bg-card px-4 py-3">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Survey Timeline</p>
        <ul className="mt-2 space-y-1 text-foreground/70">
          <li>• <span className="font-semibold">Pre-Pilot Survey</span> — completed on first login</li>
          <li>• <span className="font-semibold">4-Week Check-In</span> — pops up 4 weeks after account creation</li>
          <li>• <span className="font-semibold">Post-Pilot Survey</span> — appears on student's About checklist page (not auto-prompted)</li>
        </ul>
      </div>
    </div>
  </SlideWrapper>
);

const slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];

const Webinar = () => {
  const [current, setCurrent] = useState(0);
  const SlideComponent = slides[current];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b-4 border-secondary">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <img src={brandLogo} alt="Free Wheeler" className="h-12 w-auto rounded" />
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wider text-primary-foreground">
              Teacher Webinar
            </h1>
            <p className="font-body text-xs text-primary-foreground/70">
              Free Wheeler Bike League — Onboarding
            </p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex h-2 overflow-hidden bg-secondary/50">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex-1 transition-colors ${i <= current ? "bg-accent" : "bg-muted"} ${i < slides.length - 1 ? "mr-0.5" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Slide content */}
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="border-[3px] border-secondary bg-card p-6 shadow-[6px_6px_0px_hsl(var(--brand-dark))] md:p-8">
          <SlideComponent />
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="border-2 border-secondary font-display text-sm uppercase tracking-wider"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <span className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {current + 1} / {TOTAL_SLIDES}
          </span>
          <Button
            onClick={() => setCurrent((c) => Math.min(TOTAL_SLIDES - 1, c + 1))}
            disabled={current === TOTAL_SLIDES - 1}
            className="tape-element-green transition-transform hover:rotate-0 hover:scale-105"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </main>

      <footer className="border-t-4 border-primary bg-secondary px-4 py-6">
        <div className="container mx-auto text-center">
          <p className="font-display text-sm font-bold uppercase text-accent">
            Free Wheeler Bike League
          </p>
          <p className="mt-1 font-body text-xs text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Webinar;
