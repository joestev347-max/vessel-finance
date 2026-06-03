---
type: synthesis
created: 2026-06-02
updated: 2026-06-02
tags: [schema, prisma, reference]
source_count: 0
sources: []
---

# Data model

The Prisma schema (`prisma/schema.prisma`, SQLite) has seven models. All money is
[[concepts/money-as-cents|integer cents]]; all categorical fields are
[[concepts/sqlite-no-enums|strings backed by literal unions]].

## Models

- **Vessel** — the fleet unit. `name`/`imoNumber` unique; `type`, `status`, `dwt`, `yearBuilt`,
  `flag`, `owner`. Parent of voyages, budgets, expenses, revenues.
- **Account** — chart-of-accounts line. `code` unique; `category` (REVENUE | OPEX | CAPEX | OTHER).
- **Voyage** — a vessel's trip. Unique on `[vesselId, voyageNumber]`; origin/destination, dates,
  status, charterer, distance.
- **Budget** — budgeted amount per `[vesselId, accountId, fiscalYear, fiscalMonth]`. See
  [[concepts/budget-transfers]].
- **BudgetTransfer** — a move of money between two budget lines.
- **Expense** — a cost against a vessel/account (optionally a voyage); `status` PENDING→PAID.
- **Revenue** — recognized income against a vessel/account (optionally a voyage).

## Entry points (manual data entry, added 2026-06-02)

Every model is now enterable through the UI: Accounts, Vessels, Voyages, Budgets, Expenses,
Revenues — each with a create form and a zod-validated `POST` route that converts dollars to cents.
Start a clean fleet with `npm run db:empty`.

## Relationships

- Aggregated by [[concepts/profitability-and-tce]] and [[concepts/forecasting]].
- Conventions: [[concepts/money-as-cents]], [[concepts/sqlite-no-enums]].
