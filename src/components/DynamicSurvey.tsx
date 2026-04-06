import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

export interface SurveyQuestion {
  id: string;
  questionText: string;
  fieldType: "single select" | "multi select" | "rating" | "text" | "number";
  answerOptions: string[];
  order: number;
  phase: string;
}

interface DynamicSurveyProps {
  questions: SurveyQuestion[];
  phase: string;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
}

export default function DynamicSurvey({ questions, phase, onSubmit, onCancel }: DynamicSurveyProps) {
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const q = sorted[current];
  const total = sorted.length;
  const isLast = current === total - 1;

  const setAnswer = (val: any) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const currentAnswer = answers[q?.id];

  const hasAnswer = () => {
    if (!q) return false;
    if (q.fieldType === "multi select") return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    if (q.fieldType === "text") return typeof currentAnswer === "string" && currentAnswer.trim().length > 0;
    if (q.fieldType === "number") return currentAnswer !== undefined && currentAnswer !== "";
    if (q.fieldType === "rating") return typeof currentAnswer === "number" && currentAnswer > 0;
    return currentAnswer !== undefined && currentAnswer !== "";
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

  if (!q) return null;

  return (
    <div className="flex min-h-[400px] flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Question {current + 1} of {total}
          </span>
          <span className="font-display text-xs uppercase tracking-wider text-primary">
            {phase}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden border-[2px] border-secondary bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <h2 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
            {q.questionText}
          </h2>

          {/* Single Select */}
          {q.fieldType === "single select" && (
            <div className="grid gap-2">
              {q.answerOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(opt)}
                  className={`w-full border-[3px] p-3 text-left font-body text-sm transition-all ${
                    currentAnswer === opt
                      ? "border-primary bg-primary/10 text-foreground shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
                      : "border-secondary bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border-[2px] ${
                        currentAnswer === opt ? "border-primary bg-primary" : "border-muted"
                      }`}
                    >
                      {currentAnswer === opt && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    {opt}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Multi Select */}
          {q.fieldType === "multi select" && (
            <div className="grid gap-2">
              {q.answerOptions.map((opt) => {
                const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const prev = Array.isArray(currentAnswer) ? currentAnswer : [];
                      setAnswer(
                        selected ? prev.filter((v: string) => v !== opt) : [...prev, opt]
                      );
                    }}
                    className={`w-full border-[3px] p-3 text-left font-body text-sm transition-all ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground shadow-[4px_4px_0px_hsl(var(--brand-dark))]"
                        : "border-secondary bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selected} className="pointer-events-none" />
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rating */}
          {q.fieldType === "rating" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setAnswer(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        typeof currentAnswer === "number" && star <= currentAnswer
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {typeof currentAnswer === "number" && (
                <span className="font-display text-sm text-muted-foreground">
                  {currentAnswer} / 5
                </span>
              )}
            </div>
          )}

          {/* Text */}
          {q.fieldType === "text" && (
            <Textarea
              value={currentAnswer ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="min-h-[120px] border-[2px] border-secondary font-body"
            />
          )}

          {/* Number */}
          {q.fieldType === "number" && (
            <Input
              type="number"
              value={currentAnswer ?? ""}
              onChange={(e) => setAnswer(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter a number..."
              className="border-[2px] border-secondary font-body text-lg"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => (current > 0 ? setCurrent(current - 1) : onCancel?.())}
          className="gap-2 font-display uppercase tracking-wider"
        >
          <ChevronLeft className="h-4 w-4" />
          {current > 0 ? "Back" : "Cancel"}
        </Button>

        {isLast ? (
          <Button
            onClick={handleSubmit}
            disabled={!hasAnswer() || submitting}
            className="tape-element-green gap-2 font-display uppercase tracking-wider"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Submit
          </Button>
        ) : (
          <Button
            onClick={() => setCurrent(current + 1)}
            disabled={!hasAnswer()}
            className="gap-2 font-display uppercase tracking-wider"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
