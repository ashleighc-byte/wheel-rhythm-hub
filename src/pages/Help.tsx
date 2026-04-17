import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Send, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { callAirtable } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";
import fwLogo from "@/assets/fw-logo-oval.png";

const FEEDBACK_TYPES = [
  "Hardware Issue",
  "Software Issue",
  "New Racing Track Request",
  "General Feedback",
  "Other",
];

const SEVERITY_OPTIONS = ["Low", "Medium", "High"];

interface Bike {
  id: string;
  name: string;
}

const Help = () => {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string>("");

  // Load all bikes (Asset Type = Bike) for the conditional Hardware Assets field
  useEffect(() => {
    if (feedbackType !== "Hardware Issue" || bikes.length > 0) return;
    (async () => {
      try {
        const res = await callAirtable("Hardware Assets", "GET", {
          filterByFormula: `{Asset Type} = 'Bike'`,
        });
        const list: Bike[] = (res.records as Array<{ id: string; fields: Record<string, unknown> }>)
          .map((r) => ({
            id: r.id,
            name: String(r.fields["Asset Name 1"] ?? r.fields["Asset Name"] ?? ""),
          }))
          .filter((b) => b.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setBikes(list);
      } catch (err) {
        console.error("Failed to load bikes:", err);
      }
    })();
  }, [feedbackType, bikes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !feedbackType || !description.trim() || !severity) return;
    setSubmitting(true);

    try {
      // Match Airtable field names exactly (per Support Tickets table schema)
      const fields: Record<string, any> = {
        "Submitted By": name.trim(),
        "Feedback Type": feedbackType,
        "Description": description.trim(),
        "Severity": severity,
      };

      if (email.trim()) fields["Email"] = email.trim();

      // Linked record — only when Hardware Issue + a bike is picked
      if (feedbackType === "Hardware Issue" && selectedBikeId) {
        fields["Hardware Assets"] = [selectedBikeId];
      }

      if (photo) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${photo.name.split(".").pop()}`;
        const { error: uploadErr } = await supabase.storage
          .from("session-screenshots")
          .upload(fileName, photo);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("session-screenshots")
            .getPublicUrl(fileName);
          fields["Attachments"] = [{ url: urlData.publicUrl }];
        }
      }

      await callAirtable("Support Tickets (Bug/Issue Form)", "POST", {
        body: { records: [{ fields }] },
      });

      toast({
        title: "Issue reported!",
        description: "Thanks for letting us know. We'll look into it.",
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Help form error:", err);
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setName("");
    setEmail("");
    setOnBehalf("");
    setFeedbackType("");
    setDescription("");
    setSeverity("");
    setPhoto(null);
    setSelectedBikeId("");
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-[3px] border-secondary bg-card">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={fwLogo} alt="Freewheeler" className="h-10 w-10" />
            <span className="font-display text-lg uppercase tracking-wider text-foreground">
              Freewheeler League
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
            Report an Issue
          </h1>
        </div>
        <p className="mb-8 font-body text-muted-foreground">
          Found a bug, broken bike, or got feedback? Let us know — no sign-in required.
        </p>

        {submitted ? (
          <div className="rounded-lg border-[3px] border-secondary bg-card p-8 text-center shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 font-display text-2xl uppercase tracking-wider text-foreground">
              Thanks!
            </h2>
            <p className="mb-6 font-body text-muted-foreground">
              Your report has been submitted. We'll take a look as soon as we can.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={resetAll} variant="outline">
                Submit another
              </Button>
              <Button asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-lg border-[3px] border-secondary bg-card p-6 shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
          >
            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                className="mt-1 border-2 border-secondary bg-background font-body"
                maxLength={100}
                required
              />
            </div>

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Email (optional)
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="So we can follow up if needed"
                className="mt-1 border-2 border-secondary bg-background font-body"
                maxLength={200}
              />
            </div>

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Submitting on behalf of someone else?
              </Label>
              <Input
                value={onBehalf}
                onChange={(e) => setOnBehalf(e.target.value)}
                placeholder="Their name and email (optional)"
                className="mt-1 border-2 border-secondary bg-background font-body"
                maxLength={200}
              />
            </div>

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Feedback Type <span className="text-destructive">*</span>
              </Label>
              <Select value={feedbackType} onValueChange={setFeedbackType} required>
                <SelectTrigger className="mt-1 border-2 border-secondary bg-background font-body">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {feedbackType === "Hardware Issue" && (
              <div>
                <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Which bike does this issue relate to?
                </Label>
                <Select value={selectedBikeId} onValueChange={setSelectedBikeId}>
                  <SelectTrigger className="mt-1 border-2 border-secondary bg-background font-body">
                    <SelectValue placeholder={bikes.length ? "Select a bike..." : "Loading bikes..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {bikes.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, bike number (if relevant), and what happened..."
                className="mt-1 border-2 border-secondary bg-background font-body"
                rows={5}
                maxLength={1000}
                required
              />
            </div>

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Add a photo or supporting document
              </Label>
              <div className="mt-1">
                {photo ? (
                  <div className="flex items-center gap-2 rounded border-2 border-secondary bg-muted px-3 py-2">
                    <span className="flex-1 truncate font-body text-sm text-foreground">{photo.name}</span>
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded border-2 border-dashed border-secondary px-3 py-3 font-body text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                    <Upload className="h-4 w-4" />
                    Attach file
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Severity <span className="text-destructive">*</span>
              </Label>
              <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger className="mt-1 border-2 border-secondary bg-background font-body">
                  <SelectValue placeholder="Select severity..." />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={submitting || !name.trim() || !feedbackType || !description.trim() || !severity}
              className="tape-element-green flex w-full items-center justify-center gap-2 text-base"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default Help;
