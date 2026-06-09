-- TugOS · App 24 · Phase 0 technical-spike foundation
-- pgTAP RLS isolation tests — run with: supabase test db
--
-- Gate 0 criterion: "RLS isolation tests green." Proves that a tenant scoped to
-- company A (via the app.company_id GUC, acting as the non-superuser tug_app
-- role) cannot READ, INSERT-as, UPDATE, or DELETE another tenant's rows, and
-- that an unset tenant context is deny-by-default.
--
-- The runner (pg_prove / supabase test db) wraps this file in a transaction and
-- rolls it back, so the seed data below never persists.

begin;
select plan(11);

-- ---------------------------------------------------------------------------
-- Seed as the superuser/owner (postgres bypasses RLS) BEFORE dropping to the
-- application role. Fixed UUIDs keep assertions deterministic.
-- ---------------------------------------------------------------------------
insert into public.tug_companies (id, name) values
    ('11111111-1111-1111-1111-111111111111', 'Company A Towing'),
    ('22222222-2222-2222-2222-222222222222', 'Company B Marine');

insert into public.tug_users (id, company_id, email, full_name, role) values
    ('1a000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a.admin@a.test', 'A Admin', 'fleet_admin'),
    ('2b000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b.admin@b.test', 'B Admin', 'fleet_admin');

insert into public.tug_vessels (id, company_id, name) values
    ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A Tug One'),
    ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'A Tug Two'),
    ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B Tug One');

insert into public.tug_clients (id, company_id, name) values
    ('ac000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A Client'),
    ('bc000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B Client');

insert into public.tug_crew (id, company_id, full_name) values
    ('ae000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A Deckhand'),
    ('be000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B Deckhand');

insert into public.tug_jobs (id, company_id, vessel_id, client_id, status) values
    ('a1000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'scheduled'),
    ('b2000000-0000-0000-0000-0000000000b1', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001', 'bc000000-0000-0000-0000-000000000001', 'scheduled');

-- ---------------------------------------------------------------------------
-- Become tenant A: non-superuser role + scoped company GUC (what the Express
-- middleware does per request on a tenant-scoped connection).
-- ---------------------------------------------------------------------------
set local role tug_app;
select set_config('app.company_id', '11111111-1111-1111-1111-111111111111', true);

-- 1–5: READ isolation — A sees only its own rows.
select is((select count(*) from public.tug_companies)::int, 1,
    'A sees exactly one company row (its own)');

select is((select id from public.tug_companies)::text, '11111111-1111-1111-1111-111111111111',
    'the visible company row is company A');

select is((select count(*) from public.tug_vessels)::int, 2,
    'A sees only its 2 vessels, not B''s');

select is((select count(*) from public.tug_clients)::int, 1,
    'A sees only its 1 client, not B''s');

select is((select count(*) from public.tug_jobs)::int, 1,
    'A sees only its 1 job, not B''s');

-- 6: cross-tenant UPDATE hits 0 rows (B's vessel is invisible under USING).
with u as (
    update public.tug_vessels set name = 'HIJACKED'
    where id = 'b2000000-0000-0000-0000-000000000001'
    returning 1
)
select is((select count(*) from u)::int, 0,
    'A cannot UPDATE company B''s vessel (0 rows affected)');

-- 7: cross-tenant DELETE hits 0 rows.
with d as (
    delete from public.tug_vessels
    where id = 'b2000000-0000-0000-0000-000000000001'
    returning 1
)
select is((select count(*) from d)::int, 0,
    'A cannot DELETE company B''s vessel (0 rows affected)');

-- 8: WITH CHECK blocks inserting a row stamped with company B (RLS violation,
-- SQLSTATE 42501). errmsg = NULL means "don't assert on the text".
select throws_ok(
    $$ insert into public.tug_vessels (company_id, name)
       values ('22222222-2222-2222-2222-222222222222', 'sneaky cross-tenant insert') $$,
    '42501', NULL,
    'A cannot INSERT a row stamped with company B (WITH CHECK denies it)');

-- 9: inserting under A's own company_id succeeds.
select lives_ok(
    $$ insert into public.tug_vessels (company_id, name)
       values ('11111111-1111-1111-1111-111111111111', 'A Tug Three') $$,
    'A can INSERT a vessel under its own company_id');

-- 10: cross-tenant FK is structurally blocked. As tenant A, attaching company
-- B's vessel to an A-owned job fails with a foreign-key violation (23503),
-- because the composite FK (company_id, vessel_id) has no (A, B-vessel) parent.
select throws_ok(
    $$ insert into public.tug_jobs (company_id, vessel_id, status)
       values ('11111111-1111-1111-1111-111111111111',
               'b2000000-0000-0000-0000-000000000001', 'scheduled') $$,
    '23503', NULL,
    'A cannot attach company B''s vessel to its own job (composite FK blocks it)');

-- 11: deny-by-default — with no tenant context, nothing is visible.
select set_config('app.company_id', '', true);
select is((select count(*) from public.tug_vessels)::int, 0,
    'unset tenant context sees zero rows (deny-by-default)');

select * from finish();
rollback;
