-- Track onboarding completion on the profile. Set when the user
-- finishes step 3 (preferences). Used by middleware to redirect
-- authenticated-but-incomplete users back to /onboarding.

alter table public.profiles
  add column onboarding_completed_at timestamptz;
