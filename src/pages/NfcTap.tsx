import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ShieldX, CheckCircle, Star, Upload, X, User, Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { callAirtable, createSessionReflection, escapeFormulaValue } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logoSrc from "@/assets/fw-logo-new.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NfcStudent {
  id: string;
  fullName: string;
  firstName: string;
}

type Phase = "checking" | "invalid" | "ready" | "success";

// ─── Star Rating Component ─────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <Label className="mb-2 block font-display text-sm uppercase tracking-wider text-foreground">
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                star <= (hover || value)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const NfcTap = () => {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("checking");
  const [student, setStudent] = useState<NfcStudent | null>(null);

  // Form state
  const [preRating, setPreRating] = useState(0);
  const [postRating, setPostRating] = useState(0);
  const [reflection, setReflection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Token lookup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      return;
    }

    const lookup = async () => {
      try {
        // Sanitise token to prevent formula injection
        const safeToken = escapeFormulaValue(token);
        const formula = `{NFC Bracelet Token} = '${safeToken}'`;
        const res = await callAirtable("Student Registration", "GET", {
          filterByFormula: formula,
          maxRecords: 1,
          nfcToken: token, // Use NFC token auth instead of JWT
        });

        if (!res.records.length) {
          setPhase("invalid");
          return;
        }

        const rec = res.records[0];
        const f = rec.fields;

        // Validate NFC Status = Active
        const nfcStatus = String(f["NFC Status"] ?? "").toLowerCase();
        if (nfcStatus !== "active") {
          setPhase("invalid");
          return;
        }

        // Validate Consent Status
        const consentStatus = String(f["Consent Status"] ?? "").toLowerCase();
        const consentApproved =
          consentStatus === "active" ||
          consentStatus === "approved" ||
          f["App Access Approved"] === true;

        if (!consentApproved) {
          setPhase("invalid");
          return;
        }

        // Update Last Tap At via PATCH
        try {
          await callAirtable("Student Registration", "PATCH", {
            nfcToken: token,
            body: {
              records: [
                {
                  id: rec.id,
                  fields: { "Last Tap At": new Date().toISOString() },
                },
              ],
            },
          });
        } catch {
          // Non-fatal – proceed even if timestamp update fails
        }

        setStudent({
          id: rec.id,
          fullName: String(f["Full Name"] ?? "Rider"),
          firstName: String(f["First Name"] ?? String(f["Full Name"] ?? "Rider").split(" ")[0]),
        });
        setPhase("ready");
      } catch (err) {
        console.error("NFC lookup error:", err);
        setPhase("invalid");
      }
    };

    lookup();
  }, [token]);

  // ── File handler ────────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preRating === 0 || postRating === 0) {
      toast({ title: "Please rate both before and after mood", variant: "destructive" });
      return;
    }
    if (!student) return;

    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `nfc/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("session-screenshots")
          .upload(path, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("session-screenshots")
            .getPublicUrl(path);
          attachmentUrl = urlData.publicUrl;
        }
      }

      const fields: Record<string, any> = {
        "How did you feel before you jumped on the bike?": preRating,
        "How did you feel after your bike session today?": postRating,
        "What did you enjoy or not enjoy about today's session?": reflection.trim(),
        "Student Registration": [student.id],
      };

      if (attachmentUrl) {
        fields["Use the ipad to take a screenshot of your session time and upload it here."] = [
          { url: attachmentUrl },
        ];
      }

      await createSessionReflection(fields, token);
      setPhase("success");
    } catch (err: any) {
      console.error("NFC submit error:", err);
      toast({
        title: "Couldn't log your ride",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── UI helpers ──────────────────────────────────────────────────────────────
  const Logo = () => (
    <img src={logoSrc} alt="Free Wheeler" className="mx-auto mb-6 h-14 object-contain" />
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <AnimatePresence mode="wait">

        {/* ── CHECKING ── */}
        {phase === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Logo />
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-display text-xl uppercase tracking-widest text-foreground">
              Checking your bracelet…
            </p>
          </motion.div>
        )}

        {/* ── INVALID ── */}
        {phase === "invalid" && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-w-sm flex-col items-center gap-6 text-center"
          >
            <Logo />
            <div className="border-[3px] border-destructive bg-card p-8 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
              <ShieldX className="mx-auto mb-4 h-14 w-14 text-destructive" />
              <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                Bracelet Not Recognised
              </h1>
              <p className="mt-3 font-body text-muted-foreground">
                This bracelet isn't active or access hasn't been approved yet. See your teacher.
              </p>
              <Link to="/auth">
                <Button className="tape-element mt-6 w-full font-display uppercase tracking-wider">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── READY (form) ── */}
        {phase === "ready" && student && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Logo />

            {/* Welcome banner */}
            <div className="mb-6 border-[3px] border-primary bg-primary px-6 py-4 shadow-[6px_6px_0px_hsl(var(--brand-dark))] text-center">
              <p className="font-display text-sm uppercase tracking-widest text-primary-foreground opacity-80">
                Welcome back
              </p>
              <h1 className="font-display text-3xl uppercase tracking-wider text-primary-foreground">
                {student.firstName} 👋
              </h1>
            </div>

            {/* Form card */}
            <div className="border-[3px] border-secondary bg-card p-6 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
              <div className="mb-5 flex items-center gap-2">
                <Bike className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
                  Log a Daily Ride
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rider (read-only) */}
                <div>
                  <Label className="font-display text-sm uppercase tracking-wider text-foreground">
                    Rider
                  </Label>
                  <div className="mt-1 flex items-center gap-2 border-[2px] border-secondary bg-muted px-3 py-2.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-body text-sm font-medium text-foreground">
                      {student.fullName}
                    </span>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div>
                  <Label className="mb-2 block font-display text-sm uppercase tracking-wider text-foreground">
                    Session Screenshot
                  </Label>
                  <p className="mb-2 font-body text-xs text-muted-foreground">
                    Take a screenshot of your session time and upload it here.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Session screenshot"
                        className="max-h-48 w-full rounded border-[2px] border-secondary object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute right-2 top-2 rounded-full bg-secondary p-1 text-secondary-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 border-[2px] border-dashed border-secondary bg-muted px-4 py-8 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      <Upload className="h-5 w-5" />
                      Tap to upload screenshot
                    </button>
                  )}
                </div>

                {/* Pre-session mood */}
                <StarRating
                  value={preRating}
                  onChange={setPreRating}
                  label="How did you feel before jumping on the bike? *"
                />

                {/* Post-session mood */}
                <StarRating
                  value={postRating}
                  onChange={setPostRating}
                  label="How did you feel after your session? *"
                />

                {/* Reflection */}
                <div>
                  <Label htmlFor="reflection" className="font-display text-sm uppercase tracking-wider text-foreground">
                    What did you enjoy or not enjoy?
                  </Label>
                  <Textarea
                    id="reflection"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Tell us about your session..."
                    className="mt-1 min-h-[100px] border-[2px] border-secondary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="tape-element-green w-full text-lg transition-transform hover:scale-105"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
                    </span>
                  ) : (
                    "Log Ride 🚴"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {phase === "success" && student && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-w-sm flex-col items-center gap-6 text-center"
          >
            <Logo />
            <div className="border-[3px] border-primary bg-card p-10 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
              <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
                Ride Logged ✅
              </h1>
              <p className="mt-3 font-body text-muted-foreground">
                Nice work, {student.firstName}! Keep pedalling 🚴‍♂️
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default NfcTap;
