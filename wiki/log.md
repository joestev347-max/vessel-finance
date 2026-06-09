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
- Discovered the app runs on **SQLite** (a prior session swapped Postgres→SQLite); `dev.db` exists and is seeded. Docker not needed / not installed.
- Fixed a production-build blocker: TypeScript error indexing `as const` tone maps with a Prisma `string` field. Added `as keyof typeof STATUS_TONE` casts in `src/app/expenses/page.tsx` and `src/app/vessels/page.tsx`.
- Built successfully (`next build`, exit 0) and verified `/`, `/vessels`, `/expenses` return HTTP 200 with seeded data.
- Captured Windows toolchain gotchas (PATHEXT missing `.EXE`; node/npm/next not on the spawned shell PATH) as anti-patterns; added `_build.ps1` / `_start.ps1` helpers.
- Installed the Limitless Stack: 7 skills to `~/.claude/skills/`, this wiki scaffold, tailored `CLAUDE.md`, anti-patterns log, and staged self-heal templates under `self-heal-templates/`.

## [2026-06-02] schema | Manual data-entry UI for all entities

- Built create paths for every entity so a real fleet can be entered by hand, mirroring the existing expense form/API pattern (server "new" page → client form → zod-validated POST → dollars converted to cents):
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
- Pending (need accounts/keys): Pinecone sync and NotebookLM reminder-bucket refresh — the
  `notebooklm-workflow` end-of-session steps. Not run this session.

## [2026-06-02] setup | NotebookLM buckets live (install steps 8.3-8.4)

- Installed Python deps (pinecone, notebooklm-py[browser], python-docx, pdfplumber) + Playwright
  Chromium. Authenticated NotebookLM via `notebooklm login --browser chrome`.
- Created two notebooks and recorded IDs in `wiki/notebooklm-buckets.json`:
  reminder = 202e85d1…, default = 750d671f….
- Uploaded the reminder allowlist (CLAUDE.md, anti-patterns, overview, index) to the reminder
  bucket and the rest of `wiki/**` (12 files) to the default bucket. All 16 sources reported
  status=ready.
- Verified the reminder bucket: a query returned an accurate, cited summary of the operating rules
  and anti-patterns. NotebookLM layer is live.
- Still pending: Pinecone (step 8.2) — needs `PINECONE_API_KEY`.

## [2026-06-02] schema | CLAUDE.md upgraded to canonical enforcement + reminder bucket refreshed

- Added the canonical Limitless Stack **mandatory-first-action banner** (Roll Call preflight →
  query reminder bucket → read `wiki/index.md`) and the **end-of-session checklist** to
  `CLAUDE.md`, wired to the real reminder bucket ID and `tools/preflight.ps1`. Kept all the
  vessel-finance technical rules.
- Refreshed `CLAUDE.md` in the reminder NotebookLM bucket (delete-by-id + re-add) and **verified**:
  a query returned the new mandatory-first-action steps. Deduped two stale CLAUDE.md copies left by
  a hung delete; reminder bucket back to 4 clean sources.

## [2026-06-02] setup | Pinecone live (install step 8.2 — full stack complete)

- Set `PINECONE_API_KEY` (User scope). First `pinecone-sync.py` auto-created the `vessel-finance`
  index (multilingual-e5-large, aws/us-east-1) and synced the wiki corpus: **17 files → 34 chunks**.
- Fixed the upstream tools for pinecone-client v9 (the installed version): `upsert_records` and
  `search` became keyword-only / flat-args. Patched both `tools/pinecone-sync.py` and
  `tools/pinecone-search.py`.
- Verified: `pinecone-search.py "how is money stored…"` → top hit `wiki/concepts/money-as-cents.md`
  @ 0.833. Semantic recall working.
- **All four memory layers are now live**: Obsidian wiki + NotebookLM (reminder/default buckets) +
  Pinecone + CLAUDE.md. Limitless Stack install (steps 8.1–8.5) complete on Windows.

## [2026-06-02] schema | Self-healing pipeline built (diagnose + repair)

- Built the full self-heal loop (onboarding Section 4). **Diagnose**: `BugReport` Prisma model;
  in-app 🐞 reporter widget (`BugReporter`, mounted in layout) capturing route/viewport/recent JS
  errors; `POST /api/bug-reports` runs a Claude diagnostic with `CLAUDE.md` as system prompt
  (`src/lib/self-heal/diagnose.ts`) and persists severity/confidence/root-cause/suspected-files;
  `/bug-reports` admin page. **Repair**: `scripts/self-heal-agent.mjs` (sandboxed, tool-whitelist,
  25-turn) + `.github/workflows/self-heal.yml` (repository_dispatch → PR);
  `POST /api/bug-reports/[id]/dispatch` and `POST /api/self-heal/callback`.
- Added `@anthropic-ai/sdk`. Graceful degradation: no `ANTHROPIC_API_KEY` → store-and-skip; no
  GitHub secrets → dispatch button disabled. Auto-merge OFF. Setup + secrets in `SELF-HEAL-SETUP.md`.
