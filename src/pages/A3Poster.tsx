import { Link } from "react-router-dom";
import { Bike, Trophy, Users, Printer, ArrowLeft } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";
import wordmark from "@/assets/fw-wordmark.png";
import stripeBg from "@/assets/stripe-bg-1.png";

const A3Poster = () => {
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
          position: relative;
          overflow: hidden;
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
        <div className="a3-poster bg-card border-[6px] border-secondary shadow-[8px_8px_0px_hsl(var(--brand-dark))] flex flex-col">
          {/* Stripe overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${stripeBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.08,
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-12 py-10">
            {/* Logo + wordmark */}
            <div className="flex flex-col items-center gap-4">
              <img src={logo} alt="Freewheeler" className="h-40 w-auto object-contain" />
              <img src={wordmark} alt="Freewheeler" className="h-16 w-auto object-contain" />
            </div>

            {/* Headline */}
            <div className="text-center mt-8">
              <h1
                className="font-display font-black uppercase text-foreground leading-none"
                style={{ fontSize: "84pt", letterSpacing: "0.02em" }}
              >
                Pedal Your
                <br />
                Own Path
              </h1>
              <p className="font-display uppercase tracking-wider text-foreground/80 mt-4 text-2xl">
                A Cycling League for Secondary School Students
              </p>
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { Icon: Bike, text: "Ride smart bikes at school with MyWhoosh" },
                { Icon: Trophy, text: "Earn points and climb the leaderboard" },
                { Icon: Users, text: "Compete across 7 Waikato schools" },
              ].map(({ Icon, text }, i) => (
                <div
                  key={i}
                  className="border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))] p-5 flex flex-col items-center text-center"
                >
                  <div className="bg-primary text-primary-foreground rounded-full p-4 mb-3">
                    <Icon className="h-12 w-12" strokeWidth={2.5} />
                  </div>
                  <p className="font-display uppercase tracking-wide text-foreground text-base leading-tight">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            {/* Banner */}
            <div className="mt-10 bg-primary text-primary-foreground border-[4px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))] py-6 px-4 text-center">
              <p
                className="font-display font-black uppercase tracking-wider"
                style={{ fontSize: "32pt", lineHeight: 1 }}
              >
                No Travel. No Trials. No Pressure. Just Ride.
              </p>
            </div>

            {/* Season strip */}
            <div className="mt-6 bg-accent text-accent-foreground border-[3px] border-secondary py-3 text-center">
              <p className="font-display font-bold uppercase tracking-widest text-2xl">
                Season: 31 Aug – 6 Nov 2026
              </p>
            </div>

            {/* CTA */}
            <div className="mt-auto text-center pt-8">
              <p className="font-display uppercase tracking-wider text-foreground/70 text-lg">
                Register at
              </p>
              <p
                className="font-display font-black uppercase text-primary leading-none mt-2"
                style={{ fontSize: "44pt" }}
              >
                freewheelerleague.com
              </p>
            </div>

            {/* Footer */}
            <div className="border-t-[2px] border-secondary mt-8 pt-4 text-center">
              <p className="font-body text-foreground/70 text-sm">
                Freewheeler Cycling League · Delivered by Sport Waikato · No participation fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default A3Poster;
