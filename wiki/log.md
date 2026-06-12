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
