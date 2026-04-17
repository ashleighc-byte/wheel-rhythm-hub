import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const PLAIN_TEXT = `Subject line suggestion: "New sporting opportunity — Freewheeler Cycling League 2026"

We're excited to let you know that [SCHOOL NAME] is taking part in the Freewheeler Cycling League — a new school sport opportunity delivered by Sport Waikato for Term 3 and Term 4, 2026.

Freewheeler is a cycling league for secondary school students using smart Wattbike bikes and the MyWhoosh cycling app. Students ride at school on their own schedule, earn points, and compete on a leaderboard against six other Waikato schools — no travel, no trials, no pressure.

Places are limited to the first 24 students who register. Registration is open now at freewheelerleague.com. All students need caregiver consent to participate — a consent form will be sent home shortly.

The season runs from 31 August to 6 November 2026. There is no participation fee.

For more information visit freewheelerleague.com or speak to [TEACHER CONTACT NAME].`;

const Field = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-accent text-accent-foreground font-display font-bold uppercase px-1.5 py-0.5 rounded-sm border border-secondary/40">
    {children}
  </span>
);

const NewsletterBlurb = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PLAIN_TEXT);
      setCopied(true);
      toast.success("Newsletter text copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy — please select and copy manually");
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground mb-2">
          School Newsletter Blurb
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Pre-written copy for your school newsletter, Seesaw, Skool Loop, or app.
        </p>

        <article className="bg-card border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] p-6 md:p-8 font-body text-foreground leading-relaxed space-y-4">
          <p className="font-display uppercase tracking-wider text-sm text-muted-foreground">
            Subject line suggestion:
          </p>
          <p className="font-display font-bold text-lg text-foreground -mt-2">
            "New sporting opportunity — Freewheeler Cycling League 2026"
          </p>

          <hr className="border-secondary/30" />

          <p>
            We're excited to let you know that <Field>[SCHOOL NAME]</Field> is taking part in
            the Freewheeler Cycling League — a new school sport opportunity delivered by Sport
            Waikato for Term 3 and Term 4, 2026.
          </p>

          <p>
            Freewheeler is a cycling league for secondary school students using smart Wattbike
            bikes and the MyWhoosh cycling app. Students ride at school on their own schedule,
            earn points, and compete on a leaderboard against six other Waikato schools — no
            travel, no trials, no pressure.
          </p>

          <p>
            Places are limited to the first 24 students who register. Registration is open now
            at <span className="font-semibold">freewheelerleague.com</span>. All students need
            caregiver consent to participate — a consent form will be sent home shortly.
          </p>

          <p>
            The season runs from <span className="font-semibold">31 August to 6 November 2026</span>.
            There is no participation fee.
          </p>

          <p>
            For more information visit{" "}
            <span className="font-semibold">freewheelerleague.com</span> or speak to{" "}
            <Field>[TEACHER CONTACT NAME]</Field>.
          </p>
        </article>

        <div className="flex flex-col items-center mt-8 gap-3">
          <button
            onClick={handleCopy}
            className="tape-element-green text-lg inline-flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" /> COPIED!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" /> COPY NEWSLETTER TEXT
              </>
            )}
          </button>
          <p className="font-body text-xs text-muted-foreground text-center">
            Tip: Replace the <Field>[BRACKETED]</Field> fields before sending.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterBlurb;
