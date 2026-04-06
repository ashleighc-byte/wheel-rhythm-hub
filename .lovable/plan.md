## Inter-School Challenges System — Term 2, 2026

### Architecture

**New files:**
- `src/lib/challenges.ts` — Challenge engine: definitions, progress calculation, date-window filtering
- `src/components/ChallengesDashboard.tsx` — Student-facing challenges UI (cards, progress bars, rewards)
- `src/components/AdminChallengesView.tsx` — Teacher/admin challenge monitoring view

**Modified files:**
- `src/pages/Dashboard.tsx` — Add Challenges section below surveys
- `src/pages/TeacherDashboard.tsx` — Add admin challenges tab/section
- `src/lib/airtable.ts` — Add helper to fetch all sessions (not just by student)

### Challenge Engine (`src/lib/challenges.ts`)

A config-driven, reusable engine:

```typescript
interface ChallengeDefinition {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  metricType: 'ride_count' | 'distance' | 'duration' | 'elevation' | 'team_time';
  target: number;
  mode: 'individual' | 'team';
  teamSize?: number;
  courseFilter?: string;
  reward: string;
  displayOrder: number;
  active: boolean;
  dependsOn?: string[]; // challenge IDs that must be completed for reward
}
```

**Term 2 challenges defined as config array** — future challenges added by pushing to this array.

**Progress calculation:**
- Filters sessions by date window + student
- Parses `Session Data Table` JSON for distance/duration/elevation
- Sums the relevant metric
- For team challenges: aggregates across school's riders
- Duration internally in seconds, displayed as hh:mm:ss

### Student Dashboard Section

- Shows current/upcoming/completed challenges
- Each card: name, dates, goal, live progress bar, reward icon, completion badge
- Challenge 4 reward shows dependency note ("Complete both Challenge 3 & 4")
- Challenge 5 shows team leaderboard

### Admin/Teacher View

- Participation rates per challenge
- Completion counts by school
- Challenge 5 team rankings table
- Winner highlight

### Data Source

All from existing `Session Reflections` table via Airtable proxy — no new Airtable tables needed. Progress is computed client-side from session data within each challenge's date window.

### Files Changed

| Change | File | Size |
|--------|------|------|
| Challenge engine + definitions | `src/lib/challenges.ts` | New, medium |
| Student challenges UI | `src/components/ChallengesDashboard.tsx` | New, medium |
| Admin challenges view | `src/components/AdminChallengesView.tsx` | New, medium |
| Wire into student dashboard | `src/pages/Dashboard.tsx` | Small edit |
| Wire into teacher dashboard | `src/pages/TeacherDashboard.tsx` | Small edit |
| Fetch all sessions helper | `src/lib/airtable.ts` | Small edit |
