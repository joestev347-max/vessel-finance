-- TugOS · App 24 · Phase 0 foundation
-- Migration 0003 — pin function search_path (Supabase security advisor 0011,
-- "function_search_path_mutable").
--
-- A function without a fixed search_path resolves unqualified names against the
-- caller's search_path, which a lower-privileged role can manipulate to shadow
-- objects (privilege-escalation vector). This matters most for
-- tug_current_company_id, which is evaluated inside every RLS policy. Both
-- functions only call pg_catalog built-ins (now/nullif/current_setting), which
-- remain resolvable under an empty search_path, so pinning it is safe.

begin;

create or replace function public.tug_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create or replace function public.tug_current_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
    select nullif(current_setting('app.company_id', true), '')::uuid;
$$;

commit;
