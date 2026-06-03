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

**End — wrap.** Update `wiki/log.md`, commit (ask first, per `CLAUDE.md`), then sync the memory
layers: `python tools\pinecone-sync.py --changed-only` and the NotebookLM refresh+verify from the
`notebooklm-workflow` skill. The next session's Roll Call catches anything skipped here.

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

## Schedule nightly Pinecone sync (Windows Task Scheduler)

The upstream guide uses cron; the Windows equivalent is `schtasks`. After Pinecone is set up
(see `LIMITLESS-STACK-SETUP.md`), register a nightly changed-only sync:

```
schtasks /Create /TN "vessel-finance pinecone sync" /SC DAILY /ST 02:00 ^
  /TR "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$env:PINECONE_API_KEY=[Environment]::GetEnvironmentVariable('PINECONE_API_KEY','User'); python 'C:\Users\joest\vessel-finance\tools\pinecone-sync.py' --changed-only\""
```

(Requires `PINECONE_API_KEY` set at the User level via `setx`.) Remove with
`schtasks /Delete /TN "vessel-finance pinecone sync" /F`.

## Customization checklist (from the onboarding guide)

What the guide says to change when adopting the stack, and its status here:

- **Pinecone index name** - set via `PINECONE_INDEX` env (default `vessel-finance`). [tooling ready]
- **NotebookLM bucket IDs** - recorded in `wiki/notebooklm-buckets.json` after setup. [pending login]
- **CLAUDE.md domain** - already tailored to vessel-finance (maritime fleet finance). [done]
- **Wiki entity links** - real pages under `wiki/entities/`, `wiki/concepts/`. [done, grows over time]
- **Sources in `raw/`** - drop your own source docs here to ingest. [folder ready]
- **Keep as-is** - the installed skills, the wiki structure, and the `CLAUDE.md` guardrails.

## What still needs your accounts

Pinecone (API key) and NotebookLM (Google login + two buckets) are the only pieces not yet live.
Full status and exact steps: `LIMITLESS-STACK-SETUP.md`.
