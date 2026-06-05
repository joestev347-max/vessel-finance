---
type: synthesis
created: 2026-06-04
updated: 2026-06-04
tags: [tugos, gameplan, execution, roadmap, north-star]
source_count: 2
sources: [openscaffold-tugboat-whitepaper, tugos-osl-architecture]
---

# TugOS Build Gameplan — pointer page

The full plan is **`docs/tugos-build-gameplan.pdf`** (v1.0, 9 pp, 2026-06-04) — the execution layer
on top of `docs/tugos-whitepaper-v2.pdf` and `docs/tugos-osl-architecture-v2.pdf`. Generator:
`tools/make-tugos-gameplan.py`. This page is the skeleton for session recall.

## Structure

1. **Definition of done** — six measurable end-state outcomes (O1–O6); north-star metric =
   **Weekly Active Vessels (WAV)**.
2. **Operating principles** — evidence before code, crew-first, compliance as the spine,
   offline in the foundation, license hygiene in CI, autonomy is earned, gates not vibes.
3. **Build order mapped to the [[sources/tugos-osl-architecture|blueprint]]** — notable: the live
   job board uses **Supabase Realtime, not WebSockets on Vercel** (verified: Vercel serverless
   can't hold WebSocket connections; Fly.io socket service is the fallback).
4. **Phase 0 (wk 1–4)** — discovery (H1–H4 interviews, domain advisor) + timeboxed technical
   spike (dedicated Supabase project, RLS tests, offline queue prototype, dual AIS vendor
   evaluation, license gate). **Gate 0** before any MVP code.
5. **Phase 1 (mo 1–6)** — dispatch + job-logging MVP, 5 Gulf betas, sync telemetry. **Gate 1**:
   500+ jobs, 0 data loss, WAV ≥70%.
6. **Phase 2 (mo 6–18)** — Sub M/TSMS module (TPO-validated), billing engine, captain app,
   analytics (ports Vessel Finance patterns), first draft-only agents, SOC 2 Type I + pen test,
   port-authority reference. **Gate 2**: 20+ paying, $40K MRR, <5% churn, 1 real TPO audit passed.
7. **Phase 3 (mo 18–30)** — agent suite on the autonomy ladder (log-only → supervised →
   autonomous w/ Interrupt Protocol), predictive models vs holdout, benchmark report, public API,
   marketplace **gated on H4**, international. **Gate 3**: 75+ paying, $150K MRR.
8. **Phase 4 (mo 30–36+)** — posture: O1–O6 re-measured quarterly forever.
9. **Risk register** — 6 categories (market, adoption, technical, compliance/legal, AI, business),
   each risk with prevention + early-warning signal + contingency.
10. **Kill/pivot criteria** — pre-committed (Gate 0 fail → reposition; data loss → halt; churn >8%
    ×2mo → stop acquisition; no H4 evidence → no marketplace).
11. **Measurement system** + 12. **governance cadence** + 13. **audit record** (verified facts vs
    working assumptions explicitly separated).

## Links

- [[concepts/tugos]] · [[synthesis/tugos-whitepaper-audit]] · [[sources/tugos-osl-architecture]]
