-- Cache of USDA 2023 hardiness zones keyed by US ZIP code.
--
-- Populated lazily by the application: on first lookup of a ZIP, we
-- fetch the authoritative value from phzmapi.org (which serves the
-- USDA 2023 PHZM per-ZIP dataset from S3) and write it here. Future
-- lookups for the same ZIP are local.
--
-- Service role writes; everyone reads. The data is public.

create table public.zip_zones (
  zipcode text primary key,
  zone text not null,
  temperature_range text,
  source text not null default 'phzmapi.org',
  fetched_at timestamptz not null default now()
);

alter table public.zip_zones enable row level security;

create policy "ZIP zones are publicly readable"
  on public.zip_zones for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies: service role bypasses RLS to
-- populate the cache, no end-user write path.
