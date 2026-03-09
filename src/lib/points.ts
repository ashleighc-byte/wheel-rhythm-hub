import { supabase } from "@/integrations/supabase/client";

/**
 * Record points for a ride session.
 * Returns total points earned for this session (base + bonus).
 */
export async function recordSessionPoints(
  userId: string,
  airtableStudentId: string,
  sessionDate?: string
): Promise<number> {
  const date = sessionDate ?? new Date().toISOString().slice(0, 10);
  const basePoints = 10;

  // Insert with base points first
  const { error: insertError } = await supabase.from("student_points").insert({
    user_id: userId,
    airtable_student_id: airtableStudentId,
    session_date: date,
    base_points: basePoints,
    bonus_points: 0,
    total_points: basePoints,
  });

  if (insertError) {
    console.error("Failed to insert points:", insertError);
    throw insertError;
  }

  // Calculate weekly bonus
  const { data: bonusData, error: bonusError } = await supabase.rpc(
    "calculate_weekly_bonus",
    { _user_id: userId, _session_date: date }
  );

  const bonus = bonusError ? 0 : (bonusData ?? 0);

  // If there's a bonus, update the latest record
  if (bonus > 0) {
    // Get the record we just inserted (latest for this user+date)
    const { data: latestRows } = await supabase
      .from("student_points")
      .select("id")
      .eq("user_id", userId)
      .eq("session_date", date)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestRows?.[0]) {
      await supabase
        .from("student_points")
        .update({
          bonus_points: bonus,
          total_points: basePoints + bonus,
        })
        .eq("id", latestRows[0].id);
    }
  }

  return basePoints + bonus;
}

/**
 * Get total points for a user from Supabase.
 */
export async function getTotalPoints(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_student_total_points", {
    _user_id: userId,
  });
  if (error) {
    console.error("Failed to get total points:", error);
    return 0;
  }
  return data ?? 0;
}
