import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY")!;
    const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID")!;

    // 1. Fetch active organisations
    const orgsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent("Organisations")}?filterByFormula=${encodeURIComponent("{Status}='active'")}`;
    const orgsRes = await fetch(orgsUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!orgsRes.ok) throw new Error("Failed to fetch organisations");
    const orgsData = await orgsRes.json();

    // 2. Fetch ALL student registrations (just need School link + Consent Status)
    let allStudents: any[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({
        "fields[]": "School",
      });
      if (offset) params.set("offset", offset);
      const studentsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent("Student Registration")}?${params}`;
      const studentsRes = await fetch(studentsUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      allStudents = allStudents.concat(studentsData.records || []);
      offset = studentsData.offset;
    } while (offset);

    // 3. Count students per org record ID
    const countByOrg: Record<string, number> = {};
    for (const s of allStudents) {
      const schoolLinks: string[] = s.fields?.School || [];
      for (const orgId of schoolLinks) {
        countByOrg[orgId] = (countByOrg[orgId] || 0) + 1;
      }
    }

    // 4. Build response
    const LIMIT = 24;
    const schools = orgsData.records.map((org: any) => ({
      id: org.id,
      name: org.fields["Organisation Name"] || org.fields["Name"] || "",
      spots_taken: countByOrg[org.id] || 0,
      spots_remaining: Math.max(0, LIMIT - (countByOrg[org.id] || 0)),
    }));

    return new Response(JSON.stringify({ schools }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
