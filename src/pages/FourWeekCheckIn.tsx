import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Loader2, Bike } from "lucide-react";
import brandLogo from "@/assets/fw-logo.png";

const FREQUENCY_OPTIONS = [
  "Everyday",
  "Once or Twice a Week",
  "Rarely",
  "Not at All",
];

const MOTIVATION_OPTIONS = [
  "I don\u2019t usually enjoy traditional sports, but this works for me",
  "I like seeing my stats and progress",
  "I enjoy riding with others/being part of the group",
  "I like that I can ride at my own pace (no pressure)",
  "I wanted to try something new",
  "It feels more fun than other sports or PE",
  "It helps me feel better mentally or reduce stress",
];

const ENCOURAGED_OPTIONS = [
  "Yes, a lot",
  "A little",
  "Not really",
  "No",
];

const FourWeekCheckIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [frequency, setFrequency] = useState("");
  const [motivation, setMotivation] = useState("");
  const [encouraged, setEncouraged] = useState("");
  const [betterFor, setBetterFor] = useState("");

  const isValid = frequency && encouraged && betterFor.trim();

  const handleSubmit = async () => {
    if (!user?.email || !isValid) return;
    setSubmitting(true);

    try {
      const students = await fetchStudents(user.email);
      const student = students.records[0];
      if (!student) {
        toast({
          title: "Error",
          description: "Could not find your student record.",
          variant: "destructive",
        });
        return;
      }

      const fields: Record<string, any> = {
        "Student Name": [student.id],
        "Survey Type": "4 Week Check In",
        "How often do you use the bike?": frequency,
        "Has using the smart bike encouraged you to move more?": encouraged,
        "What would make using this bike better for you right now?": betterFor,
      };

      if (motivation) {
        fields["What motivates you to use the bike?"] = motivation;
      }

      await callAirtable("Surveys & Student Voice", "POST", {
        body: { records: [{ fields }] },
      });

      toast({
        title: "Check-in complete! 🎉",
        description: "Thanks for sharing your feedback.",
      });

      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } catch (err: any) {
      console.error("4 Week Check In submit error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit check-in",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <img
            src={brandLogo}
            alt="Free Wheeler"
            className="mx-auto mb-4 h-16 w-auto object-contain"
          />
          <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
            4 Week Check In
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            You've been riding for 4 weeks – let us know how it's going!
          </p>
        </div>

        <div className="tape-element !transform-none !rotate-0 !px-5 !py-5 space-y-6" style={{ transform: 'none' }}>
          <h2 className="font-display text-lg uppercase tracking-wider text-accent-foreground">
            <Bike className="mr-2 inline h-5 w-5" />
            Your Experience So Far
          </h2>

          {/* Q1: Frequency */}
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
              How often do you use the bike? *
            </Label>
            <RadioGroup value={frequency} onValueChange={setFrequency}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`freq-${opt}`} />
                  <Label htmlFor={`freq-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Q2: Motivation */}
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
              What motivates you to use the bike?
            </Label>
            <RadioGroup value={motivation} onValueChange={setMotivation}>
              {MOTIVATION_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`motiv-${opt}`} />
                  <Label htmlFor={`motiv-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Q3: Encouraged to move more */}
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
              Has using the smart bike encouraged you to move more? *
            </Label>
            <RadioGroup value={encouraged} onValueChange={setEncouraged}>
              {ENCOURAGED_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`enc-${opt}`} />
                  <Label htmlFor={`enc-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Q4: What would make it better */}
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
              What would make using this bike better for you right now? *
            </Label>
            <Textarea
              value={betterFor}
              onChange={(e) => setBetterFor(e.target.value)}
              placeholder="Tell us what would improve your experience..."
              className="min-h-[100px] border-secondary bg-card font-body text-foreground"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex-1 border-secondary font-display uppercase tracking-wider"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 tape-element-green font-display uppercase tracking-wider"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FourWeekCheckIn;
