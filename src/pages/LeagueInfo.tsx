import { Link } from "react-router-dom";
import { ArrowLeft, Bike, Clock, Trophy, AlertTriangle, Calendar, Users, Zap } from "lucide-react";
import logoSrc from "@/assets/fw-logo-oval.png";

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
        {title}
      </h2>
    </div>
    <div className="font-body text-sm leading-relaxed text-foreground/80 space-y-2">
      {children}
    </div>
  </div>
);

const LeagueInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="container mx-auto flex items-center px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* Header */}
      <header className="bg-secondary py-10 text-center">
        <img src={logoSrc} alt="Freewheeler Bike League" className="mx-auto mb-4 h-20 object-contain" />
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wider text-secondary-foreground md:text-4xl">
          What You're Signing Up For
        </h1>
        <p className="mt-2 font-body text-base text-secondary-foreground/70 max-w-sm mx-auto px-4">
          Read this before you register. It's short — promise.
        </p>
      </header>

      <div className="container mx-auto max-w-xl px-4 py-10 space-y-4">

        <Section icon={Bike} title="What is Freewheeler?">
          <p>
            Freewheeler is a cycling league for secondary school students across 7 Waikato schools.
            You ride on a <strong>Wattbike Proton</strong> smart bike at school using the <strong>MyWhoosh</strong> app on an iPad.
          </p>
          <p>
            Every ride earns you points. Points go on the leaderboard. Schools compete against each other across an 8-week season.
            No travel, no team selection, no trials — just ride when you can.
          </p>
        </Section>

        <Section icon={Calendar} title="When Does It Run?">
          <p>The season runs for <strong>8 weeks</strong> across Term 3 and Term 4, 2026:</p>
          <ul className="space-y-1 mt-1 pl-1">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 bg-primary" />
              <span><strong>Block 1:</strong> Mon 31 Aug – Thu 25 Sep 2026</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 bg-secondary" />
              <span><strong>Mid-season break:</strong> Fri 26 Sep – Sun 11 Oct 2026</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 bg-primary" />
              <span><strong>Block 2:</strong> Mon 12 Oct – Fri 6 Nov 2026</span>
            </li>
          </ul>
        </Section>

        <Section icon={Users} title="Your Commitment">
          <p>We're not asking much — but here's what we expect from you:</p>
          <ul className="space-y-1.5 mt-1 pl-1">
            {[
              "Turn up and ride regularly — the more you ride, the more points you earn",
              "Book a bike slot at freewheelerleague.com/book before your session",
              "Behave respectfully on MyWhoosh (it's a shared platform with real people)",
              "Look after the equipment — the bikes and iPads are on loan to your school",
              "Let your teacher know if anything is broken or not working",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Zap} title="How Points Work">
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              ["Every ride", "10 pts"],
              ["3 rides in a week", "+5 pts bonus"],
              ["New track / course", "+3 pts"],
              ["Speed 20–24 km/h", "+2 pts"],
              ["Speed 25–29 km/h", "+5 pts"],
              ["Speed 30+ km/h", "+10 pts"],
              ["Elevation 50–149m", "+2 pts"],
              ["Elevation 150–299m", "+5 pts"],
              ["Elevation 300m+", "+10 pts"],
            ].map(([label, pts]) => (
              <div key={label} className="flex items-center justify-between border border-border/40 px-3 py-2">
                <span className="text-xs text-foreground/70">{label}</span>
                <span className="font-display text-xs font-bold text-primary">{pts}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Clock} title="Spots Are Limited">
          <p>
            Only <strong>24 spots per school</strong> are available — first come, first served.
            Registering puts your name on the waitlist. Your spot is only confirmed once your caregiver
            has submitted the permission form AND you're within the first 24 registrations at your school.
          </p>
          <p>
            Once confirmed, Sport Waikato will put together your <strong>League Kit</strong> (NFC bracelet + starter pack)
            and deliver it to your school.
          </p>
        </Section>

        {/* Bracelet warning — highlighted box */}
        <div className="border-[3px] border-destructive bg-destructive/5 p-5 shadow-[4px_4px_0px_hsl(var(--destructive))]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-destructive mt-0.5" />
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wider text-destructive mb-2">
                Important — NFC Bracelet
              </h2>
              <div className="font-body text-sm leading-relaxed text-foreground/80 space-y-2">
                <p>
                  Your NFC bracelet is your login to Freewheeler. It gets delivered to school with your starter pack after your caregiver's permission is received.
                </p>
                <p className="font-semibold text-destructive">
                  Lost bracelets will NOT be replaced.
                </p>
                <p>
                  You will be given a QR code backup card at the same time — keep this safe too. If you lose both, you will not be able to log sessions for the rest of the season.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Section icon={Trophy} title="No Cost — Ever">
          <p>
            Freewheeler is completely free. There is no entry fee, no equipment hire fee, and no hidden costs.
            The bikes, iPads, and equipment are provided to your school by Sport Waikato for the duration of the season.
          </p>
          <p>
            Freewheeler is delivered by <strong>Sport Waikato</strong> as a pilot for 7 Waikato secondary schools.
          </p>
        </Section>

        {/* CTA back to register */}
        <div className="pt-2 text-center">
          <Link
            to="/"
            className="tape-element-green inline-block px-8 py-3 font-display text-base uppercase tracking-wider"
          >
            Back to Registration
          </Link>
          <p className="mt-3 font-body text-xs text-muted-foreground">
            Still have questions? Ask your teacher or visit{" "}
            <a href="https://freewheelerleague.com/programme-overview" className="underline">
              freewheelerleague.com/programme-overview
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-secondary px-4 py-8 mt-8">
        <div className="container mx-auto text-center">
          <div className="font-display text-sm font-bold uppercase text-accent">
            Freewheeler Cycling League
          </div>
          <p className="mt-1 font-body text-xs text-secondary-foreground/60">
            Pedal Your Own Path · Delivered by Sport Waikato · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LeagueInfo;
