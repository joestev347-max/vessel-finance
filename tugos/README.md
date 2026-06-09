# TugOS — Phase 0 Foundation (App 24)

This folder is the **start of the TugOS build**: the isolation-first database
foundation that the gameplan and architecture blueprint both put first. It is
deliberately **separate from the Vessel Finance prototype** (Next.js + Prisma +
SQLite). Nothing here touches that app. Per `CLAUDE.md`, Vessel Finance is *not*
being migrated — TugOS is a new build on the OSL target stack.

## Why this is the optimal place to start

Both operative v2 documents converge on the same first move:

- **Gameplan, build-order table (row 1):** *"Genetic template deploy + dedicated
  Supabase project + core `tug_` schema — everything sits on it; isolation
  decisions are cheap now, expensive later."* (Phase 0–1)
- **Gameplan, Phase 0 Workstream B (first bullet):** *"Deploy the genetic
  template into a dedicated Supabase project; stand up core `tug_` schema
  (vessels, jobs, crew, clients) with per-tenant RLS and write the first RLS
  isolation tests the same week."*
- **Architecture Blueprint v2:** the one deliberate deviation from the OSL
  genetic template is **database isolation** — a dedicated Supabase project with
  per-tenant RLS — required for the SOC 2 and port-authority security reviews.

Tenant isolation is the cheapest decision to make now and the most expensive to
retrofit, it is the contract every later surface (API, dispatch board, mobile,
agents) builds on, and **Gate 0 requires "RLS isolation tests green."** So the
foundation is the schema + RLS + isolation tests — built here.

## What's in this increment

```
tugos/
  supabase/
    migrations/
      0001_core_schema.sql     core tug_ tables + tenant key + indexes
      0002_rls_policies.sql    tug_app role, tenant resolver, RLS on every table
    tests/
      0001_rls_isolation_test.sql   pgTAP cross-tenant isolation proof (Gate 0)
  README.md
```

**Tables (6):** `tug_companies` (tenant anchor), `tug_users` (role mapping —
the blueprint's seven roles), `tug_vessels`, `tug_clients`, `tug_crew`,
`tug_jobs`. The other blueprint tables (`fuel_logs`, `maintenance`, `invoices`,
`certs`, `tug_agent_runs`) are intentionally **deferred to Phase 1+**; this
increment is the foundation, not the full schema.

## Tenancy model (how isolation works)

The SaaS tenant is the **tug operator company**. Every row carries `company_id`.
The blueprint specifies *Express + direct SQL over tenant-scoped connections*
(not PostgREST/supabase-js), so isolation is keyed on a **session GUC** rather
than a PostgREST JWT claim:

1. The app connects as the non-superuser role **`tug_app`** (no `BYPASSRLS`).
2. At the start of each request transaction, the Express middleware sets the
   tenant from the caller's verified JWT:
   `set local app.company_id = '<company-uuid>';`
3. RLS policies compare `company_id` to `tug_current_company_id()`, which reads
   that GUC. An unset GUC matches nothing → **deny-by-default**.

The migration/service role (`postgres`) and the Supabase `service_role` bypass
RLS by design and must **never** carry tenant request traffic.

## Provisioning (needs your Supabase account — your step)

This foundation is authored and SQL-validated but **not yet applied to a live
database**, because the dedicated Supabase project is yours to create. To stand
it up:

1. Create a **dedicated** Supabase project for TugOS (not a shared instance).
2. Install the Supabase CLI and link it: `supabase link --project-ref <ref>`.
3. Apply migrations: `supabase db push` (or run the two files in
   `supabase/migrations/` in order).
4. Run the isolation tests: `supabase test db` — expect **10 passing** pgTAP
   assertions.
5. Point the Express layer at the project via a `tug_app`-privileged
   connection string and set `app.company_id` per transaction.

> Tell me when the project exists (or share access) and I'll run the migrations
> and the test suite against it to turn Gate 0's "RLS isolation tests green"
> from authored to **executed-and-passing**.

## Verification status (honest)

- ✅ All SQL parses against the real PostgreSQL grammar (libpg_query via
  `pglast`), 0 syntax failures.
- ✅ RLS logic traced by hand for read/insert/update/delete cross-tenant denial
  and deny-by-default.
- ⛔ **Not yet executed against a live Postgres/Supabase** — that needs the
  dedicated project above. The pgTAP suite is the executable proof, ready to run.

## What comes next in the build order (after Gate 0 foundation)

Surface 2 (Express REST API) + roles/auth → Surface 1 (dispatch board UI with
Supabase Realtime, **not** WebSockets on Vercel) → mobile offline job log. The
remaining Phase 0 spike items — Realtime job-board proof, Expo offline-queue
prototype, two-vendor AIS adapter, CI license gate — slot in alongside this.
