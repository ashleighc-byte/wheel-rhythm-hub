import { supabase } from "@/integrations/supabase/client";

export interface CachedSchoolRanking {
  rank: number;
  name: string;
  riders: number;
  totalPoints: number;
}

export interface CachedRider {
  name: string;
  school: string;
  schoolId: string;
  sessions: number;
  totalPoints: number;
  totalMinutes: number;
  totalDistance: number;
  totalElevation: number;
  level: string;
  totalTime: string;
  airtableId: string;
}

export interface CachedGlobalStats {
  totalSessions: number;
  totalRiders: number;
  totalSchools: number;
  totalHours: number;
}

async function getCache<T>(key: string): Promise<{ data: T | null; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('leaderboard_cache')
    .select('data, updated_at')
    .eq('cache_key', key)
    .maybeSingle();

  if (error || !data) return { data: null, updatedAt: null };
  return { data: data.data as T, updatedAt: data.updated_at };
}

export async function getCachedSchoolRankings(): Promise<CachedSchoolRanking[]> {
  const { data } = await getCache<CachedSchoolRanking[]>('school_rankings');
  return data ?? [];
}

export async function getCachedTopRiders(): Promise<CachedRider[]> {
  const { data } = await getCache<CachedRider[]>('top_riders');
  return data ?? [];
}

export async function getCachedGlobalStats(): Promise<CachedGlobalStats | null> {
  const { data } = await getCache<CachedGlobalStats>('global_stats');
  return data;
}
