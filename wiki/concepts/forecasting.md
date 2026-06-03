---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [domain, finance, engine]
source_count: 0
sources: []
---

# Forecasting

Revenue/expense forecasting for the fleet, implemented in `src/lib/forecasting.ts` with self-tests
in `src/lib/engines.test.ts`. Three classic methods, each returning a forecast plus a confidence
band — no ML.

## The three methods

1. **Average** — projects the trailing mean forward. Stable, ignores trend.
2. **Linear trend** — fits a straight line to history and extends it. Captures steady growth/decline.
3. **Seasonal** — accounts for month-to-month seasonality on top of the trend.

Each method emits a central estimate with upper/lower **confidence bands** so the dashboard can show
uncertainty, not just a point estimate.

## Limits

Prototype-grade: three deterministic methods only. No machine learning, no exogenous variables
(fuel price, rates). Documented as a next step in the project README.

## Relationships

- Consumes the same per-vessel aggregates as [[concepts/profitability-and-tce]].
- Operates on [[concepts/money-as-cents|integer-cent]] series.
