-- Garden Coach — Row Level Security.
-- Every user-owned table: own rows only. Plants: public read-only.
--
-- (select auth.uid()) wrapping caches the call per-statement; per the
-- Supabase performance guide this is meaningfully faster than bare
-- auth.uid() inside policies that get evaluated against many rows.

-- ====================================================================
-- profiles
-- ====================================================================

alter table public.profiles enable row level security;

create policy "Users select own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- INSERT is performed by handle_new_user() (SECURITY DEFINER), so no
-- user-facing insert policy is required.

-- ====================================================================
-- preferences
-- ====================================================================

alter table public.preferences enable row level security;

create policy "Users manage own preferences"
  on public.preferences for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ====================================================================
-- spaces
-- ====================================================================

alter table public.spaces enable row level security;

create policy "Users manage own spaces"
  on public.spaces for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ====================================================================
-- plantings
-- ====================================================================

alter table public.plantings enable row level security;

create policy "Users manage own plantings"
  on public.plantings for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ====================================================================
-- logs
-- ====================================================================

alter table public.logs enable row level security;

create policy "Users manage own logs"
  on public.logs for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ====================================================================
-- coach_sessions
-- ====================================================================

alter table public.coach_sessions enable row level security;

create policy "Users manage own coach sessions"
  on public.coach_sessions for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ====================================================================
-- plants — public read, no user writes
-- ====================================================================

alter table public.plants enable row level security;

create policy "Plants are publicly readable"
  on public.plants for select
  to anon, authenticated
  using (true);

-- No write policies. The service role bypasses RLS entirely, so the
-- catalog seed can populate it server-side via supabase/seed.sql.
