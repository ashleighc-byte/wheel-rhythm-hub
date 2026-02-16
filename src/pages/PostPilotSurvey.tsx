import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, Bike, CheckCircle2 } from "lucide-react";
import brandLogo from "@/assets/fw-logo.png";

/* ─── Option arrays (must match exact Airtable single-select values) ─── */

const ACTIVITY_REFLECTION_OPTIONS = [
  "I join in a lot more than before",
  "I join in a little bit more than before",
  "I join in about the same as before",
  "I join in less than before",
  "I\u2019m not sure",
];

const ACTIVE_DAYS_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7"];

const DURATION_OPTIONS = [
  "0-15 Minutes per day",
  "15-30 Minutes per day",
  "30 Minutes to an Hour per day",
  "More than an hour per day",
];

const CONFIDENCE_CHANGE_OPTIONS = [
  "I feel MUCH more confident now",
  "I feel a LITTLE more confident now",
  "I feel about the same as before",
  "I feel a little less confident",
  "I feel much less confident",
  "I\u2019m not sure",
];

const ENJOYMENT_CHANGE_OPTIONS = [
  "I enjoy being active a LOT more now",
  "I enjoy being active a LITTLE more now",
  "I enjoy it about the same as before",
  "I enjoy it less than before",
  "I\u2019m not sure",
];

const FEELS_DIFFERENT_OPTIONS = [
  "I feel more confident now",
  "It feels less embarrassing now",
  "I feel safer being active now",
  "Being active feels more fun now",
  "I feel fitter or stronger",
  "I get less tired than before",
  "I join in more often",
  "I feel better doing activity with others",
  "Things feel about the same as before",
  "I still don\u2019t feel very confident",
  "I still feel embarrassed or shy",
  "I still get tired easily",
  "I still worry people will judge me",
  "I still don\u2019t feel fit enough",
  "I still prefer doing other things",
  "I still don\u2019t have someone to be active with",
  "I still get anxious trying new things",
  "Being active feels harder now",
  "I feel less confident now",
  "Nothing feels different",
  "I\u2019m not sure yet",
  "Other",
];

const RIDE_FRIENDS_OPTIONS = ["Yes", "No"];

const RIDE_FRIENDS_WHY_OPTIONS = [
  "It would make it more fun",
  "I like competing or riding with friends",
  "I like meeting new people",
  "It motivates me more when others are involved",
  "It would feel cool to ride against other schools",
  "I\u2019d feel shy or embarrassed",
  "I don\u2019t like people watching me",
  "I\u2019m not confident enough yet",
  "I prefer riding on my own",
  "I\u2019m not interested in other schools",
  "I don\u2019t really use bikes much",
  "Other",
];

/* ─── Component ─── */

