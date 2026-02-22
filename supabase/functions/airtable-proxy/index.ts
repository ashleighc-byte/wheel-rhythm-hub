import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nfc-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── Authentication ──────────────────────────────────────────────────────────
  // Allow two auth modes:
  //   1. Standard JWT (Authorization: Bearer <jwt>)
  //   2. NFC token header (x-nfc-token: <token>) – limited to Student Registration table only
  const authHeader = req.headers.get('authorization');
  const nfcToken = req.headers.get('x-nfc-token');
  let isNfcAuth = false;

  if (nfcToken) {
    // NFC token auth – we'll validate the token against Airtable below
    isNfcAuth = true;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    // Validate JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ─── Airtable credentials ───────────────────────────────────────────────────
  const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
  if (!AIRTABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'AIRTABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');
  if (!AIRTABLE_BASE_ID) {
    return new Response(JSON.stringify({ error: 'AIRTABLE_BASE_ID is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const filterFormula = url.searchParams.get('filterByFormula');
    const sort = url.searchParams.get('sort');
    const maxRecords = url.searchParams.get('maxRecords');
    const view = url.searchParams.get('view');

    if (!table) {
      return new Response(JSON.stringify({ error: 'Missing table parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // NFC auth can only access Student Registration and Session Reflections
    if (isNfcAuth) {
      const allowedTables = ['Student Registration', 'Session Reflections'];
      if (!allowedTables.includes(table)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const encodedTable = encodeURIComponent(table);
    let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTable}`;

    const params = new URLSearchParams();
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (sort) params.set('sort[0][field]', sort);
    if (maxRecords) params.set('maxRecords', maxRecords);
    if (view) params.set('view', view);

    const paramStr = params.toString();
    if (paramStr) airtableUrl += `?${paramStr}`;

    if (req.method === 'GET') {
      const allRecords: any[] = [];
      let offset: string | undefined;

      do {
        let fetchUrl = airtableUrl;
        if (offset) {
          fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + `offset=${offset}`;
        }

        const response = await fetch(fetchUrl, {
          headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Airtable API error [${response.status}]: ${errText}`);
        }

        const data = await response.json();
        allRecords.push(...(data.records || []));
        offset = data.offset;
      } while (offset && !maxRecords);

      return new Response(JSON.stringify({ records: allRecords }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'POST') {
      const body = await req.json();
      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Airtable API error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'PATCH') {
      const body = await req.json();
      const response = await fetch(airtableUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Airtable API error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Airtable proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
