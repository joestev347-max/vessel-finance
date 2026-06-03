---
type: source
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, llm-wiki, memory]
source_count: 1
sources: []
---

# Source — Karpathy's LLM Wiki approach

The originating idea behind this whole vault: instead of doing retrieval over raw documents on
every query (classic RAG), an LLM incrementally builds and maintains a structured, interlinked
markdown knowledge base that compounds over time.

## Key points

- Attributed to **[[entities/open-scaffold-labs|Open Scaffold Labs]]**'s adaptation of an idea from
  Andrej Karpathy (writer, ex-OpenAI/Tesla).
- The human **curates** sources and asks questions; the LLM **reads, writes, and maintains** the
  wiki. See [[concepts/llm-wiki-pattern]].
- Knowledge **compounds**: one new source can touch 10–15 pages, rather than being re-derived from
  scratch each query.
- Obsidian alone hits a scaling wall (~10,000 files); the answer is a four-tool memory stack —
  Obsidian + NotebookLM + Pinecone + `CLAUDE.md`.

## Extracted claims

- Per-source processing (once, up front) beats per-query processing for a knowledge base that's
  used repeatedly.
- Structure (interlinked markdown) plus an index makes the knowledge navigable in a way vector
  chunks are not.

## Relationships

- Formalized as the [[concepts/llm-wiki-pattern]] concept.
- Underpins the [[concepts/self-healing-pipeline]] and the reminder-bucket workflow.
