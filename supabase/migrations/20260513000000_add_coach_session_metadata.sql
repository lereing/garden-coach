-- Persist the trust-surface metadata (confidence, citations, follow-ups,
-- action prompts, restatement flag) emitted by the coach at the end of
-- every response. Reconstructing it from the response text on every
-- history reload is expensive and fragile; we just store it.

alter table public.coach_sessions
  add column metadata jsonb;
