# TugOS API — Surface 2 (REST)

Express + TypeScript REST API on the dedicated Supabase project. This is the
contract every other surface (dispatch UI, mobile app, agents) builds against.
First slice: auth + the tenant-scoping data layer + the vessels resource.

## How tenancy is enforced (the important part)

The API connects to Postgres as **`tug_api`**, a login role that **does not
bypass RLS** and inherits `tug_app`'s table privileges. Every tenant request runs
inside one transaction that first does `set_config('app.company_id', <id>, true)`
— transaction-local — which is exactly what the RLS policies read. So even if a
handler forgot a `WHERE company_id = …`, the database physically cannot return
another tenant's rows. See `src/db.ts` (`tenantTransaction` / `withTenant`).

Login is the one pre-tenant path: it calls the `SECURITY DEFINER`
`tug_auth_lookup(email)` function (RLS-safe) over a non-tenant connection, then
verifies the bcrypt hash in-process and issues a 15-minute JWT.

## Endpoints

- `GET /health` — liveness.
- `POST /auth/login` — `{ email, password }` → `{ token, role }`.
- `GET /vessels` — list the caller's fleet (any authenticated role).
- `POST /vessels` — create a vessel (`fleet_admin` or `port_captain`).

Send the token as `Authorization: Bearer <token>`.

## Run it

```
cp .env.example .env      # then fill DATABASE_URL (tug_api) + JWT_SECRET
npm install
npm run dev               # http://localhost:3001
```

`DATABASE_URL` must use the `tug_api` role (not `postgres`/service — those bypass
RLS). Get the host from Supabase → Project Settings → Database, set user
`tug_api` and its password, and keep `sslmode=require`.

## Verify

```
npm run typecheck         # tsc --noEmit
npm test                  # unit tests: auth, tenant-tx contract, login logic
```

The unit tests do not need a database. End-to-end HTTP against the live project
needs `.env` filled in.

## Not yet wired (next increments)

User provisioning endpoint (create users + set password within a company),
refresh-token grace for the offline mobile path, the remaining resources
(jobs/clients/crew), and request logging.
