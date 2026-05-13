-- Garden Coach — initial schema.
-- Profiles, plant catalog, user gardens, logs, and coach session memory.

-- ====================================================================
-- Helpers
-- ====================================================================

-- Auto-bumps updated_at on row UPDATE. Attached to profiles + preferences.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ====================================================================
-- profiles — 1:1 with auth.users
-- ====================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  address text,
  latitude numeric,
  longitude numeric,
  hardiness_zone text,
  last_frost_date date,
  first_frost_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row whenever an auth user signs up. SECURITY DEFINER
-- so it can write past RLS; search_path pinned to public for safety.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================================================
-- spaces — user growing surfaces
-- ====================================================================

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (
    type in ('raised_bed', 'in_ground', 'container', 'vertical')
  ),
  width_inches numeric not null,
  length_inches numeric not null,
  sunlight_hours numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index spaces_user_id_idx on public.spaces (user_id);

-- ====================================================================
-- preferences — 1:1 with profile
-- ====================================================================

create table public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  loves_eating text[],
  dislikes text[],
  already_have text[],
  goals text[],
  experience_level text check (
    experience_level in ('first_year', 'some_seasons', 'experienced')
  ),
  updated_at timestamptz not null default now()
);

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();

-- ====================================================================
-- plants — public, read-only catalog
-- ====================================================================

create table public.plants (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  type text not null check (
    type in (
      'leafy_green', 'fruiting', 'root', 'herb',
      'legume', 'allium', 'brassica', 'vine'
    )
  ),
  category text,
  days_to_maturity_min int,
  days_to_maturity_max int,
  sunlight_min_hours numeric,
  spacing_inches numeric,
  companion_plants text[],
  antagonist_plants text[],
  hardiness_zones text[],
  start_indoor_weeks_before_last_frost int,
  direct_sow_weeks_relative_to_last_frost int,
  notes text,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- plantings — what the user planted, when, where
-- ====================================================================

create table public.plantings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plant_id uuid not null references public.plants(id),
  space_id uuid references public.spaces(id) on delete set null,
  variety text,
  planted_date date not null,
  planting_method text check (
    planting_method in ('seed', 'seedling', 'transplant')
  ),
  position_x numeric,
  position_y numeric,
  status text not null default 'active' check (
    status in ('active', 'harvested', 'failed', 'removed')
  ),
  failure_reason text,
  notes text,
  created_at timestamptz not null default now()
);

create index plantings_user_id_idx on public.plantings (user_id);
create index plantings_plant_id_idx on public.plantings (plant_id);
create index plantings_space_id_idx on public.plantings (space_id);
-- Active-plantings lookup
create index plantings_user_status_idx on public.plantings (user_id, status);

-- ====================================================================
-- logs — timestamped events on plantings or spaces
-- ====================================================================

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  planting_id uuid references public.plantings(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  type text not null check (
    type in ('water', 'harvest', 'observation', 'pest', 'weather_event')
  ),
  logged_at timestamptz not null default now(),
  amount_oz numeric,
  notes text
);

create index logs_user_id_idx on public.logs (user_id);
create index logs_planting_id_idx on public.logs (planting_id);
create index logs_space_id_idx on public.logs (space_id);
-- Coach's recent-activity feed
create index logs_user_logged_at_idx on public.logs (user_id, logged_at desc);

-- ====================================================================
-- coach_sessions — persisted Q&A for cross-session memory
-- ====================================================================

create table public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  response text not null,
  tools_used text[],
  user_feedback text check (
    user_feedback in ('helpful', 'wrong', 'partial')
  ),
  created_at timestamptz not null default now()
);

create index coach_sessions_user_id_idx on public.coach_sessions (user_id);
