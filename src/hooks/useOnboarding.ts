import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnboarding() {
  const { user, role, loading: authLoading } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.id || !role) {
      setChecking(false);
      return;
    }

    const check = async () => {
      try {
        const { data } = await supabase
          .from("onboarding_completed")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!data) {
          setShowTour(true);
        }
      } catch {
        // If check fails, don't show tour
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user?.id, role, authLoading]);

  const completeTour = async () => {
    setShowTour(false);
    if (!user?.id || !role) return;
    try {
      await supabase.from("onboarding_completed").insert({
        user_id: user.id,
        role: role,
      });
    } catch {
      // silent fail
    }
  };

  return { showTour, checking, completeTour, role };
}
