-- TugOS · App 24 — shared rate-limit store
-- Migration 0007 — a serverless-correct rate-limit store (in-memory limiters are
-- useless across serverless invocations). Lives in the PRIVATE schema (not
-- exposed by PostgREST), so it adds no RLS advisor finding and isn't tenant data
-- — it's keyed by client IP. The app role gets DML; rows self-expire via the
-- expires_at window the store maintains.

begin;

create table if not exists private.tug_rate_limit (
  key         text primary key,
  hits        integer not null default 0,
  expires_at  timestamptz not null
);

grant select, insert, update, delete on private.tug_rate_limit to tug_app;

commit;
