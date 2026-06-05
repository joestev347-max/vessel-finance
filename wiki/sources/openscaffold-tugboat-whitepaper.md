---
type: source
created: 2026-06-04
updated: 2026-06-04
tags: [whitepaper, tugos, market-analysis, strategy, north-star]
source_count: 1
sources: [openscaffold-tugboat-whitepaper]
---

# Source: OpenScaffold Tugboat Whitepaper (June 2026)

**Raw file**: `raw/openscaffold-tugboat-whitepaper.pdf` (16 pages, OSL Industry Vertical White Paper, Confidential & Proprietary)

> **This is the project's north-star document.** Per Joseph (2026-06-04): this whitepaper defines
> the end goal we are building toward. The companion architecture doc is
> [[sources/tugos-osl-architecture]].

## Summary

[[entities/open-scaffold-labs|Open Scaffold Labs]] makes the case for **[[concepts/tugos|TugOS]]** — a
purpose-built, mobile-first vertical SaaS platform for tugboat and inland marine towing operators.
The global marine management software market is $2.4B (2024), growing at 17.5% CAGR, with ~85% of
tugs estimated to run on legacy systems (paper logs, Excel, QuickBooks). No modern, SMB-priced
product targets harbor/coastal tug operators; the 3–30 vessel segment is the beachhead.

## Key points

- **Operational domains** (§1): dispatch, crew scheduling + USCG compliance, fuel tracking
  (30–50% of OPEX), maintenance/class surveys, billing (assist-hour / bollard pull / daily rate /
  contract), and per-vessel financial reporting — the last being exactly what
  [[overview|Vessel Finance]] prototypes today.
- **Why existing systems fail** (§2): invoice leakage, compliance risk, fuel waste, crew disputes,
  audit exposure, 30–60 day billing cycles. Enterprise ERPs (ABS NS, BASS, Veson IMOS) cost
  $50K–$500K+/yr; road-towing apps (Towbook) are the wrong domain; BargeOps is closest but targets
  100+ barge river operators.
- **Open-source foundations** (§4): Signal K (Apache 2.0, vessel IoT), OpenCPN (GPLv2, charts/AIS),
  MarineTraffic AIS Toolbox (open-sourced 2022), Flectra ERP maritime module (LGPL, back-office),
  STSS (NUS, traffic simulation), OpenShipping.org API standards.
- **The gap** (§5): operators with 3–30 tugs — thousands of U.S. companies — have no adequate
  option. This is TugOS's wedge.
- **Eight feature pillars** (§6): Dispatch & Job Board · Crew Management & USCG Compliance · Fuel
  Tracking & Efficiency · Maintenance & Class Records · Billing & Invoicing Engine · **Financial
  Reporting & Fleet P&L** (pillar 6 ≈ Vessel Finance's scope: per-vessel margin, cost breakdown,
  utilization, budget-vs-actual — see [[concepts/profitability-and-tce]],
  [[concepts/budget-transfers]], [[concepts/forecasting]]) · Mobile App · Integrations & Open Data.
- **Proposed stack** (§7): React/Next.js + Tailwind web, React Native (Expo) mobile, Node/Hono or
  FastAPI, **Supabase (PostgreSQL + RLS), multi-tenant from day one**, Vercel + Fly.io, Signal K,
  Paperclip + Claude API for AI, QuickBooks + Stripe. ⚠ differs from the current prototype stack —
  flagged in [[concepts/tugos]].
- **Go-to-market** (§8): tiers Deckhand (free) / Harbor $149/vessel/mo / Fleet $99/vessel/mo /
  Enterprise. Gulf Coast beachhead via AWO; 5 beta customers in 90 days, 20 paying by Year 1.
- **Next steps** (§9): customer discovery (wk 1–2) → technical spike (wk 3–4) → MVP (mo 2) → beta
  (mo 3) → commercial launch (mo 4–6) → scale (mo 6–12).
- **Best-in-class gameplan** (§10): four phases over 36 months —
  - *Phase 1 (mo 1–6)* Build trust on the water: captain buy-in, domain-expert hire, MVP = dispatch
    + job logging only, offline-first non-negotiable, 5 free Gulf Coast betas.
  - *Phase 2 (mo 6–18)* Become the operator's OS: crew compliance module, auto-billing from job
    records, captain app, analytics layer, SOC 2 Type I, one port-authority reference. Targets:
    20+ paying, $40K+ MRR, <5% churn.
  - *Phase 3 (mo 18–30)* Win the category: AI predictive maintenance (Paperclip + Claude), annual
    benchmark report, Spot Job Board marketplace (2–5% fee), public API, international expansion,
    Series A at 75+ customers / $150K+ MRR.
  - *Phase 4 (mo 30–36+)* Best-in-class posture: data moat, obsessive crew UX ("55-year-old captain
    in the wheelhouse" test), compliance-as-the-system (60-second USCG inspection report), community
    trust (AWO/Workboat), relentless iteration, network-effect flywheel.

## Extracted claims

- Marine management software market: $2.4B (2024), 17.5% CAGR 2025–2034, 38.5% NA revenue share.
- ~85% of tugs estimated to be on legacy systems.
- Diesel is 30–50% of a tug operator's operating expense.
- Fuel anomaly threshold used throughout: >8% deviation from vessel baseline.
- Cert-expiry alert windows: 90/30/7 days (90/60/30 in Phase 2 section — minor internal inconsistency).
- Pricing: Harbor $149/vessel/mo (min $299/mo), Fleet $99/vessel/mo at 11–50 vessels.

## Links

- [[concepts/tugos]] — the platform page distilled from this source.
- [[sources/tugos-osl-architecture]] — companion architecture blueprint.
- [[entities/open-scaffold-labs]] — the company.
