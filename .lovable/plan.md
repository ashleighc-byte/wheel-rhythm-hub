

# Plan: Webinar Page, Student Registration, and In-App Onboarding

This is a large feature set. Here's the full implementation plan.

---

## What We're Building

1. **`/webinar`** — A static 7-slide walkthrough page for teacher Teams sessions
2. **`/studentregistration`** — A public page (no login required) that links to the external permission form and shows remaining spots per school
3. **In-app tooltip onboarding tour** — For both teachers and students on first login, with "mark as done" persistence
4. **Airtable "Onboarding Questions" field** — Save teacher questions from the webinar into Airtable Organisations table
5. **Auth flow refinements** — Better messaging when unapproved users try to sign up
6. **Setup Instructions updates** — Update URLs/links to reflect new registration flow

---

## 1. `/webinar` Page (Static Walkthrough)

New file: `src/pages/Webinar.tsx`

A multi-step page with Next/Back navigation, 7 slides:

| Slide | Content |
|---|---|
| 1 | Registration: fill out form link, sign up on site, verify email, sign back in |
| 2 | Home page: describe buttons, CTA section, "Something Not Working" — prompt test submission |
| 3 | About the Pilot: click-through each section |
| 4 | Setup Instructions: describe download PDF, print workflow |
| 5 | Leaderboards: toggle time/points, how points work |
| 6 | Teacher Dashboard: features, surveys timeline |
| 7 | Any Questions: embedded question form that saves to Airtable |

Each slide is a React component rendered inside a slide container with progress bar and navigation buttons. No login required for this page.

For slide 7, a simple text input + submit that calls `callAirtable('Organisations', 'PATCH', ...)` to append to the "Onboarding Questions" field. Since this is a teacher-only webinar page, we'll require auth and look up the teacher's org record.

**Route**: Public initially, but slide 7 question submission requires auth (we'll show a note if not logged in).

---

## 2. `/studentregistration` Page

New file: `src/pages/StudentRegistration.tsx`

A **public page** (no auth required, accessible without login):

- Branded header with FW logo
- School selector dropdown (fetches active schools from Airtable Organisations)
- Shows current registration count vs 24 limit per school
- If spots available: prominent link to external form `https://bit.ly/GameFITPermission`
- If full (24+): shows "Registrations full for this school" with disabled link
- Registration count derived from counting Student Registration records per school in Airtable

To make this accessible without auth, we need to update the Airtable proxy edge function to allow GET requests to `Student Registration` and `Organisations` from unauthenticated users — OR create a new lightweight edge function `registration-count` that returns school counts without exposing student data.

**Recommended approach**: New edge function `registration-count/index.ts` that:
- Fetches all active organisations from Airtable
- For each, counts Student Registration records linked to that org
- Returns `{ schools: [{ name, spotsRemaining }] }`
- No auth required, read-only, no PII exposed

---

## 3. In-App Tooltip Onboarding Tour

New files:
- `src/components/OnboardingTour.tsx` — Main tour component
- `src/hooks/useOnboarding.ts` — Hook to manage tour state

**Persistence**: New database table `onboarding_completed` with columns:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `role` (text — 'student' or 'admin')
- `completed_at` (timestamptz, default now())

RLS: Users can read/insert their own records.

**Tour implementation**: Use a step-based approach with floating tooltip divs positioned relative to target elements (using refs or query selectors). Each step highlights an element with a backdrop overlay and shows a description tooltip with Next/Skip/Done buttons.

**Teacher tour steps** (shown on first login after auth):
1. Home page — "Welcome! Here's where you'll find ride logging and quick actions"
2. About the Pilot dropdown — "Learn about the pilot and access setup instructions"
3. Leaderboards — "See all schools and top riders"
4. Teacher Dashboard — "Monitor your students' progress here"
5. Sign Out — "You're all set!"

**Student tour steps** (shown after pre-pilot survey completion):
1. Home page — "Welcome to Free Wheeler! Log your rides here"
2. About the Pilot — "Learn how the programme works and check your progress"
3. Leaderboards — "See how you rank against other riders"
4. Your Stats — "Track your personal dashboard"
5. Log a Ride — "After every session, log your ride here"

The tour renders on the Index page. On mount, check if `onboarding_completed` has a record for this user. If not, start the tour.

---

## 4. Auth Flow Updates

Update `src/pages/Auth.tsx`:
- When signup fails approval check, differentiate the toast message:
  - For students: "Your email isn't registered yet. Please fill out the permission form at https://bit.ly/GameFITPermission and ask your teacher if you're unsure."
  - For teachers: "Your email isn't in our system. Please complete the school registration form at https://bit.ly/Freewheelerschoolreg"

Update `validateUserApproval` in `src/lib/airtable.ts`:
- For teacher check: also verify `Status` field = 'active' (not just email exists)

---

## 5. Setup Instructions Updates

Update `src/pages/SetupInstructions.tsx` and `SetupInstructionsPrint.tsx`:
- Change permission form link from `FreewheelerPermission` to `GameFITPermission`
- Update registration flow text to reflect the new workflow
- Add link to `/studentregistration` page for checking spots

---

## 6. Route & Navigation Changes

In `src/App.tsx`:
- Add `/webinar` route (public, no auth wrapper)
- Add `/studentregistration` route (public, no auth wrapper)

In `src/components/Navbar.tsx`:
- No navbar changes needed (webinar and registration are standalone pages)

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/pages/Webinar.tsx` | 7-slide teacher walkthrough |
| `src/pages/StudentRegistration.tsx` | Public registration page with spot counter |
| `src/components/OnboardingTour.tsx` | Tooltip-style first-login tour |
| `src/hooks/useOnboarding.ts` | Tour state management + DB check |
| `supabase/functions/registration-count/index.ts` | Public edge function for school spot counts |

## Database Migration

```sql
CREATE TABLE public.onboarding_completed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.onboarding_completed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own onboarding" ON public.onboarding_completed
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_completed
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

## Edge Function: `registration-count`

- No auth required (`verify_jwt = false`)
- Fetches Organisations (active) and counts linked Student Registration records
- Returns `{ schools: [{ name, spots_taken, spots_remaining }] }`

---

## Implementation Order

1. Database migration (onboarding_completed table)
2. Registration-count edge function
3. `/studentregistration` page
4. `/webinar` page (all 7 slides)
5. Onboarding tour components + hook
6. Auth flow message updates
7. Setup Instructions link updates
8. Route registration in App.tsx

