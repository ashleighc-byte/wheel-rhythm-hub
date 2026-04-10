import { Link } from "react-router-dom";
import { ArrowLeft, Bike, Users, Trophy, Target, Calendar, CheckCircle2, Zap, Globe } from "lucide-react";
import logoSrc from "@/assets/fw-logo-oval.png";
import brandPedalPath from "@/assets/brand-pedal-your-path.png";
import brandWordmark from "@/assets/fw-wordmark.png";
import brandBikeIcon from "@/assets/brand-bike-icon.png";
import stripeBg from "@/assets/stripe-bg-1.png";

const ProgrammeOverview = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Screen-only nav */}
      <div className="print:hidden container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <button
          onClick={handlePrint}
          className="tape-element-green px-6 py-2 font-display text-sm uppercase"
        >
          Download as PDF
        </button>
      </div>

      {/* Header */}
      <header className="relative overflow-hidden bg-secondary py-12 print:py-8">
        <div className="absolute inset-0 print:hidden">
          <img src={stripeBg} alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/90 to-secondary/70" />
        </div>
        <div className="container relative mx-auto flex flex-col items-center px-4 text-center">
          <img src={logoSrc} alt="Free Wheeler" className="mb-4 h-20 object-contain print:h-16" />
          <img src={brandWordmark} alt="Freewheeler" className="mb-4 h-12 object-contain print:h-10" />
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wider text-secondary-foreground md:text-4xl">
            Programme Overview
          </h1>
          <p className="mt-2 max-w-xl font-body text-base text-secondary-foreground/80">
            A virtual cycling league for secondary school students — delivered in the Waikato by Sport Waikato.
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-10 print:py-6">
        {/* What is Freewheeler */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-primary print:border print:border-primary print:bg-transparent">
              <Bike className="h-5 w-5 text-primary-foreground print:text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              What is Freewheeler?
            </h2>
          </div>
          <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/90">
            <p>
              Freewheeler is a new virtual cycling league developed in the Waikato to meet young people where they are, and to reimagine what school sport can look like. It is purposefully designed to remove many traditional barriers facing school sports administration and participation.
            </p>
            <p>
              Delivered through <strong>MyWhoosh</strong>, an online cycling platform, students complete rides and challenges at school, on a schedule that works for them, with points accumulated across the season. Rather than requiring travel, large numbers of volunteers, burdensome paperwork and fixed competition times, Freewheeler offers a more flexible and accessible format that can work alongside the realities facing schools, sports coordinators, and students in modern life.
            </p>
          </div>
        </section>

        {/* Why are we doing this */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-accent print:border print:border-accent print:bg-transparent">
              <Target className="h-5 w-5 text-accent-foreground print:text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              Why Are We Doing This?
            </h2>
          </div>
          <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/90">
            <p>
              Offering extra-curricular activities and opportunities to be active is more important than ever, but the landscape of youth sport participation has changed. Young people are increasingly drawn to activities that are flexible, social, and less structured.
            </p>
            <p>
              At the same time, traditional school sports offerings are under pressure from rising transport costs, stretched staff capacity, busy calendars, and reduced volunteer support.
            </p>
            <p>
              Freewheeler is an opportunity to trial a different sport model — one that lowers barriers for students, reduces the administration load on schools, and creates a sport experience that feels modern, engaging, and inclusive.
            </p>
          </div>
        </section>

        {/* What the pilot includes */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-primary print:border print:border-primary print:bg-transparent">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground print:text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              What the Pilot Includes
            </h2>
          </div>
          <p className="mb-3 font-body text-sm text-foreground/90">
            As a pilot school, your school will receive:
          </p>
          <ul className="space-y-2 font-body text-sm text-foreground/90">
            {[
              "2 × smart bikes, provided free of charge for the duration of the pilot, and for longer if the league continues",
              "Access to the Freewheeler pilot season in 2026",
              "All league challenges and content delivered digitally (via student email)",
              "Promotional material and support from Sport Waikato",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What we need from schools */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-accent print:border print:border-accent print:bg-transparent">
              <Users className="h-5 w-5 text-accent-foreground print:text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              What We Need From Schools
            </h2>
          </div>
          <p className="mb-3 font-body text-sm text-foreground/90">
            We are intentionally keeping the ask on schools light. We do not expect schools to run the league, provide volunteers, or take on a large amount of extra work. The main things we need are:
          </p>
          <ul className="space-y-2 font-body text-sm text-foreground/90">
            {[
              "Commitment and support in promoting the opportunity to students",
              "Adherence to the agreed Memorandum of Understanding",
              "A willingness to help us test and learn from the pilot",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pilot League Overview */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-primary print:border print:border-primary print:bg-transparent">
              <Calendar className="h-5 w-5 text-primary-foreground print:text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              Pilot League Overview
            </h2>
          </div>
          <p className="mb-3 font-body text-sm text-foreground/90">
            The current league pilot is planned to include:
          </p>
          <ul className="space-y-2 font-body text-sm text-foreground/90">
            {[
              "7 Waikato schools",
              "An 8-week season, targeted for Term 2 and Term 3, 2026",
              "No participation fee for schools or students",
              "Students riding at school and competing on their own schedule",
              "Points accumulated across the season through virtual challenges",
              "Registration limited to the first 24 students per school",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Looking Ahead */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-accent print:border print:border-accent print:bg-transparent">
              <Globe className="h-5 w-5 text-accent-foreground print:text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              Looking Ahead
            </h2>
          </div>
          <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/90">
            <p>
              This pilot will help us understand student interest, participation levels, and the potential for a wider rollout. If successful, Freewheeler could expand across the Waikato, opening opportunities for schools to compete regionally, nationally, and potentially internationally — all without leaving the school gates.
            </p>
            <p>
              We believe Freewheeler is a chance to be part of something genuinely new: a school sport format built for the next generation.
            </p>
          </div>
        </section>

        {/* Points System summary */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-primary print:border print:border-primary print:bg-transparent">
              <Zap className="h-5 w-5 text-primary-foreground print:text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              How Points Work
            </h2>
          </div>
          <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] print:shadow-none print:border">
            <ul className="space-y-2 font-body text-sm text-foreground/90">
              <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" /><span><strong>10 points</strong> for every completed ride session</span></li>
              <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" /><span><strong>+5 bonus</strong> when you complete 3 sessions in a week</span></li>
              <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-accent" /><span><strong>Elevation bonus</strong>: +2 (50–149m), +5 (150–299m), +10 (300m+)</span></li>
              <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-accent" /><span><strong>Speed bonus</strong>: +2 (20–24 km/h), +5 (25–29 km/h), +10 (30+ km/h)</span></li>
              <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-primary" /><span><strong>+3 points</strong> for each unique track/course ridden</span></li>
            </ul>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-secondary px-4 py-8 print:border-t print:py-4">
        <div className="container mx-auto text-center">
          <img src={logoSrc} alt="Free Wheeler" className="mx-auto mb-3 h-12 object-contain print:h-10" />
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-1 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · Delivered by Sport Waikato · © 2026
          </p>
          <p className="mt-2 font-body text-xs text-secondary-foreground/40">
            freewheeler.lovable.app
          </p>
        </div>
      </footer>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
};

export default ProgrammeOverview;
