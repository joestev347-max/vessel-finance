# Self-Heal — Vessel Finance adaptation notes

The three files in this folder (`self-heal.yml`, `self-heal-agent.js`, `SELF-HEAL-SETUP.md`)
are the **canonical Limitless Stack templates**, copied verbatim. They assume **Vercel + Supabase
+ Express + a React client**. Vessel Finance is **Next.js 14 + Prisma + SQLite, not deployed**, so
they need adaptation before the loop will run. This file is the gap list.

## Status: STAGED, NOT WIRED

`CLAUDE.md` → "Self-healing configuration" reflects this: phase = staged, enabled = false.
Nothing here runs until the items below are done. None of it is destructive as-is.

## What works out of the box

- **`self-heal-agent.js`** — the constrained repair agent (read/list/grep/edit/write/bash/finish,
  25-turn budget, path + bash allow-lists) is stack-agnostic. It reads `CLAUDE.md` as system prompt
  (already tailored) and runs `npm run build` / `npm run lint` to validate. Usable nearly as-is once
  placed at `scripts/self-heal-agent.js`. One note: it `import`s `@anthropic-ai/sdk`; add that dep.
- **`self-heal.yml`** — the GitHub Actions workflow (`npm ci`, run agent, open PR) is mostly
  stack-agnostic. It posts status callbacks to an in-app `callback_url`; if you skip the in-app UI
  initially, strip the callback steps and trigger via `workflow_dispatch` for testing.

## What must be adapted (Supabase → Prisma/SQLite, Express → Next.js)

1. **Bug-report storage.** `SELF-HEAL-SETUP.md` gives a Supabase `PREFIX_bug_reports` table with
   `UUID`/`auth.users`/`JSONB`. Replace with a Prisma model on SQLite, e.g.:
   ```prisma
   model BugReport {
     id            String   @id @default(cuid())
     createdAt     DateTime @default(now())
     description   String
     pageRoute     String?
     contextBundle String?  // JSON as TEXT (SQLite has no JSONB)
     status        String   @default("pending") // pending|diagnosed|resolved|failed
     diagnosis     String?  // JSON as TEXT
     selfHealStatus String? // queued|running|completed|failed
     selfHealPrUrl String?
     updatedAt     DateTime @updatedAt
   }
   ```
   Then `npm run db:push`. Note SQLite stores JSON as TEXT — `JSON.stringify`/`parse` at the edges.

2. **Diagnostic endpoint.** The template assumes Express routes (`/server/src/routes/debug-agent.js`).
   Here it's a Next.js App Router handler: `src/app/api/bug-reports/route.ts` (POST = capture +
   fire diagnostic) and `src/app/api/bug-reports/[id]/dispatch/route.ts` (POST = `repository_dispatch`).
   The diagnostic pass calls Claude with `CLAUDE.md` as system prompt and the bug context as the
   user message; persist the structured result on the `BugReport` row.

3. **In-app capture UI.** Replace `BugReporter.jsx` / `DebugReportsPage.jsx` with App-Router client
   components (`src/components/...`), styled with the existing Tailwind tokens.

4. **Deployment + secrets.** The pipeline needs a deployed endpoint to receive callbacks and to
   fire `repository_dispatch`. Vessel Finance isn't deployed yet. Required secrets (see
   `SELF-HEAL-SETUP.md`): `ANTHROPIC_API_KEY` (both the host env and GitHub Actions secret),
   a fine-grained `GITHUB_TOKEN` (contents:write, pull-requests:write), `GITHUB_REPO`, and a
   `SELF_HEAL_CALLBACK_TOKEN`.

## Recommended rollout (per the onboarding guide: "start with one app, prove the loop")

1. Add the `BugReport` Prisma model + `db:push`.
2. Add the Next.js diagnostic API route (diagnose-only; no repair yet).
3. Add `scripts/self-heal-agent.js` + the `@anthropic-ai/sdk` dep; test it locally against a
   known bug with a dummy diagnosis JSON before involving Actions.
4. Add `.github/workflows/self-heal.yml` + secrets; test with `workflow_dispatch`.
5. Only then add the in-app bug reporter and the dispatch button. Keep auto-merge OFF.

Until step 1 is done, leave self-heal disabled. The diagnostic pass is cheap and safe; the repair
pass changes code and must stay gated behind human review (PRs, never direct commits).
