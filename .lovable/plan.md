

# Gamification & Points System — Implementation Plan

## How it works

Your Airtable AI agent extracts distance, duration, speed, and elevation from MyWhoosh screenshots and writes them as a JSON blob into a **"Session Data Table"** field on each Session Reflection record. It also calculates and writes a **"Points Earned"** value. The website's job is to **read and display** this data — not calculate it.

---

## What you need to set up in Airtable first

Before I build anything, these fields must exist:

**Session Reflections table:**
- `Session Data Table` — already exists (your agent writes JSON here with `distance_km`, `duration_hh_mm_ss`, plus speed/elevation)
- `Points Earned` — Number field. Your agent calculates and writes this.

**Student Registration table:**
- `Total Points` — Rollup field that sums `Points Earned` from linked Session Reflections
- (Optional) `Level` — Formula field based on Total Points thresholds, or I calculate client-side

---

## What I will build

### 1. Make mood ratings optional, screenshot mandatory
**File:** `src/components/SessionFeedbackForm.tsx`
- Remove the `preRating === 0 || postRating === 0` validation check
- Add validation requiring a screenshot upload before submission
- Update star rating labels to remove the asterisk (*)

### 2. Parse session data JSON on the dashboard
**File:** `src/pages/Dashboard.tsx`
- Read `Session Data Table` field from each Session Reflection record
- Parse the JSON to extract `distance_km`, `duration_hh_mm_ss`, speed, elevation
- Read `Points Earned` per session and `Total Points` from Student Registration
- Add a **Total Points** stat card to the stats grid
- Add **Speed** and **Elevation** columns to the recent sessions table
- Show points earned per session in the table

### 3. Build a Level Progress component
**New file:** `src/components/LevelProgress.tsx`
- Cycling-themed XP bar showing current level and progress to next
- Levels: Kickstand (0), Pedal Pusher (50), Chain Breaker (150), Hill Climber (300), Sprint King/Queen (500), Tour Legend (800)
- Displayed on dashboard below the stats grid

### 4. Add a Points leaderboard tab
**Files:** `src/pages/Leaderboards.tsx`, `src/components/TopRiders.tsx`
- Add tabs to toggle between "Time" and "Points" rankings
- Points tab reads `Total Points` from Student Registration and ranks accordingly
- Show level badge/name next to each rider

### 5. Enhanced ride success screen
**File:** `src/components/SessionFeedbackForm.tsx`
- After successful submission, show a summary card with:
  - "Points will appear once your screenshot is processed"
  - Current level progress (reads from Student Registration)

---

## Points formula for your Airtable agent

Here's what I'd suggest your agent uses to calculate `Points Earned` per session:

```text
Base log:           10 pts
Screenshot:          5 pts (always true since mandatory)
Distance:            1 pt per km
Duration:            1 pt per 5 mins
Elevation:           2 pts per 100m
Speed bonus:         5 pts if avg > 25 km/h, 10 pts if > 30 km/h
```

You can adjust these however you like — the website just reads the final number.

---

## Files changed

```text
src/components/SessionFeedbackForm.tsx  — Mood optional, screenshot required, success card
src/pages/Dashboard.tsx                 — Points stat, session data parsing, new columns
src/components/LevelProgress.tsx        — New: XP progress bar component
src/pages/Leaderboards.tsx              — Tabs for Time vs Points
src/components/TopRiders.tsx            — Support points-based ranking mode
```

No database migrations needed. No edge function changes needed — `Session Data Table` and `Points Earned` are standard Airtable fields read through the existing proxy.

