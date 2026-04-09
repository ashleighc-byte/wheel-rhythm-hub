

# Fix Registration Form, Auth Redirect, and Terms Page

## Issues Identified

1. **Registration form visibility**: The form uses `text-secondary-foreground` (neon green) and `bg-secondary-foreground/10` styling designed for a dark background. Inside the white Dialog, labels and inputs are nearly invisible green-on-white.

2. **Authenticated users see old homepage**: `Index.tsx` shows `AuthenticatedHome` (with `HeroSection`, `CTASection`) when logged in. User should go straight to `/dashboard`. NFC bracelet users should go to the session log form.

3. **Terms page**: Has basic placeholder content. Needs to be rebuilt using the actual MoU document content.

4. **Runtime error**: `Cannot read properties of null (reading 'useState')` in `useAuth.tsx` — likely a React import issue or StrictMode problem. Will investigate during implementation.

---

## 1. Fix Registration Form Visibility

**File:** `src/components/StudentRegistrationForm.tsx`

- Replace all `text-secondary-foreground` classes with `text-foreground` (dark brown, readable on white)
- Replace all `bg-secondary-foreground/10` input backgrounds with `bg-muted` or standard input styling
- Replace `border-secondary-foreground/20` with `border-border`
- Replace `placeholder:text-secondary-foreground/40` with `placeholder:text-muted-foreground`
- The "or" divider and Google button similarly need updated colors

## 2. Redirect Authenticated Users to Dashboard

**File:** `src/pages/Index.tsx`

- When `user` is authenticated, redirect to `/dashboard` using `<Navigate to="/dashboard" replace />`
- Remove the `AuthenticatedHome` component entirely (it duplicates dashboard functionality)
- The NFC redirect already works via `NfcTap.tsx` which opens the session form directly

**File:** `src/App.tsx`  
- `AuthRoute` already redirects logged-in users from `/auth` to `/` → this will now chain to `/dashboard`
- Alternatively, change `AuthRoute` redirect to `/dashboard` directly

## 3. Rebuild Terms Page from MoU

**File:** `src/pages/Terms.tsx`

Replace the placeholder with comprehensive terms based on the MoU document:

1. **Programme Overview** — Free Wheeler Bike League description, Proton Wattbike + MyWhoosh
2. **Objectives** — inclusive cycling, wellbeing, positive movement
3. **Participant Responsibilities** — use equipment responsibly, follow school policies, NFC bracelet care
4. **School Responsibilities** — space, supervision, consent collection
5. **Sport Waikato Responsibilities** — equipment, digital platforms, technical guidance, user packs
6. **Data Management & Privacy** — anonymisation, secure storage, authorised access only, aggregated reporting to Sport NZ
7. **Consent** — checkbox = consent for data collection; under-16 requires parent/guardian; withdraw by contacting coordinator
8. **Duration** — programme runs for the agreed pilot period
9. **Contact** — programme coordinator or Sport Waikato team

## 4. Fix Runtime Error

**File:** `src/main.tsx`

- Wrap `<App />` in `<React.StrictMode>` (or remove if already wrapped incorrectly)
- The `useState` null error often indicates duplicate React instances — check if this resolves after the other changes

---

## Files to Modify
1. `src/components/StudentRegistrationForm.tsx` — Fix all color classes for white background
2. `src/pages/Index.tsx` — Replace `AuthenticatedHome` with `Navigate` to `/dashboard`
3. `src/pages/Terms.tsx` — Full rewrite with MoU-based content
4. `src/main.tsx` — Fix React rendering if needed

