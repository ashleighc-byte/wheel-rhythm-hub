# Lovable Integration Instructions — 3D Cycling Game

## What was already added (do NOT re-add these)

| File | Purpose |
|---|---|
| `src/components/ride/CyclingGame.tsx` | Full 3D cycling game (Three.js, BLE, Supabase multiplayer) |
| `src/pages/GamePage.tsx` | Page wrapper — saves ride to Supabase on completion |
| `src/data/gameRoutes.ts` | 12 NZ routes with theme, terrain, distance, elevation |
| `supabase/migrations/20260426000000_add_game_rides.sql` | New `game_rides` table with RLS policies |
| `src/App.tsx` | Route `/game/:routeId` added (protected, requires auth) |

---

## Step 1 — Run the Supabase migration

Prompt Lovable:

> Run the Supabase migration at `supabase/migrations/20260426000000_add_game_rides.sql` to create the `game_rides` table. Then regenerate `src/integrations/supabase/types.ts` so the new table has TypeScript types.

---

## Step 2 — Add "Play 3D Game" buttons to /ride

The existing `/ride` page (`src/pages/RidePage.tsx`) has a `RouteSelector` component. After a rider selects a route and optionally connects their bike, add a **"🎮 Play 3D Game"** button that navigates to `/game/:routeId`.

Prompt Lovable:

> In `src/pages/RidePage.tsx`, after a route is selected, add a prominent "🎮 Play 3D Game" button that navigates to `/game/${selectedRouteId}` using `useNavigate`. Map the existing route IDs from `src/data/routes.ts` to the game route IDs in `src/data/gameRoutes.ts` — the names match. Use the existing Button component and keep the existing ride flow intact.

---

## Step 3 — Wire up the existing Wattbike Bluetooth hook

The game has its own basic BLE connection but the project has a richer hook at `src/hooks/useWattbikeBluetooth.ts`. Replace the inline BLE code in CyclingGame with that hook.

Prompt Lovable:

> In `src/components/ride/CyclingGame.tsx`, replace the inline `connectBike()` and `handleBleData()` functions with the existing `useWattbikeBluetooth` hook from `src/hooks/useWattbikeBluetooth.ts`. Pass the live `speed`, `power`, `cadence`, `distance`, and `elevation` values from that hook into `metrics.current` inside the game loop. Keep simulation mode as the fallback when no device is connected.

---

## Step 4 — Show game ride data in the Leaderboards page

The `/leaderboards` page (`src/pages/Leaderboards.tsx`) currently shows points-based data. Add a "Game Rides" tab or section that queries the new `game_rides` table.

Prompt Lovable:

> In `src/pages/Leaderboards.tsx`, add a new "Game Rides" tab. Query `supabase.from('game_rides').select('*').order('avg_speed_kmh', { ascending: false }).limit(50)` and display a table with columns: Rider, Route, Distance (km), Avg Speed (km/h), Avg Power (W), Duration, Date. Group by route using the existing tab/filter pattern in the leaderboard.

---

## Step 5 — Award points for completing a game ride

When a game ride is saved, award `student_points` based on distance.

Prompt Lovable:

> In `src/pages/GamePage.tsx`, after successfully inserting to `game_rides`, also insert to `student_points`: set `base_points` to `Math.round(data.distance * 10)` (10 pts per km), `bonus_points` to `0`, `total_points` to `base_points`, `session_date` to today's date, and `airtable_student_id` to the user's email. This lets game rides feed into the main gamification leaderboard.

---

## Technical notes for Lovable

- **No Firebase** — multiplayer uses Supabase Realtime broadcast channels (already implemented in `CyclingGame.tsx`). Do not add Firebase.
- **Three.js version** — the project uses `three@0.183`. The GLTFLoader import path is `three/examples/jsm/loaders/GLTFLoader.js`.
- **Canvas performance** — the game loop updates `metrics.current` (a ref) every frame. React state (`hud`) is only synced every 100ms via `setInterval`. Do not move metric updates into `useState` — it will tank framerate.
- **Full-screen** — `GamePage` sets `document.body.style.overflow = 'hidden'` and restores it on unmount. The Navbar should not appear on `/game/*` routes.
- **Fallback** — if the `game_rides` Supabase insert fails (table not migrated yet), `GamePage` falls back to logging to `activity_feed`. Once the migration runs, this fallback can be removed.
- **Kenney 3D assets** — loaded from the public Kenney GitHub CDN. They may take a moment on first load; the game has primitive fallbacks (coloured boxes/cones) if any model fails.
