import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SUBJECT = "Freewheeler Cycling League — Pilot school invitation for 2026";

const PLAIN_TEXT = `Subject: ${SUBJECT}

Tena koe [PRINCIPAL OR SPORTS COORDINATOR NAME],

My name is [YOUR NAME] from Sport Waikato. I'm reaching out to invite [SCHOOL NAME] to take part in the Freewheeler Cycling League pilot — a new school sport opportunity we're delivering across seven Waikato secondary schools in Term 3 and Term 4, 2026.

Freewheeler is a cycling league for secondary school students using Wattbike Proton smart bikes and the MyWhoosh cycling app. Students ride at school on their own schedule, earn points, and compete on a leaderboard. There's no travel, no competition dates, no entry fees, and minimal admin for your team.

As a pilot school, you would receive at no cost:
- 2 x Wattbike Proton smart bikes (on loan for the season)
- 2 x iPads pre-loaded with MyWhoosh
- Power multibox and extension lead
- NFC bracelets for each registered student
- Onboarding support and all promotional materials

We're asking schools to: sign a simple MoU with Sport Waikato, promote the opportunity to students, and collect caregiver consent forms before students participate. That's it — we handle the rest.

The season runs from 31 August to 6 November 2026. Places are limited to 24 students per school.

I'd love to have a quick conversation to answer any questions. Are you available for a 15-minute call this week?

More information is available at freewheelerleague.com/programme-overview.

Nga mihi,
[YOUR NAME]
[YOUR TITLE]
Sport Waikato
[PHONE NUMBER]`;

const Field = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-accent text-accent-foreground font-display font-bold uppercase px-1.5 py-0.5 rounded-sm border border-secondary/40">
    {children}
  </span>
);

const EmailInitialOutreach = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PLAIN_TEXT);
      setCopied(true);
      toast.success("Email text copied to clipboard");
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
          School Engagement Email — Initial Outreach
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Edit the fields in <Field>[brackets]</Field> before sending.
        </p>

        <article className="bg-card border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] p-6 md:p-8 font-body text-foreground leading-relaxed">
          <div className="border-b border-secondary/40 pb-3 mb-4">
            <p className="font-display uppercase tracking-wider text-xs text-muted-foreground">
              Subject
            </p>
            <p className="font-display font-bold text-base text-foreground mt-1">
              {SUBJECT}
            </p>
          </div>

          <div className="space-y-4">
            <p>
              Tena koe <Field>[PRINCIPAL OR SPORTS COORDINATOR NAME]</Field>,
            </p>

            <p>
              My name is <Field>[YOUR NAME]</Field> from Sport Waikato. I'm reaching out to
              invite <Field>[SCHOOL NAME]</Field> to take part in the Freewheeler Cycling
              League pilot — a new school sport opportunity we're delivering across seven
              Waikato secondary schools in Term 3 and Term 4, 2026.
            </p>

            <p>
              Freewheeler is a cycling league for secondary school students using Wattbike
              Proton smart bikes and the MyWhoosh cycling app. Students ride at school on
              their own schedule, earn points, and compete on a leaderboard. There's no
              travel, no competition dates, no entry fees, and minimal admin for your team.
            </p>

            <p>As a pilot school, you would receive at no cost:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>2 x Wattbike Proton smart bikes (on loan for the season)</li>
              <li>2 x iPads pre-loaded with MyWhoosh</li>
              <li>Power multibox and extension lead</li>
              <li>NFC bracelets for each registered student</li>
              <li>Onboarding support and all promotional materials</li>
            </ul>

            <p>
              We're asking schools to: sign a simple MoU with Sport Waikato, promote the
              opportunity to students, and collect caregiver consent forms before students
              participate. That's it — we handle the rest.
            </p>

            <p>
              The season runs from <span className="font-semibold">31 August to 6 November 2026</span>.
              Places are limited to 24 students per school.
            </p>

            <p>
              I'd love to have a quick conversation to answer any questions. Are you available
              for a 15-minute call this week?
            </p>

            <p>
              More information is available at{" "}
              <span className="font-semibold">freewheelerleague.com/programme-overview</span>.
            </p>

            <div className="pt-2">
              <p>Nga mihi,</p>
              <p><Field>[YOUR NAME]</Field></p>
              <p><Field>[YOUR TITLE]</Field></p>
              <p>Sport Waikato</p>
              <p><Field>[PHONE NUMBER]</Field></p>
            </div>
          </div>
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
                <Copy className="h-5 w-5" /> COPY EMAIL TEXT
              </>
            )}
          </button>
          <p className="font-body text-xs text-muted-foreground text-center">
            Copies subject + body as plain text, ready to paste into your email client.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailInitialOutreach;
