import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FOUR_WEEK_DONE_PREFIX = "four_week_check_in_completed:";
const FOUR_WEEK_SKIP_PREFIX = "four_week_check_in_skipped:";

// ─── NFC token persistence ────────────────────────────────────────────────────
const NFC_TOKEN_KEY = 'active_nfc_token';

export function setActiveNfcToken(token: string) {
  sessionStorage.setItem(NFC_TOKEN_KEY, token);
}

export function clearActiveNfcToken() {
  sessionStorage.removeItem(NFC_TOKEN_KEY);
}

export function getActiveNfcToken(): string | null {
  return sessionStorage.getItem(NFC_TOKEN_KEY);
}

function getFourWeekKey(prefix: string, email: string) {
  return `${prefix}${email.trim().toLowerCase()}`;
}

export function hasLocallyCompletedFourWeekCheckIn(email: string): boolean {
  return localStorage.getItem(getFourWeekKey(FOUR_WEEK_DONE_PREFIX, email)) === 'true';
}

export function markFourWeekCheckInCompleted(email: string) {
  localStorage.setItem(getFourWeekKey(FOUR_WEEK_DONE_PREFIX, email), 'true');
  sessionStorage.removeItem(getFourWeekKey(FOUR_WEEK_SKIP_PREFIX, email));
}

export function hasDeferredFourWeekCheckIn(email: string): boolean {
  return sessionStorage.getItem(getFourWeekKey(FOUR_WEEK_SKIP_PREFIX, email)) === 'true';
}

export function deferFourWeekCheckIn(email: string) {
  sessionStorage.setItem(getFourWeekKey(FOUR_WEEK_SKIP_PREFIX, email), 'true');
}

// ─── Injection-safe helpers ────────────────────────────────────────────────────

/** Escape a value for safe use inside an Airtable filterByFormula string literal. */
export function escapeFormulaValue(value: string): string {
  // Airtable formula strings are single-quoted; escape backslashes then quotes
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/** Validate that a string looks like an Airtable record ID (rec + alphanumeric). */
export function isValidRecordId(id: string): boolean {
  return /^rec[a-zA-Z0-9]{10,20}$/.test(id);
}

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
    nfcToken?: string; // For NFC tap auth (no JWT needed)
  }
): Promise<AirtableResponse> {
  const params = new URLSearchParams({ table });
  if (options?.filterByFormula) params.set('filterByFormula', options.filterByFormula);
  if (options?.sort) params.set('sort', options.sort);
  if (options?.maxRecords) params.set('maxRecords', String(options.maxRecords));
  if (options?.view) params.set('view', options.view);

  const url = `${SUPABASE_URL}/functions/v1/airtable-proxy?${params}`;

  // Build auth headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  if (options?.nfcToken) {
    // Explicit NFC token auth
    headers['x-nfc-token'] = options.nfcToken;
  } else {
    // Standard JWT auth
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Auto-detect NFC token from sessionStorage as fallback
      const storedNfcToken = getActiveNfcToken();
      if (storedNfcToken) {
        headers['x-nfc-token'] = storedNfcToken;
      }
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
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
    options.filterByFormula = `{School Email} = '${escapeFormulaValue(email)}'`;
  }
  return callAirtable('Student Registration', 'GET', options);
}

export async function validateStudentApproval(email: string): Promise<{ approved: boolean; studentName?: string }> {
  const safe = escapeFormulaValue(email);
  const formula = `AND({School Email} = '${safe}', {Consent Status} = 'active')`;
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
  const safe = escapeFormulaValue(email);
  const formula = `AND(LOWER({Email}) = LOWER('${safe}'), OR({Status} = 'active', {Status} = 'Active'))`;
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
    const validIds = sessionRecordIds.filter(isValidRecordId);
    if (validIds.length) {
      const orClauses = validIds.map(id => `RECORD_ID()='${id}'`).join(',');
      options.filterByFormula = `OR(${orClauses})`;
    }
  }
  return callAirtable('Session Reflections', 'GET', options);
}

export async function createSessionReflection(fields: Record<string, any>, nfcToken?: string) {
  return callAirtable('Session Reflections', 'POST', {
    body: { records: [{ fields }] },
    ...(nfcToken ? { nfcToken } : {}),
  });
}

export async function updateSessionReflection(recordId: string, fields: Record<string, any>, nfcToken?: string) {
  if (!isValidRecordId(recordId)) throw new Error('Invalid record ID');
  return callAirtable('Session Reflections', 'PATCH', {
    body: { records: [{ id: recordId, fields }] },
    ...(nfcToken ? { nfcToken } : {}),
  });
}

export async function fetchSurveys(studentRecordId?: string) {
  const options: any = {};
  if (studentRecordId && isValidRecordId(studentRecordId)) {
    options.filterByFormula = `FIND("${studentRecordId}", ARRAYJOIN({Linked Student}))`;
  }
  return callAirtable('Surveys & Student Voice', 'GET', options);
}

