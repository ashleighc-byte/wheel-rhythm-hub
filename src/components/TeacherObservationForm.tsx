import { useState, useEffect } from "react";
import { ClipboardList, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { callAirtable, fetchTeacherOrg, fetchStudentsByIds } from "@/lib/airtable";

interface TeacherObservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeacherObservationForm = ({ open, onOpenChange }: TeacherObservationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [teacherName, setTeacherName] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [observationSummary, setObservationSummary] = useState("");
  const [difference, setDifference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load teacher name + their school's students when the form opens
  useEffect(() => {
    if (!user?.email || !open) return;

    setLoadingStudents(true);

    callAirtable("Organisations", "GET", {
      filterByFormula: `{Email} = '${user.email}'`,
      maxRecords: 1,
    })
      .then(async (orgRes) => {
        if (!orgRes.records.length) return;
        const org = orgRes.records[0];
        setTeacherName(String(org.fields["Full Name"] ?? user.email ?? ""));

        const studentRecordIds: string[] = Array.isArray(org.fields["Student Registration"])
          ? org.fields["Student Registration"]
          : [];

        if (!studentRecordIds.length) return;

        const studentsRes = await fetchStudentsByIds(studentRecordIds);
        const mapped = studentsRes.records
          .map((r) => ({
            id: r.id,
            name: String(r.fields["Full Name"] ?? ""),
          }))
          .filter((s) => s.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setStudents(mapped);
      })
      .catch(console.error)
      .finally(() => setLoadingStudents(false));
  }, [user?.email, open]);

  const resetForm = () => {
    setSelectedStudentName("");
    setObservationSummary("");
    setDifference("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentName || !observationSummary.trim() || !difference.trim()) return;
    setSubmitting(true);

    try {
      const combined = `What I observed:\n${observationSummary.trim()}\n\nHow is this different from before Free Wheelers:\n${difference.trim()}`;

      const fields: Record<string, any> = {
        "Your Name": teacherName,
        "Student's Name": selectedStudentName,
        "Observation Summary": combined,
      };

      await callAirtable("Kaiako Observations", "POST", {
        body: { records: [{ fields }] },
      });

      toast({
        title: "Observation submitted!",
        description: "Thanks — your observation has been recorded.",
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Observation form error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = !!selectedStudentName && observationSummary.trim().length > 0 && difference.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase text-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            Kaiako Observation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Your Name — auto-filled, read-only */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your Name
            </Label>
            <div className="mt-1 rounded border-2 border-secondary bg-muted px-3 py-2 font-body text-sm text-foreground">
              {teacherName || user?.email || "Loading..."}
            </div>
          </div>

          {/* Student dropdown — filtered to their school */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Student's Name <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStudentName}
              onValueChange={setSelectedStudentName}
              required
            >
              <SelectTrigger className="mt-1 border-2 border-secondary bg-background font-body">
                <SelectValue
                  placeholder={
                    loadingStudents ? "Loading students..." : "Select a student..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-card border-2 border-secondary">
                {students.length === 0 && !loadingStudents ? (
                  <SelectItem value="__none" disabled>
                    No students found
                  </SelectItem>
                ) : (
                  students.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* What I have Observed */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              What I have Observed <span className="text-destructive">*</span>
            </Label>
            <p className="mb-1 font-body text-xs text-muted-foreground">
              Engagement, Participation, Educational priorities, Behaviour, etc.
            </p>
            <Textarea
              value={observationSummary}
              onChange={(e) => setObservationSummary(e.target.value)}
              placeholder="Describe what you observed during this session..."
              className="border-2 border-secondary bg-background font-body"
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          {/* How is this different from before */}
          <div>
            <Label className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              How is this different from before Free Wheelers? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={difference}
              onChange={(e) => setDifference(e.target.value)}
              placeholder="Describe any changes you've noticed since the programme started..."
              className="mt-1 border-2 border-secondary bg-background font-body"
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !isValid}
            className="tape-element-green flex w-full items-center justify-center gap-2 text-base"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Observation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherObservationForm;
