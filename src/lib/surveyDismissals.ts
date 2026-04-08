import { supabase } from "@/integrations/supabase/client";

/**
 * Record a survey dismissal server-side (+ localStorage fallback).
 */
export async function dismissSurvey(phase: string, userId: string, email: string): Promise<void> {
  // localStorage fallback for immediate UI response
  localStorage.setItem(`survey_dismissed_${phase}_${email}`, "true");

  try {
    await supabase.from("survey_dismissals").upsert(
      { user_id: userId, phase },
      { onConflict: "user_id,phase" }
    );
  } catch (err) {
    console.error("Failed to record survey dismissal:", err);
  }
}

/**
 * Check if a survey was dismissed (server-side first, localStorage fallback).
 */
export async function isSurveyDismissed(phase: string, userId: string, email: string): Promise<boolean> {
  // Fast localStorage check
  if (localStorage.getItem(`survey_dismissed_${phase}_${email}`) === "true") return true;

  try {
    const { data } = await supabase
      .from("survey_dismissals")
      .select("id")
      .eq("user_id", userId)
      .eq("phase", phase)
      .limit(1);

    if (data && data.length > 0) {
      // Sync to localStorage for future fast checks
      localStorage.setItem(`survey_dismissed_${phase}_${email}`, "true");
      return true;
    }
  } catch {
    // Fall through to false
  }
  return false;
}

/**
 * Clear a dismissal (e.g. when survey is completed).
 */
export async function clearSurveyDismissal(phase: string, userId: string, email: string): Promise<void> {
  localStorage.removeItem(`survey_dismissed_${phase}_${email}`);

  try {
    await supabase
      .from("survey_dismissals")
      .delete()
      .eq("user_id", userId)
      .eq("phase", phase);
  } catch {
    // Non-fatal
  }
}
