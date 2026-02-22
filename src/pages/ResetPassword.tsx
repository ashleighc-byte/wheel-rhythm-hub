import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import brandLogo from "@/assets/fw-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      toast({ title: "Invalid link", description: "This reset link is invalid or expired.", variant: "destructive" });
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={brandLogo} alt="Free Wheeler Bike League" className="mx-auto mb-6 h-20 w-auto object-contain" />
          <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">New Password</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="tape-element inline-flex w-full flex-col gap-1 rotate-[1deg]">
            <Label htmlFor="password" className="font-display text-xs uppercase tracking-wider text-accent-foreground">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="border-2 border-secondary bg-accent/30 font-display text-accent-foreground placeholder:text-accent-foreground/50 focus-visible:ring-secondary" />
          </div>
          <Button type="submit" disabled={loading} className="tape-element-green w-full text-lg transition-transform hover:rotate-0 hover:scale-105">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Updating...</span> : "Set New Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
