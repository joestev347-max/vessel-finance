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
