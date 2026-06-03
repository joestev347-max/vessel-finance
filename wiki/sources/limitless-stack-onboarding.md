---
type: source
created: 2026-06-02
updated: 2026-06-02
tags: [limitless-stack, onboarding, methodology]
source_count: 1
sources: []
---

# Source — Limitless Stack Onboarding Guide (v1.0)

A 14-page onboarding PDF from [[entities/open-scaffold-labs|Open Scaffold Labs]] describing the
"Limitless Stack" — seven tools wired into one operating system for running many vertical SaaS apps
on shared infrastructure. Ingested 2026-06-02; informs how this repo is set up.

## Key points

- **Seven tools**: Claude (reasoning), `CLAUDE.md` (rules/trust anchor), Obsidian (knowledge base),
  NotebookLM (research desk), Pinecone (semantic memory), Hub Workspace (multi-model runtime),
  Paperclip (coordination).
- **Four feedback loops** that compound knowledge: source ingest → wiki refinement → index sync
  (Pinecone + NotebookLM) → anti-patterns/reminder bucket. See [[concepts/llm-wiki-pattern]].
- **Self-healing pipeline**: in-app bug capture → Claude diagnosis (with `CLAUDE.md` as system
  prompt) → operator review → sandboxed repair agent → PR → human merge → log. See
  [[concepts/self-healing-pipeline]].
- Three problems it targets: AI "amnesia", rule "drift", and bug-repair at scale.

## How it maps to this repo

- The wiki you're reading is the Obsidian layer.
- `CLAUDE.md` at the repo root is the trust anchor.
- Self-heal templates are **staged, not wired** — see [[concepts/self-healing-pipeline]].
- NotebookLM and Pinecone are not yet provisioned (need accounts/keys).

## Relationships

- Source for [[concepts/self-healing-pipeline]] and the reminder-bucket workflow.
- Builds on the [[concepts/llm-wiki-pattern]] (the knowledge-base philosophy).
