

# Content Update, Teacher Support Page & Bike Booking System

## Overview
Three major workstreams: (1) update copy across the site to reflect all recent changes, (2) build a teacher support/resource page with setup instructions, QR backup codes, and printable instructional posters, (3) build a bike booking timetable system.

---

## 1. Content/Copy Updates Across the Site

### Landing Page (`src/pages/Index.tsx`)
- Update "How It Works" descriptions to reflect the current flow accurately (NFC bracelets, MyWhoosh, milestones)
- Add note that registration is limited to 24 students per school, first-in-first-served
- Add note that once registered, Sport Waikato will deliver a user pack (NFC bracelet + stickers) to the school

### About Page (`src/pages/Info.tsx`)
- **Student view**: Update to remove survey references, update checklist to reflect current features (milestones not levels), ensure "How Points Work" section matches the new formula
- **Teacher view**: Update timeline phases to reflect current pilot structure, remove survey references, update to mention booking system

### Dashboard (`src/pages/Dashboard.tsx`)
- Remove any remaining references to levels, surveys, or race mode in copy/comments

### Registration Form (`src/components/StudentRegistrationForm.tsx`)
- Add a visible "24 spots per school" counter showing spots remaining (already have this data from `registration-count` edge function)
- Show "Registration closed" when school is full

---

## 2. Teacher Support Page

### New Page: `src/pages/TeacherResources.tsx`
A dedicated teacher resource hub (admin-only route at `/teacher-resources`).

**Sections:**

#### A. Setup Instructions
Content covering:
- **Space**: Teachers need a dedicated space with access to power outlets for the 2 smart bikes
- **WiFi**: Need WiFi code available — bikes connect via the MyWhoosh app
- **MyWhoosh Setup**: Download MyWhoosh onto the iPad/tablet provided by Sport Waikato. Link to admin account credentials
- **iPad Screenshot**: Instructions on how to screenshot on iPad (press top button + volume up simultaneously, or use AssistiveTouch)
- **Student Access**: Students use NFC bracelets to log in — tap their bracelet on the device, log their session. No teacher monitoring needed
- **Share the Link**: Teachers share the website link with students to register. First 24 students per school — first in, first served
- **Logistics**: Consider how to structure bike access — suggest using the built-in booking system so students know when bikes are available
- **After Registration**: Sport Waikato receives registration info, creates user packs (NFC bracelet + stickers), and delivers to the school

#### B. Student QR Code Backup
- Reuse existing `StudentQRCodes` component — fetch students for the teacher's school and render the printable QR backup sheet directly on this page

#### C. Printable Instructional Posters (2 posters)
Generate as printable sections (print-friendly CSS):

**Poster 1 — "How to Log a Ride"**
1. Tap your NFC bracelet on the device
2. Your name appears — tap "Log a Ride"
3. Fill in your session details (distance, time, elevation, course)
4. Submit — you're done!

**Poster 2 — "How to Book a Bike"**
1. Go to freewheeler.lovable.app/book
2. Pick your date and time slot
3. Choose Bike A or Bike B
4. Book your 15-minute slot (book 2 for a 30-minute ride)

### Navigation Update (`src/components/Navbar.tsx`)
- Add "RESOURCES" to teacher nav dropdown under "About the Pilot" → `{ label: "Teacher Resources", path: "/teacher-resources" }`

### Route (`src/App.tsx`)
- Add `/teacher-resources` as an `AdminRoute`

---

## 3. Bike Booking System

### Database: New `bike_bookings` table

```sql
CREATE TABLE public.bike_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  bike_label text NOT NULL CHECK (bike_label IN ('Bike A', 'Bike B')),
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  booked_by_name text NOT NULL,
  booked_by_email text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bike_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view bookings for their school
CREATE POLICY "Users can view school bookings"
  ON public.bike_bookings FOR SELECT TO authenticated
  USING (true);

-- Anyone authenticated can insert bookings
CREATE POLICY "Users can insert bookings"
  ON public.bike_bookings FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can delete their own bookings
CREATE POLICY "Users can cancel own bookings"
  ON public.bike_bookings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Anon can also view and insert (for public "Book Now" page for office staff)
CREATE POLICY "Anon can view bookings"
  ON public.bike_bookings FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can insert bookings"
  ON public.bike_bookings FOR INSERT TO anon
  WITH CHECK (true);

-- Unique constraint to prevent double-booking
ALTER TABLE public.bike_bookings
  ADD CONSTRAINT unique_bike_slot UNIQUE (school_name, bike_label, booking_date, time_slot);
```

### New Page: `src/pages/BookBike.tsx`
Public page at `/book` — no auth required (office staff can book on behalf of students).

**UI:**
- School selector (dropdown of active schools from `registration-count` endpoint)
- Date picker (only future dates, weekdays only)
- Timetable grid: rows = 15-min time slots from 8:00 AM to 4:00 PM (32 slots), columns = Bike A | Bike B
- Each cell: clickable if available (green), greyed out if booked (shows name)
- On click: small form pops up — "Student Name" (required), "Email" (optional) → inserts into `bike_bookings`
- Cancel: if a user booked it, they can click to cancel their own booking

**Time slots:** `08:00`, `08:15`, `08:30`, ... `15:45` (32 slots total)

### Navigation
- Add "BOOK NOW" to the public landing page footer and as a top-nav link on the public site
- Add "BOOK A BIKE" to the student nav links in `Navbar.tsx`

### Route (`src/App.tsx`)
- Add `/book` as a public route (no auth required)

---

## Files to Create
1. `src/pages/TeacherResources.tsx` — Teacher support hub
2. `src/pages/BookBike.tsx` — Public bike booking timetable

## Files to Modify
1. `src/App.tsx` — Add routes `/teacher-resources` (admin), `/book` (public)
2. `src/components/Navbar.tsx` — Add "BOOK A BIKE" to student nav, "Teacher Resources" to teacher dropdown
3. `src/pages/Index.tsx` — Update copy, add "Book Now" to footer, add registration cap note
4. `src/pages/Info.tsx` — Update copy for both student and teacher views
5. `src/pages/Dashboard.tsx` — Clean up residual level/survey/race references
6. `src/components/StudentRegistrationForm.tsx` — Show spots remaining counter

## Database Migration
- Create `bike_bookings` table with RLS policies and unique constraint

