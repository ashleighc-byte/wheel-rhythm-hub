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

export async function validateTeacherApproval(email: string): Promise<{ approved: boolean }> {
  const formula = `{Email} = '${email}'`;
  const result = await callAirtable('Organisations', 'GET', {
    filterByFormula: formula,
    maxRecords: 1,
  });
  return { approved: result.records.length > 0 };
}

export async function validateUserApproval(email: string): Promise<{ approved: boolean; role: 'admin' | 'student'; studentName?: string }> {
  // Check teacher first
  const teacher = await validateTeacherApproval(email);
  if (teacher.approved) {
    return { approved: true, role: 'admin' };
  }
  // Check student
  const student = await validateStudentApproval(email);
  if (student.approved) {
    return { approved: true, role: 'student', studentName: student.studentName };
  }
  return { approved: false, role: 'student' };
}

export async function fetchUserRole(session: { access_token: string }): Promise<'admin' | 'student' | null> {
  const url = `${SUPABASE_URL}/functions/v1/assign-role`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.role || null;
}

export async function fetchSessionReflections(sessionRecordIds?: string[]) {
  const options: any = {};
  if (sessionRecordIds?.length) {
    // Fetch by known record IDs using OR(RECORD_ID()=...) formula
    const orClauses = sessionRecordIds.map(id => `RECORD_ID()='${id}'`).join(',');
    options.filterByFormula = `OR(${orClauses})`;
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

export async function hasCompletedPrePilotSurvey(email: string): Promise<boolean> {
  // Check the student record for linked survey entries
  const students = await fetchStudents(email);
  if (!students.records.length) return false;
  const f = students.records[0].fields;
  const linkedSurveys = f["Surveys & Student Voice"];
  return Array.isArray(linkedSurveys) && linkedSurveys.length > 0;
}

export async function hasCompletedFourWeekCheckIn(email: string): Promise<boolean> {
  const students = await fetchStudents(email);
  if (!students.records.length) return false;
  const studentRecordId = students.records[0].id;
  const formula = `AND(FIND("${studentRecordId}", ARRAYJOIN({Student Name})), {Survey Type} = "4 Week Check In")`;
  const result = await callAirtable("Surveys & Student Voice", "GET", {
    filterByFormula: formula,
    maxRecords: 1,
  });
  return result.records.length > 0;
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

// ---- Teacher-specific helpers ----

export async function fetchTeacherOrg(email: string): Promise<{ id: string; name: string } | null> {
  const formula = `{Email} = '${email}'`;
  const result = await callAirtable('Organisations', 'GET', {
    filterByFormula: formula,
    maxRecords: 1,
  });
  if (!result.records.length) return null;
  const rec = result.records[0];
  return {
    id: rec.id,
    name: rec.fields['Organisation Name'] || rec.fields['Name'] || '',
  };
}

export async function fetchStudentsBySchool(orgRecordId: string) {
  // Students link to their school via a linked record field called 'School'
  const formula = `FIND("${orgRecordId}", ARRAYJOIN({School}))`;
  return callAirtable('Student Registration', 'GET', {
    filterByFormula: formula,
  });
}

export async function fetchAllSurveysForStudents(studentRecordIds: string[]) {
  if (!studentRecordIds.length) return { records: [] };
  const orClauses = studentRecordIds
    .map(id => `FIND("${id}", ARRAYJOIN({Student Name}))`)
    .join(',');
  const formula = `OR(${orClauses})`;
  return callAirtable('Surveys & Student Voice', 'GET', {
    filterByFormula: formula,
  });
}

export async function fetchRecentSessionsForSchool(orgRecordId: string, maxRecords = 20) {
  // Sessions linked to school via the Student Registration -> School chain
  // We query sessions where the linked student belongs to this org
  const formula = `FIND("${orgRecordId}", ARRAYJOIN({School (from Student Registration)}))`;
  return callAirtable('Session Reflections', 'GET', {
    filterByFormula: formula,
    maxRecords,
    sort: 'Created',
  });
}

export { callAirtable };
export type { AirtableRecord, AirtableResponse };
