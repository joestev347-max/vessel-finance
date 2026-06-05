---
type: app
created: 2026-06-04
updated: 2026-06-04
tags: [tugos, north-star, product, roadmap]
source_count: 2
sources: [openscaffold-tugboat-whitepaper, tugos-osl-architecture]
---

# TugOS — The End Goal

The purpose-built, mobile-first SaaS platform for tugboat and inland marine towing operators that
this project is working toward. **[[overview|Vessel Finance]] is the prototype; TugOS is the
destination.**

> [!note] Operative documents are the v2 PDFs (2026-06-04)
> After the audit ([[synthesis/tugos-whitepaper-audit]]), both docs were recreated with the
> corrections folded in: **`docs/tugos-whitepaper-v2.pdf`** and
> **`docs/tugos-osl-architecture-v2.pdf`**. These are the north star going forward. The v1 PDFs in
> `raw/` remain as immutable originals; the source pages below describe v1.

Original (v1) documents: [[sources/openscaffold-tugboat-whitepaper]] (market case, pillars,
36-month gameplan) and [[sources/tugos-osl-architecture]] (the build blueprint on the
[[concepts/osl-orchestrator-model|OSL Orchestrator Model]]).

## The opportunity in one paragraph

$2.4B marine-software market, 17.5% CAGR, ~85% of tugs on paper/Excel/legacy systems. Enterprise
ERPs are overbuilt ($50K–$500K+/yr); road-towing apps are the wrong domain; BargeOps targets big
river barge lines. **Nobody serves the 3–30 tug operator.** That segment — thousands of U.S.
companies — is the wedge.

## Eight feature pillars

1. Dispatch & Job Board (drag-and-drop assignment, GPS job progress)
2. Crew Management & USCG Compliance (STCW/MMC tracking, 90/30/7 expiry alerts, hitch scheduling)
3. Fuel Tracking & Efficiency (per-voyage logs, Signal K IoT, CII reporting)
4. Maintenance & Class Records (PMS, work orders, ABS/USCG checklists)
5. Billing & Invoicing (hourly / bollard pull / charter models; auto-invoice from job logs)
6. **Financial Reporting & Fleet P&L** ← where Vessel Finance already prototypes:
   [[concepts/profitability-and-tce]], [[concepts/budget-transfers]], [[concepts/forecasting]],
   [[concepts/money-as-cents]]
7. Mobile App for captain & crew (offline-first, signature capture)
8. Integrations & Open Data (AIS, OpenCPN, Signal K, NOAA, port APIs)

## Roadmap skeleton (36 months)

- **Phase 1 (mo 1–6)** — trust on the water: discovery interviews, dispatch-only MVP,
  offline-first, 5 free Gulf Coast betas. Metrics: 5 betas, 15+ interviews, 500+ jobs, 0 data loss.
- **Phase 2 (mo 6–18)** — operator's OS: compliance module, auto-billing, captain app, analytics,
  SOC 2 Type I, port-authority reference. Metrics: 20+ paying, $40K+ MRR, <5% churn.
- **Phase 3 (mo 18–30)** — win the category: predictive maintenance AI, benchmark reports, Spot
  Job Board marketplace, public API, international. Metrics: 75+ paying, $150K+ MRR, 3+ countries.
- **Phase 4 (mo 30–36+)** — best-in-class posture: data moat, crew UX, compliance-as-the-system,
  community trust, network-effect flywheel.

## Target architecture (from the blueprint)

App 24 on the OSL genetic template, table prefix `tug_`: React 19 + Vite UI, Express.js on Vercel
serverless (direct SQL, no ORM), shared Supabase PostgreSQL with RLS, JWT auth, three surfaces
(UI / REST / MCP), five MCP servers + NotebookLM memory, six governed AI agents with the Interrupt
Protocol, seven scheduled automations. Details: [[sources/tugos-osl-architecture]].

> [!warning] Prototype ≠ target stack
> The current repo is Next.js 14 + Prisma + **SQLite**, single-tenant, no auth
> ([[overview]], `CLAUDE.md`). The TugOS target is React 19 + Vite + Express + **Supabase
> Postgres**, multi-tenant, role-based auth, no ORM. Per `CLAUDE.md`, do **not** migrate to
> Postgres or restructure toward the target stack unless Joseph explicitly asks — the migration
> path is a deliberate future decision, not a default.

> [!warning] Contradiction between the two sources
> The whitepaper (Phase 1) says to *hire or partner with a maritime domain expert* ("someone who
> has stood a watch on a tug"). The architecture blueprint says *"No tug domain expert hired"* —
> the Catalog of Authority (EaaS) replaces the expert. Reconcile with Joseph when the time comes.

> [!warning] Audited 2026-06-04 — read the audit before acting on these docs
> [[synthesis/tugos-whitepaper-audit]] found critical gaps: **Helm CONNECT** (the actual
> purpose-built workboat/tug platform, 275+ companies) is absent from the competitive landscape;
> **46 CFR Subchapter M / TSMS** (the central U.S. tug compliance regime) is never mentioned;
> the MarineTraffic AIS Toolbox is **CC BY-NC** (unusable commercially); CII doesn't apply to
> tugs (<5,000 GT); and the two docs specify different stacks and auth systems. The strategy
> shape is sound, but follow the audit's corrections, not the docs literally.

## What Vessel Finance already covers

Per-vessel P&L, OPEX/CAPEX breakdowns, TCE, budget-vs-actual with transfers, and three forecasting
methods — i.e. most of Pillar 6. The big gaps between here and TugOS MVP: dispatch/job board, crew
compliance, fuel logging, maintenance, billing engine, mobile app, multi-tenancy + auth.

## Sources

- [[sources/openscaffold-tugboat-whitepaper]]
- [[sources/tugos-osl-architecture]]
