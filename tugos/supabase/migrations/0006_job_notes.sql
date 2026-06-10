-- TugOS · App 24 · Surface 1/2 — jobs gain free-text notes
-- Migration 0006 — add a nullable notes column to tug_jobs. scheduled_at already
-- exists (0001). Notes carry dispatcher instructions / boatside remarks; they are
-- tenant-scoped by the existing RLS policy (no policy change needed).

begin;
alter table public.tug_jobs add column if not exists notes text;
commit;
