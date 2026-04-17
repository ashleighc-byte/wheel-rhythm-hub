# Lovable Prompt — Sync GitHub Changes + Branding
**Date:** April 2026  
**Purpose:** Paste this directly into Lovable after pushing GitHub changes to main.

---

## Instructions

Push your GitHub changes to main first, then paste the prompt below into Lovable. Lovable will pull the latest branch and layer on top.

---

## Prompt (copy everything below this line)

---

Sync the following changes that have been made directly in GitHub. Pull the latest code from the main branch before starting.

---

### 1. Registration Form (src/components/StudentRegistrationForm.tsx)

The registration form has been completely rebuilt in GitHub. It now collects: First Name, Last Initial (single letter only), Year Level, School. It no longer collects email, password, or gender. There is a consent checkbox instead of a terms checkbox. On submit it writes to Airtable Student Registration with Registration Status = "Pending Consent". No Supabase auth account is created. Please verify the form renders correctly on the / landing page (JOIN THE LEAGUE dialog) and on /studentregistration. The success message should read: "Your registration is in. Once your school confirms consent and Sport Waikato processes your sign-up, your NFC bracelet and starter pack will be delivered to your school."

---

### 2. New page: /admin/flowchart (src/pages/AdminFlowchart.tsx)

A new admin-only page has been added at /admin/flowchart. It shows:
- A-E student journey cards (horizontal on desktop, vertical on mobile)
- School engagement flow (8-step vertical timeline)
- Data stored vs not stored (Privacy Act 2020)
- Key URLs reference
- Print button

Protected by AdminRoute. Verify it loads correctly when signed in as admin.

---

### 3. New page: /resources (src/pages/Resources.tsx)

A new public page at /resources fetches from Airtable Resources Library (no auth required) and displays resource cards grouped by audience (Schools, Students, Caregivers). Verify it loads without errors.

---

### 4. Remove all references to "Virtual"

Search the entire codebase for any remaining instances of "virtual cycling league" or "Virtual Cycling League" or "virtual" when used to describe Freewheeler. Replace with just "cycling league" or "Cycling League". This includes any text in components, pages, meta tags, page titles, or SEO descriptions. Freewheeler is a Cycling League — drop "Virtual" everywhere.

---

### 5. Logo size — increase across all pages

The logo (fw-logo-oval.png) should be larger and more prominent on every page. Apply these sizes:

- **Navbar** (top-left, all authenticated pages): h-12 minimum, h-14 on desktop if it fits without crowding the nav links
- **Public landing page** header top-left: h-12 mobile, h-16 desktop
- **NFC tap page** (/tap/:token) — logo centered above the card: h-20
- **Log a Ride modal** (SessionFeedbackForm) — logo at top: h-20
- **Book a Bike page** (/book) — header logo: h-12 mobile, h-16 desktop
- **Auth page** (/auth) — logo centered above sign-in form: h-28
- **Student Registration page** (/studentregistration) — logo in header: h-16
- **Programme Overview** (/programme-overview) — header logo: h-24, footer logo: h-14
- **Resources page** (/resources) — header logo: h-20
- **Any other page** that shows the logo: increase by roughly 25% from whatever it currently is

The logo is an oval badge shape. It should be displayed with object-contain so it never gets cropped. On pages where it links back to /, keep that link behaviour.

---

### 6. About page (/info) — update content

The /info page is for logged-in students (after NFC tap). Update the content to include:

**Section 1 — What is Freewheeler?**

3 sentences: Freewheeler is a cycling league for NZ secondary school students. Students ride Wattbike Proton smart bikes at school using the MyWhoosh app, logging each ride via an NFC bracelet tap. Points accumulate over an 8-week season and schools compete on a leaderboard.

**Section 2 — How Points Work** (use cards or a clean table):

| What | Points |
|------|--------|
| Base ride completion | 10 pts |
| 3 sessions in a week bonus | +5 pts |
| New track first attempt | +3 pts |
| Top speed 20–24 km/h | +2 pts |
| Top speed 25–29 km/h | +5 pts |
| Top speed 30+ km/h | +10 pts |
| Elevation 50–149m | +2 pts |
| Elevation 150–299m | +5 pts |
| Elevation 300m+ | +10 pts |

**Section 3 — Season Dates**:

- Block 1: Mon 31 Aug – Thu 25 Sep 2026
- Mid-season break: Fri 26 Sep – Sun 11 Oct 2026
- Block 2: Mon 12 Oct – Fri 6 Nov 2026

**Section 4 — Competing Schools**: Fetch school names from Airtable Organisations table using callAirtable (already configured) and display as a grid of cards.

Keep the existing Navbar at the top. Use the Freewheeler design system: font-display for headings, border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))] for cards.

---

Do not change anything else. Do not add features beyond what is listed above.
