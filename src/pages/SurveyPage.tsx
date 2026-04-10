import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DynamicSurvey, { type SurveyQuestion } from "@/components/DynamicSurvey";
import { fetchSurveyQuestions, submitSurveyResponses, fetchStudents, markSurveyCompleted } from "@/lib/airtable";
import { clearSurveyDismissal, dismissSurvey } from "@/lib/surveyDismissals";
import logoSrc from "@/assets/fw-logo-oval.png";

const SurveyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const phase = searchParams.get("phase") || "Pre Phase";

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const qs = await fetchSurveyQuestions(phase);
        setQuestions(qs);
      } catch (err) {
        console.error("Failed to load survey questions:", err);
        setError("Failed to load survey. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [phase]);

  const handleSubmit = async (responses: Record<string, any>) => {
    if (!user?.email) return;

    try {
      const students = await fetchStudents(user.email);
      if (!students.records.length) {
        toast({ title: "Error", description: "Student record not found.", variant: "destructive" });
        return;
      }
      const studentRecordId = students.records[0].id;

      const questionMap = new Map(questions.map((q) => [q.id, q]));
      const mappedResponses: Record<string, any> = {};
      for (const [questionId, answer] of Object.entries(responses)) {
        const q = questionMap.get(questionId);
        if (!q) continue;
        mappedResponses[q.questionText] = answer;
      }

      await submitSurveyResponses({
        studentRecordId,
        phase,
        responses: mappedResponses,
      });

      markSurveyCompleted(phase, user.email);
      if (user.id) clearSurveyDismissal(phase, user.id, user.email);

      setSubmitted(true);
      toast({ title: "Survey Complete!", description: `${phase} survey submitted successfully.` });
    } catch (err) {
      console.error("Failed to submit survey:", err);
      toast({
        title: "Submission failed",
        description: "We couldn't save your survey yet. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="font-display text-lg uppercase tracking-wider text-foreground">
            Loading survey...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md border-[3px] border-destructive bg-card p-8 text-center shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-lg text-destructive">{error}</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex max-w-md flex-col items-center gap-6 border-[3px] border-primary bg-card p-8 text-center shadow-[6px_6px_0px_hsl(var(--brand-dark))]"
        >
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
            Survey Complete!
          </h1>
          <p className="font-body text-muted-foreground">
            Thanks for completing the {phase} survey. Your responses have been saved.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="tape-element-green w-full font-display uppercase tracking-wider"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md border-[3px] border-secondary bg-card p-8 text-center shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-lg text-foreground">
            The {phase} survey isn't available yet.
          </p>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Questions haven't been added for this phase. You'll be prompted again when it's ready.
          </p>
          <Button onClick={() => {
            if (user?.id && user?.email) {
              dismissSurvey(phase, user.id, user.email);
            }
            navigate("/dashboard");
          }} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mx-auto mb-6 block w-fit">
          <img src={logoSrc} alt="Free Wheeler" className="h-12 object-contain" />
        </Link>
        <DynamicSurvey
          questions={questions}
          phase={phase}
          onSubmit={handleSubmit}
          onCancel={phase !== "Pre Phase" ? () => navigate("/dashboard") : undefined}
        />
      </div>
    </div>
  );
};

export default SurveyPage;
