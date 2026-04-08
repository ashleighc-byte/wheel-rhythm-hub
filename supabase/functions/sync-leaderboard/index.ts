import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Fetch all records from an Airtable table with pagination */
async function fetchAllAirtable(baseId: string, apiKey: string, table: string, params?: Record<string, string>) {
  const allRecords: any[] = [];
  let offset: string | undefined;
  const encoded = encodeURIComponent(table);

  do {
    const qs = new URLSearchParams(params);
    if (offset) qs.set('offset', offset);
    const url = `https://api.airtable.com/v0/${baseId}/${encoded}?${qs}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Airtable ${table} error: ${res.status}`);
    const data = await res.json();
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function parseDuration(dur: any): number {
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const str = String(dur).trim();
  const hms = str.match(/^(\d+):(\d+):(\d+)$/);
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2]) + parseInt(hms[3]) / 60;
  const hm = str.match(/^(\d+):(\d+)$/);
  if (hm) {
    const a = parseInt(hm[1]), b = parseInt(hm[2]);
    return a < 10 ? a * 60 + b : a + b / 60;
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function parseSessionData(raw: any) {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      distance_km: Number(obj.distance_km ?? 0),
      duration_hh_mm_ss: String(obj.duration_hh_mm_ss ?? '0:00'),
      speed_kmh: Number(obj.avg_speed_kmh ?? obj.speed_kmh ?? 0),
      elevation_m: Number(obj.elevation_m ?? 0),
    };
  } catch { return null; }
}

function calculateWeeklyBonus(dates: string[]): number {
  const weekMap = new Map<string, number>();
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const weekKey = monday.toISOString().slice(0, 10);
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1);
  }
  let bonus = 0;
  for (const count of weekMap.values()) {
    if (count >= 5) bonus += 15;
    else if (count >= 3) bonus += 5;
  }
  return bonus;
}

