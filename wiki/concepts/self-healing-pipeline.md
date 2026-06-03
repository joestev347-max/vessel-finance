---
type: concept
created: 2026-06-02
updated: 2026-06-02
tags: [limitless-stack, self-heal, ci]
source_count: 1
sources: [limitless-stack-onboarding]
---

# Self-healing pipeline

The Limitless Stack's autonomous bug-repair loop. In this repo it is **staged, not wired** — the
canonical templates are copied into `self-heal-templates/`, but nothing runs yet (see `CLAUDE.md` →
"Self-healing configuration", and `self-heal-templates/VESSEL-FINANCE-NOTES.md`).

## The loop (when enabled)

In-app bug capture → Claude diagnostic pass (with `CLAUDE.md` as system prompt) → operator review →
GitHub `repository_dispatch` → sandboxed Actions runner → constrained repair agent (read/list/grep/
edit/write/bash/finish, 25-turn budget) → commit → PR → **human merge** → reconcile (log + new
anti-pattern).

## Principles

- `CLAUDE.md` is the **trust anchor** for both diagnostic and repair agents.
- **Diagnose before repair**; repair is gated on operator approval.
- **Sandboxed** execution; tool whitelist enforced in code, not the prompt.
- **Human merge by default** — PRs, never direct commits.

## Why it's deferred here

The templates assume Vercel + Supabase + a deployed app. This repo is Next.js + Prisma + SQLite and
not deployed, and it needs an `ANTHROPIC_API_KEY` + GitHub secrets. Adapting it is the biggest
remaining build — gap list in `self-heal-templates/VESSEL-FINANCE-NOTES.md`.

## Relationships

- From [[sources/limitless-stack-onboarding]] / [[entities/open-scaffold-labs]].
- Each successful heal would feed back into [[synthesis/claude-anti-patterns]] and the log.
