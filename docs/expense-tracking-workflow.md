# Expense tracking workflow

End-to-end flow when a user records a new expense.

## Sequence

```
User                ExpenseForm         /api/expenses              Postgres
 │                      │                     │                       │
 │ 1. Pick vessel       │                     │                       │
 │─────────────────────▶│                     │                       │
 │   (voyage list re-   │                     │                       │
 │    filters)          │                     │                       │
 │ 2. Pick account      │                     │                       │
 │─────────────────────▶│                     │                       │
 │ 3. Enter vendor,     │                     │                       │
 │    amount, date,     │                     │                       │
 │    description       │                     │                       │
 │─────────────────────▶│                     │                       │
 │ 4. Submit            │                     │                       │
 │─────────────────────▶│                     │                       │
 │                      │ 5. POST JSON        │                       │
 │                      │────────────────────▶│                       │
 │                      │                     │ 6. Validate (Zod)     │
 │                      │                     │ 7. Convert USD → cents│
 │                      │                     │ 8. INSERT Expense     │
 │                      │                     │──────────────────────▶│
 │                      │ 9. 201 { expense }  │                       │
 │                      │◀────────────────────│                       │
 │                      │10. Navigate to      │                       │
 │                      │    /expenses,       │                       │
 │                      │    refresh server   │                       │
 │11. Sees new row      │                     │                       │
 │◀─────────────────────│                     │                       │
```

## Field map

| Form field      | DB column        | Notes |
| ---             | ---              | --- |
| Vessel          | `vesselId`       | FK to Vessel. Cascade-delete safe. |
| Account         | `accountId`      | FK to Account (chart of accounts). |
| Voyage          | `voyageId`       | Optional. Only voyages of the selected vessel are listed. |
| Vendor          | `vendor`         | Free text, max 200 chars in UI. |
| Amount (USD)    | `amountCents`    | `Math.round(amountUsd * 100)`. |
| Date            | `expenseDate`    | ISO yyyy-mm-dd; Prisma parses to `DateTime`. |
| Description     | `description`    | Free text. Required. |
| Status          | `status`         | One of `PENDING / APPROVED / PAID / REJECTED`. |

## Read paths affected by a new expense

When the new row is inserted, the next render of any page that reads expenses
will reflect it (no caching layer). Pages that aggregate:

- `GET /` (executive dashboard) — recomputes YTD / TTM totals + the OPEX donut.
- `GET /vessels/:id` — recomputes that vessel's P&L and the budget variance row
  for the expense's account.
- `GET /expenses` — newest row appears at the top of the list.
- `GET /api/forecasts` — included in the history series the next time someone
  re-runs the forecast.

## Updating / deleting

`PATCH /api/expenses/:id` and `DELETE /api/expenses/:id` are exposed but not
wired to a UI in this prototype. Wire to an edit pencil + confirm dialog when
needed.

## What's NOT in this prototype

- **Receipt uploads.** The schema has no receipt column. Add S3-presigned
  uploads with a `receiptUrl` column.
- **Approval workflow.** `status` exists but no "send for approval" flow.
- **Per-vessel-or-account permissions.** Anyone with the app can post an
  expense to any vessel. Add row-level authorization before exposing.
- **Bulk import.** A common ask — add a CSV uploader at `/expenses/import`.
