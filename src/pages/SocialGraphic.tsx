import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";
import wordmark from "@/assets/fw-wordmark.png";
import stripeBg from "@/assets/stripe-bg-1.png";

/**
 * Square graphic — 1080x1080 logical, scaled with CSS transform.
 * Story graphic — 1080x1920 logical, scaled with CSS transform.
 * Building at full pixel size means right-click → Save image as captures
 * the high-res version (browsers save the rendered SVG/HTML at native size
 * via screenshot tools; for true PNG export use Print > Save as PDF).
 */

const SquareGraphic = () => (
  <div
    className="relative bg-primary text-primary-foreground overflow-hidden"
    style={{ width: "1080px", height: "1080px" }}
  >
    {/* Stripe overlay */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url(${stripeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.15,
      }}
    />

    {/* Logo top-left */}
    <img
      src={logo}
      alt="Freewheeler"
      className="absolute top-12 left-12 object-contain"
      style={{ height: "140px" }}
    />

    {/* Central headline */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
      <p
        className="font-display font-black uppercase leading-none"
        style={{ fontSize: "200px", letterSpacing: "0.02em" }}
      >
        Pedal
      </p>
      <p
        className="font-display font-bold uppercase leading-none mt-4"
        style={{ fontSize: "110px" }}
      >
        Your Own
      </p>
      <p
        className="font-display font-black uppercase leading-none mt-4"
        style={{ fontSize: "200px", letterSpacing: "0.02em" }}
      >
        Path
      </p>
      <p
        className="font-display uppercase tracking-wider mt-10"
        style={{ fontSize: "44px" }}
      >
        Freewheeler Cycling League
      </p>
    </div>

    {/* Season strip */}
    <div
      className="absolute left-0 right-0 bg-accent text-accent-foreground border-y-[6px] border-secondary text-center py-5"
      style={{ bottom: "180px" }}
    >
      <p
        className="font-display font-black uppercase tracking-widest"
        style={{ fontSize: "48px" }}
      >
        Season Opens 31 Aug 2026
      </p>
    </div>

    {/* CTA strip */}
    <div className="absolute bottom-0 left-0 right-0 bg-secondary text-secondary-foreground text-center py-8">
      <p
        className="font-display font-black uppercase tracking-widest"
        style={{ fontSize: "56px" }}
      >
        freewheelerleague.com
      </p>
    </div>
  </div>
);

const StoryGraphic = () => (
  <div
    className="relative bg-primary text-primary-foreground overflow-hidden"
    style={{ width: "1080px", height: "1920px" }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url(${stripeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.15,
      }}
    />

    {/* Logo top centre */}
    <div className="absolute top-20 left-0 right-0 flex justify-center">
      <img src={logo} alt="Freewheeler" className="object-contain" style={{ height: "200px" }} />
    </div>

    {/* Headline + content */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
      <p
        className="font-display font-black uppercase leading-none"
        style={{ fontSize: "200px", letterSpacing: "0.02em" }}
      >
        Pedal
      </p>
      <p
        className="font-display font-bold uppercase leading-none mt-6"
        style={{ fontSize: "120px" }}
      >
        Your Own
      </p>
      <p
        className="font-display font-black uppercase leading-none mt-6"
        style={{ fontSize: "200px", letterSpacing: "0.02em" }}
      >
        Path
      </p>

      <div className="mt-20 bg-accent text-accent-foreground border-[6px] border-secondary px-10 py-5">
        <p
          className="font-display font-black uppercase tracking-wider"
          style={{ fontSize: "48px" }}
        >
          7 Waikato Schools Competing
        </p>
      </div>

      <p
        className="font-display font-bold uppercase tracking-widest mt-12"
        style={{ fontSize: "56px" }}
      >
        Season: 31 Aug – 6 Nov 2026
      </p>

      <p
        className="font-display font-black uppercase tracking-widest mt-10"
        style={{ fontSize: "60px" }}
      >
        freewheelerleague.com
      </p>
    </div>

    {/* Wordmark bottom */}
    <div className="absolute bottom-20 left-0 right-0 flex justify-center">
      <img src={wordmark} alt="Freewheeler" className="object-contain" style={{ height: "120px" }} />
    </div>
  </div>
);

const SocialGraphic = () => {
  // Scale: square preview ~300px from 1080px = 0.278; story preview ~170px from 1080px = 0.157
  const SQUARE_SCALE = 300 / 1080;
  const STORY_SCALE = 170 / 1080;

  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="no-print flex items-center justify-between mb-6">
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
            Print / Save as PDF
          </button>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground mb-2">
          Social Media Launch Graphics
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-8">
          Right-click the graphic and "Save image as", or use Print &gt; Save as PDF.
        </p>

        <div className="flex flex-wrap items-start justify-center gap-12">
          {/* Square */}
          <div className="flex flex-col items-center gap-3">
            <p className="font-display uppercase tracking-wider text-xs text-muted-foreground">
              Square · 1080 × 1080
            </p>
            <div
              className="border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] overflow-hidden"
              style={{
                width: `${1080 * SQUARE_SCALE}px`,
                height: `${1080 * SQUARE_SCALE}px`,
              }}
            >
              <div
                style={{
                  transform: `scale(${SQUARE_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <SquareGraphic />
              </div>
            </div>
          </div>

          {/* Story */}
          <div className="flex flex-col items-center gap-3">
            <p className="font-display uppercase tracking-wider text-xs text-muted-foreground">
              Story · 1080 × 1920
            </p>
            <div
              className="border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] overflow-hidden"
              style={{
                width: `${1080 * STORY_SCALE}px`,
                height: `${1920 * STORY_SCALE}px`,
              }}
            >
              <div
                style={{
                  transform: `scale(${STORY_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <StoryGraphic />
              </div>
            </div>
          </div>
        </div>

        <p className="font-body text-sm text-muted-foreground text-center mt-10">
          Share with your school community — tag @sportwaikato
        </p>
      </div>
    </div>
  );
};

export default SocialGraphic;
