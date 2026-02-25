

## Root Cause Analysis

You've nailed the diagnosis. The NFC bracelet flow sets an `nfcSession` in React state (student ID, name, token) but does **not** create a Supabase auth session. This means `user` and `session` are both `null` for NFC-authenticated students. The problem cascades because:

1. **Dashboard stuck loading** — `loadData()` checks `if (!user?.email) return` and exits immediately, never setting `loading = false`. The page stays on "Loading your dashboard..." forever.

2. **Leaderboards empty** — `TopRiders` checks `if (!user?.email) return` and skips data loading entirely.

3. **Issue report form broken** — `ReportIssueForm` checks `if (!user?.email || !open) return` so the "Submitted By" field never populates.

4. **All Airtable calls fail silently** — `callAirtable()` tries to get a Supabase JWT to authenticate with the proxy. NFC users have no JWT, so either no auth header is sent (401 error) or only the `nfcToken` is sent for the few places that pass it. The proxy only allows NFC tokens to access 2 tables (`Student Registration` and `Session Reflections`), blocking leaderboard and organisation data.

## Plan

### Step 1: Auto-detect NFC token in the Airtable client (`src/lib/airtable.ts`)

Store the NFC token in `sessionStorage` when it's set, and modify `callAirtable` to automatically use it as a fallback when there's no JWT session. This avoids needing to thread `nfcToken` through every component manually.

- Add `setActiveNfcToken(token)` / `getActiveNfcToken()` helpers
- In `callAirtable`, if no JWT session exists, check for a stored NFC token and attach the `x-nfc-token` header automatically

### Step 2: Store the NFC token on session creation (`src/hooks/useAuth.tsx`)

When `setNfcSession` is called, also persist the token to `sessionStorage`. When cleared (sign out), remove it. This ensures `callAirtable` can always find it.

### Step 3: Expand NFC-allowed tables in the proxy (`supabase/functions/airtable-proxy/index.ts`)

Currently NFC auth only allows `Student Registration` and `Session Reflections`. Expand to also allow:
- `Organisations` (GET only — needed for leaderboards/dashboard)
- `Global Dashboard` (GET only — needed for stats bar)
- `Support Tickets (Bug/Issue Form)` (POST only — needed for issue reporting)

Add a method check: NFC auth can only GET from read-only tables, and POST to Session Reflections and Support Tickets.

### Step 4: Fix Dashboard for NFC users (`src/pages/Dashboard.tsx`)

- Instead of requiring `user?.email`, also check for `nfcSession`
- When NFC session is present, fetch the student record directly by record ID (using `RECORD_ID()` formula) instead of by email
- Skip the 4-week check-in gate for NFC users (they already bypass surveys)
- Ensure `loading` is set to `false` even when no data source is available

### Step 5: Fix TopRiders for NFC users (`src/components/TopRiders.tsx`)

- Remove the early `if (!user?.email) return` gate
- When `nfcSession` is present, use the student record ID to determine the student's school for filtering, instead of looking up by email

### Step 6: Fix ReportIssueForm for NFC users (`src/components/ReportIssueForm.tsx`)

- When `nfcSession` is present, pre-fill the submitter name and record ID from the NFC session data directly (no Airtable lookup needed)
- Allow form submission using the NFC token auth path

### Step 7: Fix SchoolLeaderboard and StatsBar

These components don't check `user?.email` but they do call `callAirtable` without passing an NFC token. With Step 1's auto-detection fix, these will work automatically once the proxy allows NFC access to their tables (Step 3).

### Step 8: Fix Navbar sign-out for NFC users (`src/components/Navbar.tsx`)

The sign-out button calls `signOut()` which clears the NFC session. This already works, but we should also clear `sessionStorage` (handled in Step 2).

---

### Technical Detail: File Changes Summary

```text
src/lib/airtable.ts          — Auto-detect NFC token fallback in callAirtable
src/hooks/useAuth.tsx         — Persist NFC token to sessionStorage
supabase/functions/airtable-proxy/index.ts — Expand NFC allowed tables + method checks
src/pages/Dashboard.tsx       — Support NFC session for data loading
src/components/TopRiders.tsx  — Remove email gate, support NFC lookup
src/components/ReportIssueForm.tsx — Pre-fill from NFC session
```

No database changes needed. No new tables or RLS policies required since all data flows through Airtable via the edge function proxy.

