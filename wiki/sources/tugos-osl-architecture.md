---
type: source
created: 2026-06-04
updated: 2026-06-04
tags: [architecture, tugos, osl, mcp, agents, north-star]
source_count: 1
sources: [tugos-osl-architecture]
---

# Source: TugOS — OSL Vertical Architecture Blueprint (June 2026)

**Raw file**: `raw/tugos-osl-architecture.pdf` (9 pages, OSL Vertical Application Blueprint)

Companion to [[sources/openscaffold-tugboat-whitepaper]] — the whitepaper makes the market case;
this blueprint specifies *how* TugOS is built on the
[[concepts/osl-orchestrator-model|OSL Orchestrator Model]].

## Summary

TugOS is **App 24** in the OSL ecosystem (table prefix `tug_`), inheriting OSL's "genetic template"
(Framework-as-a-Service shared across all 23 existing apps) so that deployment takes under 5
minutes and most infrastructure is reuse, not build.

## Key points

- **Genetic template** (§1): `deploy-new-app.sh tug_` inherits StandardHeader, Scaffold Beacon AI
  widget, role-based sidebar, JWT auth, theme system, CRUD standards, Supabase connection, and
  integration adapters (pdf-lib, PptxGenJS, React Email, DocuSeal, LlamaIndex). One shared Supabase
  PostgreSQL instance across all apps.
- **Three-surface architecture** (§2): every OSL app exposes (1) a human UI — React 19 + Vite +
  Tailwind, role-filtered; (2) a REST API — Express.js on Vercel serverless; (3) an **MCP layer** —
  TugOS as MCP *client* consumes maritime authorities, as MCP *server* exposes fleet data to agents.
- **Five MCP servers** (§3): `tug-orchestration` (brain, 20+ tools), `tug-data-connectors` (senses:
  AIS, Signal K, NOAA, fuel prices), `tug-notifications` (voice: push/Slack/email),
  `tug-scaffold-core` (memory: USCG/STCW/ABS/IMO lookups), `tug-client-portal` (handshake:
  client-scoped read-only). Plus a 6th persistent-memory layer: **NotebookLM notebooks** (USCG
  Inspection Playbook, Fleet Maintenance Encyclopedia, Crew Performance, Client Relationship
  History, Architecture Docs) — the same pattern this repo uses via the `notebooklm-workflow` skill.
- **Six AI agents** (§4): Fuel (auto-limited, <$2K approvals), Compliance (supervised),
  Dispatch (supervised), Fleet Health (autonomous, hourly, 70-score alert floor), Daily Briefing
  (autonomous, 6am), Invoice (autonomous, drafts within 1 hour of job completion). High-stakes
  actions hit a LangGraph `interrupt_before` node — the **Interrupt Protocol** (fuel >$5K, cert
  waivers, billing disputes, USCG deviation reports, crew PII changes).
- **Seven scheduled automations** (§5): daily-fleet-briefing (6am), vessel-health-monitor (hourly),
  cert-expiry-sweep (7am), invoice-generation (60 min), authority-catalog-sync (6am → Notion),
  fuel-anomaly-check (per voyage, >8%), ais-position-sync (5 min).
- **Catalog of Authority** (§6): regulatory (USCG 33 CFR, 46 CFR Part 15, STCW, ABS rules, IMO
  MARPOL/CII), data (Signal K, MarineTraffic AIS, NOAA, OpenCPN, OpenShipping.org), financial
  (QuickBooks, Stripe, Ship & Bunker fuel prices, AWO rate benchmarks). **EaaS — "no tug domain
  expert hired"**: validated MCP connections replace the expert. ⚠ Contradiction with the
  whitepaper, which says to hire/partner with a maritime domain expert (Phase 1) — flagged in
  [[concepts/tugos]].
- **Stack: inherit vs new** (§7–9): REUSE — React 19 + Vite, Express 4 + Vercel serverless
  (direct SQL, no ORM), shared Supabase Postgres, JWT + bcrypt (15-min tokens), callAI + Paperclip,
  LangGraph + MLflow. NEW — React Native captain app, Signal K IoT bridge, MarineTraffic AIS,
  8 `tug_` tables (vessels, jobs, crew, fuel_logs, maintenance, invoices, certs, clients),
  dispatch board, hitch scheduler, USCG compliance tracker, tug billing engine, 6 maritime agents,
  QuickBooks sync, NOAA connector.
- **Network effect** (§8): each vertical enriches the Catalog of Authority (15 → 25+ entries),
  making the next marine vertical (PortOS, MarineInspector) cheaper — the OSL flywheel.

## Extracted claims

- TugOS = App 24; table prefix `tug_`; zero new infrastructure provisioning.
- TugOS roles: Dispatcher, Captain, Crew, Port Captain, Fleet Admin, Billing Clerk, Client (read-only).
- Agent autonomy tiers: auto-limited / supervised / autonomous, governed by the Interrupt Protocol.
- Backend convention: direct SQL queries, no ORM (vs Prisma in the current prototype).

## Links

- [[concepts/tugos]] — platform page.
- [[concepts/osl-orchestrator-model]] — the reusable architecture pattern itself.
- [[concepts/self-healing-pipeline]] — same governance philosophy (human-reviewed, staged autonomy).
- [[entities/open-scaffold-labs]] — the company and its 23-app ecosystem.
