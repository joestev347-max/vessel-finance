-- TugOS · App 24 · Surface 2 — security fix (advisors 0028/0029)
-- Move the SECURITY DEFINER login lookup OUT of the PostgREST-exposed public
-- schema. In public, PostgREST publishes it at /rest/v1/rpc/tug_auth_lookup and
-- anon/authenticated could call it — and it returns password hashes. A private
-- schema is not exposed by PostgREST and has no PUBLIC usage, so only the app
-- role (tug_app/tug_api) can reach it, over a direct SQL connection.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to tug_app;

drop function if exists public.tug_auth_lookup(text);

create or replace function private.tug_auth_lookup(p_email text)
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

revoke all on function private.tug_auth_lookup(text) from public;
grant execute on function private.tug_auth_lookup(text) to tug_app;

commit;
