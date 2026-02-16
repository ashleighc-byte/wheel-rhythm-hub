import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudents, callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, Bike } from "lucide-react";
import brandLogo from "@/assets/fw-logo.png";

const SPORT_OPTIONS = [
  "I don\u2019t really do any sport or active stuff outside PE",
  "I sometimes join in (e.g. casual games, walking, biking)",
  "I regularly do sport or active recreation (1\u20132 times a week)",
  "I am very active (most days, training or games)",
];

const ACTIVE_DAYS_OPTIONS = [
  { label: "0 days", value: "0" },
  { label: "1 day", value: "1" },
  { label: "2 days", value: "2" },
  { label: "3 days", value: "3" },
  { label: "4 days", value: "4" },
  { label: "5+ days", value: "5" },
];

const DURATION_OPTIONS = [
  "Less than 15 Minutes per day",
  "15-30 Minutes per day",
  "30 Minutes to an Hour per day",
  "More than an hour per day",
];

const CONFIDENCE_OPTIONS = [
  { value: "1", label: "1 - I don't feel confident at all" },
  { value: "2", label: "2 - I feel a little bit confident" },
  { value: "3", label: "3 - I feel okay about it" },
  { value: "4", label: "4 - I feel pretty confident trying movement things" },
  { value: "5", label: "5 - I feel very confident trying movement things" },
];

const ENJOYMENT_OPTIONS = [
  { value: "1", label: "1 - I don't enjoy it at all" },
  { value: "2", label: "2 - I don't really enjoy it" },
  { value: "3", label: "3 - It's okay, I don't mind it" },
  { value: "4", label: "4 - I usually enjoy moving around or being active" },
  { value: "5", label: "5 - I love it!" },
];

const BARRIER_OPTIONS = [
  "Being active isn't hard for me",
  "I feel embarrassed or judged",
  "I don't have people to be active with",
  "I don't know what to do or where to go",
  "I prefer other activities that aren't movement",
  "I find it boring",
  "I find it hard because of health or pain",
  "It costs too much",
];

const BIKE_EXPERIENCE_OPTIONS = [
  "No, never",
  "Yes, a few times",
  "Yes, lots of times",
];

const CYCLING_PREFERENCE_OPTIONS = [
  "1- I don't really think I'd ride much either way",
  "2- I think I'd ride more virtually (like on a smart bike)",
  "3- I think I'd ride about the same on both",
  "4- I think I'd ride more in real life",
  "5- I'd love to ride both!",
];

const GOALS_OPTIONS = [
  "Nothing — I'm happy as I am right now",
  "Be more active or move more often",
  "Enjoy being active more",
  "Try a new sport or activity",
  "Feel more confident being active",
  "Feel safer being active (inside or outside)",
  "Find people to be active with",
  "Get stronger or fitter",
];

