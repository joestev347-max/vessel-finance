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
