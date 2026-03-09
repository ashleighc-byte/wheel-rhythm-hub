import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_POINTS = 10;

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

  // Use service role for inserting points (bypasses RLS)
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

    // Build map of student email -> user_id from Supabase auth
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const emailToUserId = new Map<string, string>();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
      }
    }

    // Fetch student emails from Airtable to map airtable_student_id -> email
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
      if (email) {
        studentIdToEmail.set(s.id, email.toLowerCase());
      }
    }

    // Get existing points from Supabase to avoid duplicates
    const { data: existingPoints } = await adminClient
      .from('student_points')
      .select('airtable_student_id, session_date');
    
    const existingSet = new Set<string>();
    if (existingPoints) {
      for (const p of existingPoints) {
        existingSet.add(`${p.airtable_student_id}|${p.session_date}`);
      }
    }

    // Process each session
    const airtableUpdates: { id: string; fields: { "Points Earned": number } }[] = [];
    const supabaseInserts: { user_id: string; airtable_student_id: string; session_date: string; base_points: number; bonus_points: number; total_points: number }[] = [];
    const skipped: string[] = [];

    for (const rec of allRecords) {
      const studentLinks = rec.fields["Student Registration"] as string[] | undefined;
      const airtableStudentId = studentLinks?.[0];
      const dateRaw = rec.fields["Auto date"] || rec.createdTime || "";
      const sessionDate = dateRaw ? dateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);

      // Always update Airtable with base points
      airtableUpdates.push({ id: rec.id, fields: { "Points Earned": BASE_POINTS } });

      // Try to insert into Supabase if we can map to a user
      if (airtableStudentId) {
        const email = studentIdToEmail.get(airtableStudentId);
        const userId = email ? emailToUserId.get(email) : undefined;

        const key = `${airtableStudentId}|${sessionDate}`;
        if (existingSet.has(key)) {
          skipped.push(rec.id);
          continue;
        }

        if (userId) {
          supabaseInserts.push({
            user_id: userId,
            airtable_student_id: airtableStudentId,
            session_date: sessionDate,
            base_points: BASE_POINTS,
            bonus_points: 0,
            total_points: BASE_POINTS,
          });
          existingSet.add(key);
        }
      }
    }

    // Airtable PATCH in batches of 10
    let airtablePatched = 0;
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
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Airtable PATCH error [${res.status}]: ${errText}`);
      }
      airtablePatched += batch.length;
    }

    // Supabase insert in batches
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
      supabaseInserted,
      skipped: skipped.length,
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
