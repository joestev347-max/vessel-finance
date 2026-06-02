# Application architecture

## Stack

| Layer       | Technology                                    | Why |
| ---         | ---                                           | --- |
| Frontend    | Next.js 14 App Router + React 18 + TypeScript | Single-stack, server components for data-heavy pages, client components for interactive widgets. |
| Styling     | Tailwind CSS 3                                | Fast UI iteration. Custom palette for executive/maritime feel. |
| Charts      | Recharts                                      | Declarative SVG charts that play well with SSR + React server components. |
| DnD         | @dnd-kit                                      | Modern, accessible drag-and-drop. Used for budget transfers. |
| Backend     | Next.js Route Handlers                        | Co-located APIs avoid a separate service. |
| DB          | PostgreSQL 16                                 | Required for transactional budget transfers and aggregate queries. |
| ORM         | Prisma                                        | Type-safe schema-first DB layer. |
| Validation  | Zod                                           | Runtime validation of API request bodies and query strings. |

## High-level layout

```
                            ┌──────────────────────┐
   Browser  ───── HTTPS ───▶│   Next.js (App Rt)   │
                            │  ┌────────────────┐  │
                            │  │ Server Pages   │  │  reads → Prisma → Postgres
                            │  │ (RSC)          │  │
                            │  ├────────────────┤  │
                            │  │ Route Handlers │  │  reads/writes → Prisma → Postgres
                            │  │ /api/*         │  │
                            │  └────────────────┘  │
                            │  ┌────────────────┐  │
                            │  │ Client Cmpts   │  │  fetch('/api/...') for mutations
                            │  │ (DnD, forms,   │  │
                            │  │  forecasts)    │  │
                            │  └────────────────┘  │
                            └──────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  PostgreSQL    │
                              └────────────────┘
```

## Read path

Most pages are **React Server Components**: they execute on the server, call Prisma
directly, run the appropriate `compute*` function from `src/lib/`, and stream
HTML to the browser. There is **no separate API call from the client** for the
initial render — this keeps cold-load fast and makes pages indexable.

## Write path

User actions that mutate state (creating an expense, transferring a budget) post
JSON to a Route Handler under `/api/*`. The handler:

1. Validates the body with Zod.
2. Performs the write inside `prisma.$transaction(...)` if it requires atomicity
   (budget transfers always do; expense inserts don't).
3. Returns the updated row(s).
4. The client calls `router.refresh()` to re-render the server component with
   the new data.

## Calculation engines

Profitability and forecasting are **pure functions** in `src/lib/`. They take
already-loaded rows and account references, so they are unit-testable without
a database and reusable from any page or route. The Prisma-backed loaders
live inside the page or route that uses them, never inside the engine itself.

See `src/lib/profitability.ts`, `src/lib/forecasting.ts`.

## Money handling

All monetary amounts are stored as **integer USD cents** in the database
(`amountCents: Int`). The `src/lib/money.ts` helpers convert to/from dollars
at the boundary (form inputs in, formatted strings out). This eliminates a
class of floating-point bugs when summing hundreds of expense lines.

## Why not separate frontend/backend services?

For a prototype this size, Route Handlers + Prisma keep the deploy footprint
to a single Node process. If/when the read path grows beyond what server
components handle well (e.g. heavy aggregations across multi-million-row
fact tables), introduce a read-only OLAP layer behind `/api/dashboard/*` and
keep mutations on the OLTP path.

## What's intentionally absent

- **Auth.** No NextAuth, no roles. Add before exposing to multiple users.
- **Multi-currency conversion.** `currency` is stored but never converted.
- **Audit trail.** `BudgetTransfer` records who-did-what; no other writes do.
- **Background jobs.** Forecasts are computed on demand. Move to a queued job
  if cold-load latency suffers.
- **Caching.** No Redis / `unstable_cache`. The app is fast enough on seed data.

## File map

| Path                                    | Role |
| ---                                     | --- |
| `prisma/schema.prisma`                  | DB schema. |
| `prisma/seed.ts`                        | Deterministic sample data. |
| `src/lib/db.ts`                         | Singleton Prisma client. |
| `src/lib/money.ts`                      | Cents/dollars helpers. |
| `src/lib/utils.ts`                      | `cn`, month formatting. |
| `src/lib/profitability.ts`              | Pure profitability engine. |
| `src/lib/forecasting.ts`                | Pure forecasting engine. |
| `src/lib/engines.test.ts`               | Self-tests for the two engines. |
| `src/app/layout.tsx`                    | Root layout (sidebar + content). |
| `src/app/page.tsx`                      | Executive dashboard. |
| `src/app/vessels/`                      | Vessel list + detail. |
| `src/app/expenses/`                     | Expense list + new-expense form. |
| `src/app/budgets/`                      | Budget grid + DnD transfers. |
| `src/app/forecasts/`                    | Forecast page. |
| `src/app/api/`                          | Route handlers. |
| `src/components/`                       | UI primitives + feature components. |
