const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
}

async function callAirtable(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  options?: {
    filterByFormula?: string;
    sort?: string;
    maxRecords?: number;
    view?: string;
    body?: any;
  }
): Promise<AirtableResponse> {
  const params = new URLSearchParams({ table });
  if (options?.filterByFormula) params.set('filterByFormula', options.filterByFormula);
  if (options?.sort) params.set('sort', options.sort);
  if (options?.maxRecords) params.set('maxRecords', String(options.maxRecords));
  if (options?.view) params.set('view', options.view);

  const url = `${SUPABASE_URL}/functions/v1/airtable-proxy?${params}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
  };

  if (options?.body && (method === 'POST' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `Airtable request failed: ${response.status}`);
  }

  return response.json();
}

// Table-specific helpers

export async function fetchStudents(email?: string) {
  const options: any = {};
  if (email) {
    options.filterByFormula = `{School Email} = '${email}'`;
  }
  return callAirtable('Student Registration', 'GET', options);
}

export async function validateStudentApproval(email: string): Promise<{ approved: boolean; studentName?: string }> {
  const formula = `AND({School Email} = '${email}', {Consent Status} = 'active')`;
  const result = await callAirtable('Student Registration', 'GET', {
    filterByFormula: formula,
    maxRecords: 1,
  });
  if (result.records.length > 0) {
    return { approved: true, studentName: result.records[0].fields['Full Name'] };
  }
  return { approved: false };
}

export async function fetchSessionReflections(studentRecordId?: string) {
  const options: any = {};
  if (studentRecordId) {
    options.filterByFormula = `FIND("${studentRecordId}", ARRAYJOIN({Linked Student}))`;
  }
  return callAirtable('Session Reflections', 'GET', options);
}

export async function createSessionReflection(fields: Record<string, any>) {
  return callAirtable('Session Reflections', 'POST', {
    body: { records: [{ fields }] }
  });
}

export async function fetchSurveys(studentRecordId?: string) {
  const options: any = {};
  if (studentRecordId) {
    options.filterByFormula = `FIND("${studentRecordId}", ARRAYJOIN({Linked Student}))`;
  }
  return callAirtable('Surveys & Student Voice', 'GET', options);
}

export async function fetchSchoolStats() {
  return callAirtable('School Stats', 'GET');
}

export async function fetchLeaderboard() {
  return callAirtable('School Stats', 'GET', { sort: 'Total Sessions' });
}

export async function fetchGlobalDashboard() {
  return callAirtable('Global Dashboard', 'GET', { maxRecords: 1 });
}

export { callAirtable };
export type { AirtableRecord, AirtableResponse };
