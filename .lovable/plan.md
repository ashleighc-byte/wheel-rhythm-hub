

# Leaderboard, Dashboard, Points & Navigation Overhaul

## Overview
Major restructuring of navigation, leaderboard page, dashboard, points system, and about page to simplify the experience for 13–16 year olds.

---

## 1. Landing Page — "Join the League" Button → Modal Form

**File:** `src/pages/Index.tsx`

- Replace the inline `StudentRegistrationForm` in the hero section with centered tagline text + a large "JOIN THE LEAGUE" button
- On click, open a `Dialog` containing the `StudentRegistrationForm`
- Keep the "Sign In" link in the top-right header

---

## 2. Navigation Update

**File:** `src/components/Navbar.tsx`

- Student nav links change from `HOME | ABOUT THE PILOT | LEADERBOARDS | MY DASHBOARD` to:
  `ABOUT | LEADERBOARD | MY DASHBOARD | LOG A RIDE`
- Remove HOME link; keep logo as home link
- "LOG A RIDE" moves into the nav bar as a regular link (opens the session feedback form)

---

## 3. Leaderboard Page Rebuild

**File:** `src/pages/Leaderboards.tsx` (major rewrite)

### Header Stats
- Pull from Airtable Global Dashboard (via leaderboard cache): **Total Schools, Total Riders, Total Sessions, Total Hours** (rounded to whole hours, no minutes)

### User Rank Banner
- Show the logged-in student's rank across all riders: e.g. "You are ranked **#4** out of **17 riders**"
- Computed from cached `top_riders` data — find user's position by points

### Remove
- Live Activity Feed (ImpactStats component)
- Engagement Stats sidebar (SchoolLeaderboard component — duplicate of header)
- Levels from all leaderboard tables

### Top Riders Table (school-only)
- Title: "Top Riders – {School Name}"
- Columns: Rank #, Name, Sessions, Points, Distance (km), Time, Elevation (m)
- Show ALL riders from the user's school (not capped at 10)
- Paginate with "Show next 10" toggle if >10 riders
- Data source: cached `top_riders` filtered by user's school

### Top Female Riders Table
- Same columns as Top Riders
- Filter by gender from Airtable student records (requires gender data in cache)
- Only show riders from user's school

### Top Male Riders Table
- Same as above, filtered for male

### Popular Tracks/Course Maps Table
- New table: "Most Popular Tracks"
- Aggregate `Course Map` field from Session Reflections (fetched via Airtable or cached)
- Show track name + ride count, sorted by popularity

### Data Changes
- **sync-leaderboard edge function**: Add `gender` field to each rider in the `top_riders` cache (read from Student Registration's Gender field)
- **sync-leaderboard edge function**: Add a new cache key `popular_tracks` — aggregate Session Reflections' `Course Map` field
- **leaderboardCache.ts**: Add `gender` to `CachedRider` interface, add `getCachedPopularTracks()` function

---

## 4. Dashboard Simplification

**File:** `src/pages/Dashboard.tsx`

### Remove
- Levels completely (LevelProgress component, level badges, level references)
- Level badge from hero panel
- Level badge from school riders table

### Keep
- Hero panel (name, school, rank, streak)
- Gamification quick stats (Total Points, Day Streak, Total Rides)
- Log a Ride CTA
- First ride welcome banner
- Recent Rides section
- Top Riders school preview
- Challenges section
- Achievements (unlocked only)
- How Points Work (collapsible)

---

## 5. New Points System

**File:** `src/lib/gamification.ts`

Update `calculateSessionPoints` and related functions:

### Base Points
- **10 points** per ride logged (keep existing)

### Streak Bonus (simplified)
- **+5 bonus** for 3 days in a row
- **Remove** 5-day streak bonus (currently +10 for 5 sessions/week)
- Keep weekly bonus for 3 sessions only

### Elevation Bonus (NEW)
- +2 pts for rides with 50–149m elevation
- +5 pts for rides with 150–299m elevation  
- +10 pts for rides with 300m+ elevation

### Track Variety Bonus (NEW)
- +3 pts for each unique track/course ridden (first time on a new track)
- Track from Session Reflections `Course Map` field

### Speed Bonus (NEW)
- +2 pts for rides averaging 20–24 km/h
- +5 pts for rides averaging 25–29 km/h
- +10 pts for rides averaging 30+ km/h

### Update `computeGrandTotalPoints` 
- Include elevation, variety, and speed bonuses in total

### Update `calculateWeeklyBonus`
- Only award +5 for 3 sessions/week (remove the +10/+15 for 5 sessions)

### Update sync-leaderboard edge function
- Mirror the same points formula server-side

---

## 6. About Page — Points Section Update

**File:** `src/pages/Info.tsx`

Update the "How Points Work" section to reflect the new formula:
- 10 pts per ride
- +5 bonus for 3 days in a row
- Elevation bonuses
- Track variety bonuses  
- Speed bonuses
- Remove the "5 sessions in a week" bonus
- Remove Level Up section entirely

---

## Technical Details

### Files to create:
- None (all modifications to existing files)

### Files to modify:
1. `src/pages/Index.tsx` — Dialog-based registration form
2. `src/components/Navbar.tsx` — Updated nav links
3. `src/pages/Leaderboards.tsx` — Full rebuild with gender tables, tracks, pagination
4. `src/pages/Dashboard.tsx` — Remove levels
5. `src/lib/gamification.ts` — New points formula
6. `src/lib/leaderboardCache.ts` — Add gender, popular tracks cache
7. `src/components/LevelProgress.tsx` — Remove or repurpose (points progress without levels)
8. `src/pages/Info.tsx` — Updated points documentation
9. `supabase/functions/sync-leaderboard/index.ts` — Add gender to rider cache, popular tracks cache, updated points formula
10. `src/components/TopRiders.tsx` — May be removed (functionality moves into Leaderboards page)
11. `src/components/SchoolLeaderboard.tsx` — Remove (duplicate of header stats)
12. `src/components/StatsBar.tsx` — Modify to show hours as whole number

### Edge function changes:
- `sync-leaderboard`: Include `gender` per rider, add `popular_tracks` cache key, update points formula to match new structure

### Database:
- No schema changes needed — all data flows through existing `leaderboard_cache` table

