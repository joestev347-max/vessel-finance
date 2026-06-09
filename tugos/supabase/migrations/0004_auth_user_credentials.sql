-- TugOS · App 24 · Surface 2 (REST API) — auth support
-- Migration 0004 — user credentials + RLS-safe login lookup
--
-- Login is a bootstrapping problem: the caller presents email + password before
-- any tenant context exists, but tug_users is under per-tenant RLS. The fix is a
-- SECURITY DEFINER lookup owned by a role that bypasses RLS, returning only the
-- minimal claims + the bcrypt hash for the app to verify in-process. The app
-- NEVER sends the password to the database. search_path is pinned (advisor 0011)
-- and EXECUTE is granted only to the app role, not PUBLIC.
--
-- Note: email is unique per-company, not globally, so the lookup can return more
-- than one row if the same address exists in two companies. The API treats a
-- non-unique match as an ambiguous login (deny) rather than guessing — a global
-- login identity is a deliberate later decision.

begin;

alter table public.tug_users add column if not exists password_hash text;

create or replace function public.tug_auth_lookup(p_email text)
returns table (id uuid, company_id uuid, role text, password_hash text)
language sql
stable
security definer
set search_path = ''
as $$
  select id, company_id, role, password_hash
  from public.tug_users
  where email = p_email;
$$;

revoke all on function public.tug_auth_lookup(text) from public;
grant execute on function public.tug_auth_lookup(text) to tug_app;

commit;
