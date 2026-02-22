import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, X, Loader2, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSessionReflection, fetchStudents } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import logoSrc from "@/assets/fw-logo-new.png";

interface SessionFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
              className={`h-8 w-8 transition-colors ${
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

const SessionFeedbackForm = ({ open, onOpenChange }: SessionFeedbackFormProps) => {
  const { user, nfcSession } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [studentRecordId, setStudentRecordId] = useState<string | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [preRating, setPreRating] = useState(0);
  const [postRating, setPostRating] = useState(0);
  const [reflection, setReflection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-fill student name from NFC session or Airtable email lookup
  useEffect(() => {
    if (!open) return;

    // NFC session takes priority
    if (nfcSession) {
      setStudentName(nfcSession.fullName);
      setStudentRecordId(nfcSession.studentId);
      setLoadingStudent(false);
      return;
    }

    if (!user?.email) return;

    setLoadingStudent(true);
    fetchStudents(user.email)
      .then((res) => {
        if (res.records.length > 0) {
          const r = res.records[0];
          setStudentName(String(r.fields["Full Name"] ?? ""));
          setStudentRecordId(r.id);
        } else {
          setStudentName(user.email ?? "");
          setStudentRecordId(null);
        }
      })
      .catch(() => {
        setStudentName(user.email ?? "");
      })
      .finally(() => setLoadingStudent(false));
  }, [open, user?.email, nfcSession]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const resetForm = () => {
    setPreRating(0);
    setPostRating(0);
    setReflection("");
    setFile(null);
    setPreview(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || preRating === 0 || postRating === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("session-screenshots")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("session-screenshots")
          .getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }

      const fields: Record<string, any> = {
        "How did you feel before you jumped on the bike?": preRating,
        "How did you feel after your bike session today?": postRating,
        "What did you enjoy or not enjoy about today's session?": reflection.trim(),
      };

      // Link to student record if found
      if (studentRecordId) {
        fields["Student Registration"] = [studentRecordId];
      } else {
        fields["Student Name"] = studentName.trim();
      }

      if (attachmentUrl) {
        fields["Use the ipad to take a screenshot of your session time and upload it here."] = [{ url: attachmentUrl }];
      }

      await createSessionReflection(fields, nfcSession?.nfcToken);
      setSubmitted(true);
      toast({ title: "Ride logged successfully! 🚴" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast({ title: "Failed to submit feedback", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wider text-foreground">
            Log a Daily Ride
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <Link to="/" className="block">
                <img src={logoSrc} alt="Free Wheeler" className="h-14 object-contain" />
              </Link>
              <CheckCircle className="h-16 w-16 text-primary" />
              <h3 className="font-display text-xl uppercase text-foreground">Ride Logged!</h3>
              <p className="font-body text-muted-foreground">Thanks for logging your ride today.</p>
              <Button
                onClick={() => {
                  handleClose(false);
                  navigate("/dashboard");
                }}
                className="tape-element-green mt-4"
              >
                View Your Stats →
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Student Name - Auto-filled */}
              <div>
                <Label className="font-display text-sm uppercase tracking-wider text-foreground">
                  Rider
                </Label>
                <div className="mt-1 flex items-center gap-2 border-[2px] border-secondary bg-muted px-3 py-2.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {loadingStudent ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Finding your profile...
                    </span>
                  ) : (
                    <span className="font-body text-sm font-medium text-foreground">
                      {studentName}
                    </span>
                  )}
                </div>
              </div>

              {/* Screenshot upload */}
              <div>
                <Label className="mb-2 block font-display text-sm uppercase tracking-wider text-foreground">
                  Session Screenshot
                </Label>
                <p className="mb-2 font-body text-xs text-muted-foreground">
                  Use the iPad to take a screenshot of your session time and upload it here.
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
                label="How did you feel when you first jumped on the bike? *"
              />

              {/* Post-session mood */}
              <StarRating
                value={postRating}
                onChange={setPostRating}
                label="How did you feel after your bike session today? *"
              />

              {/* Reflection */}
              <div>
                <Label htmlFor="reflection" className="font-display text-sm uppercase tracking-wider text-foreground">
                  What did you enjoy or not enjoy about today's session?
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
                disabled={submitting || loadingStudent}
                className="tape-element-green w-full text-lg transition-transform hover:rotate-0 hover:scale-105"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                  </span>
                ) : (
                  "Log Ride"
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SessionFeedbackForm;