- Hit anti-pattern #5 (a prior `npm install` had dropped devDependencies → build failed on
  `tailwindcss` with red-herring `@/` errors). Fixed with `npm install --include=dev`. Added an
  explicit `@`→`src` webpack alias in `next.config.js` as belt-and-suspenders.
- Verified: production build exit 0; `/bug-reports` and existing pages return HTTP 200.
- **Onboarding is now functionally complete**: only Hub Workspace + Paperclip remain, which are
  Open Scaffold proprietary products (not replicable). Self-heal goes live once its secrets are set.

## [2026-06-02] refactor | Roll Call auto-start + richer preflight

- Added a Claude Code `SessionStart` hook (`.claude/settings.json`) that runs `tools/preflight.ps1`
  automatically. Confirmed it fires in the Claude Code CLI; **Cowork does not run Claude Code
  hooks**, so in Cowork the `roll-call` skill + `CLAUDE.md` banner are the (soft) triggers.
- Rewrote the `roll-call` skill to mirror the reference setup, adapted to Windows/Desktop Commander,
  our bucket IDs (reminder `202e85d1…`), and Hub Workspace/Paperclip as documented skips.
- Upgraded `tools/preflight.ps1`: 7-tool structure, Pinecone **sync-drift** check (last sync vs.
  newest wiki edit), NotebookLM `auth check --test`, green/yellow/red verdict format.
