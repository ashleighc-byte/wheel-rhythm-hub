import { useState, useEffect } from "react";
import { Users, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import brandLogo from "@/assets/fw-logo-new.png";

const PERMISSION_LINK = "https://bit.ly/GameFITPermission";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SchoolInfo {
  id: string;
  name: string;
  spots_taken: number;
  spots_remaining: number;
}

const StudentRegistration = () => {
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/registration-count`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        setSchools(data.schools || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load school data. Please try again later.");
        setLoading(false);
      });
  }, []);

  const selected = schools.find((s) => s.id === selectedSchool);
  const isFull = selected ? selected.spots_remaining <= 0 : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b-4 border-secondary">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <img src={brandLogo} alt="Free Wheeler" className="h-12 w-auto rounded" />
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wider text-primary-foreground">
              Student Registration
            </h1>
            <p className="font-body text-xs text-primary-foreground/70">
              Free Wheeler Bike League
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="border-[3px] border-secondary bg-card p-8 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
              Check Available Spots
            </h2>
          </div>

          <p className="mb-6 font-body text-sm text-foreground/80">
            Each school has <span className="font-bold text-foreground">24 spots</span> available
            for the Free Wheeler pilot. Select your school to see how many spots are left, then
            follow the link to complete your registration.
          </p>

          {loading ? (
            <div className="py-8 text-center font-display text-sm uppercase tracking-wider text-muted-foreground animate-pulse">
              Loading schools...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 border-l-4 border-destructive bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Your School
                </label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="border-2 border-secondary bg-background font-body">
                    <SelectValue placeholder="Choose a school..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="space-y-4">
                  {/* Spot counter */}
                  <div className={`border-[3px] p-5 ${isFull ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                          {selected.name}
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground/70">
                          {isFull
                            ? "All spots have been filled for this school."
                            : `${selected.spots_remaining} of 24 spots remaining`}
                        </p>
                      </div>
                      <div className={`font-display text-3xl font-extrabold ${isFull ? "text-destructive" : "text-primary"}`}>
                        {selected.spots_remaining}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-3 w-full bg-muted">
                      <div
                        className={`h-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, (selected.spots_taken / 24) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 font-body text-[11px] text-foreground/50">
                      {selected.spots_taken} / 24 registered
                    </p>
                  </div>

                  {/* CTA */}
                  {isFull ? (
                    <div className="flex items-center gap-2 border-l-4 border-destructive bg-card px-4 py-3">
                      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                      <p className="font-body text-sm text-foreground/80">
                        Registrations are full for this school. Please check with your teacher for
                        more information.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 border-l-4 border-primary bg-card px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="font-body text-sm text-foreground/80">
                          Spots available! Complete the permission form below to register. Both you
                          and your caregiver will need to fill it out.
                        </p>
                      </div>
                      <a href={PERMISSION_LINK} target="_blank" rel="noopener noreferrer">
                        <Button className="tape-element-green w-full text-lg transition-transform hover:rotate-0 hover:scale-105">
                          <ExternalLink className="mr-2 h-5 w-5" />
                          Complete Permission Form
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Info box */}
        <div className="mt-8 border-[3px] border-secondary bg-secondary p-6 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-secondary-foreground">
            What Happens Next?
          </h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 font-body text-sm text-secondary-foreground/80">
            <li>Complete the permission form with your caregiver</li>
            <li>Wait for confirmation from your school</li>
            <li>
              Once approved, sign up at{" "}
              <a
                href="https://freewheeler.lovable.app/auth"
                className="font-semibold text-accent underline"
              >
                freewheeler.lovable.app
              </a>{" "}
              with your school email
            </li>
            <li>Verify your email and sign in</li>
            <li>You'll receive an NFC wristband for easy future sign-ins</li>
          </ol>
        </div>
      </main>

      <footer className="border-t-4 border-primary bg-secondary px-4 py-6">
        <div className="container mx-auto text-center">
          <p className="font-display text-sm font-bold uppercase text-accent">
            Free Wheeler Bike League
          </p>
          <p className="mt-1 font-body text-xs text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StudentRegistration;
