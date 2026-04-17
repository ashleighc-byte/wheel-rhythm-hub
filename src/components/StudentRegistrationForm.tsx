import { useState, useEffect } from "react";
import { callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const YEAR_LEVELS = ["Year 9", "Year 10", "Year 11", "Year 12", "Year 13"];

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const StudentRegistrationForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [school, setSchool] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string; spots_remaining?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/registration-count`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          setSchools(
            (data.schools || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              spots_remaining: s.spots_remaining,
            }))
          );
        }
      } catch {
        console.error("Failed to load schools");
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!school) {
      toast({
        title: "School required",
        description: "Please select your school.",
        variant: "destructive",
      });
      return;
    }

    if (!lastInitial.trim()) {
      toast({
        title: "Last initial required",
        description: "Please enter the first letter of your last name.",
        variant: "destructive",
      });
      return;
    }

    if (!yearLevel) {
      toast({
        title: "Year level required",
        description: "Please select your year level.",
        variant: "destructive",
      });
      return;
    }

    const selectedSchool = schools.find(s => s.name === school);
    if (selectedSchool && selectedSchool.spots_remaining !== undefined && selectedSchool.spots_remaining <= 0) {
      toast({
        title: "Registration closed",
        description: "All 24 spots at this school have been taken.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const schoolName = schools.find((s) => s.name === school)
        ? school
        : toTitleCase(school);

      const fields: Record<string, any> = {
        "First Name": firstName.trim(),
        "Last Initial": lastInitial.trim().toUpperCase().charAt(0),
        "Year Level": yearLevel,
        "Registration Status": "Pending Consent",
      };

      const matchingSchool = schools.find((s) => s.name === schoolName);
      if (matchingSchool) {
        fields["School"] = [matchingSchool.id];
      } else {
        fields["School Name"] = schoolName;
      }

      await callAirtable("Student Registration", "POST", {
        body: { records: [{ fields }] },
      });

      setSuccess(true);
    } catch {
      toast({
        title: "Registration failed",
        description: "Something went wrong — please try again or ask your teacher for help.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="border-[3px] border-primary bg-card p-6 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center bg-primary">
            <Check className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
            You're on the list!
          </h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-foreground/80">
            Your name has been added to the waitlist.
          </p>
        </div>

        {/* What happens next */}
        <div className="border-[3px] border-secondary bg-card p-5 text-left shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            What happens next
          </p>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                text: "Your school will send a permission form home for your caregiver to sign.",
              },
              {
                step: "2",
                text: "The league is limited to the first 24 students per school — check in with your parent or caregiver and make sure they return the form quickly.",
              },
              {
                step: "3",
                text: "Once your school receives your signed permission form and confirms you're in the first 24, your name gets passed to Sport Waikato.",
              },
              {
                step: "4",
                text: "Sport Waikato will put together your League Kit (NFC bracelet + starter pack) and deliver it to your school.",
              },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-primary font-display text-xs font-bold text-primary">
                  {step}
                </span>
                <span className="font-body text-sm leading-snug text-foreground/80">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="font-body text-xs text-muted-foreground">
          Questions? Ask your teacher or visit{" "}
          <Link to="/programme-overview" className="underline text-primary">
            freewheelerleague.com/programme-overview
          </Link>
        </p>
      </div>
    );
  }

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-display text-xs uppercase tracking-wider text-foreground/80">
              First Name *
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First name"
              className="border-2 border-border bg-muted text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <Label className="font-display text-xs uppercase tracking-wider text-foreground/80">
              Last Initial *
            </Label>
            <Input
              value={lastInitial}
              onChange={(e) =>
                setLastInitial(e.target.value.replace(/[^a-zA-Z]/g, "").charAt(0))
              }
              required
              maxLength={1}
              placeholder="e.g. S"
              className="border-2 border-border bg-muted text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Year Level */}
        <div>
          <Label className="font-display text-xs uppercase tracking-wider text-foreground/80">
            Year Level *
          </Label>
          <Select value={yearLevel} onValueChange={setYearLevel} required>
            <SelectTrigger className="border-2 border-border bg-muted text-foreground">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_LEVELS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* School combobox */}
        <div>
          <Label className="font-display text-xs uppercase tracking-wider text-foreground/80">
            School *
          </Label>
          <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={schoolOpen}
                className="w-full justify-between border-2 border-border bg-muted text-foreground hover:bg-muted"
              >
                {school || "Select your school..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput
                  placeholder="Search school..."
                  value={schoolSearch}
                  onValueChange={setSchoolSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {schoolSearch.trim() ? (
                      <button
                        type="button"
                        className="w-full px-2 py-1.5 text-left text-sm"
                        onClick={() => {
                          setSchool(toTitleCase(schoolSearch.trim()));
                          setSchoolOpen(false);
                          setSchoolSearch("");
                        }}
                      >
                        Use "{toTitleCase(schoolSearch.trim())}"
                      </button>
                    ) : (
                      "No schools found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredSchools.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.name}
                        onSelect={() => {
                          setSchool(s.name);
                          setSchoolOpen(false);
                          setSchoolSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            school === s.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {s.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {school && (() => {
            const selected = schools.find(s => s.name === school);
            if (selected && selected.spots_remaining !== undefined) {
              if (selected.spots_remaining <= 0) {
                return (
                  <p className="mt-1 font-display text-xs text-destructive">
                    Registration closed — all 24 spots are taken.
                  </p>
                );
              }
              return (
                <p className="mt-1 font-display text-xs text-muted-foreground">
                  {selected.spots_remaining} of 24 spots remaining at this school
                </p>
              );
            }
            return null;
          })()}
        </div>

        {/* What happens after you register */}
        <div className="flex items-start gap-2.5 rounded-none border-l-4 border-primary bg-primary/5 px-3 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="font-body text-xs leading-relaxed text-foreground/80">
            Tapping <strong>Join the League</strong> adds your name to the waitlist. Your school will
            send a permission form home for your caregiver to sign — spots are first come, first served,
            so make sure they get it back quickly.{" "}
            <Link
              to="/league-info"
              target="_blank"
              className="font-semibold text-primary underline underline-offset-2"
            >
              What am I signing up for?
            </Link>
          </p>
        </div>

        {/* Submit */}
        {(() => {
          const sel = schools.find(s => s.name === school);
          const isFull =
            sel && sel.spots_remaining !== undefined && sel.spots_remaining <= 0;
          return (
            <Button
              type="submit"
              disabled={loading || !!isFull}
              className="tape-element-green w-full text-base transition-transform hover:rotate-0 hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Registering...
                </span>
              ) : isFull ? (
                "REGISTRATION CLOSED"
              ) : (
                "JOIN THE LEAGUE"
              )}
            </Button>
          );
        })()}
      </form>
    </div>
  );
};

export default StudentRegistrationForm;
