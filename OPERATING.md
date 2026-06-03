# Operating the Limitless Stack — vessel-finance

The day-to-day runbook (Limitless Stack onboarding step 9), adapted for this repo on Windows.
The behaviors below are encoded in the installed skills; this file is the human-facing summary.

## Every session

**Start — Roll Call.** Run the preflight to confirm the stack is wired up:

```
powershell -NoProfile -ExecutionPolicy Bypass -File tools\preflight.ps1
```

Exit 0 = READY, 1 = WARN (proceed with eyes open), 2 = BLOCK (fix first). Then read
`wiki/index.md`, and — once NotebookLM is set up — query the reminder bucket (the
`notebooklm-workflow` skill).

**End — run the end-of-session checklist.** Say **"run end of session checklist"** to fire the
`end-of-session-checklist` skill. It walks the wrap in order: update `wiki/log.md`, capture any new
anti-patterns, **sync Pinecone** (`pinecone-sync.py --changed-only`), refresh + verify the
NotebookLM buckets, then commit (ask first). The next session's Roll Call catches anything skipped.

## Core moves

**Ingest a new source.** Drop the file in `raw/`, then ask:

> Ingest the new source at `raw/<filename>`.

The `obsidian-wiki-workflow` skill reads it, writes `wiki/sources/<slug>.md`, updates the relevant
concept/entity pages, flags contradictions with `> [!warning]`, updates `wiki/index.md`, and
appends a `wiki/log.md` entry.

**Ask a question.** Just ask. The four-tool lookup runs automatically: wiki first → Pinecone (if
thin) → NotebookLM (deep research) → reason. Substantive answers get filed back as
`wiki/synthesis/<slug>.md`.

**Periodic lint.** Every few weeks:

> Run a lint pass and write the report.

Surfaces contradictions, orphans, stale claims, broken links, coverage gaps, index drift → written
to `wiki/synthesis/lint-YYYY-MM-DD.md`.

**Catch a new failure mode.** Append a numbered entry to
`wiki/synthesis/claude-anti-patterns.md` (trigger → why-tempting → why-wrong → corrective rule).
Future sessions read it via Roll Call and the reminder bucket.

## Pinecone sync — at session end (preferred)

The Pinecone sync runs **as part of the end-of-session checklist** (step 3 of the
`end-of-session-checklist` skill), not on a blind nightly timer. We sync when we wrap, so the index
always reflects the work just done. The command it runs:

```
python tools\pinecone-sync.py --changed-only
```

*Optional fallback — a nightly timer.* If you also want an unattended nightly sync (e.g. for days
you forget to wrap), register a Windows Task Scheduler job (requires `PINECONE_API_KEY` set at User
level via `setx`):

```
schtasks /Create /TN "vessel-finance pinecone sync" /SC DAILY /ST 02:00 ^
  /TR "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$env:PINECONE_API_KEY=[Environment]::GetEnvironmentVariable('PINECONE_API_KEY','User'); python 'C:\Users\joest\vessel-finance\tools\pinecone-sync.py' --changed-only\""
```

Remove with `schtasks /Delete /TN "vessel-finance pinecone sync" /F`.

## Customization checklist (from the onboarding guide)

What the guide says to change when adopting the stack, and its status here:

- **Pinecone index name** - `vessel-finance` (override via `PINECONE_INDEX` env). [done, index live]
- **NotebookLM bucket IDs** - recorded in `wiki/notebooklm-buckets.json`. [done, buckets live]
- **CLAUDE.md domain** - already tailored to vessel-finance (maritime fleet finance). [done]
- **Wiki entity links** - real pages under `wiki/entities/`, `wiki/concepts/`. [done, grows over time]
- **Sources in `raw/`** - drop your own source docs here to ingest. [folder ready]
- **Keep as-is** - the installed skills, the wiki structure, and the `CLAUDE.md` guardrails.

## Status

All four memory layers are live: Obsidian wiki + NotebookLM (reminder/default buckets) + Pinecone
(`vessel-finance` index) + `CLAUDE.md`. The only opt-in piece left is the self-healing pipeline
(staged in `self-heal-templates/` — see `VESSEL-FINANCE-NOTES.md`). Full status:
`LIMITLESS-STACK-SETUP.md`.
