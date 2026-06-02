# Budget transfer workflow

End-to-end flow when a user reallocates budget from one line item to another
via drag-and-drop.

## Sequence

```
User                       BudgetGrid          /api/budgets/transfer        Postgres
 │                            │                          │                     │
 │ 1. Drag cell A onto B      │                          │                     │
 │───────────────────────────▶│                          │                     │
 │                            │ 2. Open modal pre-filled │                     │
 │                            │    with from/to context  │                     │
 │ 3. Type amount + reason    │                          │                     │
 │───────────────────────────▶│                          │                     │
 │ 4. Click "Confirm"         │                          │                     │
 │───────────────────────────▶│                          │                     │
 │                            │ 5. POST JSON body        │                     │
 │                            │─────────────────────────▶│                     │
 │                            │                          │ 6. Validate (Zod)   │
 │                            │                          │ 7. BEGIN TRANSACTION│
 │                            │                          │────────────────────▶│
 │                            │                          │ 8. SELECT both      │
 │                            │                          │    budgets FOR ROW  │
 │                            │                          │    in tx            │
 │                            │                          │────────────────────▶│
 │                            │                          │ 9. Check same vessel│
 │                            │                          │    + sufficient bal │
 │                            │                          │10. UPDATE from -=Δ  │
 │                            │                          │11. UPDATE to   +=Δ  │
 │                            │                          │12. INSERT transfer  │
 │                            │                          │    audit row        │
 │                            │                          │────────────────────▶│
 │                            │                          │13. COMMIT (or       │
 │                            │                          │    ROLLBACK on err) │
 │                            │ 14. 201 { transfer }     │                     │
 │                            │◀─────────────────────────│                     │
 │                            │ 15. close modal,         │                     │
 │                            │     router.refresh()     │                     │
 │ 16. UI shows new balances  │                          │                     │
 │◀───────────────────────────│                          │                     │
```

## Validation rules

Enforced in `src/app/api/budgets/transfer/route.ts`:

| Rule                                                   | Error code | Message |
| ---                                                    | ---        | --- |
| Body fails Zod parse                                   | 400        | flattened Zod errors |
| `fromBudgetId === toBudgetId`                          | 400        | "Source and destination budgets must differ" |
| Source or destination budget not found                 | 400        | "Budget not found" |
| Source and destination on different vessels            | 400        | "Cross-vessel transfers are not allowed in this prototype" |
| Source balance < amount                                | 400        | "Insufficient balance in source budget" |
| Underlying Postgres write fails (constraint, deadlock) | 400        | Postgres error message |

## Atomicity

All four DB operations (two `UPDATE`s + one `INSERT` + the lookups) execute
inside a single `prisma.$transaction(...)`. Postgres rolls back the entire
batch on any error, so the system cannot be left with a half-applied transfer.

## Audit trail

The `BudgetTransfer` row preserves:
- Source/destination FKs (so the transfer can be reversed by clicking a button
  in a future iteration).
- Amount, reason, who, and `transferredAt` timestamp.

## What's NOT enforced (deliberately)

- **Approval workflow.** Anyone with access can transfer. Add a `status`
  column and a separate `/api/budgets/transfer/:id/approve` endpoint when
  governance requires it.
- **Cross-month or cross-account constraints.** The UI restricts to same year
  but the API does not — a future "fiscal lock" feature should reject transfers
  to closed periods.
- **Cross-vessel transfers.** Explicitly rejected; common request in real
  fleets, but it requires inter-vessel accounting we haven't designed yet.
