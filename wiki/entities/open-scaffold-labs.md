---
type: entity
created: 2026-06-02
updated: 2026-06-04
tags: [org, tooling]
source_count: 4
sources: [limitless-stack-onboarding, karpathy-llm-wiki-video, openscaffold-tugboat-whitepaper, tugos-osl-architecture]
---

# Open Scaffold Labs

The organization behind the **Limitless Stack** — the seven-tool operating system whose protocol
this repo adopts (skills, `CLAUDE.md` discipline, the wiki, the staged self-healing pipeline) —
and the author of the [[concepts/tugos|TugOS]] whitepaper + architecture blueprint that define
this project's end goal.

## The OSL ecosystem (from the TugOS docs)

- Runs **23 vertical SaaS apps** on one shared "genetic template" + Supabase instance; TugOS is
  planned as App 24. The pattern is the [[concepts/osl-orchestrator-model]].
- Production infrastructure: React frontends, Vercel + Fly.io, Supabase, **Paperclip** (AI
  orchestration, proprietary) + Claude API, LangGraph + MLflow agent governance.
- Prior reference app: "Open Agency" (ad-agency vertical) — TugOS's MCP servers and agent suite
  are maritime equivalents of its components.

## What we use from them

- The **Limitless Stack** protocol and skills (`limitless-stack`, `roll-call`, `four-tool-lookup`,
  `verify-before-claim`, `karpathy-guidelines`, `notebooklm`, `audit-before-claim`).
- The [[concepts/llm-wiki-pattern]] methodology for this Obsidian wiki.
- The [[concepts/self-healing-pipeline]] templates (staged in `self-heal-templates/`).

## Notes

- Their stack assumes Supabase + Vercel + a 100-app vertical-SaaS context; this repo is a single
  Next.js + Prisma + SQLite prototype, so several pieces were adapted rather than adopted wholesale.

## Sources

- [[sources/limitless-stack-onboarding]]
- [[sources/karpathy-llm-wiki-video]]
- [[sources/openscaffold-tugboat-whitepaper]]
- [[sources/tugos-osl-architecture]]
