# Database schema

PostgreSQL via Prisma. Authoritative source: `prisma/schema.prisma`.

## ER overview

```
                ┌─────────┐                ┌─────────┐
                │ Vessel  │1—n  voyages   ┌│ Voyage  │
                ├─────────┤────────────────┤├─────────┤
                │ id      │                │ id      │
                │ name    │                │ vesselId│
                │ imoNum  │                │ origin  │
                │ type    │                │ dest    │
                │ flag    │                │ startDt │
                │ owner   │                │ endDt   │
                │ dwt     │                │ status  │
                │ status  │                └─────────┘
                └─┬───────┘                     │
                  │                             │
       n  budgets │   n expenses   n revenues   │ optional
                  ▼                             ▼
            ┌─────────┐    ┌─────────┐    ┌─────────┐
            │ Budget  │    │ Expense │    │ Revenue │
            ├─────────┤    ├─────────┤    ├─────────┤
            │ vesselId│    │ vesselId│    │ vesselId│
            │ accountId    │ accountId    │ accountId
            │ fiscalYr│    │ voyageId│?   │ voyageId│?
            │ fiscalMo│    │ vendor  │    │ source  │
            │ amount¢ │    │ amount¢ │    │ amount¢ │
            └────┬────┘    │ date    │    │ recogDt │
                 │         │ status  │    └─────────┘
                 ▼         └─────────┘
        ┌──────────────────┐
        │ BudgetTransfer   │
        │ fromBudgetId     │
        │ toBudgetId       │
        │ amount¢          │
        │ reason           │
        └──────────────────┘
                  ▲
                  │
            ┌─────────┐
            │ Account │  (Chart of accounts)
            ├─────────┤
            │ id      │
            │ code    │
            │ name    │
            │ category│  REVENUE / OPEX / CAPEX / OTHER
            │ subcat  │
            └─────────┘
```

## Field-level notes

### Vessel
- `imoNumber` — IMO ship identifier, globally unique by international convention.
- `dwt` — deadweight tonnage in metric tonnes.
- `status` — `ACTIVE | IN_DRYDOCK | LAID_UP | DECOMMISSIONED`.

### Account
- A chart-of-accounts entry, vessel-agnostic.
- `category` controls how the row is treated by the profitability engine:
  - `REVENUE`: sums into top line.
  - `OPEX`:    sums into gross-profit denominator.
  - `CAPEX`:   excluded from gross profit; deducted from net profit.
  - `OTHER`:   bank fees, FX adjustments, etc. Deducted from net profit.

### Voyage
- Optional FK target for expenses and revenues.
- Voyage-level profitability uses voyage-tagged rows + `OPEX` accounts with
  subcategory `"Voyage"` for TCE calculation.

### Budget
- One row per (vessel × account × year × month). Unique constraint enforces this.
- Stored in **USD cents** as `Int`.
- Indexed on `(vesselId, fiscalYear)` for fast yearly grid loads.

### BudgetTransfer
- Audit log + the actual atomic operation.
- Inserted **inside** the same `prisma.$transaction` that mutates the two budget
  rows — see `src/app/api/budgets/transfer/route.ts`.

### Expense / Revenue
- Standard ledger rows.
- `voyageId` is nullable so non-voyage costs (e.g. insurance premiums) don't
  pollute voyage P&L.
- Indexed on `(vesselId, date)` for the most common dashboard queries.

## Why integer cents?

A typical fleet has thousands of expense lines per month. Summing them as
`Float` accumulates rounding errors and breaks deterministic budget variance
calculations. Cents avoid this entirely and use less storage than `Decimal`.

## Migrations

Use Prisma migrations: `npm run db:migrate -- --name <description>`. The first
run creates `prisma/migrations/`. After each schema edit, generate a new
migration; never edit a previous one.

For ad-hoc prototyping, `npm run db:push` syncs without migration history.
