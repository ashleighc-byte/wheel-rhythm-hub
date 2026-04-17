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
  footnote?: React.ReactNode;
};

const steps: Step[] = [
  {
    n: "1",
    title: "Tap In",
    body: (
      <>
        Scan your bracelet on the iPad to confirm today's booking and that
        you're on the <span className="bg-primary text-primary-foreground px-1">right bike</span>.
        Check the bike label sticker.
      </>
    ),
    footnote: <>Need a slot? <span className="underline">freewheelerleague.com/book</span></>,
  },
  {
    n: "2",
    title: "Pick Your Ride",
    body: (
      <>
        Open the <strong>MyWhoosh</strong> app on the iPad (it stays
        secured to the bike). Choose a route — try <strong>Free Ride</strong>,{" "}
        <strong>MyBunch</strong> or <strong>Zombie Escape</strong>.
      </>
    ),
    screenshot: mainScreen,
    screenshotAlt: "MyWhoosh main menu",
    footnote: <>More tracks + more elevation = more points!</>,
  },
  {
    n: "3",
    title: "Send It",
    body: (
      <>
        Hop on and start pedalling. Your avatar rides with cyclists from
        around the world. Push hard for speed + elevation bonuses.
      </>
    ),
    screenshot: rideScreen,
    screenshotAlt: "Riding in MyWhoosh",
    footnote: <>10 pts every ride · bonus for speed + climbing</>,
  },
  {
    n: "4",
    title: "Snap + Log",
    body: (
      <>
        At the end of your ride, screenshot the <strong>finish summary</strong>{" "}
        screen (looks like this →). Then tap your bracelet again, hit{" "}
        <strong>Log a Ride</strong> and upload it.
      </>
    ),
    screenshot: finishScreen,
    screenshotAlt: "MyWhoosh ride summary",
    footnote: <>No screenshot = no points. Don't forget!</>,
  },
];

const BikeInstructions = () => {
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
        <div className="a3-poster relative bg-card border-[6px] border-secondary shadow-[8px_8px_0px_hsl(var(--brand-dark))] flex flex-col px-10 py-8 overflow-hidden">
          {/* Decorative brand marks */}
          <img
            src={pedalPath}
            alt=""
            aria-hidden="true"
            className="absolute -top-6 -right-8 w-[180px] opacity-90 -rotate-6 z-0"
          />
          <img
            src={pedalPath}
            alt=""
            aria-hidden="true"
            className="absolute -bottom-10 -left-10 w-[170px] opacity-90 rotate-[200deg] z-0"
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between">
            <img src={logo} alt="Freewheeler" className="h-24 w-auto object-contain" />
            <div className="text-right">
              <h1
                className="font-display font-black uppercase text-foreground leading-none"
                style={{ fontSize: "78pt", letterSpacing: "0.02em" }}
              >
                Ride Guide
              </h1>
              <p className="font-display uppercase tracking-wider text-foreground/80 mt-2 text-2xl">
                4 steps · every session
              </p>
            </div>
          </div>

          {/* Steps grid */}
          <div className="relative z-10 grid grid-cols-2 gap-5 mt-7 flex-1">
            {steps.map((s, idx) => (
              <div
                key={s.n}
                className={`relative bg-card border-[5px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))] p-5 flex flex-col ${
                  idx % 2 === 0 ? "rotate-[-0.4deg]" : "rotate-[0.4deg]"
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="bg-primary text-primary-foreground font-display font-black flex items-center justify-center border-[4px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
                    style={{ width: "78px", height: "78px", fontSize: "44pt", lineHeight: 1 }}
                  >
                    {s.n}
                  </div>
                  <h2
                    className="font-display font-black uppercase text-foreground leading-none"
                    style={{ fontSize: "32pt" }}
                  >
                    {s.title}
                  </h2>
                </div>

                {s.screenshot ? (
                  <div className="flex gap-4 flex-1">
                    <p
                      className="font-body text-foreground leading-snug flex-1"
                      style={{ fontSize: "15pt" }}
                    >
                      {s.body}
                    </p>
                    <div className="w-[42%] flex-shrink-0 border-[3px] border-secondary shadow-[3px_3px_0px_hsl(var(--brand-dark))] bg-secondary/10 overflow-hidden self-start">
                      <img
                        src={s.screenshot}
                        alt={s.screenshotAlt ?? ""}
                        className="w-full h-auto object-cover block"
                      />
                    </div>
                  </div>
                ) : (
                  <p
                    className="font-body text-foreground leading-snug flex-1"
                    style={{ fontSize: "16pt" }}
                  >
                    {s.body}
                  </p>
                )}

                {s.footnote && (
                  <div
                    className="mt-3 bg-secondary/10 border-l-[5px] border-primary px-3 py-2 font-display uppercase tracking-wide text-foreground"
                    style={{ fontSize: "12pt" }}
                  >
                    {s.footnote}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hype banner */}
          <div className="relative z-10 mt-5 bg-primary text-primary-foreground border-[4px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))] py-4 px-6 flex items-center justify-between gap-4">
            <p
              className="font-display font-black uppercase tracking-wider leading-none"
              style={{ fontSize: "22pt" }}
            >
              Ride · Earn · Climb the leaderboard
            </p>
            <p
              className="font-display uppercase tracking-wider leading-none text-right"
              style={{ fontSize: "14pt" }}
            >
              10 pts / ride<br />
              +bonus speed & elevation
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-4 flex items-end justify-between">
            <img src={wordmark} alt="Freewheeler" className="h-14 w-auto object-contain" />
            <p
              className="font-display uppercase tracking-widest text-foreground/80 text-right"
              style={{ fontSize: "13pt" }}
            >
              freewheelerleague.com<br />
              Book a bike: /book
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeInstructions;
