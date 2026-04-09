

# Rebuild Public Landing Page with Inline Registration Form

## Overview
Replace the external "Join the League" link with a built-in student registration form on the homepage. The form creates a Supabase auth account and writes registration data to Airtable. After registration, students can sign in immediately.

## Changes

### 1. New Component: `StudentRegistrationForm`
Create `src/components/StudentRegistrationForm.tsx` — an inline registration form embedded in the landing page hero section, replacing the "JOIN THE LEAGUE" external link.

**Fields:**
- First Name (required)
- Last Name (required)
- Gender (optional — dropdown: Male, Female, Non-binary, Prefer not to say)
- Year Level (required — dropdown: Year 9, Year 10, Year 11, Year 12, Year 13)
- School (required — combobox with pre-populated school names from the `registration-count` edge function; auto-capitalises free-text input using title case)
- School Email (required — used as login email)
- Password (required, min 6 chars)
- Confirm Password (required)
- Terms & Conditions checkbox (required — links to `/terms` page)

**On submit:**
1. Create Supabase auth account via `supabase.auth.signUp({ email, password })`
2. Write student record to Airtable "Student Registration" table via `callAirtable('Student Registration', 'POST', { body: { fields: { ... } } })`
3. Show success message: "You're registered! Sign in above to get started."
4. Auto-confirm email signups (use `cloud--configure_auth` to enable) since user explicitly said no email verification needed

**Google Sign Up integration:** Add a "Sign up with Google" button that:
1. Triggers `lovable.auth.signInWithOAuth("google")`
2. On return, if no Airtable record exists for the email, shows the remaining fields (name, gender, year level, school, T&C checkbox) to complete registration before proceeding

### 2. Update `PublicLanding` in `src/pages/Index.tsx`
- **Hero section:** Move "Sign In" to top-right corner as a small link/button. Replace "JOIN THE LEAGUE" + "SIGN IN" buttons with the inline `StudentRegistrationForm`
- **How It Works:** Keep section but update copy placeholder text noting it will be updated later
- **Remove:** "Ready to Ride?" QR section entirely
- **Remove:** "Are you a teacher?" section entirely
- **Footer:** Add "Terms & Conditions" link

### 3. Create Terms & Conditions page
Create `src/pages/Terms.tsx` — a simple page with placeholder text for MoU (bike use, data collection terms). Add route `/terms` in `App.tsx`.
Add "Terms & Conditions" link in the footer.

### 4. Update `src/pages/Auth.tsx`
- Remove the "Sign Up" mode entirely — registration now happens on the homepage
- Keep only Sign In + Forgot Password modes
- Remove "Don't have an account? Sign Up" link
- Remove "Teachers: your email must be registered" note

### 5. Update `src/App.tsx`
- Add `/terms` route (public)
- Enable auto-confirm for email signups via `cloud--configure_auth`

### 6. Update `registration-count` Edge Function
The existing function already returns school names from Airtable Organisations table. The form will call this to populate the school combobox. No changes needed to the function itself.

### 7. School Name Handling
- Fetch school list from `registration-count` endpoint on form mount
- Show as a searchable combobox (using existing `Command` + `Popover` components)
- If user types a new school name, auto-apply title case (e.g., "hamilton boys" → "Hamilton Boys")
- This prevents duplicate school name variations

## Technical Details

- **Auth flow:** `supabase.auth.signUp()` creates the account. Auto-confirm enabled so no email verification step. Student can immediately sign in.
- **Airtable sync:** POST to "Student Registration" table with fields: `Full Name`, `School Email`, `Gender`, `Year Level`, `School` (linked record or text depending on table schema)
- **Validation:** Zod schema for all fields. Email must end in `.school.nz` or similar school domain pattern (or just basic email validation if schools use various domains).
- **No teacher flow:** Teacher sign-in remains at `/auth` but is not linked from the public landing page.

