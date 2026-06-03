---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [convention, money, repo]
source_count: 0
sources: []
---

# Money as integer cents

**Every monetary value is stored as USD cents in an `Int` column — never as floating-point
dollars.** This avoids rounding drift when summing thousands of expenses, budgets, and revenues.

## How it works

- DB columns: `amountCents`, etc. (`Int`). See [[synthesis/data-model]].
- Conversion happens only at the edges, via `src/lib/money.ts`:
  - `dollarsToCents(d)` → `Math.round(d * 100)` (used in every create API route).
  - `formatUSD(cents)` / `formatUSDCompact(cents)` for display.
- Forms collect dollars (`amountUsd`); the API converts to cents before persisting.

## Why it matters

Floating-point dollars accumulate rounding errors when aggregated. Integer cents are exact. This is
a hard rule in `CLAUDE.md` ("Don't reintroduce floating-point dollars anywhere money is handled").

## Relationships

- Used by [[concepts/profitability-and-tce]] and [[concepts/budget-transfers]].
- Enforced alongside [[concepts/sqlite-no-enums]] as a core repo convention.
