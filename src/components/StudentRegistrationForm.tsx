import { useState, useEffect } from "react";
import { callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
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
  const [agreedConsent, setAgreedConsent] = useState(false);
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
            (data.schools || []).map((s: any) => ({ id: s.id, name: s.name, spots_remaining: s.spots_remaining }))
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

    if (!agreedConsent) {
      toast({
        title: "Consent required",
        description: "Please confirm your school or caregiver has given permission.",
        variant: "destructive",
      });
      return;
    }

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

    // Block submission if all 24 spots are taken
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

      // Link school by org record ID if matched
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
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: "Something went wrong — please try again or ask your teacher for help.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md border-[3px] border-primary bg-card p-8 text-center shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
        <h3 className="font-display text-xl font-bold uppercase text-foreground">
          You're registered! 🚴
        </h3>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          Your registration is in. Once your school confirms consent and Sport Waikato processes your sign-up, your NFC bracelet and starter pack will be delivered to your school.
        </p>
        <p className="mt-3 font-body text-xs text-muted-foreground">
          Questions? Ask your teacher or contact Sport Waikato.
        </p>
      </div>
    );
  }

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

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
              onChange={(e) => setLastInitial(e.target.value.replace(/[^a-zA-Z]/g, "").charAt(0))}
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
                return <p className="mt-1 font-display text-xs text-destructive">Registration closed — all 24 spots are taken.</p>;
              }
              return <p className="mt-1 font-display text-xs text-muted-foreground">{selected.spots_remaining} of 24 spots remaining</p>;
            }
            return null;
          })()}
        </div>

        {/* Consent checkbox */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent"
            checked={agreedConsent}
            onCheckedChange={(checked) => setAgreedConsent(checked === true)}
            className="mt-0.5 border-secondary-foreground/40 data-[state=checked]:bg-primary"
          />
          <Label
            htmlFor="consent"
            className="font-body text-xs leading-snug text-foreground/80"
          >
            My school or caregiver has confirmed I have permission to participate in Freewheeler. I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              className="font-bold text-primary underline"
            >
              Terms & Conditions
            </Link>
            .
          </Label>
        </div>

        {(() => {
          const sel = schools.find(s => s.name === school);
          const isFull = sel && sel.spots_remaining !== undefined && sel.spots_remaining <= 0;
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