export async function hasCompletedPrePilotSurvey(email: string): Promise<boolean> {
  const students = await fetchStudents(email);
  if (!students.records.length) return false;
  const f = students.records[0].fields;
  const linkedSurveys = f["Surveys & Student Voice"];
  return Array.isArray(linkedSurveys) && linkedSurveys.length > 0;
}

export async function hasCompletedFourWeekCheckIn(email: string): Promise<boolean> {
  if (hasLocallyCompletedFourWeekCheckIn(email)) return true;
  const students = await fetchStudents(email);
  if (!students.records.length) return false;
  const studentRecordId = students.records[0].id;
  if (!isValidRecordId(studentRecordId)) return false;
  const formula = `AND(FIND("${studentRecordId}", ARRAYJOIN({Student Name})), {Survey Type} = "4 Week Check In")`;
  const result = await callAirtable("Surveys & Student Voice", "GET", {
    filterByFormula: formula,
    maxRecords: 1,
  });
  const completed = result.records.length > 0;
  if (completed) markFourWeekCheckInCompleted(email);
  return completed;
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

export interface OrgInfo {
  id: string;
  name: string;
  orgRole: string;
  region: string;
  studentRecordIds: string[];
}

export async function fetchTeacherOrg(email: string): Promise<{ id: string; name: string; studentRecordIds: string[] } | null> {
  const full = await fetchTeacherOrgFull(email);
  if (!full) return null;
  return { id: full.id, name: full.name, studentRecordIds: full.studentRecordIds };
}

export async function fetchTeacherOrgFull(email: string): Promise<OrgInfo | null> {
  const formula = `{Email} = '${escapeFormulaValue(email)}'`;
  const result = await callAirtable('Organisations', 'GET', {
    filterByFormula: formula,
    maxRecords: 1,
  });
  if (!result.records.length) return null;
  const rec = result.records[0];
  const studentRecordIds: string[] = Array.isArray(rec.fields['Student Registration'])
    ? rec.fields['Student Registration']
    : [];
  return {
    id: rec.id,
    name: rec.fields['Organisation Name'] || rec.fields['Name'] || '',
    orgRole: String(rec.fields['Role'] || ''),
    region: String(rec.fields['Region'] || ''),
    studentRecordIds,
  };
}

export function isSuperAdmin(orgInfo: OrgInfo): boolean {
  return orgInfo.orgRole === 'Regional Sports Trust/Director';
}

export async function fetchOrgsInRegion(region: string): Promise<AirtableResponse> {
  if (region.toLowerCase() === 'all') {
    return callAirtable('Organisations', 'GET');
  }
  const formula = `{Region} = '${escapeFormulaValue(region)}'`;
  return callAirtable('Organisations', 'GET', { filterByFormula: formula });
}

export async function fetchAllStudentsForOrgs(orgRecords: AirtableRecord[]): Promise<string[]> {
  const allStudentIds: string[] = [];
  for (const org of orgRecords) {
    const ids = Array.isArray(org.fields['Student Registration']) ? org.fields['Student Registration'] : [];
    allStudentIds.push(...ids);
  }
  return [...new Set(allStudentIds)];
}

export async function fetchStudentsByIds(studentRecordIds: string[]) {
  const validIds = studentRecordIds.filter(isValidRecordId);
  if (!validIds.length) return { records: [] };
  const orClauses = validIds.map(id => `RECORD_ID()='${id}'`).join(',');
  return callAirtable('Student Registration', 'GET', {
    filterByFormula: `OR(${orClauses})`,
  });
}

// Kept for backwards compatibility / alternate use
export async function fetchStudentsBySchool(orgRecordId: string) {
  if (!isValidRecordId(orgRecordId)) return { records: [] };
  const formula = `FIND("${orgRecordId}", ARRAYJOIN({School}))`;
  return callAirtable('Student Registration', 'GET', {
    filterByFormula: formula,
  });
}

export async function fetchAllSurveysForStudents(studentRecordIds: string[]) {
  const validIds = studentRecordIds.filter(isValidRecordId);
  if (!validIds.length) return { records: [] };
  const orClauses = validIds
    .map(id => `FIND("${id}", ARRAYJOIN({Student Name}))`)
    .join(',');
  const formula = `OR(${orClauses})`;
  return callAirtable('Surveys & Student Voice', 'GET', {
    filterByFormula: formula,
  });
}

export async function fetchSessionsByRecordIds(sessionRecordIds: string[]) {
  const validIds = sessionRecordIds.filter(isValidRecordId);
  if (!validIds.length) return { records: [] };
  const orClauses = validIds.map(id => `RECORD_ID()='${id}'`).join(',');
  return callAirtable('Session Reflections', 'GET', {
    filterByFormula: `OR(${orClauses})`,
  });
}

export async function fetchRecentSessionsForSchool(orgRecordId: string, maxRecords = 20) {
  if (!isValidRecordId(orgRecordId)) return { records: [] };
  const formula = `FIND("${orgRecordId}", ARRAYJOIN({School (from Student Registration) 2}))`;
  return callAirtable('Session Reflections', 'GET', {
    filterByFormula: formula,
    maxRecords,
    sort: 'Auto date',
  });
}

export { callAirtable };
export type { AirtableRecord, AirtableResponse };
