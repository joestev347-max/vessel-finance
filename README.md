# Vessel Finance

A maritime fleet financial management prototype: executive dashboards, expense tracking,
drag-and-drop budget transfers, per-vessel profitability, and revenue/expense forecasting.

Built with Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind +
@dnd-kit + Recharts.

> Status: **prototype**. Single-user, no auth, no role permissions, no receipt uploads.
> Designed to be a faithful end-to-end working scaffold — every page reads from a real
> database, every workflow round-trips through the API.

## Quickstart

```bash
# 1. Start Postgres (Postgres 16 in Docker, listening on host port 5433)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Apply the schema and seed sample data
npm run db:migrate -- --name init
npm run db:seed

# 4. Run the app
npm run dev
# open http://localhost:3000
```

If you don't have Docker, install Postgres locally and update `DATABASE_URL` in `.env`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in dev mode (port 3000). |
| `npm run build` / `npm run start` | Production build & serve. |
| `npm run db:migrate` | Run Prisma migrations against the dev DB. |
| `npm run db:push` | Push schema without a migration file (good for tinkering). |
| `npm run db:seed` | Reseed sample fleet, voyages, budgets, expenses. |
| `npm run db:reset` | Drop & recreate DB, run migrations, then seed. |
| `npm run db:studio` | Open Prisma Studio for a table-level view of the DB. |
| `npm run engines:test` | Run the profitability + forecasting engine self-tests. |

## What's in here

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Database schema (Vessel, Account, Voyage, Budget, BudgetTransfer, Expense, Revenue). |
| `prisma/seed.ts` | Deterministic sample fleet: 5 vessels, ~20 accounts, ~15 voyages, 12 months of budgets, 200+ expenses, 50+ revenues. |
| `src/lib/profitability.ts` | Revenue / OPEX / CAPEX / margin / TCE calculations. |
| `src/lib/forecasting.ts` | Three forecasting methods with confidence bands. |
| `src/lib/engines.test.ts` | Self-tests for both engines. |
| `src/app/api/**` | API route handlers — see `docs/api-endpoints.md`. |
| `src/app/(pages)/**` | Dashboard, vessels, expenses, budgets, forecasts pages. |
| `src/components/**` | UI primitives + feature components. |
| `docs/architecture.md` | High-level architecture & design rationale. |
| `docs/database-schema.md` | Schema overview with field-level notes. |
| `docs/api-endpoints.md` | API contract reference. |
| `docs/component-structure.md` | Frontend component tree. |
| `docs/wireframes.md` | ASCII wireframes of each page. |
| `docs/budget-transfer-workflow.md` | End-to-end transfer flow. |
| `docs/expense-tracking-workflow.md` | End-to-end expense flow. |

## Design influences

QuickBooks (entry forms + ledger), Power BI (dashboards + drill-downs), and maritime
fleet-management tooling (vessel-first navigation, voyage-aware accounting).

## Known limits / next steps

- **Auth.** Not implemented. Add NextAuth + role-based authorization before exposing.
- **Multi-currency.** Currency code is stored but not converted; assume USD.
- **Receipts.** Expense entries have no upload UI; add S3-presigned uploads.
- **Forecasting.** Three classic methods (avg, linear trend, seasonal) — no ML.
- **Tests.** Engine self-tests only. Add Vitest + Playwright before shipping.
