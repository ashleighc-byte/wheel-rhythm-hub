import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Users,
  Mail,
  FileCheck,
  UserPlus,
  ClipboardList,
  Bike,
  Camera,
  LogOut,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  FileDown,
  Smartphone,
} from "lucide-react";

const PERMISSION_LINK = "https://bit.ly/GameFITPermission";

const messageTemplate = `Tēnā koe,

We're excited to share a new opportunity for your child — the Free Wheeler Bike League.

Free Wheeler is an indoor virtual cycling programme running at our school. It's self-paced, digital, and built around friendly competition — a great fit for students who love a challenge but maybe don't always feel at home in traditional team sports.

There are 24 spots available and participation is free — no cost to join.

If you'd like your child to take part, please complete the short registration and permission form below. This covers consent and a brief agreement for participation.

Registration form: ${PERMISSION_LINK}

Spots are limited, so please register early to secure a place.

If you have any questions, please don't hesitate to get in touch.

Ngā mihi,
[Your name]
[School name]`;

const CaregiverMessageTemplate = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          <ClipboardList className="mr-1 inline h-3.5 w-3.5" /> Template Message — Copy &amp; Customise
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 border-[2px] border-primary bg-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy Message
            </>
          )}
        </button>
      </div>
      <div className="border-[2px] border-secondary bg-background p-4 font-body text-xs leading-relaxed text-foreground/80">
        {messageTemplate.split(PERMISSION_LINK).map((part, i, arr) => (
          <span key={i} className="whitespace-pre-wrap">
            {part}
            {i < arr.length - 1 && (
              <a
                href={PERMISSION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-75"
              >
                {PERMISSION_LINK}
              </a>
            )}
          </span>
        ))}
      </div>
      <p className="font-body text-[11px] text-foreground/50 italic">
        Replace [Your name] and [School name] before sending.
      </p>
    </div>
  );
};

