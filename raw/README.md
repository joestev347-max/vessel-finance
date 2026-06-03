# raw/ — immutable source documents

This folder holds **source material** you want the wiki to learn from: PDFs, articles, exported
docs, transcripts, spec sheets, etc.

Rules (per the `obsidian-wiki-workflow` skill):

- The agent **reads** from here but **never edits** these files. Sources are immutable.
- To ingest a source: drop it here, then ask to "ingest the source at `raw/<filename>`". The agent
  creates a summary at `wiki/sources/<slug>.md`, updates the relevant concept/entity pages, flags
  any contradictions, updates `wiki/index.md`, and appends a `wiki/log.md` entry.
- This folder lives at the repo root, outside the Obsidian vault (`wiki/`). What you browse in
  Obsidian are the *summaries* in `wiki/sources/`, not the raw files themselves.
