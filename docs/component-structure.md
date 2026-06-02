# Frontend component structure

```
src/app/
├── layout.tsx                      (root: <Sidebar/> + main)
├── globals.css
│
├── page.tsx                        Executive dashboard
│
├── vessels/
│   ├── page.tsx                    Vessel list
│   └── [id]/page.tsx               Vessel detail (P&L, voyages, variance)
│
├── expenses/
│   ├── page.tsx                    Expense list + filter
│   └── new/page.tsx                New-expense form host
│
├── budgets/
│   └── page.tsx                    Budget grid host
│
└── forecasts/
    └── page.tsx                    Forecast host

src/components/
├── ui/                             Primitive UI (server + client safe)
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── KpiTile.tsx
│
├── layout/
│   ├── Header.tsx
│   └── Sidebar.tsx                 [client] uses usePathname
│
├── dashboard/
│   ├── FleetSummaryTable.tsx
│   ├── OpexBreakdownChart.tsx      [client] recharts
│   └── RevenueExpenseChart.tsx     [client] recharts
│
├── vessels/
│   ├── BudgetVarianceTable.tsx
│   └── VoyageList.tsx
│
├── expenses/
│   └── ExpenseForm.tsx             [client] form + fetch POST
│
├── budgets/
│   └── BudgetGrid.tsx              [client] @dnd-kit + transfer modal
│
└── forecasts/
    ├── ForecastChart.tsx           [client] recharts
    └── ForecastsClient.tsx         [client] orchestrates fetch + chart + table
```

## Server vs client boundaries

| Component                  | Why server vs client |
| ---                        | --- |
| Most page files            | Server. They Prisma-fetch and stream HTML. |
| `Sidebar`                  | Client — needs `usePathname()`. |
| Anything using recharts    | Client — recharts uses SVG refs and `ResponsiveContainer`. |
| `ExpenseForm`              | Client — controlled inputs + `fetch` POST. |
| `BudgetGrid`               | Client — DnD state + modal. |
| `ForecastsClient`          | Client — re-fetches when controls change. |

## Data flow

```
┌─────────────────────────────┐
│ Server component (page.tsx) │  ──┐
└─────────────────────────────┘    │  prisma + compute*()
            │                       ▼
            │             [pure functions in src/lib]
            │
            │   props passed by reference (no JSON serialization step
            ▼   for server-to-server)
┌──────────────────────────────────┐
│  Server child / Client component │
└──────────────────────────────────┘
                │
                │  user interaction (drag, submit)
                ▼
        fetch('/api/...')   ─→   Route handler  ─→  Prisma write
                │
                ▼
        router.refresh() re-runs the server component above
```

## Styling conventions

- Tailwind utility classes only, no CSS modules.
- `cn()` from `src/lib/utils.ts` for conditional classes.
- Custom palette in `tailwind.config.ts`:
  - `ink-50..900` — neutral grays (slate-ish)
  - `accent-50..900` — primary blue
  - `good`, `warn`, `bad` — semantic 500/600 pairs
- `.data-table` component class for the standard ledger-style table.
- `.num` class for right-aligned tabular numbers.