const steps = [
  {
    num: "01",
    icon: Users,
    title: "Open Registration",
    colour: "bg-primary",
    textColour: "text-primary-foreground",
    content: (
      <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/85">
        <p>
          The Free Wheeler Bike League is an opportunity for up to{" "}
          <span className="font-bold text-foreground">24 students</span> per school to register
          and join a virtual indoor cycling league.
        </p>
        <div className="border-l-4 border-primary bg-card px-4 py-3">
          <p className="font-semibold text-foreground">Why 24 students?</p>
          <p className="mt-1 text-foreground/70">
            Spots are limited to keep the pilot manageable and ensure every student gets a quality
            experience. This is a student opt-in programme — anyone can register if there's a spot
            available.
          </p>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    icon: Mail,
    title: "Contact Caregivers",
    colour: "bg-secondary",
    textColour: "text-secondary-foreground",
    content: (
      <div className="space-y-4 font-body text-sm leading-relaxed text-foreground/85">
        <p>
          Send a message via your school's communications to caregivers. The message should explain:
        </p>
        <ul className="space-y-2 pl-1">
          {[
            "What the Free Wheeler Bike League is about",
            "That their child can register to participate — it's free, no cost to join",
            "That to participate, they need to complete the registration and permission form",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <CaregiverMessageTemplate />

      </div>
    ),
  },
  {
    num: "03",
    icon: FileCheck,
    title: "Permission Slip Completed",
    colour: "bg-accent",
    textColour: "text-accent-foreground",
    content: (
      <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/85">
        <p>
          Once both the caregiver and student have filled in the permission slip, our backend will:
        </p>
        <ul className="space-y-2 pl-1">
          {[
            "Record that the MOU has been signed",
            "Mark the student as active",
            "Add them to the approved group to sign up to the website",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="border-l-4 border-accent bg-card px-4 py-3">
          <p className="font-semibold text-foreground">No action needed from you at this step.</p>
          <p className="mt-1 text-foreground/70">
            The system handles approval automatically once the form is submitted.
          </p>
        </div>
      </div>
    ),
  },
  {
    num: "04",
    icon: UserPlus,
    title: "Student Signs Up",
    colour: "bg-primary",
    textColour: "text-primary-foreground",
    content: (
      <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/85">
        <p>Students visit the website and click <span className="font-bold text-foreground">Sign Up</span>.</p>
        <div className="border-[3px] border-primary bg-card p-4 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
            Website Sign-Up Link
          </p>
          <a
            href="https://freewheeler.lovable.app/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-body text-base font-semibold text-primary underline underline-offset-2 hover:opacity-80"
          >
            freewheeler.lovable.app/auth
          </a>
        </div>
        <div className="border-l-4 border-accent bg-card px-4 py-3">
          <p className="font-bold text-foreground"><AlertTriangle className="mr-1 inline h-4 w-4" /> Important</p>
          <p className="mt-1 text-foreground/70">
            Students <span className="font-bold text-foreground">must use their school email address</span> — the
            same one used on the permission form — or they won't be recognised by the system.
          </p>
        </div>
        <p>
          After signing up, students will receive a confirmation email to their school address. They
          need to click the link in that email to verify their account before they can sign in.
        </p>
      </div>
    ),
  },
  {
    num: "05",
    icon: ClipboardList,
    title: "Pre Phase Survey",
    colour: "bg-secondary",
    textColour: "text-secondary-foreground",
    content: (
      <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/85">
        <p>
          When a student signs in for the first time, they'll be prompted to complete the{" "}
          <span className="font-bold text-foreground">Pre Phase Survey</span> before accessing the
          main website.
        </p>
        <p>
          This survey captures their baseline attitudes towards sport, physical activity, confidence,
          and wellbeing — which we'll compare with the Post Phase survey at the end of the pilot to
          measure impact.
        </p>
        <div className="border-l-4 border-primary bg-card px-4 py-3">
          <p className="text-foreground/70">
            Once they submit the survey, they'll be taken straight to the home page and can start
            using the platform. The survey questions are managed dynamically from the backend.
          </p>
        </div>
      </div>
    ),
  },
];

const studentInstructions = [
  {
    icon: Bike,
    title: "Complete a Cycling Session",
    body: "Students jump on the smart bike and ride using the shared MyWhoosh account. Each session is self-paced.",
  },
  {
    icon: Camera,
    title: "Screenshot the Results",
    body: (
      <>
        At the end of the session, take a screenshot of the results screen on the iPad/tablet.
        <span className="mt-2 block border-l-4 border-accent bg-card px-3 py-2 text-xs text-foreground/70">
          <Smartphone className="mr-1 inline h-3 w-3" />
          <strong>How to screenshot on iPad:</strong> Press the <strong>Top Button</strong> and{" "}
          <strong>Volume Up</strong> button at the same time. The screenshot will be saved to your Photos.
        </span>
      </>
    ),
  },
  {
    icon: ClipboardList,
    title: "Log the Ride on the Website",
    body: (
      <>
        Students scan their <strong>NFC bracelet</strong> on the iPad to open the session form
        automatically — no sign-in required. They upload their screenshot, fill in the form, and
        submit. The data is tied to their name.
        <span className="mt-2 block text-xs text-foreground/60">
          If they've forgotten their bracelet, they can sign in at{" "}
          <a
            href="https://freewheeler.lovable.app/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
          >
            freewheeler.lovable.app
          </a>{" "}
          or scan a backup QR code from the teacher dashboard.
        </span>
      </>
    ),
  },
  {
    icon: LogOut,
    title: "Sign Out When Done",
    body: "Once logged, students must sign out (if they used email login) so the next student doesn't accidentally submit data against their name. NFC bracelet sessions end automatically.",
  },
];

const ongoingItems = [
  {
    icon: ClipboardList,
    label: "Mid Phase Survey",
    description:
      "After 4 weeks the Mid Phase Survey will automatically pop up for students. It only needs to be submitted once — after that it's marked as completed on their checklist. If it hasn't appeared yet, students can find it on their Info page checklist.",
  },
  {
    icon: BarChart3,
    label: "Post Phase Survey",
    description:
      "At the end of the pilot, students complete the Post Phase Survey. This is available from their student checklist on the Info page. It's how we measure the impact of the programme.",
  },
  {
    icon: MessageSquare,
    label: "Teacher Observations",
    description:
      "Use the Teacher Observation Form on your dashboard to record any changes you notice in students — engagement, confidence, attitude towards physical activity.",
  },
  {
    icon: AlertTriangle,
    label: "Report Hardware Issues",
    description:
      "If a bike, app, or piece of hardware isn't working, use the Report an Issue button on the Info page. We'll sort it quickly.",
  },
];

const SetupInstructions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-6xl">
            Setup Instructions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-secondary-foreground/70">
            Everything you need to get your students onto Free Wheeler — from first contact to first
            ride.
          </p>
          <button
            onClick={() => navigate("/setup-instructions/print")}
            className="mt-6 inline-flex items-center gap-2 border-[3px] border-accent bg-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-[4px_4px_0px_hsl(var(--brand-dark))] transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_hsl(var(--brand-dark))]"
          >
            <FileDown className="h-4 w-4" />
            Download as PDF
          </button>
          <p className="mt-2 font-body text-xs text-secondary-foreground/50">
            Opens a print-ready flowchart — save as PDF from your browser's print dialog
          </p>
        </div>
      </section>

      {/* Onboarding Steps */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              Getting Students Onboard
            </h2>

            <div className="relative space-y-0">
              {/* vertical line */}
              <div className="absolute left-6 top-0 h-full w-1 bg-primary/20" />

              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative pb-10 pl-16 last:pb-0">
                    {/* circle marker */}
                    <div
                      className={`absolute left-3 top-1 flex h-7 w-7 items-center justify-center border-[3px] border-background shadow-md ${step.colour}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${step.textColour}`} />
                    </div>

                    <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="font-display text-xs font-bold tracking-widest text-primary">
                          STEP {step.num}
                        </span>
                        <h3 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      {step.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Purpose of the website */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground">
                What the Website Does
              </h2>
            </div>
            <div className="space-y-4 font-body text-base leading-relaxed text-secondary-foreground/85">
              <p>
                The Free Wheeler website is where students track their sessions and see how they
                stack up. Here's what each role can see:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-[3px] border-accent bg-secondary p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">
                    Students Can See
                  </p>
                  <ul className="mt-3 space-y-1.5 font-body text-sm text-secondary-foreground/80">
                    {[
                      "Their own session history and stats",
                      "A leaderboard of students from their school",
                      "Their checklist of pilot tasks",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-2 w-2 shrink-0 bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-[3px] border-primary bg-secondary p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                    Teachers Can See
                  </p>
                  <ul className="mt-3 space-y-1.5 font-body text-sm text-secondary-foreground/80">
                    {[
                      "Leaderboards across all schools",
                      "Top riders from the region",
                      "Survey completion per student",
                      "Recent session submissions",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-2 w-2 shrink-0 bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student session workflow */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <Bike className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
                Logging a Session
              </h2>
            </div>
            <p className="mb-6 font-body text-sm text-foreground/70">
              Share this process with students — or run through it with them the first time.
            </p>
            <div className="space-y-4">
              {studentInstructions.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex gap-5 border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                        {i + 1}. {item.title}
                      </p>
                      <p className="mt-1 font-body text-sm text-foreground/70">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-l-4 border-accent bg-card px-5 py-4">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                Using the Shared MyWhoosh Account
              </p>
              <p className="mt-1 font-body text-sm text-foreground/70">
                All students ride using the school's general MyWhoosh account on the smart bike. The
                screenshot ties their session to them in the Free Wheeler system — MyWhoosh itself
                just tracks the ride.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ongoing responsibilities */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-secondary-foreground">
                Ongoing Responsibilities
              </h2>
            </div>
            <div className="space-y-4">
              {ongoingItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex gap-5 border-[3px] border-accent/30 bg-secondary p-5 shadow-[3px_3px_0px_hsl(var(--brand-dark))]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent">
                      <Icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">
                        {item.label}
                      </p>
                      <p className="mt-1 font-body text-sm text-secondary-foreground/80">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SetupInstructions;
