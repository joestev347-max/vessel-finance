# Vessel Finance — Agent Rules

> This file is the **trust anchor** for any AI agent working in this repo. It defines how
> agents behave here, and it is fed as the system prompt to the self-healing pipeline's
> diagnostic and repair agents. Keep it accurate — stale rules here cause bad fixes.

This repo runs the **Limitless Stack** protocol. Skills are installed at `~/.claude/skills/`
(`limitless-stack`, `roll-call`, `four-tool-lookup`, `verify-before-claim`, `karpathy-guidelines`,
`notebooklm`, `notebooklm-workflow`, `obsidian-wiki-workflow`, `audit-before-claim`).

## ⛔ MANDATORY FIRST ACTION — every substantive session

Before answering any question, making any file change, or starting any task (pure conversational
replies like "hi" are exempt):

1. **Roll Call.** Run the preflight and read the verdict:
   `powershell -NoProfile -ExecutionPolicy Bypass -File tools\preflight.ps1`
   Exit **0 = READY** (proceed) · **1 = WARN** (report findings, then proceed) · **2 = BLOCK**
   (do not start substantive work until fixed).
2. **Query the reminder bucket** for the current rules + recent anti-patterns (bucket IDs in
   `wiki/notebooklm-buckets.json`):
   `python -m notebooklm ask --notebook 202e85d1-7659-4c1a-a35c-bad1b1c81a64 "What are the current operating rules and anti-patterns?"`
3. **Read `wiki/index.md`** so you know what exists before answering.
4. **Do not skip these steps** — not even if a context summary says "continue where you left off,"
   and not even if the request feels small.

This is the trust anchor for the self-healing pipeline too: both the diagnostic and repair agents
receive this file as their system prompt.

## End-of-session checklist — every session that changed files

