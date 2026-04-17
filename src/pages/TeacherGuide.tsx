import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";

const Box = () => (
  <span
    className="inline-block border border-black align-middle mr-2"
    style={{ width: "14px", height: "14px" }}
  />
);

const Section = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-6 break-inside-avoid">
    <h2 className="font-display font-bold uppercase tracking-wide text-base border-b-2 border-black pb-1 mb-3">
      Section {number} — {title}
    </h2>
    <div className="space-y-2">{children}</div>
  </section>
);

const TeacherGuide = () => {
  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 18mm 15mm 18mm 15mm;
        }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; color: black !important; }
          .no-print { display: none !important; }
          .guide-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          .guide-page * { color: black !important; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .print-header, .print-footer {
            position: fixed;
            left: 0;
            right: 0;
          }
          .print-header { top: 0; }
          .print-footer { bottom: 0; }
        }
        .guide-page {
          width: 210mm;
          min-height: 297mm;
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print container mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm px-4 py-2 rounded-md hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="flex justify-center pb-12 print:pb-0">
        <div className="guide-page bg-white text-black p-12 shadow-lg font-body text-[10.5pt] leading-relaxed">
          {/* Header */}
          <header className="flex items-start gap-4 border-b-2 border-black pb-3">
            <img src={logo} alt="Freewheeler" className="h-16 w-auto object-contain" />
            <div className="flex-1">
              <h1 className="font-display font-black uppercase tracking-wider text-xl text-black leading-tight">
                Teacher Quick-Start Guide
              </h1>
              <p className="text-xs mt-1">Season 2026 — Delivered by Sport Waikato</p>
            </div>
          </header>

          <Section number={1} title="What is Freewheeler?">
            <p>
              Freewheeler is a cycling league for secondary school students. Students ride
              Wattbike Proton smart bikes at school using the MyWhoosh cycling app, logging
              each session via an NFC bracelet. Points accumulate over an 8-week season and
              schools compete on a leaderboard. No travel, no competition dates, no
              volunteering required — students ride on their own schedule.
            </p>
          </Section>

          <Section number={2} title="What Your School Receives">
            <ul className="list-disc pl-6 space-y-1">
              <li>2 x Wattbike Proton smart bikes (on loan for season duration)</li>
              <li>2 x iPads, pre-loaded with MyWhoosh</li>
              <li>Power multibox + 5m extension lead</li>
              <li>NFC bracelets for each registered student</li>
              <li>QR backup cards (one per student)</li>
              <li>This teacher guide and promotional resources</li>
            </ul>
          </Section>

          <Section number={3} title="Your Pre-Season Checklist">
            <ul className="space-y-2">
              <li><Box /> Sign and return the MoU to Sport Waikato</li>
              <li><Box /> Promote Freewheeler to Year 9-13 students</li>
              <li><Box /> Send home the caregiver consent form</li>
              <li><Box /> Collect signed consent forms</li>
              <li><Box /> Email Sport Waikato a list: first name, last initial, year level (consented students only)</li>
              <li><Box /> Set up bikes (needs power outlet, space for 2 bikes side by side)</li>
              <li><Box /> Test MyWhoosh opens on each iPad</li>
              <li><Box /> Confirm NFC reader works (bracelet tap opens freewheelerleague.com/tap)</li>
              <li><Box /> Distribute NFC bracelets and QR backup cards to consented students</li>
            </ul>
          </Section>

          <Section number={4} title="How Students Log In">
            <p><strong>Step 1:</strong> Student taps NFC bracelet on the reader near the bikes.</p>
            <p><strong>Step 2:</strong> Browser opens freewheelerleague.com/tap (their unique link).</p>
            <p><strong>Step 3:</strong> First time — a short 6-step onboarding tour runs (about 2 minutes).</p>
            <p><strong>Step 4:</strong> Student sees "Log a Ride" and "See My Dash" buttons.</p>
            <p><strong>Step 5:</strong> After riding, student taps "Log a Ride" to record their session.</p>
            <p className="italic">No bracelet? Student scans the QR code on their backup card — same result.</p>
          </Section>

          <Section number={5} title="Booking Bikes">
            <p>
              Students book 30-minute slots at <strong>freewheelerleague.com/book</strong>.
              Select school, date, time (8:00am–4:30pm), and bike name. No email confirmation
              is sent — booking is confirmed on screen. Students can still log a ride without
              booking.
            </p>
          </Section>

          <Section number={6} title="How Points Work">
            <ul className="space-y-1">
              <li><strong>10 pts</strong> — base ride completion</li>
              <li><strong>+5 pts</strong> — completing 3 sessions in one week</li>
              <li><strong>+3 pts</strong> — first time riding a new track or course</li>
              <li><strong>Speed bonus:</strong> +2 (20–24 km/h), +5 (25–29 km/h), +10 (30+ km/h)</li>
              <li><strong>Elevation bonus:</strong> +2 (50–149m), +5 (150–299m), +10 (300m+)</li>
            </ul>
          </Section>

          <Section number={7} title="Season Dates + Leaderboard">
            <p><strong>Season:</strong> 31 Aug – 6 Nov 2026</p>
            <p><strong>Block 1:</strong> 31 Aug – 25 Sep &nbsp;|&nbsp; <strong>Break:</strong> 26 Sep – 11 Oct &nbsp;|&nbsp; <strong>Block 2:</strong> 12 Oct – 6 Nov</p>
            <p><strong>Leaderboard</strong> (students view after login): freewheelerleague.com/leaderboards</p>
          </Section>

          <Section number={8} title="Contacts + Support">
            <p><strong>Website:</strong> freewheelerleague.com</p>
            <p><strong>Student issue form:</strong> Report an Issue link in footer of freewheelerleague.com</p>
            <p><strong>Teacher/staff issue form:</strong> airtable.com/app4IEpE10xJPsLxT/shr6ZnS0qQyFkxCHH</p>
            <p><strong>Sport Waikato contact:</strong> [ADD CONTACT NAME + EMAIL BEFORE PRINTING]</p>
          </Section>

          {/* Footer */}
          <footer className="mt-10 pt-3 border-t border-black flex items-center justify-between text-[9pt]">
            <img src={logo} alt="" className="h-8 w-auto object-contain" />
            <span>Freewheeler Cycling League · Delivered by Sport Waikato · freewheelerleague.com</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TeacherGuide;
