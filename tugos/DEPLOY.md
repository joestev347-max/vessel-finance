# Deploying TugOS to Vercel (single-origin, auto-deploy)

The whole app deploys as **one Vercel project**: the Express API serves both the
REST routes and the built React SPA, so it's a single origin (the httpOnly
session cookie stays first-party — no CORS/CSRF complexity). Importing the GitHub
repo gives **auto-deploy on every push**.

## One-time import (Vercel dashboard)

1. vercel.com → **Add New… → Project** → import `joestev347-max/vessel-finance`.
2. **Root Directory:** `tugos/api`  ← important (so the API package installs cleanly).
3. **Framework Preset:** Other. Build/output come from `tugos/api/vercel.json`
   (it builds the web app and copies it to `public/`, and runs the Express app
   as a serverless function with all paths rewritten to it).
4. Add the **Environment Variables** below, then **Deploy**.

After this, every push to `master` redeploys automatically.

## Environment variables (Production)

| Name | Value |
|---|---|
| `DATABASE_URL` | The Supabase **pooler** connection string with the `tug_api` role (see below). Serverless must use the pooler, not the direct connection. |
| `JWT_SECRET` | A long random string (e.g. generate one; keep it secret). |
| `PGSSL_NO_VERIFY` | `1` (connect to the pooler over TLS without local CA verification). |

`NODE_ENV=production` is set by Vercel automatically (this also makes the session
cookie `Secure`). `CORS_ORIGINS` is not needed (single origin). `LOGIN_RATE_MAX`
defaults to 10.

### Getting the pooler DATABASE_URL

In Supabase → **Connect** → **Transaction pooler**, copy the URI. It looks like:

```
postgresql://postgres.naxqxajzlmisqdnfvhzm:<password>@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

Swap the role to **tug_api** (username becomes `tug_api.naxqxajzlmisqdnfvhzm`) and
use tug_api's password, and append `?sslmode=require`:

```
postgresql://tug_api.naxqxajzlmisqdnfvhzm:<tug_api password>@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

(Confirm the exact pooler host/port shown in your dashboard — region/format can differ.)

## After deploy — create your login

The schema has no users until you make one. From the SQL editor (or once an admin
exists, via the in-app Fleet → Users):

```sql
insert into public.tug_companies (id, name) values (gen_random_uuid(), 'Your Company') returning id;
-- then, with that company id:
insert into public.tug_users (company_id, email, full_name, role, password_hash)
values ('<company-id>', 'you@company.com', 'You', 'fleet_admin', crypt('<your password>', gen_salt('bf', 12)));
```

Then open the Vercel URL and sign in.

> First deploy may need 1–2 config tweaks (serverless TS bundling / pooler string);
> share the build log and I'll adjust `vercel.json`.
