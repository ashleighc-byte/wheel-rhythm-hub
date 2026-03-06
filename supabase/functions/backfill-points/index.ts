import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculatePoints(sessionData: any): number {
  let points = 15; // Base (10) + Screenshot (5) — always awarded

  if (!sessionData) return points;

  const distance = Number(sessionData.distance_km ?? 0);
  const durationStr = String(sessionData.duration_hh_mm_ss ?? "0:00:00");
  const speed = Number(sessionData.speed_kmh ?? 0);
  const elevation = Number(sessionData.elevation_m ?? 0);

  // Parse duration to minutes
  const parts = durationStr.split(":").map(Number);
  let totalMinutes = 0;
  if (parts.length === 3) {
    totalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
  } else if (parts.length === 2) {
    totalMinutes = parts[0] + parts[1] / 60;
  }

  // Distance: 1 pt per km
  points += Math.floor(distance);

  // Duration: 1 pt per 5 mins
  points += Math.floor(totalMinutes / 5);

  // Elevation: 2 pts per 100m
  points += Math.floor(elevation / 100) * 2;

  // Speed bonus
  if (speed > 30) {
    points += 10;
  } else if (speed > 25) {
    points += 5;
  }

  return points;
}

function parseSessionData(raw: any): any | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (typeof raw === "object") return raw;
  } catch { /* ignore */ }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check — admin only
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

    // Calculate and batch update
    const updates: { id: string; fields: { "Points Earned": number } }[] = [];
    const details: { id: string; name: string; oldPoints: number; newPoints: number; sessionData: any }[] = [];

    for (const rec of allRecords) {
      const sessionData = parseSessionData(rec.fields["Session Data Table"]);
      const newPoints = calculatePoints(sessionData);
      const oldPoints = Number(rec.fields["Points Earned"] ?? 0);

      updates.push({ id: rec.id, fields: { "Points Earned": newPoints } });
      details.push({
        id: rec.id,
        name: String(rec.fields["Student Name (from Student Registration)"] ?? rec.id),
        oldPoints,
        newPoints,
        sessionData,
      });
    }

    // Airtable PATCH in batches of 10
    let patchedCount = 0;
    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10);
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
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Airtable PATCH error [${res.status}]: ${errText}`);
      }
      patchedCount += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      totalSessions: allRecords.length,
      updated: patchedCount,
      details: details.map(d => ({
        id: d.id,
        oldPoints: d.oldPoints,
        newPoints: d.newPoints,
        hasSessionData: !!d.sessionData,
      })),
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