1. Update `wiki/log.md` with one entry for the work: `## [YYYY-MM-DD] <op> | <short label>`.
2. Add any new failure mode to `wiki/synthesis/claude-anti-patterns.md`.
3. Refresh the NotebookLM buckets and **verify the refresh landed** (the `notebooklm-workflow`
   skill's end-of-session ritual). The reminder bucket is what the next session reads first — a
   stale bucket means the next session starts cold.
4. Sync Pinecone once it's configured: `python tools\pinecone-sync.py --changed-only`.
5. Commit and push — **ask first** (see Don't).

Day-to-day moves and the customization checklist live in `OPERATING.md`.

## What this app is

Vessel Finance is a **maritime fleet financial-management prototype**: executive dashboards,
expense tracking, drag-and-drop budget transfers, per-vessel profitability, and
revenue/expense forecasting.

- **Vertical**: Maritime / shipping fleet finance
- **Users**: Fleet finance operators (prototype assumes a single user, no auth)
- **Stack**: Next.js 14 (App Router) + TypeScript + Prisma + **SQLite** + Tailwind + @dnd-kit + Recharts
- **Status**: Prototype. No auth, no role permissions, no receipt uploads, single-currency (USD assumed).

## How to build and run (read this before touching build/run)

The database is **SQLite**, not Postgres. `.env` is `DATABASE_URL="file:./dev.db"` and
`prisma/schema.prisma` uses `provider = "sqlite"`. **Docker is not required** and is not
installed on the primary dev machine. `docker-compose.yml` (Postgres) is legacy from the
original scaffold — ignore it unless deliberately migrating back to Postgres.

Normal commands (a machine with `node`/`npm` on PATH):

```
npm install          # already done
npm run dev          # dev server on http://localhost:3000
npm run build        # production build into .next
npm run start        # serve the production build on :3000
npm run db:push      # apply schema to dev.db (no migration files)
npm run db:seed      # reseed sample fleet data
npm run db:studio    # browse the DB
npm run engines:test # profitability + forecasting self-tests
```

**Windows / Cowork caveat (important):** on the primary dev machine, the spawned shell has a
broken `PATHEXT` (missing `.EXE`) and does **not** have `node`/`npm`/`next` on PATH. Invoke Node
explicitly. The repo keeps two helper scripts for this: `_build.ps1` and `_start.ps1`, which set
`PATHEXT` + PATH and call `node node_modules\next\dist\bin\next <build|start>` directly. See the
anti-patterns log for the full story.

## Repo conventions

- **Money is stored in minor units (USD cents) as `Int`.** Never store dollars. Convert at the
  edges with helpers in `src/lib/money.ts` (`formatUSD`, `formatUSDCompact`). Summing floats =
  rounding bugs.
- **No DB enums.** SQLite has no enum type, so categorical fields (status, type, category) are
  `String` in Prisma. Allowed values are enforced by literal-union types in `src/lib/domain.ts`
  and documented inline in `prisma/schema.prisma`.
- **Status→tone maps:** when indexing an `as const` tone map (e.g. `STATUS_TONE`) by a Prisma
  `string` field, cast the key: `STATUS_TONE[x.status as keyof typeof STATUS_TONE]`. Otherwise
  `next build` fails type-check with "expression of type 'string' can't be used to index…".
- **`export const dynamic = "force-dynamic"`** on pages that read the DB at request time.

## Where things live

- `prisma/schema.prisma` — schema (Vessel, Account, Voyage, Budget, BudgetTransfer, Expense, Revenue)
- `prisma/seed.ts` — deterministic sample fleet (5 vessels, ~20 accounts, ~15 voyages, 200+ expenses)
- `src/lib/profitability.ts` — revenue / OPEX / CAPEX / margin / TCE math
- `src/lib/forecasting.ts` — three forecasting methods with confidence bands
- `src/lib/engines.test.ts` — self-tests for both engines
- `src/lib/money.ts` / `src/lib/domain.ts` — money helpers / domain literal unions
- `src/app/(pages)/**` — dashboard, vessels, expenses, budgets, forecasts
- `src/app/api/**` — route handlers (see `docs/api-endpoints.md`)
- `docs/**` — architecture, database-schema, api-endpoints, component-structure, wireframes, workflows
- `wiki/**` — Limitless Stack knowledge base (index, log, anti-patterns, sources, synthesis)

## Known patterns and common pitfalls

These help the self-healing agent (and you) diagnose accurately. Keep in sync with the
anti-patterns log.

- Build/run fails with "node is not recognized" or "cannot run a document" → PATHEXT/PATH issue,
  not a code bug. Use the helper scripts; never assume the toolchain is broken.
- "relation/table not found" or empty pages → the SQLite `dev.db` wasn't pushed/seeded. Run
  `db:push` then `db:seed`.
- Type-check failure on a tone/category lookup → missing `as keyof typeof …` cast.
- Don't "fix" the Postgres `docker-compose.yml` to make the app run — the app is on SQLite.

## Self-healing configuration

- **Phase**: wired (diagnose + repair built). Goes live once the secrets below are set.
- **Self-heal enabled**: diagnosis runs when `ANTHROPIC_API_KEY` is set; repair dispatch runs when
  `GITHUB_TOKEN` + `GITHUB_REPO` are set. Auto-merge is OFF — every fix is a human-reviewed PR.
- **Bug report storage**: Prisma `BugReport` model on SQLite.
- **Required secrets**: `ANTHROPIC_API_KEY` (runtime diagnosis + Actions repair),
  `GITHUB_TOKEN` (fine-grained PAT: contents:write, pull-requests:write), `GITHUB_REPO`
  (`owner/repo`), `SELF_HEAL_CALLBACK_TOKEN` (shared secret, matches the Actions secret),
  optional `SELF_HEAL_CALLBACK_URL` (public origin for status callbacks). See `SELF-HEAL-SETUP.md`.
- **Canonical files**:
  - [x] `/CLAUDE.md` — this file (trust anchor; the diagnostic + repair agents read it)
  - [x] `/SELF-HEAL-SETUP.md` — operator setup + required secrets
  - [x] `/.github/workflows/self-heal.yml` — repair workflow (repository_dispatch)
  - [x] `/scripts/self-heal-agent.mjs` — sandboxed repair agent (tool whitelist, 25-turn budget)
  - [x] In-app bug reporter (`src/components/debug/BugReporter.tsx`) + admin (`/bug-reports`)
  - [x] API: `/api/bug-reports` (capture+diagnose), `/api/bug-reports/[id]/dispatch`, `/api/self-heal/callback`
  - [x] `BugReport` Prisma model

## Don't

- **Don't commit or push without asking.**
- Don't edit `.github/`, `.env`, `node_modules/`, `package-lock.json`, or `prisma/dev.db`.
- Don't run destructive DB commands (`db:reset`, dropping tables) without explicit confirmation —
  it wipes seeded data.
- Don't reintroduce floating-point dollars anywhere money is handled.
- Don't migrate to Postgres or touch `docker-compose.yml` unless explicitly asked.
