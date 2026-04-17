import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";
import wordmark from "@/assets/freewheeler-wordmark.png";
import pedalPath from "@/assets/pedal-your-own-path.png";
import mainScreen from "@/assets/mywhoosh-main-screen.jpg";
import rideScreen from "@/assets/mywhoosh-ride-screen.jpg";
import finishScreen from "@/assets/mywhoosh-finish-screen.png";

type Step = {
  n: string;
  title: string;
  body: React.ReactNode;
  screenshot?: string;
  screenshotAlt?: string;
  screenshotCaption?: React.ReactNode;
  footnote: React.ReactNode;
};

const steps: Step[] = [
  {
    n: "1",
    title: "TAP IN",
    body: (
      <>
        Scan your bracelet on the iPad to confirm today's booking and that
        you're on the right bike.
        <br />
        <br />
        Check the bike label sticker.
      </>
    ),
    footnote: (
      <>
        NEED A SLOT?
        <br />
        FREEWHEELERLEAGUE.COM/BOOK
      </>
    ),
  },
  {
    n: "2",
    title: "PICK YOUR RIDE",
    body: <>Open the MyWhoosh app on the iPad (it stays secured to the bike).</>,
    screenshot: mainScreen,
    screenshotAlt: "MyWhoosh main menu",
    screenshotCaption: (
      <>
        Choose a route — try <strong>Free Ride</strong>,{" "}
        <strong>MyBunch</strong> or <strong>Zombie Escape</strong>.
      </>
    ),
    footnote: <>MORE TRACKS + MORE ELEVATION = MORE POINTS!</>,
  },
  {
    n: "3",
    title: "RIDE",
    body: <>Hop on and start pedalling.</>,
    screenshot: rideScreen,
    screenshotAlt: "Riding in MyWhoosh",
    screenshotCaption: <>Your avatar rides with cyclists from around the world.</>,
    footnote: <>10 PTS EVERY RIDE · BONUS FOR SPEED + CLIMBING</>,
  },
  {
    n: "4",
    title: "SNAP + LOG",
    body: (
      <>
        At the end of your ride, screenshot the finish summary screen (looks
        like this →).
      </>
    ),
    screenshot: finishScreen,
    screenshotAlt: "MyWhoosh ride summary",
    screenshotCaption: <>Then tap your bracelet again, hit Log a Ride and upload it.</>,
    footnote: (
      <>
        NO SCREENSHOT = NO POINTS.
        <br />
        DON'T FORGET!
      </>
    ),
  },
];

const ECHO_BORDER = "border-[6px] border-[hsl(var(--brand-dark))] shadow-[10px_10px_0px_hsl(var(--brand-dark))]";
const ECHO_BORDER_SM = "border-[5px] border-[hsl(var(--brand-dark))] shadow-[7px_7px_0px_hsl(var(--brand-dark))]";

const RideGuide = () => {
  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A3 portrait; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .a3-poster {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
        }
        .a3-poster { width: 297mm; height: 420mm; }
      `}</style>

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
        <div className={`a3-poster relative bg-card ${ECHO_BORDER} flex flex-col px-8 py-7 overflow-hidden`}>
          {/* Decorative pedal-your-own-path stickers */}
          <img
            src={pedalPath}
            alt=""
            aria-hidden="true"
            className="absolute top-2 right-4 w-[220px] rotate-[12deg] z-0 pointer-events-none"
          />
          <img
            src={pedalPath}
            alt=""
            aria-hidden="true"
            className="absolute bottom-3 left-3 w-[200px] -rotate-[14deg] z-0 pointer-events-none"
          />

          {/* Header */}
          <div className="relative z-10 flex items-start gap-6">
            <img src={logo} alt="Freewheeler" className="h-44 w-auto object-contain flex-shrink-0" />
            <div className="flex-1 pt-1">
              <h1
                className="font-display font-black uppercase text-foreground leading-[0.9]"
                style={{ fontSize: "108pt", letterSpacing: "-0.01em" }}
              >
                RIDE GUIDE
              </h1>
              <p
                className="font-display text-foreground mt-3"
                style={{ fontSize: "20pt", lineHeight: 1.15 }}
              >
                <span className="font-black uppercase">HAVING TROUBLE?</span> Report an issue
                <br />
                www.freewheelerleague.com/help
              </p>
            </div>
          </div>

          {/* Steps grid */}
          <div className="relative z-10 grid grid-cols-2 gap-6 mt-6 flex-1">
            {steps.map((s) => (
              <div key={s.n} className={`relative bg-card ${ECHO_BORDER_SM} p-5 flex flex-col`}>
                <div className="flex items-baseline gap-4 mb-3">
                  <span
                    className="font-display font-black text-primary leading-none"
                    style={{
                      fontSize: "72pt",
                      WebkitTextStroke: "2px hsl(var(--brand-dark))",
                      textShadow: "5px 5px 0px hsl(var(--brand-dark))",
                    }}
                  >
                    {s.n}
                  </span>
                  <h2
                    className="font-display font-black uppercase text-foreground leading-none"
                    style={{ fontSize: "40pt" }}
                  >
                    {s.title}
                  </h2>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <p className="font-body text-foreground leading-snug" style={{ fontSize: "17pt" }}>
                    {s.body}
                  </p>

                  {s.screenshot && (
                    <div className="flex justify-center">
                      <div className={`bg-secondary/10 overflow-hidden ${ECHO_BORDER_SM}`} style={{ maxWidth: "75%" }}>
                        <img
                          src={s.screenshot}
                          alt={s.screenshotAlt ?? ""}
                          className="w-full h-auto object-cover block"
                        />
                      </div>
                    </div>
                  )}

                  {s.screenshotCaption && (
                    <p
                      className="font-body text-foreground leading-snug text-center"
                      style={{ fontSize: "15pt" }}
                    >
                      {s.screenshotCaption}
                    </p>
                  )}
                </div>

                <div
                  className="mt-3 border-l-[6px] border-primary pl-3 py-1 font-display font-black uppercase tracking-wide text-foreground"
                  style={{ fontSize: "13pt", lineHeight: 1.2 }}
                >
                  {s.footnote}
                </div>
              </div>
            ))}
          </div>

          {/* Hype banner */}
          <div className={`relative z-10 mt-5 bg-card ${ECHO_BORDER_SM} py-4 px-6 flex items-center justify-between gap-4`}>
            <p
              className="font-display font-black uppercase tracking-wider leading-none text-foreground"
              style={{ fontSize: "26pt" }}
            >
              RIDE 🚴 EARN 🚴 CLIMB THE LEADERBOARD
            </p>
            <p
              className="font-display font-black uppercase tracking-wider leading-tight text-right text-foreground"
              style={{ fontSize: "13pt" }}
            >
              10 PTS / RIDE
              <br />
              + BONUS SPEED &amp; ELEVATION
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-5 flex items-end justify-between gap-4">
            <div className="w-[180px]" />
            <img src={wordmark} alt="Freewheeler" className="h-16 w-auto object-contain" />
            <p
              className="font-display font-black uppercase tracking-widest text-foreground text-right"
              style={{ fontSize: "13pt", lineHeight: 1.3 }}
            >
              BOOK A BIKE
              <br />
              FREEWHEELERLEAGUE.COM/BOOK
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideGuide;
