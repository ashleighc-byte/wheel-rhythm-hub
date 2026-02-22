import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callAirtable, escapeFormulaValue } from "@/lib/airtable";
import { useAuth } from "@/hooks/useAuth";
import logoSrc from "@/assets/fw-logo-new.png";

type Phase = "checking" | "invalid" | "redirecting";

const NfcTap = () => {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("checking");
  const { setNfcSession } = useAuth();
  const navigate = useNavigate();

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

        // Set NFC session in auth context — grants access to student routes
        setNfcSession({
          studentId: rec.id,
          fullName: String(f["Full Name"] ?? "Rider"),
          firstName: String(f["First Name"] ?? String(f["Full Name"] ?? "Rider").split(" ")[0]),
          nfcToken: token,
        });

        setPhase("redirecting");
        navigate("/", { replace: true });
      } catch (err) {
        console.error("NFC lookup error:", err);
        setPhase("invalid");
      }
    };

    lookup();
  }, [token]);

  const Logo = () => (
    <img src={logoSrc} alt="Free Wheeler" className="mx-auto mb-6 h-14 object-contain" />
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
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

        {phase === "redirecting" && (
          <motion.div
            key="redirecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Logo />
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-display text-lg uppercase tracking-widest text-foreground">
              Welcome! Redirecting…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NfcTap;
