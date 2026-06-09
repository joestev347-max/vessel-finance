-- TugOS · App 24 · Phase 0 technical-spike foundation
-- Migration 0002 — per-tenant Row Level Security
--
-- The v2 blueprint's one deliberate deviation from the OSL genetic template is
-- database isolation: a dedicated Supabase project with per-tenant RLS, for the
-- SOC 2 / port-authority security story. This migration is that isolation,
-- enforced at the database layer so a bug in the API cannot leak across tenants.
--
-- Tenancy signal: the app connects on a tenant-scoped connection as the
-- non-superuser role `tug_app` and sets the GUC `app.company_id` (from the
-- caller's verified JWT) at the start of each transaction:
--     set local app.company_id = '<company-uuid>';
-- RLS reads that GUC. No dependency on Supabase Auth / PostgREST claims, which
-- matches the blueprint's "Express + direct SQL via tenant-scoped connections".
-- The service/migration role (postgres) and Supabase service_role bypass RLS by
-- design and must NEVER be used for tenant request traffic.

begin;

-- ---------------------------------------------------------------------------
-- Application role: holds data DML, NOT superuser, does NOT bypass RLS.
-- ---------------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'tug_app') then
        create role tug_app nologin;
    end if;
end
$$;

grant usage on schema public to tug_app;
grant select, insert, update, delete on all tables in schema public to tug_app;
alter default privileges in schema public
    grant select, insert, update, delete on tables to tug_app;

-- Defense in depth: ensure NO other role can reach tenant data directly. Strip
-- table privileges from PUBLIC and, where they exist (Supabase), from the anon
-- and authenticated roles, so tenant traffic must go through tug_app + RLS.
revoke all on all tables in schema public from public;
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        execute 'revoke all on all tables in schema public from anon';
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'revoke all on all tables in schema public from authenticated';
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Current-tenant resolver. STABLE, reads only the session GUC -> no table
-- read, so no RLS recursion. Returns NULL when unset (an unset GUC matches no
-- company_id, i.e. deny-by-default).
-- ---------------------------------------------------------------------------
create or replace function public.tug_current_company_id()
returns uuid
language sql
stable
as $$
    select nullif(current_setting('app.company_id', true), '')::uuid;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS + tenant-isolation policy on every tug_ table.
-- One FOR ALL policy covers SELECT/INSERT/UPDATE/DELETE: USING gates which
-- rows are visible/updatable/deletable; WITH CHECK gates inserted/updated
-- rows so a tenant cannot write a row stamped with another company_id.
-- ---------------------------------------------------------------------------

-- tug_companies: a tenant sees only its own company row.
alter table public.tug_companies enable row level security;
drop policy if exists tenant_isolation on public.tug_companies;
create policy tenant_isolation on public.tug_companies
    for all
    using      (id = public.tug_current_company_id())
    with check (id = public.tug_current_company_id());

-- tug_users
alter table public.tug_users enable row level security;
drop policy if exists tenant_isolation on public.tug_users;
create policy tenant_isolation on public.tug_users
    for all
    using      (company_id = public.tug_current_company_id())
    with check (company_id = public.tug_current_company_id());

-- tug_vessels
alter table public.tug_vessels enable row level security;
drop policy if exists tenant_isolation on public.tug_vessels;
create policy tenant_isolation on public.tug_vessels
    for all
    using      (company_id = public.tug_current_company_id())
    with check (company_id = public.tug_current_company_id());

-- tug_clients
alter table public.tug_clients enable row level security;
drop policy if exists tenant_isolation on public.tug_clients;
create policy tenant_isolation on public.tug_clients
    for all
    using      (company_id = public.tug_current_company_id())
    with check (company_id = public.tug_current_company_id());

-- tug_crew
alter table public.tug_crew enable row level security;
drop policy if exists tenant_isolation on public.tug_crew;
create policy tenant_isolation on public.tug_crew
    for all
    using      (company_id = public.tug_current_company_id())
    with check (company_id = public.tug_current_company_id());

-- tug_jobs
alter table public.tug_jobs enable row level security;
drop policy if exists tenant_isolation on public.tug_jobs;
create policy tenant_isolation on public.tug_jobs
    for all
    using      (company_id = public.tug_current_company_id())
    with check (company_id = public.tug_current_company_id());

-- ---------------------------------------------------------------------------
-- FORCE RLS so the policy applies even to the table OWNER, not just other
-- roles. Without this, a connection that happens to run as the owner would
-- silently see all tenants' rows. (Superuser / BYPASSRLS roles still bypass by
-- design — those are migration/service only, never tenant request traffic.)
-- ---------------------------------------------------------------------------
alter table public.tug_companies force row level security;
alter table public.tug_users     force row level security;
alter table public.tug_vessels   force row level security;
alter table public.tug_clients   force row level security;
alter table public.tug_crew      force row level security;
alter table public.tug_jobs      force row level security;

commit;
