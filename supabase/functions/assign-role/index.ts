import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user from the auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY')!;
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID')!;

    // Verify user with anon client
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const email = user.email;

    // Check if role already assigned
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: existingRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (existingRoles && existingRoles.length > 0) {
      return new Response(JSON.stringify({ role: existingRoles[0].role }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check Organisations table (teachers) first
    const orgUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent('Organisations')}?filterByFormula=${encodeURIComponent(`{Email} = '${email}'`)}&maxRecords=1`;
    const orgRes = await fetch(orgUrl, {
      headers: { 'Authorization': `Bearer ${airtableApiKey}` }
    });
    const orgData = await orgRes.json();

    let role: 'admin' | 'student' = 'student';
    if (orgData.records && orgData.records.length > 0) {
      role = 'admin';
    }

    // Insert role
    const { error: insertError } = await adminClient
      .from('user_roles')
      .insert({ user_id: user.id, role });

    if (insertError) {
      console.error('Role insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ role }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('assign-role error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
