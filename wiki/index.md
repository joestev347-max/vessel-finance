---
type: overview
created: 2026-06-02
updated: 2026-06-04
---

# Vessel Finance Wiki — Index

Knowledge base for the Vessel Finance repo, maintained with the LLM Wiki pattern (see the
`obsidian-wiki-workflow` skill). Content catalog — every page is listed here. Read this first.

## App

- [[overview]] — what Vessel Finance is, stack, status, build/run.
- [[concepts/tugos]] — **TugOS, the end goal**: pillars, 36-month roadmap, target architecture,
  and the prototype-vs-target stack warning. North star for the whole project.
- [[synthesis/data-model]] — the seven Prisma models and how they relate.

## Concepts

- [[concepts/llm-wiki-pattern]] — the methodology this vault runs on.
- [[concepts/money-as-cents]] — money stored as integer cents (core convention).
- [[concepts/sqlite-no-enums]] — categorical fields as strings + literal unions.
- [[concepts/profitability-and-tce]] — revenue / OPEX / CAPEX / margin / TCE engine.
- [[concepts/forecasting]] — the three forecasting methods.
- [[concepts/budget-transfers]] — drag-and-drop budget transfers.
- [[concepts/self-healing-pipeline]] — the staged self-heal loop.
- [[concepts/osl-orchestrator-model]] — OSL's reusable vertical-SaaS architecture (genetic
  template, three surfaces, Catalog of Authority, governed agents).

## Entities

- [[entities/open-scaffold-labs]] — creators of the Limitless Stack we adopted.

## Sources

- [[sources/limitless-stack-onboarding]] — the v1.0 onboarding PDF.
- [[sources/karpathy-llm-wiki-video]] — origin of the LLM Wiki pattern.
- [[sources/openscaffold-tugboat-whitepaper]] — **the project whitepaper** (market, pillars,
  go-to-market, 36-month gameplan). Raw: `raw/openscaffold-tugboat-whitepaper.pdf`.
- [[sources/tugos-osl-architecture]] — TugOS build blueprint on the OSL Orchestrator Model.
  Raw: `raw/tugos-osl-architecture.pdf`.

## Synthesis

- [[synthesis/data-model]] — schema reference.
- [[synthesis/claude-anti-patterns]] — accumulating list of failure modes + corrective rules.
- [[synthesis/tugos-whitepaper-audit]] — verified/refuted/internal-contradiction audit of the
  TugOS docs + corrected route to top-of-class (Helm CONNECT, Subchapter M, AIS licensing, CII).
- [[synthesis/tugos-build-gameplan]] — pointer to `docs/tugos-build-gameplan.pdf`: phased build
  order, gates, risk register with preventions, kill/pivot criteria, WAV north-star metric.

## See also (authoritative repo docs)

Hand-written docs under `docs/` predate this wiki and remain source-of-truth for detail:
`architecture.md`, `database-schema.md`, `api-endpoints.md`, `component-structure.md`,
`wireframes.md`, `budget-transfer-workflow.md`, `expense-tracking-workflow.md`. The trust anchor is
`CLAUDE.md` at the repo root (outside this vault).
