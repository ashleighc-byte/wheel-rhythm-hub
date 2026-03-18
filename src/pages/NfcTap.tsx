import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldX, Bike, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callAirtable, escapeFormulaValue } from "@/lib/airtable";
import { useAuth } from "@/hooks/useAuth";
import { getLevel } from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";
import SessionFeedbackForm from "@/components/SessionFeedbackForm";
import logoSrc from "@/assets/fw-logo-new.png";

type Phase = "checking" | "invalid" | "choose";

const NfcTap = () => {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("checking");
  const [totalPoints, setTotalPoints] = useState(0);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const { setNfcSession, nfcSession, user } = useAuth();
  const navigate = useNavigate();

  const firstName = nfcSession?.firstName ?? "Rider";

  // Fetch points for the student
  useEffect(() => {
    if (phase !== "choose") return;
    const fetchPoints = async () => {
      try {
        if (user?.id) {
          const { data } = await supabase.rpc("get_student_total_points", { _user_id: user.id });
          if (typeof data === "number") setTotalPoints(data);
        }
      } catch {
        // non-fatal
      }
    };
    fetchPoints();
  }, [phase, user?.id]);

  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      return;
    }

    const lookup = async () => {
      try {
        const safeToken = escapeFormulaValue(token);
        const formula = `{NFC Bracelet Token} = '${safeToken}'`;
        const res = await callAirtable("Student Registration", "GET", {
          filterByFormula: formula,
          maxRecords: 1,
          nfcToken: token,
        });

        if (!res.records.length) {
          setPhase("invalid");
          return;
        }

        const rec = res.records[0];
        const f = rec.fields;

        const nfcStatus = String(f["NFC Status"] ?? "").toLowerCase();
        if (nfcStatus !== "active") {
          setPhase("invalid");
          return;
        }

        const consentStatus = String(f["Consent Status"] ?? "").toLowerCase();
        const consentApproved =
          consentStatus === "active" ||
          consentStatus === "approved" ||
          f["App Access Approved"] === true;

        if (!consentApproved) {
          setPhase("invalid");
          return;
        }

        // Update Last Tap At
        try {
          await callAirtable("Student Registration", "PATCH", {
            nfcToken: token,
            body: {
              records: [
                {
                  id: rec.id,
                  fields: { "Last Tap At": new Date().toISOString() },
                },
              ],
            },
          });
        } catch {
          // Non-fatal
        }

        // Set NFC session in auth context
        setNfcSession({
          studentId: rec.id,
          fullName: String(f["Full Name"] ?? "Rider"),
          firstName: String(f["First Name"] ?? String(f["Full Name"] ?? "Rider").split(" ")[0]),
          nfcToken: token,
        });

        setPhase("choose");
      } catch (err) {
        console.error("NFC lookup error:", err);
        setPhase("invalid");
      }
    };

    lookup();
  }, [token]);

  const levelInfo = getLevel(totalPoints);

  const Logo = () => (
    <Link to="/" className="mx-auto mb-4 block">
      <img src={logoSrc} alt="Free Wheeler" className="h-14 object-contain" />
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <AnimatePresence mode="wait">
        {phase === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Logo />
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-display text-xl uppercase tracking-widest text-foreground">
              Checking your bracelet…
            </p>
          </motion.div>
        )}

        {phase === "invalid" && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-w-sm flex-col items-center gap-6 text-center"
          >
            <Logo />
            <div className="border-[3px] border-destructive bg-card p-8 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
              <ShieldX className="mx-auto mb-4 h-14 w-14 text-destructive" />
              <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                Bracelet Not Recognised
              </h1>
              <p className="mt-3 font-body text-muted-foreground">
                This bracelet isn't active or access hasn't been approved yet. See your teacher.
              </p>
              <Link to="/auth">
                <Button className="tape-element mt-6 w-full font-display uppercase tracking-wider">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {phase === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-lg flex-col items-center gap-6 text-center"
          >
            <Logo />

            {/* Greeting */}
            <div>
              <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
                Hey {firstName}! 👋
              </h1>
              <div className="mt-2 flex items-center justify-center gap-3 font-body text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/20 px-3 py-1 font-display text-xs uppercase tracking-wider text-primary">
                  {levelInfo.current.name}
                </span>
                <span>{totalPoints} pts</span>
              </div>
            </div>

            {/* Choice cards */}
            <div className="grid w-full gap-4">
              {/* MyWhoosh Session */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSessionForm(true)}
                className="flex items-center gap-5 border-[3px] border-primary bg-card p-6 text-left shadow-[5px_5px_0px_hsl(var(--brand-dark))] transition-colors hover:bg-primary/10"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Bike className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-display text-xl uppercase tracking-wider text-foreground">
                    Log a MyWhoosh Session
                  </p>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    Upload your screenshot and log your ride
                  </p>
                </div>
              </motion.button>

              {/* Cycle Cup */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/race")}
                className="flex items-center gap-5 border-[3px] border-accent bg-card p-6 text-left shadow-[5px_5px_0px_hsl(var(--brand-dark))] transition-colors hover:bg-accent/10"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Gamepad2 className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="font-display text-xl uppercase tracking-wider text-foreground">
                    Play Cycle Cup
                  </p>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    Hop on and ride — points logged automatically
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session feedback modal — unchanged component */}
      <SessionFeedbackForm open={showSessionForm} onOpenChange={setShowSessionForm} />
    </div>
  );
};

export default NfcTap;
