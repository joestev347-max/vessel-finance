---
type: overview
created: 2026-06-02
updated: 2026-06-02
---

# Activity Log

Chronological, append-only. Every entry starts with `## [YYYY-MM-DD] <op> | <label>` where
`<op>` is one of `ingest`, `query`, `lint`, `refactor`, `schema`, `setup`.

## [2026-06-02] setup | Limitless Stack bootstrapped + production build fixed

- Confirmed repo already cloned at `C:\Users\joest\vessel-finance`; connected it as a Cowork folder.
- Discovered the app runs on **SQLite** (a prior session swapped Postgresâ†’SQLite); `dev.db` exists and is seeded. Docker not needed / not installed.
- Fixed a production-build blocker: TypeScript error indexing `as const` tone maps with a Prisma `string` field. Added `as keyof typeof STATUS_TONE` casts in `src/app/expenses/page.tsx` and `src/app/vessels/page.tsx`.
- Built successfully (`next build`, exit 0) and verified `/`, `/vessels`, `/expenses` return HTTP 200 with seeded data.
- Captured Windows toolchain gotchas (PATHEXT missing `.EXE`; node/npm/next not on the spawned shell PATH) as anti-patterns; added `_build.ps1` / `_start.ps1` helpers.
- Installed the Limitless Stack: 7 skills to `~/.claude/skills/`, this wiki scaffold, tailored `CLAUDE.md`, anti-patterns log, and staged self-heal templates under `self-heal-templates/`.

## [2026-06-02] schema | Manual data-entry UI for all entities

- Built create paths for every entity so a real fleet can be entered by hand, mirroring the existing expense form/API pattern (server "new" page â†’ client form â†’ zod-validated POST â†’ dollars converted to cents):
  - Accounts (`/accounts`, `/accounts/new`, `POST /api/accounts`)
  - Vessels (`/vessels/new`, `POST /api/vessels`, "New vessel" button)
  - Voyages (`/voyages`, `/voyages/new`, `POST /api/voyages`)
  - Budgets (`/budgets/new`, `POST /api/budgets`, "New budget" button + friendly empty state)
  - Revenues (`/revenues`, `/revenues/new`; `POST /api/revenues` already existed)
- Added nav entries (Voyages, Accounts, Revenues) and unique-constraint (P2002) handling that returns clean 409 messages for duplicate code/IMO/voyage-number/budget-line.
- Added `npm run db:empty` (`prisma/empty.ts`) to clear all tables for a clean start; re-seed samples with `npm run db:seed`.
- Verified: production build exit 0; all 13 pages return HTTP 200; all 5 create endpoints return 201 via smoke test.

## [2026-06-02] ingest | Built out the Obsidian vault (LLM Wiki pattern)

- Ran an ingest/build pass using the `obsidian-wiki-workflow` skill. Created the vault structure:
  `wiki/concepts/`, `wiki/entities/`, `wiki/sources/`, and a repo-root `raw/` for immutable sources.
- Wrote two source summaries (`limitless-stack-onboarding`, `karpathy-llm-wiki-video`), one entity
  (`open-scaffold-labs`), seven concept pages (`llm-wiki-pattern`, `money-as-cents`,
  `sqlite-no-enums`, `profitability-and-tce`, `forecasting`, `budget-transfers`,
  `self-healing-pipeline`), and one synthesis page (`data-model`). All interlinked with wiki-links +
  frontmatter so Obsidian's graph shows concept/source/entity clusters.
- Rebuilt `wiki/index.md` as the full catalog.
- Pending (need accounts/keys): Pinecone sync and NotebookLM reminder-bucket refresh â€” the
  `notebooklm-workflow` end-of-session steps. Not run this session.

## [2026-06-02] setup | NotebookLM buckets live (install steps 8.3-8.4)

- Installed Python deps (pinecone, notebooklm-py[browser], python-docx, pdfplumber) + Playwright
  Chromium. Authenticated NotebookLM via `notebooklm login --browser chrome`.
- Created two notebooks and recorded IDs in `wiki/notebooklm-buckets.json`:
  reminder = 202e85d1â€¦, default = 750d671fâ€¦.
- Uploaded the reminder allowlist (CLAUDE.md, anti-patterns, overview, index) to the reminder
  bucket and the rest of `wiki/**` (12 files) to the default bucket. All 16 sources reported
  status=ready.
- Verified the reminder bucket: a query returned an accurate, cited summary of the operating rules
  and anti-patterns. NotebookLM layer is live.
- Still pending: Pinecone (step 8.2) â€” needs `PINECONE_API_KEY`.

## [2026-06-02] schema | CLAUDE.md upgraded to canonical enforcement + reminder bucket refreshed

- Added the canonical Limitless Stack **mandatory-first-action banner** (Roll Call preflight â†’
  query reminder bucket â†’ read `wiki/index.md`) and the **end-of-session checklist** to
  `CLAUDE.md`, wired to the real reminder bucket ID and `tools/preflight.ps1`. Kept all the
  vessel-finance technical rules.
- Refreshed `CLAUDE.md` in the reminder NotebookLM bucket (delete-by-id + re-add) and **verified**:
  a query returned the new mandatory-first-action steps. Deduped two stale CLAUDE.md copies left by
  a hung delete; reminder bucket back to 4 clean sources.

## [2026-06-02] setup | Pinecone live (install step 8.2 â€” full stack complete)

- Set `PINECONE_API_KEY` (User scope). First `pinecone-sync.py` auto-created the `vessel-finance`
  index (multilingual-e5-large, aws/us-east-1) and synced the wiki corpus: **17 files â†’ 34 chunks**.
- Fixed the upstream tools for pinecone-client v9 (the installed version): `upsert_records` and
  `search` became keyword-only / flat-args. Patched both `tools/pinecone-sync.py` and
  `tools/pinecone-search.py`.
- Verified: `pinecone-search.py "how is money storedâ€¦"` â†’ top hit `wiki/concepts/money-as-cents.md`
  @ 0.833. Semantic recall working.
- **All four memory layers are now live**: Obsidian wiki + NotebookLM (reminder/default buckets) +
  Pinecone + CLAUDE.md. Limitless Stack install (steps 8.1â€“8.5) complete on Windows.

## [2026-06-02] schema | Self-healing pipeline built (diagnose + repair)

- Built the full self-heal loop (onboarding Section 4). **Diagnose**: `BugReport` Prisma model;
  in-app ðŸž reporter widget (`BugReporter`, mounted in layout) capturing route/viewport/recent JS
  errors; `POST /api/bug-reports` runs a Claude diagnostic with `CLAUDE.md` as system prompt
  (`src/lib/self-heal/diagnose.ts`) and persists severity/confidence/root-cause/suspected-files;
  `/bug-reports` admin page. **Repair**: `scripts/self-heal-agent.mjs` (sandboxed, tool-whitelist,
  25-turn) + `.github/workflows/self-heal.yml` (repository_dispatch â†’ PR);
  `POST /api/bug-reports/[id]/dispatch` and `POST /api/self-heal/callback`.
- Added `@anthropic-ai/sdk`. Graceful degradation: no `ANTHROPIC_API_KEY` â†’ store-and-skip; no
  GitHub secrets â†’ dispatch button disabled. Auto-merge OFF. Setup + secrets in `SELF-HEAL-SETUP.md`.
- Hit anti-pattern #5 (a prior `npm install` had dropped devDependencies â†’ build failed on
  `tailwindcss` with red-herring `@/` errors). Fixed with `npm install --include=dev`. Added an
  explicit `@`â†’`src` webpack alias in `next.config.js` as belt-and-suspenders.
- Verified: production build exit 0; `/bug-reports` and existing pages return HTTP 200.
- **Onboarding is now functionally complete**: only Hub Workspace + Paperclip remain, which are
  Open Scaffold proprietary products (not replicable). Self-heal goes live once its secrets are set.

## [2026-06-02] refactor | Roll Call auto-start + richer preflight

- Added a Claude Code `SessionStart` hook (`.claude/settings.json`) that runs `tools/preflight.ps1`
  automatically. Confirmed it fires in the Claude Code CLI; **Cowork does not run Claude Code
  hooks**, so in Cowork the `roll-call` skill + `CLAUDE.md` banner are the (soft) triggers.
- Rewrote the `roll-call` skill to mirror the reference setup, adapted to Windows/Desktop Commander,
  our bucket IDs (reminder `202e85d1â€¦`), and Hub Workspace/Paperclip as documented skips.
- Upgraded `tools/preflight.ps1`: 7-tool structure, Pinecone **sync-drift** check (last sync vs.
  newest wiki edit), NotebookLM `auth check --test`, green/yellow/red verdict format.
