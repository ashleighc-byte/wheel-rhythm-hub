
# Teacher (Admin) Dashboard & Role-Based Views

## Overview

This plan splits the app into student-facing and teacher-facing views. Teachers see everything students see, plus an exclusive teacher dashboard showing their school's active students, survey completion status, and session counts. The Info page will also show a Teacher Observation Form link for admins only.

## What's Being Built

### 1. Teacher Dashboard Page (`/teacher-dashboard`)
A new protected admin-only page that shows:
- A table of all students from the teacher's school (matched by their organisation record)
- For each student:
  - Name
  - Number of sessions completed
  - Pre-Pilot Survey completed? (checkbox/tick)
  - 4 Week Check-In completed? (checkbox/tick)
  - Post-Pilot Survey completed? (checkbox/tick)
- Recent session submissions from those students (name, date, km, time, mood)

### 2. Navbar Updates
Teachers get an extra nav link: **"TEACHER DASHBOARD"** → `/teacher-dashboard`

The "LOG A RIDE" button will be hidden for admin users (teachers don't log rides).

### 3. Info Page Updates
The Teacher Observation Form section will show a clickable link for admins, instead of the placeholder "Available under the admin login" text. (The actual form can be linked externally or built as a future step.)

## Data Strategy (Airtable)

All data is already available in Airtable — no new tables needed.

**To build the teacher's student list:**
1. Fetch the teacher's Organisation record using their email → get `Organisation Name` and record ID
2. Fetch all `Student Registration` records where `{School}` links to that org record ID
3. For each student, check:
   - **Pre-Pilot Survey**: `Surveys & Student Voice` array in their student record is non-empty (field already used in `hasCompletedPrePilotSurvey`)
   - **4 Week Check-In**: Query `Surveys & Student Voice` with `Survey Type = "4 Week Check In"` + student record ID (already done in `hasCompletedFourWeekCheckIn`)
   - **Post-Pilot Survey**: Query `Surveys & Student Voice` with `Survey Type = "Post-Pilot"` + student record ID
   - **Session count**: `Count (Session Reflections)` field already on each student record

**New airtable helper functions needed in `src/lib/airtable.ts`:**
- `fetchStudentsBySchool(orgRecordId: string)` — fetch all students linked to a given org
- `fetchTeacherOrg(email: string)` — fetch the org record for a teacher
- `fetchAllSurveysForStudents(studentRecordIds: string[])` — batch fetch all survey records for a group of students to check completion status efficiently

## Files to Create / Modify

### New Files
- `src/pages/TeacherDashboard.tsx` — the new admin-only dashboard page

### Modified Files
- `src/App.tsx` — add `/teacher-dashboard` route (admin-only protected route wrapper)
- `src/components/Navbar.tsx` — add conditional "TEACHER DASHBOARD" link + hide "LOG A RIDE" for admins
- `src/pages/Info.tsx` — show Teacher Observation Form as a clickable link for admins (conditionally rendered)
- `src/lib/airtable.ts` — add new helper functions for teacher data fetching

## Technical Detail

### Route Protection
A new `AdminRoute` wrapper will be added to `App.tsx`:

```text
AdminRoute
  ├── If loading → show loading spinner
  ├── If no session → redirect /auth
  ├── If role !== 'admin' → redirect /
  └── Else → render children
```

### Teacher Dashboard Data Flow

```text
TeacherDashboard loads
  │
  ├─ fetchTeacherOrg(email) → gets org record ID + name
  │
  ├─ fetchStudentsBySchool(orgRecordId) → list of student records
  │   Each record already has:
  │   ├─ Full Name
  │   ├─ Count (Session Reflections)  [session count]
  │   └─ Surveys & Student Voice []   [for pre-pilot check]
  │
  ├─ For Post-Pilot + 4-Week:
  │   Batch fetch Surveys & Student Voice filtered by student record IDs
  │   and check Survey Type = "Post-Pilot" / "4 Week Check In"
  │
  └─ Fetch recent Session Reflections for all students in that school
```

### Student Table Layout

| Student Name | Sessions | Pre-Pilot ✓ | 4 Week Check-In ✓ | Post-Pilot ✓ |
|---|---|---|---|---|
| Jane Smith | 12 | ✅ | ✅ | ❌ |
| Tom Brown | 4 | ✅ | ❌ | ❌ |

### Recent Sessions Section
Below the student table, a second table showing the most recent 20 session submissions from all students at the school, including student name, date, km, time, and mood transition.

## What Teachers Won't See Differently
- Home, Leaderboards, Info pages — identical to students
- The "Log a Ride" button is removed from nav for teachers since they don't log rides themselves

## Implementation Order
1. Add new airtable helpers (`src/lib/airtable.ts`)
2. Create `TeacherDashboard.tsx` page
3. Add `AdminRoute` and `/teacher-dashboard` route in `App.tsx`
4. Update `Navbar.tsx` for role-based links
5. Update `Info.tsx` for admin-visible Teacher Observation Form link
