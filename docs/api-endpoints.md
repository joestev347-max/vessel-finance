# API endpoints

All endpoints are Next.js Route Handlers under `src/app/api/`. JSON in, JSON out.
Errors return `{ error: string | object }` with an appropriate HTTP status.

## Vessels

### `GET /api/vessels`
List vessels with row counts.

Response:
```json
{ "vessels": [ { "id": "...", "name": "...", "_count": { "voyages": 4, "expenses": 350, "revenues": 60 } } ] }
```

### `GET /api/vessels/:id`
Detail with all voyages.

## Accounts

### `GET /api/accounts`
Chart of accounts. Ordered by code.

## Expenses

### `GET /api/expenses?vesselId=&accountId=&from=&to=&limit=100`
Recent expenses, most recent first.

### `POST /api/expenses`
```json
{
  "vesselId": "...", "accountId": "...", "voyageId": "...|null",
  "vendor": "ACME", "amountUsd": 12345.67,
  "expenseDate": "2026-05-21", "description": "...", "status": "PENDING"
}
```
Returns 201 + created row.

### `PATCH /api/expenses/:id`
Any subset of `{ vendor, amountUsd, description, status, voyageId }`.

### `DELETE /api/expenses/:id`

## Revenues

### `GET /api/revenues?vesselId=&from=&to=&limit=`
### `POST /api/revenues`
Same shape as expense create, with `recognitionDate` instead of `expenseDate`
and `source` instead of `vendor`.

## Budgets

### `GET /api/budgets?vesselId=&year=`
Returns all budget rows matching the filter. Used to populate the budget grid.

### `POST /api/budgets/transfer`
```json
{
  "fromBudgetId": "...", "toBudgetId": "...",
  "amountUsd": 15000.0, "reason": "Higher bunker prices in Q2",
  "transferredBy": "demo.user"
}
```

**Atomicity guarantee:** the source budget is decremented, the destination
budget is incremented, and a `BudgetTransfer` audit row is inserted, all inside
one `prisma.$transaction`. Rolls back on any failure.

**Validation rules** (enforced in the handler):
- Source and destination must differ.
- Source and destination must belong to the same vessel.
- Source must have at least `amountUsd` available.

Returns 201 + the transfer row, or 400 with an error message on any rule failure.

## Voyages

### `GET /api/voyages?vesselId=`

## Profitability

### `GET /api/profitability?vesselId=&from=&to=`
Runs the profitability engine over `[from, to]` and returns:
```json
{
  "from": "...", "to": "...",
  "totals": { "revenueCents": N, "opexCents": N, "capexCents": N, ... },
  "revenueByAccount": [...],
  "opexBySubcategory": [...],
  "capexByAccount": [...],
  "monthly": [...]
}
```

## Forecasts

### `GET /api/forecasts?vesselId=&series=&method=&horizon=`
- `series`: `revenue | opex | net` (default `revenue`)
- `method`: `historical-average | linear-trend | seasonal` (default `seasonal`)
- `horizon`: 1..36 months (default 12)

Returns the forecast result plus the history series used to compute it.

## Dashboard

### `GET /api/dashboard/summary?asOf=ISO`
Fleet-wide YTD + trailing-12-months KPIs and the per-vessel rollup that
drives the dashboard's fleet table.
