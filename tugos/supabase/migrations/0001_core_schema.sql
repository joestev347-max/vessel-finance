-- TugOS · App 24 · Phase 0 technical-spike foundation
-- Migration 0001 — core tug_ schema (tenant anchor + four MVP entities + users)
--
-- Scope: the four core entities named in the gameplan's Workstream B
-- (vessels, jobs, crew, clients) plus the tenant anchor (tug_companies) and the
-- auth/role mapping (tug_users) that make per-tenant RLS real. The remaining
-- blueprint tables (fuel_logs, maintenance, invoices, certs, tug_agent_runs)
-- are deferred to Phase 1+; this migration is the isolation-first foundation
-- "everything sits on" (build-order row 1).
--
-- Multi-tenancy model: the SaaS tenant is the tug OPERATOR COMPANY. Every row
-- carries company_id. Isolation is enforced in 0002_rls_policies.sql via a
-- session GUC (app.company_id) set per tenant-scoped transaction — see README.
--
-- Best-in-class hardening baked in here (prevent, don't patch later):
--   * COMPOSITE tenant FKs: FK validation bypasses RLS, so without this a tenant
--     could attach another tenant's vessel/client to its own job by guessing a
--     UUID. (company_id, child_id) -> (company_id, id) makes cross-tenant
--     references structurally impossible — the top technical risk in the
--     gameplan's register, closed at the schema layer.
--   * updated_at + trigger for change auditability (data-loss / audit-trail risk).
--   * CHECK constraints on every categorical column (no DB enums, per convention).

begin;

-- Supabase enables pgcrypto; gen_random_uuid() is core in PostgreSQL 13+.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared updated_at maintenance trigger
-- ---------------------------------------------------------------------------
create or replace function public.tug_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tenant anchor
-- ---------------------------------------------------------------------------
create table if not exists public.tug_companies (
    id          uuid primary key default gen_random_uuid(),
    name        text not null check (length(btrim(name)) > 0),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users / role mapping. Roles mirror the v2 blueprint's seven surface roles.
-- ---------------------------------------------------------------------------
create table if not exists public.tug_users (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references public.tug_companies(id) on delete cascade,
    email       text not null check (position('@' in email) > 1),
    full_name   text,
    role        text not null check (role in (
                    'fleet_admin', 'port_captain', 'dispatcher',
                    'captain', 'crew', 'billing', 'client'
                )),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (company_id, email)
);

-- ---------------------------------------------------------------------------
-- Vessels.  unique (company_id, id) is the target for composite tenant FKs.
-- ---------------------------------------------------------------------------
create table if not exists public.tug_vessels (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references public.tug_companies(id) on delete cascade,
    name             text not null check (length(btrim(name)) > 0),
    official_number  text,
    status           text not null default 'active'
                         check (status in ('active', 'maintenance', 'laid_up', 'retired')),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    unique (company_id, id)
);

-- ---------------------------------------------------------------------------
-- Clients (the operator's customers).  unique (company_id, id) for composite FK.
-- ---------------------------------------------------------------------------
create table if not exists public.tug_clients (
    id             uuid primary key default gen_random_uuid(),
    company_id     uuid not null references public.tug_companies(id) on delete cascade,
    name           text not null check (length(btrim(name)) > 0),
    billing_email  text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (company_id, id)
);

-- ---------------------------------------------------------------------------
-- Crew
-- ---------------------------------------------------------------------------
create table if not exists public.tug_crew (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references public.tug_companies(id) on delete cascade,
    full_name   text not null check (length(btrim(full_name)) > 0),
    rank        text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Jobs (the dispatch unit).  Composite FKs guarantee the referenced vessel and
-- client belong to the SAME company as the job (MATCH SIMPLE: when the child id
-- is NULL the FK is skipped; company_id is NOT NULL so it is always enforced
-- when an id is present).  Default ON DELETE NO ACTION: a vessel/client with
-- live jobs cannot be hard-deleted (retire it via status instead) — the check
-- defers to statement end, so deleting a whole company still cascades cleanly.
-- ---------------------------------------------------------------------------
create table if not exists public.tug_jobs (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references public.tug_companies(id) on delete cascade,
    vessel_id     uuid,
    client_id     uuid,
    status        text not null default 'scheduled'
                      check (status in ('scheduled', 'en_route', 'on_scene', 'complete', 'cleared', 'cancelled')),
    scheduled_at  timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    foreign key (company_id, vessel_id) references public.tug_vessels (company_id, id),
    foreign key (company_id, client_id) references public.tug_clients (company_id, id)
);

-- ---------------------------------------------------------------------------
-- Indexes: every read is tenant-filtered; dispatch board filters by status.
-- ---------------------------------------------------------------------------
create index if not exists idx_tug_users_company    on public.tug_users  (company_id);
create index if not exists idx_tug_vessels_company   on public.tug_vessels(company_id, status);
create index if not exists idx_tug_clients_company   on public.tug_clients(company_id);
create index if not exists idx_tug_crew_company      on public.tug_crew   (company_id);
create index if not exists idx_tug_jobs_company      on public.tug_jobs   (company_id, status);
create index if not exists idx_tug_jobs_vessel       on public.tug_jobs   (company_id, vessel_id);
create index if not exists idx_tug_jobs_client       on public.tug_jobs   (company_id, client_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger trg_tug_companies_updated before update on public.tug_companies
    for each row execute function public.tug_set_updated_at();
create trigger trg_tug_users_updated before update on public.tug_users
    for each row execute function public.tug_set_updated_at();
create trigger trg_tug_vessels_updated before update on public.tug_vessels
    for each row execute function public.tug_set_updated_at();
create trigger trg_tug_clients_updated before update on public.tug_clients
    for each row execute function public.tug_set_updated_at();
create trigger trg_tug_crew_updated before update on public.tug_crew
    for each row execute function public.tug_set_updated_at();
create trigger trg_tug_jobs_updated before update on public.tug_jobs
    for each row execute function public.tug_set_updated_at();

commit;
