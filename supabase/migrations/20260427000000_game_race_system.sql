-- ─────────────────────────────────────────────────────────────────────────────
-- 20260427000000_game_race_system.sql
-- 1. student_points.airtable_student_id → nullable (game rides have no Airtable ID)
-- 2. game_rides.placement_points column
-- 3. game_race_rooms  (room lifecycle)
-- 4. game_race_results (per-racer finish data)
-- 5. award_game_ride_points() trigger → auto-grants points on game_rides INSERT
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Allow game-sourced point rows that have no Airtable student
alter table public.student_points
  alter column airtable_student_id drop not null;

-- 2. Placement bonus column on game_rides
alter table public.game_rides
  add column if not exists placement_points integer not null default 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Race rooms
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.game_race_rooms (
  id           uuid        primary key default gen_random_uuid(),
  room_code    text        not null unique,
  route_id     text        not null,
  route_name   text        not null,
  status       text        not null default 'waiting'
                check (status in ('waiting', 'countdown', 'racing', 'finished')),
  host_user_id uuid        references auth.users(id) on delete set null,
  player_count integer     not null default 1,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.game_race_rooms enable row level security;

create policy "race_rooms_select_auth" on public.game_race_rooms
  for select using (auth.role() = 'authenticated');

create policy "race_rooms_insert_own" on public.game_race_rooms
  for insert with check (auth.uid() = host_user_id);

create policy "race_rooms_update_host" on public.game_race_rooms
  for update using (auth.uid() = host_user_id);

create index if not exists idx_game_race_rooms_code    on public.game_race_rooms (room_code);
create index if not exists idx_game_race_rooms_created on public.game_race_rooms (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Race results
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.game_race_results (
  id                  uuid        primary key default gen_random_uuid(),
  room_code           text        not null,
  route_id            text        not null,
  route_name          text        not null,
  user_id             uuid        not null references auth.users(id) on delete cascade,
  lane                integer     not null default 1,
  finish_position     integer,
  finish_time_seconds integer,
  total_racers        integer     not null default 1,
  placement_points    integer     not null default 0,
  created_at          timestamptz not null default now()
);

alter table public.game_race_results enable row level security;

create policy "race_results_insert_own" on public.game_race_results
  for insert with check (auth.uid() = user_id);

create policy "race_results_select_auth" on public.game_race_results
  for select using (auth.role() = 'authenticated');

create index if not exists idx_game_race_results_room    on public.game_race_results (room_code);
create index if not exists idx_game_race_results_user    on public.game_race_results (user_id, created_at desc);
create index if not exists idx_game_race_results_route   on public.game_race_results (route_id, finish_time_seconds);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: award points whenever a game_ride row is inserted
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.award_game_ride_points()
returns trigger
language plpgsql
security definer
as $$
declare
  v_base          integer := 10;
  v_elev          integer := 0;
  v_speed         integer := 0;
  v_power         integer := 0;
  v_weekly        integer := 0;
  v_placement     integer := 0;
  v_bonus         integer;
  v_total         integer;
  v_email         text;
  v_week_sessions bigint;
begin
  -- Elevation bonus
  if    NEW.elevation_gain_m >= 300 then v_elev  := 10;
  elsif NEW.elevation_gain_m >= 150 then v_elev  := 5;
  elsif NEW.elevation_gain_m >=  50 then v_elev  := 2;
  end if;

  -- Speed bonus
  if    NEW.avg_speed_kmh >= 30 then v_speed := 10;
  elsif NEW.avg_speed_kmh >= 25 then v_speed := 5;
  elsif NEW.avg_speed_kmh >= 20 then v_speed := 2;
  end if;

  -- Power bonus
  if    NEW.avg_power_watts >= 200 then v_power := 10;
  elsif NEW.avg_power_watts >= 150 then v_power := 5;
  elsif NEW.avg_power_watts >= 100 then v_power := 2;
  end if;

  -- Weekly bonus: +5 if this is the user's 3rd+ ride this calendar week
  select count(*) into v_week_sessions
  from public.game_rides
  where user_id    = NEW.user_id
    and id        != NEW.id
    and completed_at >= date_trunc('week', NEW.completed_at);
  if v_week_sessions >= 2 then v_weekly := 5; end if;

  -- Placement bonus from multiplayer race
  v_placement := coalesce(NEW.placement_points, 0);

  v_bonus := v_elev + v_speed + v_power + v_weekly + v_placement;
  v_total := v_base + v_bonus;

  -- Insert points row (airtable_student_id is null for game-sourced rides)
  insert into public.student_points (
    user_id, airtable_student_id, session_date,
    base_points, bonus_points, total_points
  ) values (
    NEW.user_id, null, NEW.completed_at::date,
    v_base, v_bonus, v_total
  );

  -- Activity feed
  select email into v_email from auth.users where id = NEW.user_id;
  insert into public.activity_feed (
    rider_name, school_name, event_type, message, metadata
  ) values (
    coalesce(split_part(v_email, '@', 1), 'Rider'),
    '',
    'game_ride_complete',
    format(
      'Completed %s — %.2f km · %s pts',
      NEW.route_name, NEW.distance_km, v_total
    ),
    jsonb_build_object(
      'route_id',         NEW.route_id,
      'distance_km',      NEW.distance_km,
      'points_earned',    v_total,
      'placement_points', v_placement,
      'source',           NEW.source
    )
  );

  return NEW;
end;
$$;

-- Attach (or re-attach) the trigger
drop trigger if exists trg_award_game_ride_points on public.game_rides;
create trigger trg_award_game_ride_points
  after insert on public.game_rides
  for each row
  execute function public.award_game_ride_points();
