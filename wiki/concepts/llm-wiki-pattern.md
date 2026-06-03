---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, llm-wiki, meta]
source_count: 1
sources: [karpathy-llm-wiki-video]
---

# LLM Wiki pattern

The methodology this vault is built on: an LLM incrementally builds and maintains a structured
markdown knowledge base, instead of doing retrieval over raw documents on every query. Operating
details live in the `obsidian-wiki-workflow` skill; this page is the *why*.

## Summary

Pattern adapted from Andrej Karpathy. The human curates sources and asks questions; the LLM reads
sources and writes into a persistent, interlinked wiki. Knowledge *compounds* — each new source can
touch many pages — rather than being re-derived from scratch each time.

## Three layers

1. `raw/` — immutable source documents (read, never edit).
2. `wiki/` — LLM-owned markdown pages.
3. `CLAUDE.md` — the schema / rulebook / voice.

## Core operations

- **Ingest** — new source → summary page + entity/concept updates + log entry.
- **Query** — read `index.md` first, follow wiki-links, answer with citations, file substantive
  answers as a synthesis page.
- **Lint** — periodic check for contradictions, orphans, stale claims, coverage gaps.

## Difference from classic RAG

| | Classic RAG | LLM Wiki |
|---|---|---|
| Processing | per-query | per-source, once |
| Memory | stateless | compounding |
| Structure | vector chunks | interlinked pages |
| One source touches… | itself | 10–15 pages |

## Scaling wall

Obsidian alone breaks down around ~10,000 files. Past that, the answer is a four-tool memory stack:
Obsidian + NotebookLM + Pinecone + `CLAUDE.md`.

## Relationships

- Implemented by this vault; operationalized by the `obsidian-wiki-workflow` skill.
- Original source: [[sources/karpathy-llm-wiki-video]].
- Adopted via [[entities/open-scaffold-labs]]'s [[sources/limitless-stack-onboarding]].