/** Count consecutive riding days ending today or yesterday */
function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latest = new Date(unique[0]);
  latest.setHours(0, 0, 0, 0);
  if (latest < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const curr = new Date(unique[i]);
    const prev = new Date(unique[i - 1]);
    curr.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

const LEVELS = [
  { name: "Pedal Pusher", min: 0 },
  { name: "Gear Shifter", min: 50 },
  { name: "Hill Climber", min: 150 },
  { name: "Breakaway Rider", min: 300 },
  { name: "Pace Setter", min: 500 },
  { name: "Sprint Leader", min: 800 },
  { name: "Free Wheeler Legend", min: 1200 },
];

function getLevelName(pts: number): string {
  let name = LEVELS[0].name;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) { name = LEVELS[i].name; break; }
  }
  return name;
}

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')!;
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── Load previous cache for diff detection ──
    const { data: prevCache } = await adminClient
      .from('leaderboard_cache')
      .select('cache_key, data')
      .in('cache_key', ['top_riders', 'school_rankings']);

    const prevRidersArr = (prevCache?.find(c => c.cache_key === 'top_riders')?.data ?? []) as any[];
    const prevSchoolArr = (prevCache?.find(c => c.cache_key === 'school_rankings')?.data ?? []) as any[];

    const prevRiderMap = new Map<string, any>();
    for (const r of prevRidersArr) prevRiderMap.set(r.airtableId ?? r.name, r);
    const prevSchoolMap = new Map<string, number>();
    for (const s of prevSchoolArr) prevSchoolMap.set(s.name, s.rank);

    // Fetch all data from Airtable in parallel
    const [orgs, students, sessions, globalDash] = await Promise.all([
      fetchAllAirtable(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'Organisations'),
      fetchAllAirtable(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'Student Registration'),
      fetchAllAirtable(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'Session Reflections'),
      fetchAllAirtable(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'Global Dashboard', { maxRecords: '1' }),
    ]);

    // ── Compute rider points ──
    const studentSessions = new Map<string, any[]>();
    for (const rec of sessions) {
      const links = rec.fields?.['Student Registration'] as string[] | undefined;
      const sid = links?.[0];
      if (!sid) continue;
      if (!studentSessions.has(sid)) studentSessions.set(sid, []);
      studentSessions.get(sid)!.push(rec);
    }

    const riderPoints = new Map<string, { totalPoints: number; totalMinutes: number; totalDistance: number; totalElevation: number; sessions: number; level: string; streak: number }>();

    for (const [studentId, sess] of studentSessions) {
      let totalMin = 0, totalDist = 0, totalElev = 0, valid = 0;
      const dates: string[] = [];

      for (const s of sess) {
        const rawData = s.fields['Session Data Table'];
        const parsed = parseSessionData(
          typeof rawData === 'object' && rawData !== null && 'value' in rawData ? rawData.value : rawData
        );
        const durStr = String(s.fields['Total minutes'] ?? parsed?.duration_hh_mm_ss ?? '0:00');
        const mins = parseDuration(s.fields['Rollup Minutes'] ?? durStr);
        const dist = Number(s.fields['Total km '] ?? parsed?.distance_km ?? 0);
        const elev = Number(s.fields['Total Elevation'] ?? parsed?.elevation_m ?? 0);

        if (mins <= 0 && dist <= 0) continue;
        totalMin += mins;
        totalDist += dist;
        totalElev += elev;
        valid++;
        const dateStr = String(s.fields['Date'] ?? s.fields['Created'] ?? '').slice(0, 10);
        if (dateStr) dates.push(dateStr);
      }

      const pts = valid * 10 + calculateWeeklyBonus(dates);
      const streak = calculateStreak(dates);
      riderPoints.set(studentId, { totalPoints: pts, totalMinutes: totalMin, totalDistance: totalDist, totalElevation: totalElev, sessions: valid, level: getLevelName(pts), streak });
    }

    // ── Build org map ──
    const orgMap = new Map<string, string>();
    for (const o of orgs) orgMap.set(o.id, String(o.fields['Organisation Name'] ?? 'Unknown'));

    // ── School rankings ──
    const schoolData = new Map<string, { riders: number; points: number }>();
    for (const s of students) {
      const schoolIds = s.fields['School'] as string[] | undefined;
      if (!schoolIds?.length) continue;
      const sid = schoolIds[0];
      const prev = schoolData.get(sid) ?? { riders: 0, points: 0 };
      const computed = riderPoints.get(s.id);
      schoolData.set(sid, { riders: prev.riders + 1, points: prev.points + (computed?.totalPoints ?? 0) });
    }
    for (const [id] of orgMap) {
      if (!schoolData.has(id)) schoolData.set(id, { riders: 0, points: 0 });
    }

    const schoolRankings = Array.from(schoolData.entries())
      .map(([id, data]) => ({ name: orgMap.get(id) ?? id, riders: data.riders, totalPoints: data.points }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.riders - a.riders)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // ── Top riders ──
    const topRiders = students
      .map((s: any) => {
        const computed = riderPoints.get(s.id);
        const schoolId = (s.fields['School'] as string[])?.[0] ?? '';
        return {
          name: String(s.fields['Full Name'] ?? ''),
          school: orgMap.get(schoolId) ?? '',
          schoolId,
          sessions: computed?.sessions ?? 0,
          totalPoints: computed?.totalPoints ?? 0,
          totalMinutes: computed?.totalMinutes ?? 0,
          totalDistance: computed?.totalDistance ?? 0,
          totalElevation: computed?.totalElevation ?? 0,
          level: computed?.level ?? 'Pedal Pusher',
          streak: computed?.streak ?? 0,
          totalTime: String(s.fields['Total Time (h:mm)'] ?? '0:00'),
          airtableId: s.id,
        };
      })
      .filter((r: any) => r.sessions > 0);

    // ── Generate activity feed events (diffs) ──
    const feedEvents: { event_type: string; rider_name: string; school_name: string; message: string }[] = [];

    for (const rider of topRiders) {
      const prev = prevRiderMap.get(rider.airtableId ?? rider.name);

      // Level-up detection
      if (prev && prev.level && rider.level !== prev.level && rider.level !== 'Pedal Pusher') {
        feedEvents.push({
          event_type: 'level_up',
          rider_name: rider.name.split(' ')[0],
          school_name: rider.school,
          message: `leveled up to ${rider.level}`,
        });
      }

      // Streak milestone detection
      if (rider.streak > 0) {
        const prevStreak = prev?.streak ?? 0;
        for (const milestone of STREAK_MILESTONES) {
          if (rider.streak >= milestone && prevStreak < milestone) {
            feedEvents.push({
              event_type: 'streak',
              rider_name: rider.name.split(' ')[0],
              school_name: rider.school,
              message: `hit a ${milestone}-day streak`,
            });
            break; // only emit highest new milestone
          }
        }
      }
    }

    // School rank change detection
    for (const school of schoolRankings) {
      const prevRank = prevSchoolMap.get(school.name);
      if (prevRank && school.rank < prevRank) {
        feedEvents.push({
          event_type: 'rank_change',
          rider_name: school.name,
          school_name: '',
          message: `moved up to #${school.rank}`,
        });
      }
    }

    // Insert feed events (limit to 10 per sync to avoid spam)
    if (feedEvents.length > 0) {
      const batch = feedEvents.slice(0, 10);
      const { error: feedErr } = await adminClient.from('activity_feed').insert(batch);
      if (feedErr) console.error('Feed insert error:', feedErr);
      else console.log(`Inserted ${batch.length} activity events`);
    }

    // ── Global stats ──
    const gf = globalDash[0]?.fields ?? {};
    const globalStats = {
      totalSessions: Number(gf['Total Sessions'] ?? 0),
      totalRiders: Number(gf['Total Riders'] ?? 0),
      totalSchools: Number(gf['Total Schools'] ?? 0),
      totalHours: Number(gf['Total Hours'] ?? 0),
    };

    // ── Upsert cache rows ──
    const now = new Date().toISOString();
    const rows = [
      { cache_key: 'school_rankings', data: schoolRankings, updated_at: now },
      { cache_key: 'top_riders', data: topRiders, updated_at: now },
      { cache_key: 'global_stats', data: globalStats, updated_at: now },
    ];

    for (const row of rows) {
      const { error } = await adminClient
        .from('leaderboard_cache')
        .upsert(row, { onConflict: 'cache_key' });
      if (error) console.error(`Upsert ${row.cache_key} error:`, error);
    }

    return new Response(JSON.stringify({ success: true, updated: rows.map(r => r.cache_key), feedEventsInserted: feedEvents.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
