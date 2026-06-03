---
type: overview
created: 2026-06-02
updated: 2026-06-02
---

# Vessel Finance Wiki — Index

Knowledge base for the Vessel Finance repo, maintained with the LLM Wiki pattern (see the
`obsidian-wiki-workflow` skill). Content catalog — every page is listed here. Read this first.

## App

- [[overview]] — what Vessel Finance is, stack, status, build/run.
- [[synthesis/data-model]] — the seven Prisma models and how they relate.

## Concepts

- [[concepts/llm-wiki-pattern]] — the methodology this vault runs on.
- [[concepts/money-as-cents]] — money stored as integer cents (core convention).
- [[concepts/sqlite-no-enums]] — categorical fields as strings + literal unions.
- [[concepts/profitability-and-tce]] — revenue / OPEX / CAPEX / margin / TCE engine.
- [[concepts/forecasting]] — the three forecasting methods.
- [[concepts/budget-transfers]] — drag-and-drop budget transfers.
- [[concepts/self-healing-pipeline]] — the staged self-heal loop.

## Entities

- [[entities/open-scaffold-labs]] — creators of the Limitless Stack we adopted.

## Sources

- [[sources/limitless-stack-onboarding]] — the v1.0 onboarding PDF.
- [[sources/karpathy-llm-wiki-video]] — origin of the LLM Wiki pattern.

## Synthesis

- [[synthesis/data-model]] — schema reference.
- [[synthesis/claude-anti-patterns]] — accumulating list of failure modes + corrective rules.

## See also (authoritative repo docs)

Hand-written docs under `docs/` predate this wiki and remain source-of-truth for detail:
`architecture.md`, `database-schema.md`, `api-endpoints.md`, `component-structure.md`,
`wireframes.md`, `budget-transfer-workflow.md`, `expense-tracking-workflow.md`. The trust anchor is
`CLAUDE.md` at the repo root (outside this vault).
