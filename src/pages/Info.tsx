import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import { Target, BarChart3, Calendar, ClipboardList, MessageSquare, Heart } from "lucide-react";

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

const Info = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
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
              <p>
                Free Wheeler combines indoor cycling, digital racing, and real-time feedback to create an experience that is competitive, accessible, and student-driven.
              </p>
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
              <p>
                Many rangatahi disengage from traditional sport due to structure, pressure, or lack of perceived ability.
              </p>

              <p className="font-semibold text-accent">Free Wheeler offers:</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {["Low barrier to entry", "Self-paced challenge", "Individual progress tracking", "Inclusive participation", "A new pathway into physical activity"].map((item) => (
                  <div key={item} className="border-2 border-accent/30 bg-secondary px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-accent">
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

              <p>
                The data collected will determine how Free Wheeler can grow sustainably within schools.
              </p>
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
              {/* Vertical line */}
              <div className="absolute left-5 top-0 h-full w-1 bg-primary/30" />

              {timelinePhases.map((phase, i) => (
                <div key={phase.phase} className="relative pb-10 pl-14 last:pb-0">
                  {/* Dot */}
                  <div className="absolute left-3 top-1 h-5 w-5 border-[3px] border-primary bg-background" />

                  <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                    <div className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-primary">
                      {phase.phase}
                    </div>
                    <h3 className="mb-3 font-display text-lg font-bold uppercase text-foreground">
                      {phase.title}
                    </h3>
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

      {/* How Data Is Collected */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <ClipboardList className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground">
                How Data Is Collected
              </h2>
            </div>

            <div className="space-y-5 font-body text-base leading-relaxed text-secondary-foreground/90">
              <p>To ensure this pilot is evidence-based, students will:</p>
              <ul className="space-y-2 pl-1">
                {[
                  "Log their cycling session data",
                  "Complete a short post-session reflection",
                  "Participate in pre- and post-pilot surveys",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Teachers may also complete short observation forms to help measure engagement and impact.
              </p>
              <p>All data is used to evaluate the effectiveness of the programme.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Surveys & Feedback */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
                Surveys & Feedback
              </h2>
            </div>

            <div className="font-body text-base leading-relaxed text-foreground/90">
              <p className="mb-5">You can access the surveys below:</p>
              <div className="space-y-3">
                <Link
                  to="/post-pilot-survey"
                  className="block border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] transition-transform hover:translate-x-1 hover:-translate-y-1"
                >
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    Post-Pilot Survey
                  </h3>
                  <p className="mt-1 font-body text-sm text-primary">
                    Click here to complete →
                  </p>
                </Link>
                <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    Teacher Observation Form
                  </h3>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    Available under the admin login
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center bg-accent">
                <Heart className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
            <h2 className="mb-8 font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground md:text-4xl">
              Our Vision
            </h2>

            <div className="space-y-4 font-body text-lg leading-relaxed text-secondary-foreground/90">
              <p className="font-semibold text-accent">
                Free Wheeler isn't just about cycling.
              </p>
              <p>
                It's about creating a pathway for rangatahi to move on their own terms.
              </p>
              <p>To build confidence.</p>
              <p>To find enjoyment in effort.</p>
              <p>To feel part of something different.</p>
            </div>

            <div className="mt-10 inline-block tape-element-green px-8 py-4">
              <span className="font-display text-2xl font-extrabold uppercase tracking-wider">
                Pedal Your Own Path.
              </span>
            </div>
          </div>
        </div>
      </section>

      <CTASection />

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

export default Info;
