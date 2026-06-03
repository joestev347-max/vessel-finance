---
type: app
created: 2026-06-02
updated: 2026-06-02
---

# Vessel Finance — Overview

Maritime fleet financial-management prototype. Executive dashboards, expense tracking,
drag-and-drop budget transfers, per-vessel profitability, and revenue/expense forecasting.

- **Vertical**: Maritime / shipping fleet finance
- **Stack**: Next.js 14 (App Router) + TypeScript + Prisma + SQLite + Tailwind + @dnd-kit + Recharts
- **Database**: SQLite (`prisma/dev.db`), `DATABASE_URL="file:./dev.db"`. Docker/Postgres is legacy, unused.
- **Status**: Prototype — single-user, no auth, no role permissions, no receipt uploads, USD-only.
- **Self-heal phase**: staged (templates copied, not wired). See `CLAUDE.md` → Self-healing configuration.

## Build/run quick reference

`npm run dev` → http://localhost:3000. Production: `npm run build` then `npm run start`.
On the Windows dev machine use `_build.ps1` / `_start.ps1` (PATHEXT/PATH workaround — see anti-patterns).
DB: `npm run db:push` then `npm run db:seed`.

## Core modules

- `src/lib/profitability.ts` — revenue / OPEX / CAPEX / margin / TCE.
- `src/lib/forecasting.ts` — three forecasting methods with confidence bands.
- `src/lib/money.ts` — cents↔dollars helpers. Money is stored as Int cents everywhere.
- `src/lib/domain.ts` — literal-union types standing in for absent SQLite enums.