const PostPilotSurvey = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [activityReflection, setActivityReflection] = useState("");
  const [activeDays, setActiveDays] = useState("");
  const [activeDuration, setActiveDuration] = useState("");
  const [confidenceChange, setConfidenceChange] = useState("");
  const [enjoymentChange, setEnjoymentChange] = useState("");
  const [feelsDifferent, setFeelsDifferent] = useState<string[]>([]);
  const [feelsDifferentText, setFeelsDifferentText] = useState("");
  const [rideFriends, setRideFriends] = useState("");
  const [rideFriendsWhy, setRideFriendsWhy] = useState<string[]>([]);
  const [anythingElse, setAnythingElse] = useState("");

  const toggleFeelsDifferent = (v: string) =>
    setFeelsDifferent((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const toggleRideFriendsWhy = (v: string) =>
    setRideFriendsWhy((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const steps = [
    {
      title: "Activity Reflection",
      subtitle: "How has your activity changed?",
      valid: activityReflection && activeDays && activeDuration,
    },
    {
      title: "Confidence & Enjoyment",
      subtitle: "How have things changed for you?",
      valid: confidenceChange && enjoymentChange,
    },
    {
      title: "What Feels Different",
      subtitle: "Select all that apply",
      valid: feelsDifferent.length > 0,
    },
    {
      title: "Reflections & Friends",
      subtitle: "Tell us more",
      valid: rideFriends && rideFriendsWhy.length > 0,
    },
    {
      title: "Final Thoughts",
      subtitle: "Anything else?",
      valid: true, // optional text field
    },
  ];

  const handleSubmit = async () => {
    if (!user?.email) return;
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
        "Survey Type": "Post-Pilot",
        "At the start of this programme you answered a question about how often you join in with activity. Now that you\u2019ve completed Free Wheeler, how would you answer that question today?":
          activityReflection,
        "Q1 \u2013How many days in a week do you usually move around or do something active?":
          activeDays,
        "Q2 - On days when you ARE active, about how long do you move for altogether?":
          activeDuration,
        "Q3b - Has your confidence in trying movement changed since the start of the programme?":
          confidenceChange,
        "Q4b - Has your enjoyment of being active changed since the start of the programme?":
          enjoymentChange,
        "Q5b - Thinking about what you said earlier about what makes being active hard\u2026 does anything feel different now?":
          feelsDifferent,
        "Q5b - Is there anything else you want to tell us about what feels different or the same?":
          feelsDifferentText || "",
        "Q8 - Would you want to ride with friends at other schools?":
          rideFriends,
        "Q8b - Why or Why Not?": rideFriendsWhy,
        "Anything else you want us to know?": anythingElse || "",
      };

      await callAirtable("Surveys & Student Voice", "POST", {
        body: { records: [{ fields }] },
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Post-pilot survey error:", err);
      toast({
        title: "Something went wrong",
        description: err.message || "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center bg-primary">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Survey Complete!
          </h1>
          <p className="mt-4 font-body text-lg text-muted-foreground">
            Thank you for submitting the form and being part of our pilot program.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="tape-element-green mt-8"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
            Post-Pilot Survey
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Tell us how the programme went for you
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="tape-element rotate-[-1deg] !px-5 !py-5 space-y-4">
          <h2 className="font-display text-lg uppercase tracking-wider text-accent-foreground">
            <Bike className="mr-2 inline h-5 w-5" />
            {steps[step].title}
          </h2>
          <p className="font-body text-sm text-accent-foreground/70">
            {steps[step].subtitle}
          </p>

          {/* Step 0: Activity Reflection */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  At the start of this programme you answered a question about how often you join in with activity. Now that you{"\u2019"}ve completed Free Wheeler, how would you answer that question today?
                </Label>
                <RadioGroup value={activityReflection} onValueChange={setActivityReflection}>
                  {ACTIVITY_REFLECTION_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`ref-${opt}`} />
                      <Label htmlFor={`ref-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Q1 – How many days in a week do you usually move around or do something active?
                </Label>
                <p className="font-body text-xs text-accent-foreground/60">
                  Any movement counts — walking, playing, dancing, biking, chores, PE, or just moving around. There are NO right answers. Just pick the closest guess.
                </p>
                <RadioGroup value={activeDays} onValueChange={setActiveDays}>
                  <div className="grid grid-cols-4 gap-2">
                    {ACTIVE_DAYS_OPTIONS.map((d) => (
                      <div key={d} className="flex items-center gap-1.5">
                        <RadioGroupItem value={d} id={`days-${d}`} />
                        <Label htmlFor={`days-${d}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                          {d}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Q2 – On days when you ARE active, about how long do you move for altogether?
                </Label>
                <p className="font-body text-xs text-accent-foreground/60">
                  It{"\u2019"}s okay to guess! This includes ALL the little bits of movement you do in a day.
                </p>
                <RadioGroup value={activeDuration} onValueChange={setActiveDuration}>
                  {DURATION_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`dur-${opt}`} />
                      <Label htmlFor={`dur-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 1: Confidence & Enjoyment Changes */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Q3b – Has your confidence in trying movement changed since the start of the programme?
                </Label>
                <RadioGroup value={confidenceChange} onValueChange={setConfidenceChange}>
                  {CONFIDENCE_CHANGE_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`conf-${opt}`} />
                      <Label htmlFor={`conf-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Q4b – Has your enjoyment of being active changed since the start of the programme?
                </Label>
                <RadioGroup value={enjoymentChange} onValueChange={setEnjoymentChange}>
                  {ENJOYMENT_CHANGE_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`enjoy-${opt}`} />
                      <Label htmlFor={`enjoy-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: What Feels Different */}
          {step === 2 && (
            <div className="space-y-2">
              <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                Q5b – Thinking about what you said earlier about what makes being active hard… does anything feel different now?
              </Label>
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
                {FEELS_DIFFERENT_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`diff-${opt}`}
                      checked={feelsDifferent.includes(opt)}
                      onCheckedChange={() => toggleFeelsDifferent(opt)}
                    />
                    <Label htmlFor={`diff-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Reflections & Ride with friends */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Is there anything else you want to tell us about what feels different or the same?
                </Label>
                <Textarea
                  value={feelsDifferentText}
                  onChange={(e) => setFeelsDifferentText(e.target.value)}
                  placeholder="Tell us more... (optional)"
                  className="border-2 border-secondary bg-accent/30 font-body text-accent-foreground placeholder:text-accent-foreground/50"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Would you want to expand this pilot and be able to ride online with friends at other schools?
                </Label>
                <RadioGroup value={rideFriends} onValueChange={setRideFriends}>
                  {RIDE_FRIENDS_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`friends-${opt}`} />
                      <Label htmlFor={`friends-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Why or Why Not? (select all that apply)
                </Label>
                {RIDE_FRIENDS_WHY_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`why-${opt}`}
                      checked={rideFriendsWhy.includes(opt)}
                      onCheckedChange={() => toggleRideFriendsWhy(opt)}
                    />
                    <Label htmlFor={`why-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Final */}
          {step === 4 && (
            <div className="space-y-2">
              <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                Anything else you want us to know? (optional)
              </Label>
              <Textarea
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                placeholder="Tell us anything..."
                className="border-2 border-secondary bg-accent/30 font-body text-accent-foreground placeholder:text-accent-foreground/50"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="border-2 border-secondary font-display uppercase tracking-wider"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!steps[step].valid}
              className="tape-element-green transition-transform hover:rotate-0 hover:scale-105"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!steps[step].valid || submitting}
              className="tape-element-green transition-transform hover:rotate-0 hover:scale-105"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Survey 🎉"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPilotSurvey;
