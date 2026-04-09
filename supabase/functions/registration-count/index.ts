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
    const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");
    const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID");

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error("Missing Airtable configuration");
    }

    // Fetch ALL student registrations with pagination, using School text field
    let allStudents: any[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({ "fields[]": "School" });
      if (offset) params.set("offset", offset);
      const studentsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent("Student Registration")}?${params}`;
      const studentsRes = await fetch(studentsUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });
      if (!studentsRes.ok) {
        const errBody = await studentsRes.text();
        console.error("Airtable students error:", studentsRes.status, errBody);
        throw new Error(`Failed to fetch students: ${studentsRes.status}`);
      }
      const studentsData = await studentsRes.json();
      allStudents = allStudents.concat(studentsData.records || []);
      offset = studentsData.offset;
    } while (offset);

    // Count students per school name
    const countBySchool: Record<string, number> = {};
    for (const s of allStudents) {
      const school = s.fields?.School;
      if (school) {
        const name = String(school);
        countBySchool[name] = (countBySchool[name] || 0) + 1;
      }
    }

    const LIMIT = 24;
    // Get unique school names from students
    const schoolNames = Object.keys(countBySchool);
    const schools = schoolNames.map((name) => ({
      id: name,
      name,
      spots_taken: countBySchool[name] || 0,
      spots_remaining: Math.max(0, LIMIT - (countBySchool[name] || 0)),
    }));

    return new Response(JSON.stringify({ schools }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("registration-count error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
