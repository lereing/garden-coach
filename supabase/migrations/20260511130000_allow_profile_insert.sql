-- Allow authenticated users to insert their own profile row.
--
-- The handle_new_user() trigger creates a profile on auth.users insert,
-- so this is normally redundant. The auth callback uses it as a
-- defensive fallback in case the trigger ever fails or is removed.

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));
