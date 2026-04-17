import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";

const steps = [
  {
    n: "1",
    title: "Tap In",
    lines: [
      "Tap your NFC bracelet on the blue reader near the bikes.",
      "No bracelet? Scan the QR code on your backup card.",
    ],
  },
  {
    n: "2",
    title: "Open MyWhoosh",
    lines: [
      "Pick up the iPad. Open the MyWhoosh app.",
      "Choose your route and get ready to ride.",
    ],
  },
  {
    n: "3",
    title: "Ride",
    lines: [
      "Hop on the bike and start pedalling.",
      "Every session earns at least 10 points.",
      "Bonus points for speed, elevation, and new tracks.",
    ],
  },
  {
    n: "4",
    title: "Finish + Log",
    lines: [
      "Complete your ride in MyWhoosh.",
      "Take a screenshot of your results (top button + volume up on iPad).",
      "Your session is automatically logged from when you tapped in.",
    ],
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
        .a3-poster {
          width: 297mm;
          height: 420mm;
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

      {/* A3 Poster */}
      <div className="flex justify-center pb-12 print:pb-0">
        <div className="a3-poster bg-card border-[6px] border-secondary shadow-[8px_8px_0px_hsl(var(--brand-dark))] flex flex-col px-10 py-8">
          {/* Header */}
          <div className="flex flex-col items-center">
            <img src={logo} alt="Freewheeler" className="h-28 w-auto object-contain" />
            <h1
              className="font-display font-black uppercase text-foreground leading-none mt-4"
              style={{ fontSize: "90pt", letterSpacing: "0.02em" }}
            >
              How To Ride
            </h1>
            <p className="font-display uppercase tracking-wider text-foreground/80 mt-2 text-2xl">
              Follow these steps every session
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-2 gap-6 mt-8 flex-1">
            {steps.map((s) => (
              <div
                key={s.n}
                className="bg-card border-[5px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))] p-6 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="bg-primary text-primary-foreground font-display font-black flex items-center justify-center border-[4px] border-secondary"
                    style={{ width: "70px", height: "70px", fontSize: "40pt", lineHeight: 1 }}
                  >
                    {s.n}
                  </div>
                  <h2
                    className="font-display font-black uppercase text-foreground leading-none"
                    style={{ fontSize: "30pt" }}
                  >
                    Step {s.n} — {s.title}
                  </h2>
                </div>
                <div className="space-y-2 mt-2">
                  {s.lines.map((l, i) => (
                    <p
                      key={i}
                      className="font-display uppercase tracking-wide text-foreground leading-snug"
                      style={{ fontSize: "16pt" }}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Points strip */}
          <div className="mt-6 bg-primary text-primary-foreground border-[4px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))] py-4 px-4 text-center">
            <p
              className="font-display font-black uppercase tracking-wider"
              style={{ fontSize: "20pt", lineHeight: 1.1 }}
            >
              10 pts every ride · +5 for 3 sessions/week · Bonus pts for speed + elevation
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p
              className="font-display uppercase tracking-widest text-foreground/80"
              style={{ fontSize: "13pt" }}
            >
              freewheelerleague.com · Book a bike: freewheelerleague.com/book
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeInstructions;
