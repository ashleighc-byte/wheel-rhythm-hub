import { useState, useEffect } from "react";
import { AlertTriangle, Send, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { supabase } from "@/integrations/supabase/client";

const FEEDBACK_TYPES = [
  "Hardware Issue",
  "Software Issue",
  "New Racing Track Request",
  "General Feedback",
  "Other",
];

const SEVERITY_OPTIONS = ["Low", "Medium", "High"];

interface ReportIssueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportIssueForm = ({ open, onOpenChange }: ReportIssueFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [studentRecordId, setStudentRecordId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [onBehalf, setOnBehalf] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email || !open) return;
    fetchStudents(user.email).then((res) => {
      if (res.records.length > 0) {
        setStudentRecordId(res.records[0].id);
        setStudentName(String(res.records[0].fields["Full Name"] ?? ""));
      }
    });
  }, [user?.email, open]);

  const resetForm = () => {
    setOnBehalf("");
    setFeedbackType("");
    setDescription("");
    setSeverity("");
    setPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !description.trim() || !severity) return;
    setSubmitting(true);

    try {
      const fields: Record<string, any> = {
        "Feedback Type": feedbackType,
        "Description": description.trim(),
        "Severity": severity,
      };

      if (studentRecordId) {
        fields["Submitted By"] = [studentRecordId];
      }

      if (onBehalf.trim()) {
        fields["If your name is not listed above, type it here"] = onBehalf.trim();
      }

      // Upload photo if provided
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
        description: "Thanks for letting us know. We\u2019ll look into it.",
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Issue report error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase text-foreground">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Submitted By (auto) */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Submitted By
            </Label>
            <div className="mt-1 rounded border-2 border-secondary bg-muted px-3 py-2 font-body text-sm text-foreground">
              {studentName || user?.email || "Loading..."}
            </div>
          </div>

          {/* On behalf of */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              If you are submitting this request on behalf of someone else, what is their name and email address?
            </Label>
            <Input
              value={onBehalf}
              onChange={(e) => setOnBehalf(e.target.value)}
              placeholder="Name and email (optional)"
              className="mt-1 border-2 border-secondary bg-background font-body"
              maxLength={200}
            />
          </div>

          {/* Feedback Type */}
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

          {/* Description */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="mt-1 border-2 border-secondary bg-background font-body"
              rows={4}
              maxLength={1000}
              required
            />
          </div>

          {/* Photo upload */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Add any photos or supporting documents
            </Label>
            <div className="mt-1">
              {photo ? (
                <div className="flex items-center gap-2 rounded border-2 border-secondary bg-muted px-3 py-2">
                  <span className="flex-1 truncate font-body text-sm text-foreground">{photo.name}</span>
                  <button type="button" onClick={() => setPhoto(null)} className="text-muted-foreground hover:text-foreground">
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

          {/* Severity */}
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
            disabled={submitting || !feedbackType || !description.trim() || !severity}
            className="tape-element-green flex w-full items-center justify-center gap-2 text-base"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueForm;
