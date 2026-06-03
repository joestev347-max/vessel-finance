# Limitless Stack — Vessel Finance setup status

This repo has been wired into the Limitless Stack protocol. This file records **what's done**
and **what still needs your accounts/keys** before each remaining piece can run.

Source: `Open-Scaffold-Labs/LimitlessStack` (reviewed and adapted — the upstream `install.sh` is
macOS-only, so the pieces were applied by hand for this Windows + Next.js/Prisma/SQLite repo).

## Done (works now, no accounts needed)

- **`CLAUDE.md`** — trust anchor tailored to this repo (stack, build/run, conventions, pitfalls,
  guardrails). Read automatically by Claude Code / Cowork at session start.
- **`wiki/`** — knowledge base: `index.md`, `overview.md`, `log.md`,
  `synthesis/claude-anti-patterns.md` (seeded with 4 real lessons from the 2026-06-02 session).
- **Skills** — 7 installed globally to `~/.claude/skills/`: `limitless-stack`, `roll-call`,
  `four-tool-lookup`, `verify-before-claim`, `karpathy-guidelines`, `notebooklm`,
  `audit-before-claim`. These affect **all** your Claude Code sessions, not just this repo.
- **`self-heal-templates/`** — canonical workflow + agent + setup guide, plus
  `VESSEL-FINANCE-NOTES.md` describing the Prisma/SQLite/Next.js adaptation. Staged, not wired.
- **`tools/`** — `pinecone-sync.py`, `pinecone-search.py`, `requirements.txt` (semantic memory;
  inert until a Pinecone key + index exist).

## Needs your accounts / keys

### 1. Pinecone (semantic memory) — optional, low priority for one small repo
- **Account**: Pinecone (free tier is fine) → create an index.
- **Key**: the upstream tool reads it from the macOS Keychain. On Windows, set an env var instead
  (`PINECONE_API_KEY`) — the scripts may need a one-line tweak to read `os.environ` rather than
  Keychain. Then `pip install -r tools/requirements.txt --break-system-packages` and
  `python tools/pinecone-sync.py`.
- **My take**: low value here — this is one small repo and `grep`/Glob already cover search. Worth
  it only if you grow to many repos/docs.

### 2. NotebookLM (research desk + reminder bucket) — needs Google + browser auth
- **Account**: Google account with NotebookLM access.
- **Setup**: the upstream flow uses an unofficial `notebooklm-py[browser]` library driving Chrome
  via Playwright, plus hardcoded bucket IDs in `notebooklm-wiki-refresh.py` /
  `limitless-preflight.sh`. This is the most fragile, macOS-leaning part of the stack.
- **My take**: skip unless you specifically want audio-overview / briefing artifacts. Not copied
  into the repo to avoid dead, misconfigured scripts.

### 3. Self-healing pipeline — needs deployment + secrets (biggest remaining build)
- **Prereqs**: a deployed endpoint (the app isn't deployed yet), plus these secrets — host env +
  GitHub Actions: `ANTHROPIC_API_KEY`; GitHub: a fine-grained `GITHUB_TOKEN` (contents:write,
  pull-requests:write), `GITHUB_REPO`, `SELF_HEAL_CALLBACK_TOKEN`.
- **Work required**: adapt Supabase→Prisma/SQLite bug table, Express→Next.js API routes, add the
  in-app bug reporter. Full gap list in `self-heal-templates/VESSEL-FINANCE-NOTES.md`.
- **My take**: the most interesting piece, but premature until the app is deployed and has users.
  Recommended order is in the notes file. Keep auto-merge OFF; every fix goes through a human PR.

## What I'd actually do next

For day-to-day building, the parts already in place (CLAUDE.md + anti-patterns + wiki + skills)
deliver most of the value immediately. Pinecone/NotebookLM/self-heal are worth wiring only when
the repo grows or ships. Tell me which one to build out and I'll do it.
