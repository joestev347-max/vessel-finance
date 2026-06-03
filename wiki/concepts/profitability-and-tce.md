---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [domain, finance, engine]
source_count: 0
sources: []
---

# Profitability & TCE

How the app turns raw revenue and expense records into per-vessel financial performance. Implemented
in `src/lib/profitability.ts`, with self-tests in `src/lib/engines.test.ts`.

## Terms

- **OPEX** — operating expenses: the day-to-day cost of running a vessel (crew, bunkers, stores,
  maintenance). Accounts categorized `OPEX`.
- **CAPEX** — capital expenditure: larger, longer-lived investments (drydock, major equipment).
  Accounts categorized `CAPEX`.
- **Margin** — net profit as a percentage of revenue.
- **TCE (Time Charter Equivalent)** — voyage revenue net of voyage costs, expressed per day. A
  standard shipping metric for comparing earnings across voyages and charter types.

## How it computes

Revenue and expense rows (stored in [[concepts/money-as-cents|integer cents]]) are aggregated per
vessel and split by account category into revenue / OPEX / CAPEX, then combined into net profit,
margin, and TCE. All arithmetic is on integer cents to stay exact.

## Relationships

- Consumes data described in [[synthesis/data-model]].
- Feeds the dashboard and the [[concepts/forecasting]] engine.
- Built on [[concepts/money-as-cents]].
