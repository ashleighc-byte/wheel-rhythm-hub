import { Link } from "react-router-dom";
import { ArrowLeft, Printer, ArrowRight, ArrowDown } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface StageStep {
  label: string;
  note?: string;
}

interface Stage {
  id: string;
  label: string;
  title: string;
  colour: string; // Tailwind bg class
  borderColour: string;
  who: "student" | "school" | "sportwaikato" | "system";
  steps: StageStep[];
  trigger?: string;
  outcome?: string;
}

interface SchoolStep {
  title: string;
  detail: string;
  actor: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const studentStages: Stage[] = [
  {
    id: "A",
    label: "A",
    title: "Discover",
    colour: "bg-secondary/30",
    borderColour: "border-secondary",
    who: "student",
    steps: [
      { label: "Hears about Freewheeler at school" },
      { label: "Visits freewheelerleague.com" },
      { label: "Reads programme overview & terms" },
      { label: "Clicks "JOIN THE LEAGUE"" },
    ],
    trigger: "Awareness from school / teacher",
    outcome: "Student opens registration form",
  },
  {
    id: "B",
    label: "B",
    title: "Register",
    colour: "bg-primary/10",
    borderColour: "border-primary",
    who: "student",
    steps: [
      { label: "Enters: First Name, Last Initial, Year Level, School" },
      { label: "Ticks consent checkbox", note: "confirms school/caregiver has approved" },
      { label: "Submits form" },
      { label: "Airtable: Registration Status = Pending Consent" },
    ],
    trigger: "Student submits JOIN THE LEAGUE form",
    outcome: "Record created in Student Registration (Airtable)",
  },
  {
    id: "C",
    label: "C",
    title: "Consent & Setup",
    colour: "bg-accent/10",
    borderColour: "border-accent",
    who: "sportwaikato",
    steps: [
      { label: "School collects signed consent forms from caregivers" },
      { label: "School sends list to Sport Waikato", note: "First name + last initial + year level only" },
      { label: "Sport Waikato creates NFC token, updates status → Active" },
      { label: "NFC bracelet + starter pack delivered to school" },
      { label: "School distributes bracelets to consented students" },
    ],
    trigger: "Consent confirmed by school",
    outcome: "Student has NFC bracelet + QR backup card",
  },
  {
    id: "D",
    label: "D",
    title: "Onboarding",
    colour: "bg-secondary/30",
    borderColour: "border-secondary",
    who: "student",
    steps: [
      { label: "Student taps NFC bracelet on reader at school" },
      { label: "App navigates to /tap/:token" },
      { label: "Onboarding tour shown (6 steps — ONCE only)", note: "localStorage flag: nfc_onboarding_seen_{token}" },
      { label: "Ready screen: "Log a Ride" + "See My Dash"" },
    ],
    trigger: "First NFC tap",
    outcome: "Student understands how to log rides & view dashboard",
  },
  {
    id: "E",
    label: "E",
    title: "Season",
    colour: "bg-primary/10",
    borderColour: "border-primary",
    who: "student",
    steps: [
      { label: "Logs rides via NFC tap → SessionFeedbackForm" },
      { label: "Earns points (base + streak + elevation + speed bonuses)" },
      { label: "Views dashboard (/dashboard)" },
      { label: "Competes on leaderboard (/leaderboards)" },
      { label: "Books bike slots at /book" },
    ],
    trigger: "Onboarding complete",
    outcome: "Active participant — 8-week season (31 Aug – 6 Nov 2026)",
  },
];

const schoolSteps: SchoolStep[] = [
  {
    actor: "Sport Waikato",
    title: "Send MoU + Programme Overview",
    detail: "Sent to school principal / sports coordinator before season. MoU clause 3: school is consent gatekeeper.",
  },
  {
    actor: "School",
    title: "Sign MoU & Return",
    detail: "School confirms hardware delivery date, signs MoU, returns to Sport Waikato.",
  },
  {
    actor: "Sport Waikato",
    title: "Hardware Delivery",
    detail: "2 × Wattbike Proton, 2 × iPad, 1 × multibox, 5m extension lead, NFC reader, bracelets per school.",
  },
  {
    actor: "School",
    title: "Distribute Consent Forms",
    detail: "School sends home consent forms. Collects signed forms. Sends list to Sport Waikato.",
  },
  {
    actor: "Sport Waikato",
    title: "Activate Students",
    detail: "Creates NFC tokens, updates Airtable status to Active. Delivers starter packs.",
  },
  {
    actor: "School",
    title: "Distribute Bracelets",
    detail: "Teacher hands NFC bracelets + QR backup cards to consented students.",
  },
  {
    actor: "School + Students",
    title: "Season Runs",
    detail: "Students book bikes, ride, log sessions. Teacher monitors via leaderboard link.",
  },
  {
    actor: "Sport Waikato",
    title: "Post-Season",
    detail: "Data exported, anonymised report to schools. All personal data deleted within 90 days (Karawhiua DSMP).",
  },
];

const WHO_COLOURS: Record<string, string> = {
  student: "bg-primary text-primary-foreground",
  school: "bg-secondary text-secondary-foreground",
  sportwaikato: "bg-accent text-accent-foreground",
  system: "bg-muted text-muted-foreground",
};

const WHO_LABELS: Record<string, string> = {
  student: "Student",
  school: "School",
  sportwaikato: "Sport Waikato",
  system: "System",
};

// ── Components ────────────────────────────────────────────────────────────────

const StageCard = ({ stage }: { stage: Stage }) => (
  <div className={`border-[3px] ${stage.borderColour} ${stage.colour} p-4 flex-1 min-w-[180px] shadow-[3px_3px_0px_hsl(var(--brand-dark))] print:shadow-none print:min-w-0`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center border-2 border-current font-display text-lg font-black">
          {stage.id}
        </span>
        <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {stage.title}
        </span>
      </div>
      <span className={`rounded-sm px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider ${WHO_COLOURS[stage.who]}`}>
        {WHO_LABELS[stage.who]}
      </span>
    </div>

    <ul className="space-y-1.5 mt-3">
      {stage.steps.map((step, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
          <span className="font-body text-xs text-foreground/80 leading-snug">
            {step.label}
            {step.note && (
              <span className="block text-[10px] text-muted-foreground italic">{step.note}</span>
            )}
          </span>
        </li>
      ))}
    </ul>

    {stage.outcome && (
      <div className="mt-3 border-t border-current/20 pt-2">
        <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Outcome</p>
        <p className="font-body text-xs text-foreground/70 mt-0.5">{stage.outcome}</p>
      </div>
    )}
  </div>
);

const SchoolStepCard = ({ step, index }: { step: SchoolStep; index: number }) => (
  <div className="flex gap-3 items-start">
    <div className="flex flex-col items-center">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-secondary bg-secondary/20 font-display text-sm font-bold text-foreground">
        {index + 1}
      </div>
      {index < schoolSteps.length - 1 && (
        <div className="w-0.5 flex-1 bg-secondary/40 min-h-[20px] mt-1" />
      )}
    </div>
    <div className="flex-1 pb-4">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          {step.title}
        </span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider text-muted-foreground">
          {step.actor}
        </span>
      </div>
      <p className="font-body text-xs text-muted-foreground leading-snug">{step.detail}</p>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminFlowchart = () => {
  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Nav — hidden on print */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4 print:hidden">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 border-[2px] border-secondary px-4 py-2 font-display text-xs uppercase tracking-wider text-foreground hover:bg-secondary/20"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-16 print:px-2 print:pb-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <h1 className="font-display text-3xl font-black uppercase tracking-wider text-foreground md:text-4xl print:text-2xl">
            Freewheeler — Programme Flowchart
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Season: 31 Aug – 6 Nov 2026 · 7 Waikato schools · Internal use only
          </p>
        </div>

        {/* ── Student Journey A→E ────────────────────────────────────────── */}
        <section className="mb-10 print:mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-0.5 w-8 bg-primary" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground print:text-lg">
              Student Journey: A → E
            </h2>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3 print:mb-2">
            {Object.entries(WHO_LABELS).map(([key, label]) => (
              <span key={key} className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${WHO_COLOURS[key]}`}>
                {label}
              </span>
            ))}
          </div>

          {/* Desktop: horizontal flow */}
          <div className="hidden xl:flex items-stretch gap-0">
            {studentStages.map((stage, i) => (
              <div key={stage.id} className="flex items-stretch flex-1">
                <StageCard stage={stage} />
                {i < studentStages.length - 1 && (
                  <div className="flex items-center px-1 shrink-0">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile / tablet: vertical flow */}
          <div className="xl:hidden flex flex-col gap-2">
            {studentStages.map((stage, i) => (
              <div key={stage.id}>
                <StageCard stage={stage} />
                {i < studentStages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Data stored at each stage ────────────────────────────────── */}
        <section className="mb-10 border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] print:mb-6 print:shadow-none">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground mb-3 print:text-base">
            Data Stored — Privacy Act 2020 Compliance
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-primary mb-1">What Sport Waikato stores</p>
              <ul className="space-y-1">
                {["First Name", "Last Initial", "Year Level", "School", "NFC Token (hashed)", "Registration Status", "Last Tap At"].map(f => (
                  <li key={f} className="flex items-center gap-1.5 font-body text-xs text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-destructive mb-1">What is NOT stored</p>
              <ul className="space-y-1">
                {["Full last name", "Email address", "Password", "Date of birth", "Gender", "Phone number", "Address", "Caregiver contact"].map(f => (
                  <li key={f} className="flex items-center gap-1.5 font-body text-xs text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Retention & deletion</p>
              <ul className="space-y-1">
                {[
                  "Data deleted within 90 days of season end",
                  "Karawhiua DSMP compliant",
                  "MoU clause 3: school is consent gatekeeper",
                  "No third-party email required",
                  "No Supabase auth accounts for students",
                ].map(f => (
                  <li key={f} className="flex items-start gap-1.5 font-body text-xs text-foreground/80">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── School Engagement Flow ────────────────────────────────────── */}
        <section className="mb-10 print:mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-0.5 w-8 bg-secondary" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground print:text-lg">
              School Engagement Flow
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-1 max-w-2xl">
            {schoolSteps.map((step, i) => (
              <SchoolStepCard key={i} step={step} index={i} />
            ))}
          </div>
        </section>

        {/* ── Key URLs / Resources ─────────────────────────────────────── */}
        <section className="border-[3px] border-primary bg-primary/5 p-5 print:shadow-none">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground mb-3 print:text-base">
            Key URLs & Resources
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs font-body">
            {[
              { label: "Public site", url: "freewheelerleague.com" },
              { label: "NFC tap entry", url: "freewheelerleague.com/tap/:token" },
              { label: "Book a bike", url: "freewheelerleague.com/book" },
              { label: "Leaderboards", url: "freewheelerleague.com/leaderboards" },
              { label: "Dashboard", url: "freewheelerleague.com/dashboard" },
              { label: "Resources", url: "freewheelerleague.com/resources" },
              { label: "Programme Overview", url: "freewheelerleague.com/programme-overview" },
              { label: "Student issue form", url: "airtable.com/…/shr7QNbev1Dg4p4mb" },
              { label: "Staff issue form", url: "airtable.com/…/shr6ZnS0qQyFkxCHH" },
            ].map(({ label, url }) => (
              <div key={label} className="flex gap-2">
                <span className="font-display font-semibold uppercase tracking-wider text-foreground/70 shrink-0">{label}:</span>
                <span className="text-muted-foreground break-all">{url}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Print footer */}
        <div className="hidden print:block mt-6 border-t border-border pt-4 text-center font-body text-xs text-muted-foreground">
          Freewheeler Bike League · Delivered by Sport Waikato · Internal use only · Printed {new Date().toLocaleDateString("en-NZ")}
        </div>
      </div>
    </div>
  );
};

export default AdminFlowchart;
