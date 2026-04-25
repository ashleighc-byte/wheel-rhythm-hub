create table if not exists public.game_rides (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  route_id         text        not null,
  route_name       text        not null,
  distance_km      numeric(8,3) not null default 0,
  avg_speed_kmh    numeric(6,1) not null default 0,
  avg_power_watts  integer      not null default 0,
  avg_cadence_rpm  integer      not null default 0,
  elevation_gain_m integer      not null default 0,
  duration_seconds integer      not null default 0,
  source           text         not null default 'game' check (source in ('game', 'simulator', 'wattbike')),
  completed_at     timestamptz  not null default now()
);

alter table public.game_rides enable row level security;

create policy "riders_insert_own" on public.game_rides
  for insert to authenticated with check (auth.uid() = user_id);

create policy "riders_select_own" on public.game_rides
  for select to authenticated using (auth.uid() = user_id);

create policy "admins_select_all" on public.game_rides
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read for the Game Rides leaderboard (no PII beyond user_id)
create policy "public_select_leaderboard" on public.game_rides
  for select to anon using (true);

create index if not exists game_rides_user_completed_idx on public.game_rides (user_id, completed_at desc);
create index if not exists game_rides_route_speed_idx    on public.game_rides (route_id, avg_speed_kmh desc);
create index if not exists game_rides_completed_idx      on public.game_rides (completed_at desc);