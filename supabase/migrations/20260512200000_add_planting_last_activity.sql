-- Track the most recent activity (log, status change) on a planting.
-- Used by the home logging screen to sort cards: needs-attention
-- first, then most-recent activity. The application updates this
-- column directly on every log insert / planting status change.

alter table public.plantings
  add column last_activity_at timestamptz not null default now();

-- Backfill so existing rows reflect when they were created, not when
-- this migration ran. No-op when the table is empty.
update public.plantings
   set last_activity_at = created_at;

create index plantings_user_last_activity_idx
  on public.plantings (user_id, last_activity_at desc);