- Caught a real self-inflicted bug: the preflight didn't set `PATHEXT`, so `& python.exe`/`& git.exe`
  silently failed (anti-pattern #1) → false negatives on Pinecone/NotebookLM. Fixed.

## [2026-06-04] setup | Self-heal activated end-to-end + audit-before-claim installed in Cowork

- **Self-heal is live** (SELF-HEAL-SETUP.md steps 1–4). App `.env`: `ANTHROPIC_API_KEY`,
  `GITHUB_TOKEN` (fine-grained PAT, contents+PR write), `GITHUB_REPO`, generated
  `SELF_HEAL_CALLBACK_TOKEN`. Actions secrets: `ANTHROPIC_API_KEY` + `SELF_HEAL_CALLBACK_TOKEN`.
- Verified: test bug → diagnosed in 5.7s (status `diagnosed`, coherent JSON). Dispatch → workflow
  run 26989504900 succeeded in 51s; agent `applied_fix=false` (correct for a synthetic bug), no PR
  opened. **Callback delivery leg untested** — GitHub can't reach localhost; test report sits at
  `dispatched/queued` until manually closed. PR-open leg fires only when the agent edits code.
- Gotcha: PAT initially lacked Contents:write → 403 on `repository_dispatch`
  (`X-Accepted-GitHub-Permissions: contents=write` was the diagnostic tell). Fixed by editing the
  token's permissions in place — token value unchanged.
- Bumped `actions/checkout` + `actions/setup-node` to v5 in `self-heal.yml` (both declare
  `using: node24`; GitHub forces Node 24 June 16, 2026). Commit `4316b85`, pushed.
- **Roll Call soft trigger confirmed in Cowork**: fired on a bare "hey claude" in a fresh session —
  the open question from the 2026-06-02 handoff is answered (refines anti-pattern #6: once the
  skill is surfaced in a new session, the soft trigger does work).
- Packaged `audit-before-claim` as a `.skill` zip and installed it into Cowork (verified surfaced
  in the session's available-skills list). First package attempt failed: PowerShell
  `Compress-Archive` backslash entries — see anti-pattern #7.
- Wrap: Pinecone synced (wiki: 2 files / 14 chunks). NotebookLM refreshed: anti-patterns replaced
  in reminder bucket, log.md replaced in default bucket — verified by reminder-bucket query
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
  SQLite/Prisma/Next.js prototype — no migration unless explicitly asked; (2) whitepaper says hire
  a maritime domain expert, blueprint says Catalog of Authority replaces the expert — reconcile
  later.

## [2026-06-04] query | Audit of the TugOS whitepaper + blueprint (audit-before-claim)

- Joseph asked whether the TugOS docs are the best route to top-of-class. Ran a web-verified
  audit; filed [[synthesis/tugos-whitepaper-audit]] and added a warning callout to
  [[concepts/tugos]] + index entry.
- **Refuted**: "no product owns the tug vertical" (Helm CONNECT, 275+ companies, Foss Maritime
  reference, sells Sub M compliance — omitted entirely); MarineTraffic AIS Toolbox as commercial
  foundation (CC BY-NC-SA 4.0, density-map tool); CII reporting for tugs (applies ≥5,000 GT);
  whitepaper's "33 CFR Part 15" rest-hour cite (actual: 46 CFR 15.1111 / 46 USC 8904).
- **Critical gap**: 46 CFR Subchapter M / TSMS never mentioned in either doc.
- **Internal contradictions**: two different stacks+auth (Next.js/Hono/Supabase-Auth vs
  React19/Vite/Express/JWT-15min); RLS isolation vs shared-instance direct SQL across 23 apps;
  offline-first vs 15-min tokens; hire-domain-expert vs EaaS; 90/30/7 vs 90/60/30.
- **Verified**: $2.4B/17.5% traces to market.us but is the most optimistic of ~6 firms
  ($1.2–2.3B, 10–12.5% elsewhere); BargeOps, Signal K, Flectra, OpenCPN claims accurate.
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
  hypothesis, market figures stated as cross-firm ranges ($1.2–2.4B, 10–17.5%).
- [[concepts/tugos]] updated: v2 PDFs are the operative north star; v1 PDFs remain immutable in
  `raw/`.

## [2026-06-04] query | TugOS Build Gameplan v1.0 written + audited

- Per Joseph: comprehensive build gameplan referencing the Architecture Blueprint v2 —
  `docs/tugos-build-gameplan.pdf` (9 pp; generator `tools/make-tugos-gameplan.py`), pointer page
  [[synthesis/tugos-build-gameplan]]. Defines best-in-class as 6 measurable outcomes (north star:
  Weekly Active Vessels), maps build order to blueprint components, sets 4 phase gates with
  pre-committed pass/fail actions, 24-risk register (prevention + early-warning + contingency per
  risk), kill/pivot criteria, measurement system, governance cadence, and an audit-record section.
- New verifications this pass: **Vercel serverless cannot host WebSockets** (blueprint's live job
  board re-specified onto Supabase Realtime with Fly.io fallback); **DocuSeal is AGPLv3 with
  Section 7(b) terms + commercial Pro option** (embedding/API for production is a paid feature —
  cleanest resolution is buying the Pro license).
- Audit-before-claim applied: doc separates verified facts (Helm, Sub M, CII, AIS license,
  46 USC 8904/46 CFR 15.1111, Vercel WS, market ranges) from working assumptions (H1–H4, pricing,
  all gate thresholds = judgments). PDF content verified by text extraction (all 13 sections +
  key terms render).

## [2026-06-04] schema | end-of-session-checklist must load the notebooklm skill for step 4

- Per Joseph: future sessions must use the **`notebooklm`** skill (CLI reference) when running the
  end-of-session checklist — no improvised CLI syntax. Edited
  `~/.claude/skills/end-of-session-checklist/SKILL.md`: step 4 now requires loading both
  `notebooklm-workflow` (ritual) and `notebooklm` (commands), documents the
  `delete-by-title` hang, and prescribes `source delete <id> --notebook <nb> -y`. Frontmatter
  description updated to match. Cowork surfaces the edited skill starting with the next session.

## [2026-06-09] schema | TugOS Phase 0 foundation scaffolded (tug_ schema + per-tenant RLS)

- Per Joseph: started the TugOS build at the optimal first move — the isolation-first DB
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
  `(company_id, child_id)→(company_id, id)` so FK validation (which bypasses RLS) can't reference
  another tenant's rows; retire-don't-delete posture via NO ACTION.
- `tugos/supabase/tests/0001_rls_isolation_test.sql`: 11 pgTAP assertions (read/insert/update/
  delete/cross-tenant-FK/deny-by-default). `tugos/PHASE0-CHECKLIST.md` encodes O1–O6, the risk
  register→prevention map, and the compliance-spine (Sub M tables wait for advisor+TPO validation)
  + license-gate guards.
- Verified this session: all SQL parses clean against the real PG grammar (pglast v7.14 /
  libpg_query, 0 failures). **NOT yet executed against a live DB** — pending the dedicated Supabase
  project (Joseph granting access via the Supabase MCP connector; provisioning + live RLS-test run
  is the next step).

## [2026-06-09] schema | TugOS foundation applied + RLS verified on live Supabase project

- Joseph connected the **Supabase MCP** connector and created the dedicated project **`TUGOS`**
  (ref `naxqxajzlmisqdnfvhzm`, region `us-east-2`, Postgres 17, org `joestev347-max's Org`). A
  second stray project `joestev347- TUGOS` (`us-west-2`) exists — Joseph chose East US as canonical
  and to delete West; the MCP has no delete capability, so the West project must be deleted from the
  dashboard (still pending).
- Applied migrations **0001** (core schema), **0002** (RLS + tug_app + FORCE RLS + revokes), and
  **0003** (pin function `search_path`) via `apply_migration`. Verified directly: all 6 `tug_`
  tables have `relrowsecurity=true` + `relforcerowsecurity=true`, 6 policies, composite tenant FKs.
- **Live RLS isolation: 11/11 green.** Ran a self-contained, self-cleaning harness (seed 2 tenants
  → `set role tug_app` → assert read/insert/update/delete/cross-tenant-FK/deny-by-default → `raise`
  to roll back). Confirmed zero residue afterwards (all tables count 0). Re-ran after 0003 — still
  11/11. Supabase **security advisor: 0 findings** (was 2 `function_search_path_mutable` WARNs,
  fixed by 0003). Gate 0's "RLS isolation tests green" criterion is met at the DB layer.
- App connection (later): API URL `https://naxqxajzlmisqdnfvhzm.supabase.co`; tenant traffic must
  use a `tug_app`-privileged connection that sets `app.company_id` per transaction (NOT the
  bypass-RLS `postgres`/service role).
- New anti-patterns captured (#9, #10).