- Caught a real self-inflicted bug: the preflight didn't set `PATHEXT`, so `& python.exe`/`& git.exe`
  silently failed (anti-pattern #1) â†’ false negatives on Pinecone/NotebookLM. Fixed.

## [2026-06-04] setup | Self-heal activated end-to-end + audit-before-claim installed in Cowork

- **Self-heal is live** (SELF-HEAL-SETUP.md steps 1â€“4). App `.env`: `ANTHROPIC_API_KEY`,
  `GITHUB_TOKEN` (fine-grained PAT, contents+PR write), `GITHUB_REPO`, generated
  `SELF_HEAL_CALLBACK_TOKEN`. Actions secrets: `ANTHROPIC_API_KEY` + `SELF_HEAL_CALLBACK_TOKEN`.
- Verified: test bug â†’ diagnosed in 5.7s (status `diagnosed`, coherent JSON). Dispatch â†’ workflow
  run 26989504900 succeeded in 51s; agent `applied_fix=false` (correct for a synthetic bug), no PR
  opened. **Callback delivery leg untested** â€” GitHub can't reach localhost; test report sits at
  `dispatched/queued` until manually closed. PR-open leg fires only when the agent edits code.
- Gotcha: PAT initially lacked Contents:write â†’ 403 on `repository_dispatch`
  (`X-Accepted-GitHub-Permissions: contents=write` was the diagnostic tell). Fixed by editing the
  token's permissions in place â€” token value unchanged.
- Bumped `actions/checkout` + `actions/setup-node` to v5 in `self-heal.yml` (both declare
  `using: node24`; GitHub forces Node 24 June 16, 2026). Commit `4316b85`, pushed.
- **Roll Call soft trigger confirmed in Cowork**: fired on a bare "hey claude" in a fresh session â€”
  the open question from the 2026-06-02 handoff is answered (refines anti-pattern #6: once the
  skill is surfaced in a new session, the soft trigger does work).
- Packaged `audit-before-claim` as a `.skill` zip and installed it into Cowork (verified surfaced
  in the session's available-skills list). First package attempt failed: PowerShell
  `Compress-Archive` backslash entries â€” see anti-pattern #7.
- Wrap: Pinecone synced (wiki: 2 files / 14 chunks). NotebookLM refreshed: anti-patterns replaced
  in reminder bucket, log.md replaced in default bucket â€” verified by reminder-bucket query
  quoting anti-pattern #7 verbatim. Gotcha: `source delete-by-title` hangs (interactive confirm);
  use `source delete <id> --notebook <nb> -y`.

## [2026-06-04] ingest | TugOS whitepaper + architecture blueprint (project north star)

- Joseph uploaded two OSL docs and designated them **the project whitepaper we follow to the end
  goal**: the TugOS Industry Vertical White Paper (16 pp) and the TugOS OSL Architecture Blueprint
  (9 pp). Saved immutably to `raw/openscaffold-tugboat-whitepaper.pdf` and
  `raw/tugos-osl-architecture.pdf`.
- Read both fully; created source pages (`sources/openscaffold-tugboat-whitepaper`,
  `sources/tugos-osl-architecture`), the north-star app page `concepts/tugos` (pillars, 36-month
  roadmap, target architecture, prototype-vs-target stack warning), and
  `concepts/osl-orchestrator-model`. Updated `entities/open-scaffold-labs` (23-app ecosystem,
  Open Agency lineage), `overview` (project-direction callout), and the index.
- Flagged two warnings in `concepts/tugos`: (1) target stack is Supabase/Express/React 19 vs our
  SQLite/Prisma/Next.js prototype â€” no migration unless explicitly asked; (2) whitepaper says hire
  a maritime domain expert, blueprint says Catalog of Authority replaces the expert â€” reconcile
  later.

## [2026-06-04] query | Audit of the TugOS whitepaper + blueprint (audit-before-claim)

- Joseph asked whether the TugOS docs are the best route to top-of-class. Ran a web-verified
  audit; filed [[synthesis/tugos-whitepaper-audit]] and added a warning callout to
  [[concepts/tugos]] + index entry.
- **Refuted**: "no product owns the tug vertical" (Helm CONNECT, 275+ companies, Foss Maritime
  reference, sells Sub M compliance â€” omitted entirely); MarineTraffic AIS Toolbox as commercial
  foundation (CC BY-NC-SA 4.0, density-map tool); CII reporting for tugs (applies â‰¥5,000 GT);
  whitepaper's "33 CFR Part 15" rest-hour cite (actual: 46 CFR 15.1111 / 46 USC 8904).
- **Critical gap**: 46 CFR Subchapter M / TSMS never mentioned in either doc.
- **Internal contradictions**: two different stacks+auth (Next.js/Hono/Supabase-Auth vs
  React19/Vite/Express/JWT-15min); RLS isolation vs shared-instance direct SQL across 23 apps;
  offline-first vs 15-min tokens; hire-domain-expert vs EaaS; 90/30/7 vs 90/60/30.
- **Verified**: $2.4B/17.5% traces to market.us but is the most optimistic of ~6 firms
  ($1.2â€“2.3B, 10â€“12.5% elsewhere); BargeOps, Signal K, Flectra, OpenCPN claims accurate.
- Verdict: playbook shape is sound; follow it **with corrections** (reposition vs Helm, center
  Sub M, fix AIS licensing + tenant isolation, drop CII, test the 85%-legacy assumption in
  Phase 1 interviews).

## [2026-06-04] refactor | TugOS docs recreated as v2 with audit corrections folded in

- Committed + pushed the ingest/audit work (f9f7ea2, 11 files).
- Per Joseph: recreated both north-star docs as clean v2 PDFs (reportlab), corrections folded in
  seamlessly: `docs/tugos-whitepaper-v2.pdf` (8 pp) and `docs/tugos-osl-architecture-v2.pdf`
  (5 pp). Verified by text extraction: Helm CONNECT positioning (Tier 0 incumbent), Subchapter
  M/TSMS as the compliance core, CC BY-NC AIS toolbox excluded (commercial AIS APIs instead),
  CII dropped (>=5,000 GT only), one reconciled stack (React 19 + Vite + Express + dedicated
  Supabase project for tenant isolation), offline refresh-token auth design, 90/30/7 windows,
  domain-expert hire kept (advisor + Catalog hybrid), marketplace gated on a liquidity
  hypothesis, market figures stated as cross-firm ranges ($1.2â€“2.4B, 10â€“17.5%).
- [[concepts/tugos]] updated: v2 PDFs are the operative north star; v1 PDFs remain immutable in
  `raw/`.

## [2026-06-04] query | TugOS Build Gameplan v1.0 written + audited

- Per Joseph: comprehensive build gameplan referencing the Architecture Blueprint v2 â€”
  `docs/tugos-build-gameplan.pdf` (9 pp; generator `tools/make-tugos-gameplan.py`), pointer page
  [[synthesis/tugos-build-gameplan]]. Defines best-in-class as 6 measurable outcomes (north star:
  Weekly Active Vessels), maps build order to blueprint components, sets 4 phase gates with
  pre-committed pass/fail actions, 24-risk register (prevention + early-warning + contingency per
  risk), kill/pivot criteria, measurement system, governance cadence, and an audit-record section.
- New verifications this pass: **Vercel serverless cannot host WebSockets** (blueprint's live job
  board re-specified onto Supabase Realtime with Fly.io fallback); **DocuSeal is AGPLv3 with
  Section 7(b) terms + commercial Pro option** (embedding/API for production is a paid feature â€”
  cleanest resolution is buying the Pro license).
- Audit-before-claim applied: doc separates verified facts (Helm, Sub M, CII, AIS license,
  46 USC 8904/46 CFR 15.1111, Vercel WS, market ranges) from working assumptions (H1â€“H4, pricing,
  all gate thresholds = judgments). PDF content verified by text extraction (all 13 sections +
  key terms render).

## [2026-06-04] schema | end-of-session-checklist must load the notebooklm skill for step 4

- Per Joseph: future sessions must use the **`notebooklm`** skill (CLI reference) when running the
  end-of-session checklist â€” no improvised CLI syntax. Edited
  `~/.claude/skills/end-of-session-checklist/SKILL.md`: step 4 now requires loading both
  `notebooklm-workflow` (ritual) and `notebooklm` (commands), documents the
  `delete-by-title` hang, and prescribes `source delete <id> --notebook <nb> -y`. Frontmatter
  description updated to match. Cowork surfaces the edited skill starting with the next session.

## [2026-06-09] schema | TugOS Phase 0 foundation scaffolded (tug_ schema + per-tenant RLS)

- Per Joseph: started the TugOS build at the optimal first move â€” the isolation-first DB
  foundation (build-order row 1 / Phase 0 Workstream B first bullet). New isolated tree under
  `tugos/`, deliberately separate from the SQLite/Prisma prototype (no migration of Vessel Finance).
- `tugos/supabase/migrations/0001_core_schema.sql`: 6 core `tug_` tables (companies, users,
  vessels, clients, crew, jobs) with `company_id` on every row, CHECK-constrained categorical
  fields (no enums), `updated_at` triggers, query-pattern indexes. Remaining blueprint tables
  (fuel_logs, maintenance, invoices, certs, agent_runs) deferred to Phase 1+.
- `0002_rls_policies.sql`: per-tenant RLS via a session GUC `app.company_id` (matches blueprint's
  Express + direct-SQL tenant-scoped connections, not PostgREST claims); least-privilege `tug_app`
  role; **FORCE RLS**; DML revoked from PUBLIC/anon/authenticated.
- Best-in-class hardening pass (top technical risk = cross-tenant leak): **composite tenant FKs**
  `(company_id, child_id)â†’(company_id, id)` so FK validation (which bypasses RLS) can't reference
  another tenant's rows; retire-don't-delete posture via NO ACTION.
- `tugos/supabase/tests/0001_rls_isolation_test.sql`: 11 pgTAP assertions (read/insert/update/
  delete/cross-tenant-FK/deny-by-default). `tugos/PHASE0-CHECKLIST.md` encodes O1â€“O6, the risk
  registerâ†’prevention map, and the compliance-spine (Sub M tables wait for advisor+TPO validation)
  + license-gate guards.
- Verified this session: all SQL parses clean against the real PG grammar (pglast v7.14 /
  libpg_query, 0 failures). **NOT yet executed against a live DB** â€” pending the dedicated Supabase
  project (Joseph granting access via the Supabase MCP connector; provisioning + live RLS-test run
  is the next step).

## [2026-06-09] schema | TugOS foundation applied + RLS verified on live Supabase project

- Joseph connected the **Supabase MCP** connector and created the dedicated project **`TUGOS`**
  (ref `naxqxajzlmisqdnfvhzm`, region `us-east-2`, Postgres 17, org `joestev347-max's Org`). A
  second stray project `joestev347- TUGOS` (`us-west-2`) exists â€” Joseph chose East US as canonical
  and to delete West; the MCP has no delete capability, so the West project must be deleted from the
  dashboard (still pending).
- Applied migrations **0001** (core schema), **0002** (RLS + tug_app + FORCE RLS + revokes), and
  **0003** (pin function `search_path`) via `apply_migration`. Verified directly: all 6 `tug_`
  tables have `relrowsecurity=true` + `relforcerowsecurity=true`, 6 policies, composite tenant FKs.
- **Live RLS isolation: 11/11 green.** Ran a self-contained, self-cleaning harness (seed 2 tenants
  â†’ `set role tug_app` â†’ assert read/insert/update/delete/cross-tenant-FK/deny-by-default â†’ `raise`
  to roll back). Confirmed zero residue afterwards (all tables count 0). Re-ran after 0003 â€” still
  11/11. Supabase **security advisor: 0 findings** (was 2 `function_search_path_mutable` WARNs,
  fixed by 0003). Gate 0's "RLS isolation tests green" criterion is met at the DB layer.
- App connection (later): API URL `https://naxqxajzlmisqdnfvhzm.supabase.co`; tenant traffic must
  use a `tug_app`-privileged connection that sets `app.company_id` per transaction (NOT the
  bypass-RLS `postgres`/service role).
- New anti-patterns captured (#9, #10).

## [2026-06-09] schema | TugOS Surface 2 (REST API) built + verified live

- Built **Surface 2** under `tugos/api/` (Express 4 + TypeScript, ESM): tenant-scoped DB layer
  (`withTenant` â†’ `BEGIN; set_config('app.company_id',â€¦,true); â€¦ COMMIT`), JWT+bcrypt auth
  (`bcryptjs`, 15-min tokens), `authenticate`/`requireRole` middleware, and routes for
  `auth/login`, `users` (provision+list), `vessels`, `clients`, `crew`, `jobs`. Async-safe via an
  `asyncHandler` wrapper + terminal error middleware (Express 4 doesn't catch async rejections).
- Provisioned a dedicated **`tug_api`** login role (inherits `tug_app`, `bypassrls=false`) for the
  app's tenant-scoped connection. Login bootstrap uses a SECURITY DEFINER lookup moved to a
  **`private` schema** (migration 0005) after the advisor flagged it was exposed over PostgREST
  (`/rest/v1/rpc`) returning password hashes â€” see anti-pattern #11.
- Migrations applied live (0001â€“0005), all via the Supabase MCP. Security advisor: **0 findings**.
- Hardened `/auth/login`: helmet, configurable CORS, `express-rate-limit` (10/15min), 100kb body
  cap, `trust proxy`.
- **Verified end-to-end against the live project** (project `TUGOS`, role `tug_api`): a self-cleaning
  e2e (`src/e2e.ts`) seeded a demo company/user, then exercised login (200 + JWT, 401s), vessel/
  client/crew/job create, a foreign-`vessel_id` job correctly rejected **400** (composite tenant FK
  through the API), user provisioning, a provisioned dispatcher logging in, and dispatcher blocked
  from `/users` (**403**). 18/18 e2e checks; `tsc --noEmit` clean; 11/11 unit tests. Demo data
  deleted afterward â€” all `tug_` tables back to 0 rows.
- Commits: `b1b897a` (foundation), `8b9dd4a` (Surface 2), `625d7c6` (e2e+SSL), `3677ef3`
  (login hardening), `55db62a` (users + clients/crew/jobs + async errors). Local only (not pushed).
- Hit anti-pattern #5 again (NODE_ENV=production dropped devDeps â†’ `tsc` couldn't find `@types`);
  fixed with `npm install --include=dev` + cleared `NODE_ENV`. New anti-pattern #11 captured.
- End-of-session sync: Pinecone `--changed-only` re-embedded 2 files / 26 chunks. NotebookLM
  refreshed (anti-patterns â†’ reminder bucket, log â†’ default) and **verified**: a reminder-bucket
  query for anti-pattern #11 returned the SECURITY-DEFINER/PostgREST answer. `refreshed: 2  verified: yes`.

## [2026-06-09] schema | Surface 1 dispatch UI, Fleet UI, CI, scheduled-time+notes, test coverage

- Built **Surface 1** (`tugos/web`, React 19 + Vite + Tailwind): login (JWT), dispatch board with
  status columns + status-transition `PATCH`, Fleet management (vessels/clients/crew/users) via a
  reusable ResourceManager, and a scheduled-time picker + notes on jobs (migration 0006 +
  generalized `PATCH /jobs/:id`). Verified by a committable, env-driven Playwright e2e
  (`web/e2e/uiverify.mjs`) against the live project â€” login â†’ fleet setup â†’ dispatch, screenshots.
- **CI**: added `.github/workflows/tugos-ci.yml` (new file; `self-heal.yml` untouched) running API
  typecheck+tests and web typecheck+tests+build on push/PR touching `tugos/**`. First run **caught a
  real bug** (see anti-pattern #12): the root `.gitignore` `_*` was swallowing `__tests__`, so the
  API test suite had never been committed. Fixed with `!**/__tests__/`; CI green after.
- **Test coverage** added and wired into CI: API node:test units for the job-patch builder,
  auth/role middleware, and async error handling (25 assertions total); web vitest+jsdom tests for
  the API client and the Login component (4 assertions). All green: API tsc+tests, web tsc+vitest+build.
- Pushed all commits to origin (`github.com/joestev347-max/vessel-finance`). New anti-pattern #12
  captured (broad `_*` gitignore swallowing `__tests__`).
- End-of-session sync: Pinecone `--changed-only` â†’ 2 files / 29 chunks. NotebookLM refreshed
  (anti-patterns â†’ reminder, log â†’ default) and **verified**: reminder-bucket query returns
  anti-pattern #12 (the `_*`/`__tests__` lesson). `refreshed: 2  verified: yes`.

## [2026-06-10] deploy | TugOS live on Vercel (single-origin) — pg -> porsager/postgres

- **Goal**: run the dispatch app on Vercel so edits show up live. Got the single-origin Express+SPA
  deploy READY, but every DB-backed route 500'd with an empty body (DB-free routes were fine).
- **Misdiagnosis loop** (captured as anti-pattern #14): assumed a connection hang and burned commits
  on pooler host (aws-0 vs aws-1 — aws-1 is correct), SSL flags, `connectionTimeoutMillis`, a
  `pool.on('error')` handler, IPv4-first DNS, and `maxDuration 30`. An env-echo route proved the env
  was correct all along (host/sslNoVerify/JWT). Adding a stopwatch showed the 500 was **~0s** = an
  instant crash, not a timeout.
- **Root cause + fix** (anti-pattern #13): `pg` (node-postgres) crashes in the Vercel serverless
  bundle on first pool use. Switched the DB layer to **porsager/postgres** with `prepare:false`
  (Supabase transaction pooler), same `Queryable {rows}` shim, tenant tx over `sql.reserve()`.
  Verified: API tsc + 25 unit tests; live API e2e **23/23** through aws-1 pooler.
- **Live verification on Vercel**: `/debug/db` ok (1s), then login 200 (fleet_admin) + `/auth/me` 200
  + `/vessels` 200 + `/jobs` 200 + logout 200 via a real cookie jar. Removed the temporary `/debug`
  routes after confirming. Site: https://vessel-finance.vercel.app (demo: captain@demo.test).
- Commits e31c458..229256d pushed; auto-deploy on push to master is working.

- **End-of-session sync (2026-06-10)**: Pinecone `--changed-only` -> 2 files / 32 chunks (21 unchanged). NotebookLM refreshed both buckets and **verified**: reminder query returns anti-pattern #13 (pg->porsager/postgres); default query returns the 2026-06-10 Vercel/driver session. `refreshed: 2  verified: yes`.

## [2026-06-10] setup | Built separate "Boat Budget" (Tug Budget Manager) app - isolated from TUGOS
- Built a full Next.js 16 + Supabase + Vercel fleet-budgeting app for HMS (Haugland Marine) on its OWN Supabase project (ref aiugwzgxpwgmglpojgoz), deliberately isolated from TUGOS (naxqxajzlmisqdnfvhzm). Repo github.com/joestev347-max/boat-budget, live at boat-budget.vercel.app (GitHub auto-deploy on push to master).
- Schema: vessels, revenue + overhead/variable cost categories (added Repairs & Maintenance), category budgets, transactions, budget transfers (audit trail), monthly_reports + lines (kept separate from live data, with reported-vs-entered reconciliation), receipts storage bucket + transaction_attachments. 5-role RBAC + RLS; security advisors run + hardened (3 benign authenticated-execute warnings remain by design for RLS helper fns).
- Data: 4 vessels (Emma Rose/Miss Madeline/Lily Anne/Everly Mist), $25k/mo / $300k/yr budgets, $13.2M fleet revenue target; April 2026 HMS combined report (rev 1,089,389.80 / exp 1,106,246.30 / net -16,856.50, anonymized) loaded into Monthly Reports.
- New anti-pattern #15 (NODE_ENV=production hides devDeps). Full handoff saved in the Boat Budget repo as HANDOFF.md. NOTE: separate project from TUGOS/vessel-finance; logged here only as a session record.
- End-of-session sync (2026-06-10b): Pinecone --changed-only -> 2 files / 34 chunks (21 unchanged). NotebookLM reminder-bucket refresh did NOT land this session (anti-patterns source id unchanged; CLI calls hung in the spawned shell) - re-run 'notebooklm source delete-by-title + add' for claude-anti-patterns.md on next session. refreshed: 0  verified: no

## [2026-06-11] schema | Hardened Pinecone key resolution (sync + preflight) — killed a Roll Call false-green

- **Symptom**: Session-start Roll Call was green on Pinecone, but `pinecone-sync.py --changed-only` failed with `PINECONE_API_KEY is not set` from a Desktop-Commander-spawned shell. Cause: preflight resolved the key off the **User-level** env var (set), but the spawned sync process didn't inherit it and the key wasn't in `.env`. Captured as anti-pattern #16.
- **Fix (sync)**: added `load_dotenv_file()` to `tools/pinecone-sync.py` — loads vault `.env` into `os.environ` before reading the key, without overriding an existing var (explicit shell export still wins). Copied `PINECONE_API_KEY` from the User env var into the gitignored `.env`. Verified: sync runs clean with `PINECONE_API_KEY` removed from the shell (23 wiki files unchanged, exit 0).
- **Fix (preflight)**: tightened check #4 in `tools/preflight.ps1` to resolve the key the way the sync does — present only if in **process env OR `.env`**; "key only in User env, not in `.env`" is now an explicit **yellow** instead of a green. Verified: preflight with the key stripped from the shell still reports Pinecone green from `.env` (exit 1 only on the expected uncommitted-files warning).
- **Pinecone**: re-synced earlier this session (`--changed-only` → 1 wiki file / 21 chunks). Files changed this entry: `tools/pinecone-sync.py`, `tools/preflight.ps1`, `wiki/synthesis/claude-anti-patterns.md`, `wiki/log.md`. NOTE: end-of-session NotebookLM refresh + Pinecone re-sync for the wiki edits still pending.

## [2026-06-11] setup | Boat Budget app — budget model rework, per-category bars, revenue budgets, invoices, customers

Session record for the separate **Boat Budget** app (Supabase ref `aiugwzgxpwgmglpojgoz`, repo
github.com/joestev347-max/boat-budget, live boat-budget.vercel.app). Isolated from TUGOS/vessel-finance;
logged here per convention. Five commits, all built green + deployed READY; finance test suite grew
30 → 53 assertions (all pass); Supabase security advisors clean after each migration (only the 3
pre-existing benign SECURITY DEFINER warnings + leaked-password-protection remain).

- **Diagnosed a "budgets tab does nothing" report**: category budgets were write-only — only the
  Budgets tab read them; every other bar used vessel-level allocation. Not a save bug; a wiring gap.
- **Reworked the budget model** (commits `a57220b`→`fdfa0d5`): overhead is now a single **fleet-level**
  combined budget; **variable** is per-vessel. Vessel budget bars use the vessel's variable budgets
  (fallback to allocation); overhead shows as a fleet figure on the dashboard + Budgets fleet view.
  Migrated the 5 test overhead rows from Emma Rose → fleet (`vessel_id = null`).
- **Per-category budget-vs-actual bars** (`edcfd13`): variable + overhead breakdowns on vessel pages
  and dashboard. **Revenue budgets by code**: new `revenue_budgets` table (mirrors category_budgets:
  nullable vessel_id, cascade FKs, unique idx, RLS select-all + can_write write). Revenue bars use
  inverse color (over-target = green).
- **Invoice attachments on revenue** (`c173ca2`): the revenue entry form had no file field (expense
  did) — added an "Invoice (optional)" upload mirroring the expense receipt flow; recent-txn widget
  labels revenue rows "Invoice".
- **Customers** (`5eec4b7`): new `customers` table (name, code, archived; RLS select-all + write
  `can_enter_txn`) + `transactions.customer_id` (FK on delete set null). Revenue form has a quick-add
  customer field (datalist of existing names, or type new — find-or-create by case-insensitive name).
  Dashboard "Revenue by customer" table + Reports CSV; uncoded revenue rolls up as "Unassigned".
- New anti-pattern **#17** (inline `$`-vars mangled in Desktop Commander PowerShell `-Command`).
- Next session: HANDOFF.md in the Boat Budget repo is refreshed. Open items there: optional Customers
  management page (rename/archive), decide whether vessel allocation should mean variable-only, May/June
  monthly reports still pending, security hardening still deferred.

- **End-of-session sync (2026-06-11)**: Pinecone `--changed-only` → 2 wiki files / 41 chunks (21 unchanged). NotebookLM: re-added `claude-anti-patterns.md` (reminder bucket) + `log.md` (default bucket) and **VERIFIED** — the reminder bucket now answers anti-pattern #17 (inline `$`-var mangling) correctly. `refreshed: 2  verified: yes`. **Cleanup debt**: `source delete-by-title` aborts when a title is ambiguous (multiple sources share the name), so old copies were NOT removed while `source add` still ran → duplicate sources accumulated (reminder has 3× `claude-anti-patterns.md`, default has 3× `log.md`). Next session: delete the stale duplicates **by ID** (keep reminder `0680023a…`, default `0e75eac7…`) via `notebooklm source delete --notebook <id> <source_id> -y`. This ambiguous-title no-op is the real cause of earlier "refresh didn't land" notes.

## [2026-06-12] setup | Boat Budget — entry/category overhaul: day-rate billing, multi-vessel split, vendors/employees

Continuation session on the **Boat Budget** app (Supabase `aiugwzgxpwgmglpojgoz`, repo boat-budget,
live boat-budget.vercel.app). 8 commits, all built green + deployed READY; finance suite steady at
**54/54**; Supabase security advisors clean after every migration (only the 3 pre-existing benign
SECURITY DEFINER warnings + leaked-password remain). Final HEAD `9fe970d`.

- **Cleared all dummy/experimental data** (transactions, transfers, all budgets, operating days)
  per Joe; kept the 4 vessels + the April 2026 monthly report. One orphaned storage receipt
  (`Emma-Rose-Spec-Sheet.pdf`) could NOT be removed — Supabase blocks direct `storage.objects`
  deletes (a `protect_delete` trigger) and the repo only has the anon key; needs the dashboard or a
  service-role key. Claude-in-Chrome was attempted but no browser/extension was connected.
- **Vessel budget = variable-only** (`f0b82c5`): the $25k/$300k allocation is a VARIABLE budget;
  bars + variance now measure variable spend only; relabeled fields "variable".
- **Customer/Vendor dropdowns with inline "Add new"** (`1f83cdf`): new `vendors` table +
  `transactions.vendor_id`; generalized `PartyPicker`. Expense-by-vendor report (`8bc0f8c`).
- **Revenue categories → Shifting/Assist/Time Charter/Towing** + **revenue_subcategories** table
  (Day Rate/Hourly/Trip Price per category) (`8bc0f8c`). Renamed overlapping cats to preserve the
  April Towing line; deleted the 4 unused.
- **Day-rate / hourly billing** (`1749aab`,`864b7b5`): `transactions.rate_detail` jsonb; revenue
  Day Rate auto-counts days from a date span (inclusive) × day rate + hours × hourly rate; Hourly =
  hours × rate; Trip Price = lump sum. Server stores the breakdown; client computes the amount.
- **Expense overhaul** (`a047944`): overhead removed from the expense category dropdown (variable
  only); added Grub + Equipment Charter; cost subcategories replaced with Com Data/Invoice (old ones
  archived to preserve the April report); **multi-vessel split** (checkboxes → even split into one
  txn per vessel, remainder cents distributed, receipt attached to each).
- **Equipment Charter billed per day** (`00c954a`): expense day-rate mirroring revenue, combines
  with the split (rate_detail carries split_count).
- **Truck Fuel** category + **shoreside_employees** table + `transactions.shoreside_employee_id`
  (`9fe970d`): when the Com Data subcategory is selected, a Shoreside-employee picker appears so
  credit-card expenses can be tagged to people, not only vessels (still allocates to a vessel).
- New anti-pattern **#18** (NotebookLM delete-by-title is a silent no-op on ambiguous titles).
- Open items carried to HANDOFF.md: orphaned storage file; uneven/weighted cost split; non-vessel
  (employee-only) expenses; customer/vendor/employee management page; May/June reports; security
  hardening; confirm inclusive vs exclusive day-count convention.

- **End-of-session sync (2026-06-12)**: Pinecone `--changed-only` → 2 wiki files / 45 chunks. NotebookLM **deduplicated by ID** (deleted 3 stale `claude-anti-patterns.md` from reminder + 3 stale `log.md` from default — the accumulation from anti-pattern #18), then added one fresh copy of each. **Verified**: reminder bucket answers anti-pattern #18 correctly. Both buckets now 1 source per title. `refreshed: 2  verified: yes  dedup: done`.


## [2026-06-19] setup | Boat Budget — barges, price-per-ton, budgets cleanup, accounting reconciliation

Large feature session on the **Boat Budget** Next.js app (`joestev347-max/boat-budget`, master, auto-deploys to Vercel). Every change committed + pushed + verified READY; HEAD `0227a1b`. App tests 61/61, build clean throughout.

- **Barges & shoreside cost centers** (`f036a0f`…): a `kind` column on `vessels` (`vessel`/`barge`/`shoreside`, already on live DB). `getReferenceData` partitions vessels/barges/shoresideCenters; a single pure `txnsForVesselIds` walls barge/shoreside txns out of every fleet figure (dashboard, exec actuals, full-ledger CSV, monthly reconciliation). Shoreside = single expense bucket; barges = revenue-only.
- **Price per Ton** revenue **subcategory** (`7f820cc`): one shipment → boat revenue (tonnage × $/ton) to the vessel **and** $2/ton barge rental to the single "Barge Rental" bucket. **NYS sales tax** 8.625% on the rental (NY only), tracked separately as a remittable liability (`sales_tax`/`tax_state` cols).
- **Barge charter** revenue: multi-select barge #s, each at its own day rate; one record per barge on the bucket. Docks + barge_units tables (find-or-create pickers).
- **Demo data cleared** (backed up to `_demo_backup_*`): 0 transactions, docks/barge_units/customers cleared for manual entry. 4 vessels + Barge Rental + Shoreside buckets remain.
- **Edit-transaction** feature (admin edits/deletes any entry).
- **Budgets = single source**: removed per-vessel budget fields from the Vessels page (vessel = info only); **revenue targets removed from Budgets** (live only in Fleet Utilization); added a **Barge overhead** scope (new `Barge Overhead` cost category). Fleet Utilization day-rate defaults to $12,500 and persists per browser.
- **Executive** page: company-wide ALL revenue/expenses (vessels+barges+shoreside) with by-category tables, above the fleet-only section.
- **Monthly Reports**: fleet/barge **scope**, add-report form, file upload+attach (receipts bucket, allowed-MIME extended for xlsx), client-side parse of **only the "HMS Comb" tab** of accounting's Viewpoint/Vista workbook → maps each line item to category/subcategory (mirrors the demo April mapping) → server resolves names→ids → per-category reconciliation vs entered data. Verified against `HMS APRIL.xlsx`: Revenue 1,089,389.82 / Expense 1,106,246.30 / Net −16,856.48 (25 lines).
- New anti-patterns **#19** (target the named sheet in a multi-sheet workbook, not first-match) and **#20** (parse uploaded files client-side, not in a serverless action). #15 (NODE_ENV → npm omits devDeps) recurred when `npm install xlsx --save` pruned devDeps — fixed with `npm install --include=dev`.
- Open items / next session: build the **barge** monthly-report tab parser (awaiting a sample barge report); the manual-totals fallback exists for non-HMS layouts; consider a month-by-month sales-tax-collected breakdown; barge overhead is combined (not per-barge).

- **End-of-session sync (2026-06-19)**: Pinecone `--changed-only` → 2 wiki files / 49 chunks. NotebookLM refreshed by **ID** (deleted + re-added `claude-anti-patterns.md` in reminder, `log.md` in default; still 1 source per title). **Verified**: reminder bucket answers new anti-pattern #20 (parse uploaded files client-side) correctly. `refreshed: 2  verified: yes`.


## [2026-06-22] setup | Boat Budget — Executive period selector, overhead in net, barge revenue split, fuel/lube + surcharge, fleet overhead allocation

Large feature session on the **Boat Budget** Next.js app (`joestev347-max/boat-budget`, master, auto-deploys to Vercel). 12 commits, each committed → pushed → confirmed Vercel **READY** via the Vercel MCP `get_deployment` (state READY); `next build` clean (TypeScript passes) every time; finance engine tests **61 → 91** (`node scripts/finance.test.ts`, re-verified 91/91 at wrap). Final HEAD `8663ea5` (incl. the handoff doc; last code commit `5e8e358`).

- **Executive page period selector** (`3d90a41`): Single month / Year-to-date · month · year via `searchParams`; every figure scopes to the period. `buildFleetView(ref, yearData, year, months?)` gained an optional `months` arg — omitted = year-wide (Fleet/Reports/Forecast unchanged), supplied = period-scoped + fleet overhead folded into expense/net. New pure finance helpers: `computeVesselFinancialsForMonths`, `fleetPeriodOverheadBudget`, `categoryPeriodBudget`, `vesselVariablePeriodBudget`, `netPeriodTransfer` (+30 unit tests). Annual overhead pro-rated ÷12/month; 12-month trend chart stays full-year.
- **Fleet shared overhead now hits the bottom line**: it was entered as a `vessel_id=null` budget but Company net was transactions-only, so overhead never reduced net. Now folded into Executive expense/net (per period) and into Fleet & Profitability's headline Overhead/Net — and **split evenly across the vessels** in the detail table (`fleetOverhead / vesselCount` carried into each row's overhead/net/margin/cost-day). Split basis is even (could be weighted later).
- **Barge revenue split into two streams treated oppositely** (`fd8be71`,`b7464a3`,`9a45abc`): the **$2/ton rental** (Price-per-Ton auto-target, "Barge Rental" revenue category) is internal tug→barge income → lives only on the Barges tab (barge net income = rental − overhead), excluded from company revenue. **Barge charter** (any other category on the barge bucket) is external company income → shown as a "Barge charter revenue" line on the Executive page, in All revenue + Company net, excluded from barge net income. (Added then removed a redundant charter stat box per Joe.)
- **Day-rate reimbursed fuel & lube** (`f6c08d7`): fuel/lube start/stop meter readings × $/gal, billed as revenue, added to the day-rate total → flows into fleet revenue. Stop readings optional at start, filled at job end via the **Edit modal** (now recomputes amount). Stored in the `rate_detail` jsonb (no DB migration); `updateTransaction` now persists `rate_detail` when the edit form supplies it.
- **Fuel surcharge %** on **every** revenue subcategory (`0057ce8`): % of the base rate (excl. fuel/lube), billed as revenue — Day Rate/Hourly/Trip/Price-per-Ton(boat)/barge charter. Stored as `rate_detail.fuel_surcharge_pct`.
- **Fleet & Profitability**: "Cost/$ rev" column → **"Revenue/day"** (`ce473bf`).
- New anti-patterns **#21** (re-scoping a value but missing a secondary aggregation of it) and **#22** (PowerShell mangles `git commit -m` messages containing `()`/`$`/`/` → use `git commit -F <file>`).
- **Honest caveat carried to HANDOFF.md**: this session's barge/fuel/lube/surcharge/fleet-allocation changes are verified by clean TypeScript build + deploy + math reasoning, but were **not exercised at runtime** (no click-through with real data). Next session item #1 is to runtime-test them.


## [2026-07-01] setup | Boat Budget rollout prep — cleared test data, monthly-overhead chart fix, backup system, security lockdown

Cowork session prepping the **Boat Budget** app (`joestev347-max/boat-budget`, Supabase project `aiugwzgxpwgmglpojgoz`) for team rollout. HEAD `dbd532c`, deployed READY to Vercel (`boat-budget.vercel.app`). All claims re-verified at wrap per audit-before-claim.

- **Cleared test data**: deleted all 74 leftover test transactions → `transactions` = 0 (fresh count verified) for a clean July slate. Vessels (6), barge_units (24), `_demo_backup_*` tables (112 txns), and the HMS APRIL report left intact.
- **Executive monthly-overhead fix** (`a297834`, deployed via no-op nudge `dbd532c`): the "Monthly revenue vs. expense" bar summed only variable expense txns, omitting shared fleet overhead. Added a per-month `overhead` to `dashboard.ts` `monthlySeries` (monthly rows + annual/12) and folded it into the expense bar on the Executive page **only** (forecast left on txn-only expense to avoid silently changing projections). `next build` clean, finance tests 91/91.
- **Backup system stood up** — new private repo `joestev347-max/boat-budget-backups`: GitHub Actions daily 07:00 UTC → `supabase db dump` (roles+schema+data) → `backups/daily/` (90-day retention) + permanent `backups/monthly/` + a `receipts` storage-bucket mirror. Secrets: `SUPABASE_DB_URL` (session pooler) + `SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key). Verified: `daily/2026-07-01.sql.gz`, `monthly/2026-06.sql.gz`, 2 receipt files. Supabase upgraded to **Pro** (managed daily backups; PITR intentionally not enabled).
- **Security**: disabled public signups (invite-only); invited `tcarsch@hauglandllc.com` and set **Administrator** via `UPDATE public.profiles`; enabled leaked-password protection (advisor warning cleared). Read model confirmed: every `authenticated` user can `SELECT` all tables (`qual=true`); writes are role-gated (`can_write()`/`can_enter_txn()`) — so locking public signups is the real control for a public-URL app.
- New anti-patterns **#23** (Vercel webhook didn't fire → nudge with empty commit), **#24** (Supabase pooler password auth / can't ALTER `postgres` role via SQL), **#25** (auth config + user creation are control-plane only, not data-plane MCP/SQL).
- **Open items / next session**: (1) delete leftover test account `jstevenson@hauglandllc.com` (read-only, created during a signup-toggle test); (2) `tcarsch` invite still pending (unconfirmed, never logged in); (3) rotate DB password + `sb_secret_` key — both passed through chat; (4) optional advisor cleanup: 3 `SECURITY DEFINER` funcs (`can_enter_txn`/`can_write`/`my_role`) → private schema, drop `_demo_backup_*`; (5) Fleet & Profitability still annual-only (no period selector); (6) forecast excludes fleet overhead; (7) runtime-verify the 6/22 barge/fuel/surcharge changes with real data.

- **End-of-session sync (2026-07-01)**: Pinecone `--changed-only` → 2 wiki files / 61 chunks (21 unchanged). NotebookLM refreshed **by ID** (reminder: `claude-anti-patterns.md` → new `c0889fb8`; default: `log.md` → new `0519751b`). **Verified**: reminder bucket correctly answers new #23 (Vercel webhook → nudge with empty commit) and #25 (Supabase auth config/user creation is control-plane, not SQL). `refreshed: 2  verified: yes`.


## [2026-07-28] schema | Boat Budget — Transactions tab, full transaction editing, user-managed cost categories

Feature session on the **Boat Budget** app (`joestev347-max/boat-budget`, master, auto-deploys to
Vercel; Supabase `aiugwzgxpwgmglpojgoz`). Four features, each committed → pushed → confirmed Vercel
**READY** via the Vercel MCP (matching SHA); `next build` clean + finance tests **91/91** before every
push. Final HEAD `220fd3e`.

- **Transactions tab** (`002c2e9`): new sidebar item + `/transactions` — lists every revenue and
  expense entry (vessels + barges + shoreside), defaults to the current month, filters by type,
  coded-to center, category, subcategory, customer, vendor, and free-text; count/revenue/expense/net
  tiles + CSV export of the filtered set. Reuses EditTransaction/Attachments/CsvButton. Added
  `revalidatePath("/transactions")` to the txn + attachment mutations.
- **Full transaction editing** (`d586e65`): expanded the edit modal from a few fields to EVERY field
  except direction — coded-to, category/subcategory, customer/vendor/shoreside employee (inline
  "+ add new"), full rate breakdown (dates/day-rate/hourly/hours/fuel/lube/surcharge, amount recomputed
  live for day-rate/hourly/equipment-charter/barge-charter), and shipment fields for price-per-ton
  (tonnage/docks/barge #/tax). Lump-sum, price-per-ton, and split entries expose the amount directly.
  `updateTransaction` now persists all of it; the form carries unshown columns as **hidden inputs** so an
  edit never nulls an unrelated field.
- **User-managed cost categories — Budgets panel** (`338fc55`): add a category (variable/overhead),
  archive/restore; `createCostCategory` (dedupe by name+grp, append sort_order) + `setCostCategoryArchived`.
  Archived categories hidden from expense entry + budget sections, kept for historical filtering. The
  `costcat_write` RLS policy (`can_write()`) already allowed inserts — no migration.
- **Inline cost-category add on the Expenses tab** (`220fd3e`): "+ Add new category" in the expense
  cost-category dropdown (write roles only); server `resolveCostCategoryId` find-or-creates a variable
  category by name and codes the expense to it, reusing the row across a multi-vessel split.
- **Data check (Supabase MCP)**: chased a "WEEKS customer missing from the Transactions filter" report —
  WEEKS is a **customer** (19 revenue txns this July), so it correctly lives in the Customer filter, not
  the Vendor filter; not a bug. **115 live July transactions** now in the DB (rollout underway); 19
  customers / 30 vendors.
- New anti-patterns **#26** (Supabase MCP multi-statement SQL returns only the last result) and **#27**
  (remote-devices bridge drops mid-edit → verify landed state, batch build+commit). The device bridge
  disconnected several times mid-session; the combined build→test→commit script is what let the last
  feature survive a drop.
- **Honest caveat**: all four features verified by clean `next build` + 91/91 + Vercel READY + code review,
  **not** a runtime click-through — but there is now real July data to exercise them against.
- HANDOFF.md refreshed.

- **End-of-session sync (2026-07-28)**: Pinecone `--changed-only` → 2 wiki files / 65 chunks (21 unchanged). NotebookLM refreshed **by ID** (reminder: `claude-anti-patterns.md` → `05932d62`; default: `log.md` → `975b0be5`) and **VERIFIED** — the reminder bucket answers new anti-pattern #27 (bridge drops mid-edit), the default bucket lists the four 2026-07-28 Boat Budget features. `refreshed: 2  verified: yes`.


## [2026-08-04] schema | Boat Budget — subcategory filter, shoreside revenue + user-managed revenue categories, barge-charter routing, report-import warning, fuel/lube meter fix, fuel-surcharge editing

Feature + fix session on the **Boat Budget** app (`joestev347-max/boat-budget`, master, auto-deploys to Vercel; Supabase `aiugwzgxpwgmglpojgoz`). **7 commits, each → `next build` clean + finance tests 91/91 → pushed → confirmed Vercel READY (matching SHA) via the Vercel MCP.** Final HEAD `6c1887c`.

- **Transactions filters** (`1b95e03`): grouped the Subcategory filter by parent category (optgroups + Revenue/Expense context) instead of a flat list of ambiguous duplicate names; added a **Source** filter (All / Com Data / Invoice) keyed off the existing "Com Data" cost subcategory. No schema change.
- **Shoreside revenue + user-managed revenue categories** (`dcbc1aa`): revenue can now be coded to the Shoreside center (its own bucket on the Executive dashboard, hits company All revenue, stays out of Fleet); revenue categories are now user-managed (`createRevenueCategory`/`setRevenueCategoryArchived` + Budgets panel + inline "+ Add new category" on the revenue form) — **no migration** (`revcat_write` RLS `can_write()` already existed).
- **Barge-charter routing** (`2aa58bf`): barge charter entry now has an **All revenue vs Barges only** toggle. "Barges only" files under a new seeded **"Barge Charter"** system revenue category -> counts in Barges-tab net income (per barge #), excluded from company All revenue (like the internal $2/ton "Barge Rental"). Both barge-segment categories excluded from Executive All revenue.
- **Monthly-report import** (`053ff7d`): `ReportUploader.parseHmsComb` now surfaces unrecognized "HMS Comb" line labels (excluding total/subtotal rows) in an amber warning instead of silently dropping them — non-destructive (still not imported; can't auto-categorize without double-counting subtotals). Fixes the "new/renamed accounting line silently understates the report" gotcha.
- **Fuel-surcharge editing in the edit modal** (`f8b58a4` then `6c1887c`): surcharge was only editable on day-rate/hourly entries. Added Base amount + surcharge % + recomputed Amount to **every** revenue entry without a rate breakdown (lump-sum first, then broadened to price-per-ton + split). Stores `base_amount` in `rate_detail` (whitelisted server-side) for idempotent re-edits.
- **Fuel/lube meter-direction bug** (`01655f7`): gallons used was `max(0, stop - start)` (assumes a cumulative UP meter); crews reading tank levels (count DOWN) enter start > stop, so reimbursement silently computed to $0 and never hit revenue. Now `|stop - start|` with a "blank stop = 0" guard, in all 4 sites (entry form, edit recompute, both rate-summary ledgers). **Corrected the one affected row: Miss Madeline July revenue 279,000 -> 288,988.60** (fuel 2358 gal x $4.15 + lube 10 gal x $20.29; SQL-verified). Fleet scan found no other high-to-low entries.
- **Data**: seeded "Barge Charter" revenue category (`d11848b2`); Miss Madeline amount corrected. User self-loaded the May monthly report via the app.
- **Diagnostic**: Executive "All revenue" vs Transactions "Revenue" differ by exactly the barge segment — July $1,156,161.75 (Transactions, all rows) - $132,437.40 (Barge Rental $54,936.00 + Barge Charter $77,501.40) = $1,023,724.35 (Executive). By design; both correct.
- New anti-patterns **#28** (fixed one subtype, claimed the capability — check the data distribution first) and **#29** (`max(0,.)` floor / allow-list filter silently swallows inputs that violate the assumption — surface it).
- **Honest caveat**: all 7 features verified by clean `next build` + TypeScript + finance tests **91/91** + Vercel READY + code review — **NOT** a runtime click-through. The 91 tests cover only the pure `finance.ts` engine, not the UI components changed this session. Next-session item #1: runtime-verify.
- HANDOFF.md refreshed.

- **End-of-session sync (2026-08-04)**: Pinecone `--changed-only` → 2 wiki files / 71 chunks (21 unchanged). NotebookLM refreshed **by ID** (reminder: `claude-anti-patterns.md` → `5ec48286`; default: `log.md` → `ffb3e63b`) and **VERIFIED** — the reminder bucket answers new anti-pattern #29 (silent `max(0,·)` / allow-list drop), the default bucket lists the seven 2026-08-04 Boat Budget features. `refreshed: 2  verified: yes`.


## [2026-09-02] schema | Boat Budget — barge period selector + coverage, standing charters, remembered period, Transactions filter rebuild, green lint, budget carry-forward, vessel period selector, source subcategories

Feature + fix session on the **Boat Budget** app (`joestev347-max/boat-budget`, master, auto-deploys to Vercel; Supabase `aiugwzgxpwgmglpojgoz`). **8 commits, each → tests + `next build` clean → pushed → confirmed Vercel READY (matching SHA) via the Vercel MCP.** Final HEAD `0fb128b`. Finance-engine assertions **91 → 132**.

- **Barges period selector + overhead coverage** (`a3ab480`): `/bulk` read every figure year-wide while barge overhead is a recurring MONTHLY cost, so a 12-month overhead total sat next to one month of revenue. Added the Executive-style month/YTD selector; overhead now resolves through the tested `categoryPeriodBudget`. New pure `bargeCoverageBar()` (revenue-vs-target semantics, colors inverted vs the expense bars) + coverage card + per-barge "% of overhead" column. **Data**: the "$250k overhead" the user believed was monthly was actually a June $200k + July $50k sum — replaced with 12 monthly rows of $250,000 for 2026.
- **Standing monthly barge charters** (`b361440`): HG 701 / HG 702 / Pontoons charter for flat monthly amounts but were entered as `day_rate × 30` (drifts with month length; a 31-day month would bill HG 701 $25,835). New `barge_charter_schedules` table + `post_barge_charters(year, month)` DB function, idempotent per (barge unit, month), run by a **pg_cron job on the 1st at 06:00 UTC**, plus a manual "post this month" button. Seeded 701=$25,000 (TOMKINS COVE), 702=$40,000 (METS), Pontoons=$25,000 (METS) = **$90,000/mo**. July corrected to round figures; **August and September backfilled — August's $90k had never been entered**, which is why August barge coverage read 30% instead of 66%.
- **Remembered period** (`50ba313`): the Executive period lived only in the URL, so leaving the page and returning snapped back to the current month. New `src/lib/period.ts` resolves URL params → per-page cookie → current month; the selector now posts to a `setPeriod` server action (scope allow-listed before it picks a redirect target). Selector markup lifted into a shared `PeriodSelector`.
- **Transactions filters rebuilt** (`e8f352e`): ten dropdowns in a flat grid, several of which could only combine into an empty result. **Of 547 transactions, ZERO carry both a customer and a vendor** — so those two filters could never be used together; merged into one "Customer / vendor" control. Source (Com Data) is expense-only but showed while viewing revenue — now hidden when it cannot apply. Year+Month collapsed into one Period control (Year previously had no "all"); every dropdown now lists only options with entries in the current period/type, each with its count (the Subcategory list could otherwise render 67 options across ~24 groups). Active filters render as dismissible chips; the empty state names them.
- **Green lint** (`7845810`): `npm run lint` had been exiting 1 on **39 pre-existing errors** since at least `8e4005c`. Typed the test mocks against the real interfaces (+ a `txn()` factory) and deleted all 37 `@ts-ignore`; replaced two `set-state-in-effect` calls in `UtilizationView` with `useSyncExternalStore` (localStorage IS an external store) and render-time state adjustment. See anti-pattern **#31**.
- **Budgets recur month to month** (`454fc71`): every budget row is a single month, so a month nobody typed into was a budget of ZERO — fleet overhead had been hand-copied July→August (**and Rent was missed in the copy**), and the four vessels had no variable budget past July, so Aug/Sep variance was measured against nothing. Budgets now **carry forward**: a month with no row inherits the most recent earlier month, across the year boundary; an entry overrides from that month on; months before the first entry stay at zero. Resolved at read time (no cron, no duplicated rows, retroactive). Annual helpers became the sum of the twelve effective months. `categoryBudgetOrigin()` reports explicit/inherited/none so the Budgets page labels "Carried forward from <month>" and offers "use carried-forward value" to unpin; saving an unchanged inherited value writes nothing. **Effect (SQL-verified), September 2026: fleet overhead 0 → 805,000; each of 4 tugs 0 → 15,000.** Two existing assertions changed meaning (February now carries January rather than falling back to `monthly_budget_allocation`) and were updated, with a new test pinning the fallback that remains.
- **Vessel page period selector** (`01043d4`): `/vessels/[id]` was year-wide with no control. Added the same month/YTD selector (its own cookie); revenue, expense, net, margin, efficiency, the budget bar, both breakdowns and the transaction list are period-scoped. The month-by-month bar list deliberately stays full-year with out-of-period months dimmed. New `categoryPeriodActual`/`revenuePeriodActual`; the annual versions delegate to them. The period module gained a `vessel` scope whose dynamic path is built by `periodRedirectPath`, appending the id only when it matches a UUID.
- **Source subcategories** (`0fb128b`): reported as "adding a new vendor won't let me pick Com Data or Invoice" — the vendor picker was not involved; **both category-creation paths inserted a category with no subcategories**, so DUES & SUBSCRIPTIONS, HMS Trucks, RENT and TUG FUEL were bare and their expenses were invisible to the Transactions Source filter. New `ensureSourceSubcategories()` seeds Com Data + Invoice on creation (both paths); backfilled the four — **all 11 variable categories now carry the pair**. The inline "+ Add new category" flow replaced the subcategory dropdown entirely, so the entry that created a category could never be tagged; it now posts the source by NAME and the server matches it to the pair it just seeded.
- New anti-patterns **#30** (`SECURITY DEFINER` exempting null `auth.uid()` also exempts anon — caught by `get_advisors` before release), **#31** (tests+build green is not verification when lint is already red), **#32** (stale `tsconfig.tsbuildinfo` lets `next build` skip type-checking a changed file).
- **Honest caveat**: all 8 commits verified by tests + lint + clean `next build` + Vercel READY + code review, and every data claim by independent SQL — **NOT** a runtime click-through. The browser pane was at the sign-in screen all session and credentials are never entered. This is now the **second consecutive session** shipping UI unverified; it is next-session item #1.
- HANDOFF.md rewritten.

- **End-of-session sync (2026-09-02)**: Pinecone `--changed-only` → 2 wiki files / 80 chunks (21 unchanged). NotebookLM refreshed **by ID** (reminder: `claude-anti-patterns.md` `5ec48286` → `112d2a45`; default: `log.md` `ffb3e63b` → `1a159df6`) and **VERIFIED** — the reminder bucket answers new anti-patterns **#30** (`SECURITY DEFINER` null-`auth.uid()` exemption also exempts anon) and **#32** (stale `tsbuildinfo` skips type-checking), and the default bucket lists all eight 2026-09-02 Boat Budget features plus final HEAD `0fb128b`. `refreshed: 2  verified: yes`.


## [2026-09-05] query | Boat Budget — HMS July monthly report: importer post-mortem + full reconciliation against app actuals

Analysis session on the **Boat Budget** app. **No commits, no schema changes, no deploys** — the deliverable is a variance report and a defect list. HEAD remains `0fb128b`. Roll Call could NOT run: the vessel-finance vault was not a connected folder at session start and `device_bash` reported "Workspace unavailable — the isolated Linux environment on this device failed to start", so `tools/preflight.ps1` was unreachable; Desktop Commander only reappeared at wrap. Reported as BLOCK rather than assumed green.

- **The July report was in the app with a file and ZERO lines.** `monthly_reports` had the row (`bdbf8f91`, HMS JULY, uploaded 2026-09-05 10:42 UTC, `reports/7ecf9be3-…-HMS_JULY.xlsx`, 751,744 b — the upload itself was fine); `monthly_report_lines` had 0 rows against April's 25 and May's 25. **Three stacked defects**, each sufficient on its own:
  1. `parseHmsComb` reads the label from column C and the amount from `r?.[3]` (column D). April/May had amounts in D; **July has them in E** — accounting inserted a column. Every row fails `typeof amt !== "number"` and `continue`s, so the parser returns zero lines **and** zero unmapped warnings — the `continue` sits *before* the unmapped check, so the amber box shipped on 2026-08-04 (`053ff7d`) for exactly this situation cannot fire. See new anti-pattern **#33**.
  2. `monthly_report_lines` carries `CHECK (amount >= 0)`; July has **Misc Job Expense −$1,576.00** and **Employee Benefits-SGA −$1,513.90**. Fixing (1) alone still kills the whole batch.
  3. `saveMonthlyReport` (`actions.ts` ~L1033) calls `.insert(lines)` and **discards the error**, so a rejected batch is indistinguishable from success. See new anti-pattern **#34**.
  - **Fix**: take the amount as the last numeric cell in the row (survives future column moves), drop the `>= 0` constraint, check the insert result, and add a guard for "sheet found but no row produced a number" = layout change, fail loudly. Not yet implemented — next session.
- **Workbook structure** (`HMS JULY.xlsx`, 38 tabs, 36 hidden): `HMS Comb FS` is the combined income statement (col A = the GL account mask per line, col C = label, amount column moves); **`Detail`** is 946 GL rows (Company, ActDate, Source, Account, GLACT/GLDT Description, Amount) filtered to accounts `5*–9*`. Expenses are positive debits, revenue accounts negative credits; the P&L flips sign on the revenue line only. **Every finding below came from `Detail`, which the importer ignores entirely.**
- **Verified the statement against its own detail**: all 25 non-zero P&L lines re-added by account mask from the 946 GL rows. 23 tie to the penny. Two do not, and they are the same entry.
- **$503,130 error inside accounting's own report.** Four vessel-owning entities (co `157/184/185/186` — depreciation `62725`, equipment interest `62750`, hull insurance `62500`) charge the operating company (co `183`) for equipment use: credit `63999 Fleet-Rev-Inter Equip Use`, debit `52000.80x Internal Equip Usage`. Both sides total **$505,610.64** — the entry balances in the ledger. But the P&L's Revenue line `[41*,63999]` pulls the credit in full while its **Equipment charges** line `[52000]` pulls only bare account 52000 (**$2,480.64**) and misses every `.801/.802/.803` sub-account. The mask *can* reach sub-accounts — Truck and Auto Expenses correctly sums `55025.801/.802/.803` — so this is a one-line mapping error. **Reported net income $277,909.08; actual −$225,220.92.** Outside revenue is **$881,811.27**, not $1,387,421.91. Both corrections agree: `1,387,421.91 − 1,612,642.83 = −225,220.92` and `881,811.27 − 1,107,032.19 = −225,220.92`. Cross-check: `Detail` total 1,107,032.19 + 2,480.64 = 1,109,512.83 = P&L total expenses.
- **Job → vessel map (use the job, not the sub-account)**: `807823`/co157 = Everly Mist `.801`; `808723`/co184 = Emma Rose `.802`; `808823`/co185 = Miss Madeline `.803`; `809625`/co186 = **Lily Anne `.804`**. Job 809625's field office correctly posted to `55050.804`, but its **$135,005 equipment charge and its fuel posted to `.802` — Emma Rose is carrying Lily Anne's costs**, and Lily Anne has no equipment charge, fuel, materials, fringe or payroll-tax sub-account for July at all.
- **$205,994.71 of charges hitting HMS with no app entry**, led by **management fees $169,361.79 for one month** (`78000` payroll 50,724 / `78001` occupancy 18,290 / `78002` selling 2,080 / `78003` other 109,327.09 GL-journal "allocation from NYS" + 9,278, less 20,337.30 of reversing credits). They are allocated by journal with no invoice and land inside **Misc Expenses** (89% of that line's $110,641.05) and **Salaries-SGA** (the `[…,78000,…]` mask). The app has no category for them — the single largest blind spot. Also: NYS Bulk **$17,404** of *June* barge tonnage, "Elizabeth" charter-in $6,532.57, Nabrico gearbox $7,755 (dated 05-28), Winegard Starlink $2,105 (06-30), Sunbelt $1,377.27 (05-27), Grace-allocated bank fees $965.21 (HMS's own share is a −$118.53 *credit*), Nabrico −$2,503.00 credit.
- **13 AP invoices totalling $42,823.24 carry non-July dates** (2026-02-02 through 2026-08-01) yet sit in the July P&L. The February one is described "Dumpster Rentals to **HG Ticket**" — reads like a sister-company cost on HMS. A stale-date scan of `Detail` is the cheapest monthly catch available.
- **Fuel is wrong on both sides.** App: 2 entries, $73,681.35 (Lily Anne 42,511.71 + Emma Rose 31,169.64). Accounting `55025.*` nets **$23,345.33** — because underneath sit **nine prepaid-fuel journal adjustments worth −$87,852.87 net**, including `+283,507.08 / −215,027.13 / −146,943.13` on Everly Mist alone, which drives its July fuel *negative* $69,535.43. Of the AP rows: the **20 July Buckeye $42,511.71 is Lily Anne's**, coded to Emma Rose (the app has it right); **Joe's Auto Part $8,927.75 is 55 gal of 40SAE lube oil** coded to Fuel–Everly Mist (the app has it right as R&M); the **Global Companies $28,589.10 is dated 9 June** and has no app entry in either month.
- **7 bucket mismatches** (same dollars, different heading): NP Staten Island KMI $24,000 (acct Office Rent / app Misc Expenses); Kirby Offshore mooring $6,762.60 (Equip Rent / Dock Rent); Tompkins CAMF $2,407.50 (Office Rent / Misc Expenses); Meyerrose $927 (Professional Services / Misc Expenses); Quest DOT panel $27.80 (Drug Testing / Dues & Subscriptions); plus two real dollar variances — **Hughes Brothers charter 24,384.38 vs app 24,397.00 ($12.62)** and **Grainger 1,250.62 vs 1,250.00 ($0.62)**.
- **Revenue gap.** App July revenue 1,581,914.11 (89 entries); less internal $2/ton barge rental 54,936 → 1,526,978.11; less Grace Industries 164,036 (sister company, 11 jobs) → **1,362,942.11 third-party** against accounting's **881,811.27** = **$481,130.84 unexplained**. The two largest app entries — MTS CIM tandem hopper tow **$390,337.76** (Everly Mist) and Kiewit Key Bridge **$288,988.60** (Miss Madeline), both dated 1 July as full-month day-rate — would close most of it if invoiced in August. **Not yet confirmed; do not treat as missing revenue.**
- **Fleet overhead ran $140,694.75 (17.5%) over budget** in July: Payroll 559,055.03 vs 460,000; Equipment 202,638.65 vs 160,000 (**705,768.65** once the omitted internal charges are added back); Indirect Payroll 130,656.81 vs 140,000; Travel Pay 24,529.26 vs 45,000; **Rent 28,815.00 vs a budget of 0**.
- **Also flagged**: account `75000 "Unallocated Credit Card"` took a $121,464.00 debit and an identical credit on 1 July, leaving −$884.98 of Comdata; and the app's $50,000 Four Leaf "Blue Angels Ferry" entry carries the note `**change to shoreside**` and is still on Lily Anne.
- **Deliverable**: variance report published as a Claude artifact — 8 parts, ending with 12 numbered questions for accounting ranked by dollars at stake, plus 6 app changes. Every figure traced: 946 GL rows re-added by account against 25 P&L lines, 334 app transactions re-added by category/vessel/vendor/customer.
- **Project memory written** to the Boat Budget repo (`.claude` project memory: `MEMORY.md` + `monthly_report_reconciliation.md`) with the workbook structure, the company/job/vessel map and the five recurring monthly checks.
- New anti-patterns **#33** (position-keyed parsing + an unreachable diagnostic), **#34** (unchecked `.insert()` makes a rejected batch look like success), **#35** (a statement that ties to its own subtotals is not verified — cross-foot both sides of paired entries and reconcile from the detail).
- **Honest caveat**: the importer fix is **designed, not implemented** — no code changed this session, so nothing was built, tested or deployed. The runtime-verification debt from 2026-08-04 and 2026-09-02 is **untouched and now three sessions old**. HANDOFF.md refreshed.

- **End-of-session sync (2026-09-05)**: Pinecone `--changed-only` → 2 wiki files / 91 chunks (21 unchanged), exit 0. NotebookLM refreshed **by ID** (reminder: `claude-anti-patterns.md` `112d2a45` → `2b029bf3`; default: `log.md` `1a159df6` → `597dcc12`), both `source wait` → ready, and **VERIFIED** — the reminder bucket returns new anti-patterns **#33** (position-keyed parsing, unreachable diagnostic), **#34** (unchecked `.insert()`) and **#35** (foot-to-detail, cross-foot paired entries) with their corrective rules; the default bucket returns the 2026-09-05 entry, the **$503,130** report error and the −$225,220.92 corrected net income. `refreshed: 2  verified: yes`.
