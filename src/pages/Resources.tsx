import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, Printer, Megaphone, FileText, Mail } from "lucide-react";
import logoSrc from "@/assets/fw-logo-oval.png";
import { callAirtable } from "@/lib/airtable";

interface Resource {
  id: string;
  name: string;
  type: string;
  audience: string;
  description: string;
  url: string;
  status: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  "Instruction Poster": Printer,
  "Newsletter Template": FileText,
  "Social Media": Megaphone,
  "Email Template": Mail,
  "Consent Form": FileText,
  "MoU Template": FileText,
  "FAQ": FileText,
  "Onboarding Guide": FileText,
};

const AUDIENCE_COLOURS: Record<string, string> = {
  "Schools": "bg-primary/10 text-primary",
  "Students": "bg-accent/20 text-accent-foreground",
  "Caregivers": "bg-secondary text-secondary-foreground",
  "Internal": "bg-muted text-muted-foreground",
};

const ResourceCard = ({ resource }: { resource: Resource }) => {
  const Icon = TYPE_ICONS[resource.type] ?? FileText;
  const audienceClass = AUDIENCE_COLOURS[resource.audience] ?? "bg-muted text-muted-foreground";

  return (
    <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))] flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${audienceClass}`}>
              {resource.audience}
            </span>
            <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
              {resource.type}
            </span>
          </div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            {resource.name}
          </h3>
        </div>
      </div>
      {resource.description && (
        <p className="font-body text-xs leading-relaxed text-muted-foreground">
          {resource.description}
        </p>
      )}
      {resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tape-element-green mt-auto inline-flex items-center gap-2 px-4 py-2 text-xs"
        >
          <Download className="h-3.5 w-3.5" /> Open / Download
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      ) : (
        <span className="mt-auto inline-flex items-center gap-2 border-[2px] border-muted px-4 py-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
          Coming Soon
        </span>
      )}
    </div>
  );
};

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resources are hand-curated below; no Airtable fetch needed.
    setLoading(false);
  }, []);

  const byAudience = (audience: string) =>
    resources.filter((r) => r.audience === audience);

  const sections = [
    { key: "Schools", label: "For Schools", desc: "Promotional material, consent forms, and MoU templates to share with your school community." },
    { key: "Students", label: "For Students", desc: "Instruction posters and guides to print and display near the bikes." },
    { key: "Caregivers", label: "For Caregivers", desc: "Information for parents and whānau about Freewheeler and how to give consent." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <Link to="/book" className="tape-element px-5 py-2 font-display text-xs uppercase">
          Book a Bike
        </Link>
      </div>

      {/* Header */}
      <header className="bg-secondary py-10 text-center">
        <img src={logoSrc} alt="Freewheeler" className="mx-auto mb-4 h-16 object-contain" />
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wider text-secondary-foreground md:text-4xl">
          Resources
        </h1>
        <p className="mt-2 font-body text-base text-secondary-foreground/70 max-w-md mx-auto px-4">
          Everything you need to promote Freewheeler at your school — printable posters, consent forms, newsletter templates, and more.
        </p>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-display text-lg uppercase tracking-widest text-muted-foreground animate-pulse">
              Loading resources…
            </p>
          </div>
        ) : resources.length === 0 ? (
          <div className="border-[3px] border-secondary bg-card p-12 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="font-display text-xl uppercase text-muted-foreground">
              Resources Coming Soon
            </h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              We're building out our resource library. Check back soon or contact Sport Waikato directly.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map(({ key, label, desc }) => {
              const items = byAudience(key);
              if (!items.length) return null;
              return (
                <section key={key}>
                  <div className="mb-5">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                      {label}
                    </h2>
                    <p className="mt-1 font-body text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {items.map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-secondary px-4 py-10 mt-8">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Freewheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · Delivered by Sport Waikato · © 2026
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 flex-wrap">
            <Link to="/programme-overview" className="font-display text-xs uppercase tracking-wider text-secondary-foreground/60 underline hover:text-secondary-foreground/80">
              Programme Overview
            </Link>
            <Link to="/book" className="font-display text-xs uppercase tracking-wider text-secondary-foreground/60 underline hover:text-secondary-foreground/80">
              Book a Bike
            </Link>
            <Link to="/terms" className="font-display text-xs uppercase tracking-wider text-secondary-foreground/40 underline hover:text-secondary-foreground/60">
              Terms & Conditions
            </Link>
            <Link
              to="/help"
              className="font-display text-xs uppercase tracking-wider text-secondary-foreground/40 underline hover:text-secondary-foreground/60"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Resources;
