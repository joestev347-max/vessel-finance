---
type: concept
created: 2026-06-04
updated: 2026-06-04
tags: [architecture, osl, mcp, agents, pattern]
source_count: 1
sources: [tugos-osl-architecture]
---

# OSL Orchestrator Model

[[entities/open-scaffold-labs|Open Scaffold Labs]]' reusable architecture for vertical SaaS apps —
the framework [[concepts/tugos|TugOS]] (App 24) is specified against. Its premise: every vertical
maps onto the same primitives "with zero framework changes."

## The primitives

- **Genetic template (FaaS)** — `@openscaffold/core` + `@openscaffold/integrations` +
  `scaffold.config.js`, shared across all OSL apps. A new vertical is deployed with one script
  (`deploy-new-app.sh <prefix>_`) and inherits auth, header, sidebar, theming, CRUD standards, a
  shared Supabase Postgres instance (per-app table prefix), and adapter integrations (pdf-lib,
  PptxGenJS, React Email, DocuSeal, LlamaIndex).
- **Three surfaces** — every app is simultaneously (1) a human UI (React, role-filtered),
  (2) a REST API (Express on Vercel serverless), and (3) an MCP layer: MCP *client* to consume
  authority knowledge, MCP *server* to expose app data to AI agents.
- **Catalog of Authority (EaaS)** — instead of hiring domain experts, the app holds validated MCP
  connections to the authorities an expert would consult (for TugOS: USCG 33 CFR, STCW, ABS, IMO,
  Signal K, NOAA, QuickBooks, AWO benchmarks). Each new vertical enriches the shared catalog,
  making the next vertical cheaper — the flywheel.
- **Five MCP servers per app** — brain (orchestration), senses (data connectors), voice
  (notifications), memory (scaffold-core/authority lookup), handshake (client-scoped portal) —
  plus NotebookLM notebooks as a 6th persistent-memory layer.
- **Governed agents** — a suite of AI agents in three autonomy tiers (auto-limited / supervised /
  autonomous), orchestrated by Paperclip + Claude API on LangGraph + MLflow. High-stakes actions
  pause at an `interrupt_before` node for human review — the **Interrupt Protocol**.
- **Scheduled automations** — cron-based tasks (briefings, sweeps, syncs) wiring orchestration to
  notifications and connectors.

## Why it matters for this repo

This is the same philosophy the Limitless Stack applies to *development* (memory layers, staged
autonomy, human-reviewed self-healing — [[concepts/self-healing-pipeline]]), applied to the
*product*. Our NotebookLM reminder/default buckets mirror TugOS's persistent-memory notebooks; our
self-heal Interrupt-style "ask before commit/merge" mirrors the Interrupt Protocol.

## Sources

- [[sources/tugos-osl-architecture]]
