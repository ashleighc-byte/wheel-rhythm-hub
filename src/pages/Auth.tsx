import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import brandLogo from "@/assets/fw-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to verify your account.",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img
            src={brandLogo}
            alt="Free Wheeler Bike League"
            className="mx-auto mb-6 h-20 w-auto object-contain"
          />
          <h1 className="font-display text-3xl uppercase tracking-wider text-secondary-foreground">
            {isLogin ? "Sign In" : "Create Account"}
          </h1>
          <p className="mt-2 font-body text-sm text-secondary-foreground/70">
            {isLogin ? "Welcome back, rider!" : "Join the Free Wheeler league"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-display text-xs uppercase tracking-wider text-secondary-foreground">
              School Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.nz"
              required
              className="mt-1 border-[2px] border-primary bg-card"
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-display text-xs uppercase tracking-wider text-secondary-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="mt-1 border-[2px] border-primary bg-card"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="tape-element-green w-full text-lg transition-transform hover:rotate-0 hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <p className="text-center font-body text-sm text-secondary-foreground/70">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-display font-bold uppercase text-primary underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
