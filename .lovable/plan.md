

# Fix Book a Bike Page for Both Authenticated and Public Users

## Problem
The BookBike page always renders its own public-style header (with "SIGN IN" link) regardless of whether the user is logged in. When a signed-in student clicks "BOOK A BIKE" from the navbar, they lose the app navigation and see the public landing header instead.

## Solution

### File: `src/pages/BookBike.tsx`

1. **Import `useAuth`** and check for `session` / `loading` state
2. **Conditional header rendering:**
   - If authenticated → render `<Navbar />` (the standard app navigation bar)
   - If not authenticated → keep the existing public header with logo + "SIGN IN" link
3. **Pre-fill school** for authenticated users if their school is known (from the user's Airtable student record)
4. Add a loading state while auth is resolving to prevent flash of wrong header

### Schools Not Appearing

The `registration-count` edge function fetches schools from Airtable's "Student Registration" table. If no students are registered yet for a school, it won't appear. This is working as designed — schools only show once they have at least one registered student. No change needed here unless the list should include schools with zero registrations.

### No Route Change Needed

`/book` is already a public route (no wrapper in App.tsx), which is correct since unauthenticated users should also be able to book.

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/BookBike.tsx` | Import `useAuth`, conditionally render `Navbar` vs public header based on auth state |

