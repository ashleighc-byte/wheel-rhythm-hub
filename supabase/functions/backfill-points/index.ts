import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Points Calculation (mirrors src/lib/gamification.ts) ──
function calculateSessionPoints(session: {
  duration_minutes: number;
  distance_km: number;
  elevation_m: number;
  avg_speed_kmh: number;
}): number {
  const { duration_minutes, distance_km, elevation_m, avg_speed_kmh } = session;
  if (duration_minutes <= 0 && distance_km <= 0) return 0;

  let pts = 10; // base

  // Time bonus: 1pt per 10 min
  pts += Math.floor(duration_minutes / 10);
  // Distance bonus: 1pt per 5 km
  pts += Math.floor(distance_km / 5);
  // Elevation bonus: 1pt per 25 m
  pts += Math.floor(elevation_m / 25);

  // Hard course bonus
  if (elevation_m >= 500) pts += 15;
  else if (elevation_m >= 300) pts += 10;
  else if (elevation_m >= 150) pts += 5;
  else if (elevation_m >= 75) pts += 2;

  // Speed bonus
  if (avg_speed_kmh >= 30) pts += 6;
  else if (avg_speed_kmh >= 25) pts += 4;
  else if (avg_speed_kmh >= 20) pts += 2;

  // Long ride bonus
  if (duration_minutes >= 60) pts += 10;
  else if (duration_minutes >= 45) pts += 5;

  return pts;
}

function parseDuration(dur: string | number | undefined): number {
  if (dur === undefined || dur === null) return 0;
  if (typeof dur === "number") return dur;
  const str = String(dur).trim();
  const hms = str.match(/^(\d+):(\d+):(\d+)$/);
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2]) + parseInt(hms[3]) / 60;
  const hm = str.match(/^(\d+):(\d+)$/);
  if (hm) {
    const a = parseInt(hm[1]);
    const b = parseInt(hm[2]);
    return a < 10 ? a * 60 + b : a + b / 60;
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function parseSessionData(raw: any): { distance_km: number; duration_hh_mm_ss: string; elevation_m: number; avg_speed_kmh: number } | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      distance_km: Number(obj.distance_km ?? 0),
      duration_hh_mm_ss: String(obj.duration_hh_mm_ss ?? "0:00"),
      elevation_m: Number(obj.elevation_m ?? 0),
      avg_speed_kmh: Number(obj.avg_speed_kmh ?? 0),
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')!;
  const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')!;

  try {
    // Fetch all session reflections (paginated)
    const allRecords: any[] = [];
    let offset: string | undefined;
    do {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Session Reflections')}`;
      if (offset) url += `?offset=${offset}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      });
      const data = await res.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    // Build email -> userId map
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const emailToUserId = new Map<string, string>();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
      }
    }

    // Fetch students for studentId -> email mapping
    const studentRecords: any[] = [];
    let studentOffset: string | undefined;
    do {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Student Registration')}`;
      if (studentOffset) url += `?offset=${studentOffset}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      });
      const data = await res.json();
      studentRecords.push(...(data.records || []));
      studentOffset = data.offset;
    } while (studentOffset);

    const studentIdToEmail = new Map<string, string>();
    for (const s of studentRecords) {
      const email = s.fields["School Email"] || s.fields["Email"];
      if (email) studentIdToEmail.set(s.id, email.toLowerCase());
    }

    // Delete ALL existing student_points to do a clean recalculation
    const { error: deleteError } = await adminClient
      .from('student_points')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
    
    if (deleteError) {
      console.error('Failed to clear student_points:', deleteError);
    }

    // Process each session with new formula
    const airtableUpdates: { id: string; fields: { "Points Earned": number } }[] = [];
    const supabaseInserts: { user_id: string; airtable_student_id: string; session_date: string; base_points: number; bonus_points: number; total_points: number }[] = [];

    for (const rec of allRecords) {
      const studentLinks = rec.fields["Student Registration"] as string[] | undefined;
      const airtableStudentId = studentLinks?.[0];
      const dateRaw = rec.fields["Auto date"] || rec.createdTime || "";
      const sessionDate = dateRaw ? dateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);

      // Parse session data for points calculation
      const rawData = rec.fields["Session Data Table"];
      const parsed = parseSessionData(
        typeof rawData === "object" && rawData !== null && "value" in rawData
          ? rawData.value
          : rawData
      );
      const durationStr = String(rec.fields["Total minutes"] ?? parsed?.duration_hh_mm_ss ?? "0:00");
      const duration_minutes = parseDuration(rec.fields["Rollup Minutes"] ?? durationStr);
      const distance_km = Number(rec.fields["Total km "] ?? parsed?.distance_km ?? 0);
      const elevation_m = Number(rec.fields["Total Elevation"] ?? parsed?.elevation_m ?? 0);
      const avg_speed_kmh = Number(rec.fields["Avg Speed"] ?? parsed?.avg_speed_kmh ?? 0);

      const points = calculateSessionPoints({ duration_minutes, distance_km, elevation_m, avg_speed_kmh });

      // Update Airtable with computed points
      airtableUpdates.push({ id: rec.id, fields: { "Points Earned": points } });

      // Insert into Supabase
      if (airtableStudentId) {
        const email = studentIdToEmail.get(airtableStudentId);
        const userId = email ? emailToUserId.get(email) : undefined;

        if (userId) {
          supabaseInserts.push({
            user_id: userId,
            airtable_student_id: airtableStudentId,
            session_date: sessionDate,
            base_points: points,
            bonus_points: 0,
            total_points: points,
          });
        }
      }
    }

    // Airtable PATCH in batches of 10
    let airtablePatched = 0;
    let airtableError: string | null = null;

    for (let i = 0; i < airtableUpdates.length; i += 10) {
      const batch = airtableUpdates.slice(i, i + 10);
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Session Reflections')}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records: batch }),
        }
      );
      if (res.ok) {
        airtablePatched += batch.length;
      } else if (i === 0) {
        airtableError = await res.text();
        console.error('Airtable patch error:', airtableError);
        break;
      }
    }

    // Supabase insert in batches of 50
    let supabaseInserted = 0;
    for (let i = 0; i < supabaseInserts.length; i += 50) {
      const batch = supabaseInserts.slice(i, i + 50);
      const { error: insertError } = await adminClient.from('student_points').insert(batch);
      if (insertError) {
        console.error('Supabase insert error:', insertError);
      } else {
        supabaseInserted += batch.length;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalSessions: allRecords.length,
      airtableUpdated: airtablePatched,
      airtableError,
      supabaseInserted,
      pointsFormula: "10 base + floor(min/10) + floor(km/5) + floor(elev/25) + speed_bonus + elevation_bonus + long_ride_bonus",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Backfill error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
