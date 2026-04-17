import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SUBJECT = "Freewheeler Cycling League — MoU attached + next steps";

const PLAIN_TEXT = `Subject: ${SUBJECT}

Tena koe [NAME],

Thank you for your interest in the Freewheeler Cycling League pilot. As discussed, I've attached the Memorandum of Understanding (MoU) for your review.

The MoU outlines:
- Equipment provided by Sport Waikato (on loan for the season)
- Your school's responsibilities during the season
- Data and privacy arrangements (Privacy Act 2020 compliant)
- The process for collecting caregiver consent

Once you've had a chance to review it, please sign and return by [RETURN DATE]. Once we have your signed MoU, we'll confirm your hardware delivery date and start getting things set up.

In the meantime, if you'd like to start promoting Freewheeler to students, you can find a newsletter blurb, A3 poster, and social media graphic at freewheelerleague.com/resources.

Please don't hesitate to get in touch if you have any questions.

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

const EmailMouFollowup = () => {
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
          School Engagement Email — MoU Follow-up
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
            <p>Tena koe <Field>[NAME]</Field>,</p>

            <p>
              Thank you for your interest in the Freewheeler Cycling League pilot. As
              discussed, I've attached the Memorandum of Understanding (MoU) for your review.
            </p>

            <p>The MoU outlines:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Equipment provided by Sport Waikato (on loan for the season)</li>
              <li>Your school's responsibilities during the season</li>
              <li>Data and privacy arrangements (Privacy Act 2020 compliant)</li>
              <li>The process for collecting caregiver consent</li>
            </ul>

            <p>
              Once you've had a chance to review it, please sign and return by{" "}
              <Field>[RETURN DATE]</Field>. Once we have your signed MoU, we'll confirm your
              hardware delivery date and start getting things set up.
            </p>

            <p>
              In the meantime, if you'd like to start promoting Freewheeler to students, you
              can find a newsletter blurb, A3 poster, and social media graphic at{" "}
              <span className="font-semibold">freewheelerleague.com/resources</span>.
            </p>

            <p>Please don't hesitate to get in touch if you have any questions.</p>

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

export default EmailMouFollowup;
