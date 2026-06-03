---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [domain, finance, ui]
source_count: 0
sources: []
---

# Budget transfers

A budget line is a budgeted amount for one vessel + account + fiscal month (the `Budget` model,
unique on `[vesselId, accountId, fiscalYear, fiscalMonth]`). The Budgets page lets you move money
between lines by **dragging one cell onto another**, recording a `BudgetTransfer`.

## How it works

- UI: `src/components/budgets/BudgetGrid.tsx` using `@dnd-kit` for drag-and-drop.
- API: `POST /api/budgets/transfer` debits the source line and credits the target, writing a
  `BudgetTransfer` row (from, to, amount, reason, by).
- Amounts are [[concepts/money-as-cents|integer cents]]; transfers never touch float dollars.
- New budget lines are created via `POST /api/budgets` (added 2026-06-02 for manual data entry).

## Relationships

- Part of the data model in [[synthesis/data-model]].
- Shares the money convention in [[concepts/money-as-cents]].