const PrePilotSurvey = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sportInvolvement, setSportInvolvement] = useState("");
  const [activeDays, setActiveDays] = useState("");
  const [activeDuration, setActiveDuration] = useState("");
  const [confidence, setConfidence] = useState("");
  const [enjoyment, setEnjoyment] = useState("");
  const [barriers, setBarriers] = useState<string[]>([]);
  const [bikeExperience, setBikeExperience] = useState("");
  const [cyclingPreference, setCyclingPreference] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [rideFriends, setRideFriends] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const toggleBarrier = (b: string) => {
    setBarriers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const toggleGoal = (g: string) => {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const steps = [
    {
      title: "Activity Level",
      subtitle: "Tell us about how active you are",
      valid: sportInvolvement && activeDays && activeDuration,
    },
    {
      title: "Confidence & Enjoyment",
      subtitle: "How do you feel about being active?",
      valid: confidence && enjoyment,
    },
    {
      title: "Barriers",
      subtitle: "What makes being active harder?",
      valid: barriers.length > 0,
    },
    {
      title: "Biking",
      subtitle: "Your experience with bikes",
      valid: bikeExperience && cyclingPreference,
    },
    {
      title: "Goals",
      subtitle: "What would you like to achieve?",
      valid: goals.length > 0,
    },
  ];

  const handleSubmit = async () => {
    if (!user?.email) return;
    setSubmitting(true);

    try {
      // Find student record
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
        "Survey Type": "Pre-Pilot",
        "Current Sport Involvement": sportInvolvement,
        "Q2 - On days when you ARE active, about how long do you move for altogether?": activeDuration,
        
        "Q3 \u2013 Right now, how confident do you feel trying things that involve movement?":
          CONFIDENCE_OPTIONS.find((o) => o.value === confidence)?.label || "",
        "Q4 - How much do you enjoy moving or being active?":
          ENJOYMENT_OPTIONS.find((o) => o.value === enjoyment)?.label || "",
        
        "Q6 - Have you ever used a bike before (any bike at all)?": bikeExperience,
        "Q7 - Do you think you\u2019d cycle more virtually or in real life?": cyclingPreference,
        "Q8 - Thinking about movement or being active\u2026 what would you LIKE to change or improve for yourself?":
          goals,
        "Q8 - Would you want to ride with friends at other schools?": rideFriends,
        "Anything else you want us to know?": anythingElse || "",
      };

      await callAirtable("Surveys & Student Voice", "POST", {
        body: { records: [{ fields }] },
      });

      toast({
        title: "Survey complete! 🎉",
        description: "You're all set to start riding. Let's go!",
      });

      // Small delay then navigate
      setTimeout(() => navigate("/", { replace: true }), 1000);
    } catch (err: any) {
      console.error("Survey submit error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit survey",
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
            Pre-Pilot Survey
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Complete this before you start logging rides
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

          {/* Step 0: Activity Level */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  How would you describe your current sport involvement?
                </Label>
                <RadioGroup value={sportInvolvement} onValueChange={setSportInvolvement}>
                  {SPORT_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`sport-${opt}`} />
                      <Label htmlFor={`sport-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  How many days in a week do you usually move or do something active?
                </Label>
                <RadioGroup value={activeDays} onValueChange={setActiveDays}>
                  {ACTIVE_DAYS_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`days-${opt.value}`} />
                      <Label htmlFor={`days-${opt.value}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  On days when you ARE active, about how long do you move for?
                </Label>
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

          {/* Step 1: Confidence & Enjoyment */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  How confident do you feel trying things that involve movement?
                </Label>
                <RadioGroup value={confidence} onValueChange={setConfidence}>
                  {CONFIDENCE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`conf-${opt.value}`} />
                      <Label htmlFor={`conf-${opt.value}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  How much do you enjoy moving or being active?
                </Label>
                <RadioGroup value={enjoyment} onValueChange={setEnjoyment}>
                  {ENJOYMENT_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`enjoy-${opt.value}`} />
                      <Label htmlFor={`enjoy-${opt.value}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: Barriers */}
          {step === 2 && (
            <div className="space-y-2">
              <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                What makes being active less enjoyable or harder for you? (select all that apply)
              </Label>
              {BARRIER_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`barrier-${opt}`}
                    checked={barriers.includes(opt)}
                    onCheckedChange={() => toggleBarrier(opt)}
                  />
                  <Label htmlFor={`barrier-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Biking */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Have you ever used a bike before (any bike at all)?
                </Label>
                <RadioGroup value={bikeExperience} onValueChange={setBikeExperience}>
                  {BIKE_EXPERIENCE_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`bike-${opt}`} />
                      <Label htmlFor={`bike-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Do you think you'd cycle more virtually or in real life?
                </Label>
                <RadioGroup value={cyclingPreference} onValueChange={setCyclingPreference}>
                  {CYCLING_PREFERENCE_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`pref-${opt}`} />
                      <Label htmlFor={`pref-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  What would you like to change or improve for yourself? (select all that apply)
                </Label>
                {GOALS_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`goal-${opt}`}
                      checked={goals.includes(opt)}
                      onCheckedChange={() => toggleGoal(opt)}
                    />
                    <Label htmlFor={`goal-${opt}`} className="font-body text-sm text-accent-foreground cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Would you want to ride with friends at other schools?
                </Label>
                <RadioGroup value={rideFriends} onValueChange={setRideFriends}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Yes" id="friends-yes" />
                    <Label htmlFor="friends-yes" className="font-body text-sm text-accent-foreground cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="No" id="friends-no" />
                    <Label htmlFor="friends-no" className="font-body text-sm text-accent-foreground cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-display text-xs uppercase tracking-wider text-accent-foreground">
                  Anything else you want us to know? (optional)
                </Label>
                <Textarea
                  value={anythingElse}
                  onChange={(e) => setAnythingElse(e.target.value)}
                  placeholder="Tell us anything..."
                  className="border-2 border-secondary bg-accent/30 font-body text-accent-foreground placeholder:text-accent-foreground/50"
                />
              </div>
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
              disabled={!steps[step].valid || !rideFriends || submitting}
              className="tape-element-green transition-transform hover:rotate-0 hover:scale-105"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit & Start Riding! 🚴"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrePilotSurvey;
