

## Fixes Identified from Canva Whiteboard Post-It Notes

### Checklist of Issues

1. **Remove Google Sign Up from Registration Form** — The post-it says "Remove Sign Up with Google, we don't want them in their accounts before they receive their bracelets." Currently the form has a Google OAuth sign-up button at the bottom. Remove it entirely. Students will sign in with Google later (via the Sign In page) once they have their bracelets.

2. **Dashboard School Rank Bug** — Post-it says "Currently showing #1. This is an Airtable bug and needs to be fixed." The school rank calculation may be incorrect after the Airtable base migration. This likely relates to the `NFC Status` field values or the school name resolution in the new base. Will investigate and fix the rank computation logic.

3. **Dashboard Date Format** — Post-it says "Change date format so it shows Day before month." The chart X-axis currently shows `MM-DD` format (e.g., `02-23`). Change to day-first format (e.g., `23/02` or `23 Feb`).

4. **Leaderboard Showing School-Only Leaders** — Post-it says "Currently only showing school leaders so will change to ALL schools." The Top Riders tables currently filter to the user's school only. Add an "All Schools" / league-wide view showing top riders across ALL schools (with names from other schools hidden for privacy per existing design).

5. **Book a Bike Calendar Not Showing** — The calendar/date picker on `/book` appears to work but may not be loading schools correctly from the new Airtable base. Testing confirms the `registration-count` endpoint returns data fine (Sport Waikato: 14 taken, St Andrew's: 1 taken). The issue may be a UI rendering problem — will investigate the calendar popover.

### Technical Plan

**File: `src/components/StudentRegistrationForm.tsx`**
- Remove the Google OAuth sign-up button and the "or" divider (lines 456-494)

**File: `src/pages/Dashboard.tsx`**
- Fix chart X-axis date format from `MM-DD` to `DD/MM` (line 578: change `.slice(5)` to a day-first format)
- Investigate school rank calculation — ensure it correctly handles the new Airtable base's school field format

**File: `src/pages/Leaderboards.tsx`**
- Add an "All Schools" rider table showing league-wide top riders (names from other schools masked for privacy)
- Keep school-specific tables as well but add the all-schools view

**File: `src/pages/BookBike.tsx`**
- Debug the calendar not appearing — check if it's a rendering/state issue or data loading problem

