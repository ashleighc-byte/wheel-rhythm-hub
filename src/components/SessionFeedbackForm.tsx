import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, X, Loader2, CheckCircle, User, Zap, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSessionReflection, fetchStudents, updateSessionReflection } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import logoSrc from "@/assets/fw-logo-oval.png";

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
          <motion.button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            animate={star <= value ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.25 }}
            className="transition-colors"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hover || value)
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/40"
              }`}
            />
          </motion.button>
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

  useEffect(() => {
    if (!open) return;
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
    if (!studentName.trim()) {
      toast({ title: "Please wait for your profile to load", variant: "destructive" });
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
        "What did you enjoy or not enjoy about today's session?": reflection.trim(),
      };
      if (preRating > 0) {
        fields["How did you feel before you jumped on the bike?"] = preRating;
      }
      if (postRating > 0) {
        fields["How did you feel after your bike session today?"] = postRating;
      }

      if (studentRecordId) {
        fields["Student Registration"] = [studentRecordId];
      } else {
        fields["Student Name"] = studentName.trim();
      }

      if (attachmentUrl) {
        fields["Use the ipad to take a screenshot of your session time and upload it here."] = [{ url: attachmentUrl }];
      }

      const createResponse = await createSessionReflection(fields, nfcSession?.nfcToken);
      const newSessionRecordId = createResponse?.records?.[0]?.id;

      let pointsEarned = 10;
      if (user?.id && studentRecordId) {
        try {
          const { recordSessionPoints } = await import("@/lib/points");
          pointsEarned = await recordSessionPoints(user.id, studentRecordId);
        } catch (err) {
          console.error("Points recording failed:", err);
        }
      }

      if (newSessionRecordId) {
        try {
          await updateSessionReflection(
            newSessionRecordId,
            { "Points Earned": pointsEarned },
            nfcSession?.nfcToken
          );
        } catch (err) {
          console.error("Failed to sync points to Airtable:", err);
        }
      }

      // Emit activity feed event
      try {
        const firstName = studentName.split(" ")[0];
        await supabase.from("activity_feed" as any).insert({
          event_type: "ride",
          rider_name: firstName,
          school_name: "",
          message: "just logged a ride",
        });
      } catch (feedErr) {
        console.error("Activity feed insert failed:", feedErr);
      }

      setSubmitted(true);
      toast({ title: `+${pointsEarned} points earned!` });
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
            Log Your Ride
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <Link to="/" className="block">
                <img src={logoSrc} alt="Free Wheeler" className="h-14 object-contain" />
              </Link>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <CheckCircle className="h-16 w-16 text-primary" />
              </motion.div>
              <h3 className="font-display text-xl uppercase text-foreground">Ride Logged!</h3>
              <p className="font-body text-muted-foreground">Your session has been logged and your points have been recorded.</p>
              <Button
                onClick={() => {
                  handleClose(false);
                  navigate("/dashboard");
                }}
                className="tape-element-green mt-4"
              >
                View Your Stats
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
              {/* Student Name */}
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
                  Session Screenshot <span className="font-body text-xs normal-case tracking-normal text-muted-foreground">(optional)</span>
                </Label>
                <p className="mb-2 font-body text-xs text-muted-foreground">
                  Take a screenshot of your session time on the iPad and upload it here if you have one.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
                {preview ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <img
                      src={preview}
                      alt="Session screenshot"
                      className="max-h-48 w-full border-[2px] border-secondary object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute right-2 top-2 bg-secondary p-1 text-secondary-foreground hover-bounce"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 border-[2px] border-dashed border-secondary bg-muted px-4 py-8 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <Camera className="h-5 w-5" />
                    Tap to upload screenshot
                  </motion.button>
                )}
              </div>

              {/* Pre-session mood */}
              <StarRating
                value={preRating}
                onChange={setPreRating}
                label="How did you feel when you first jumped on the bike?"
              />

              {/* Post-session mood */}
              <StarRating
                value={postRating}
                onChange={setPostRating}
                label="How did you feel after your bike session today?"
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
                className="tape-element-green w-full text-lg"
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
