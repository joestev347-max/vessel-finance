# TugOS — Phase 0 Build Checklist (best-in-class mindset)

The goal is the best tugboat operating app in the industry. "Best" is not a
feeling — it's the gameplan's six measurable end-states, held forever:

- **O1** Crews choose it over paper (WAV / contracted ≥ 80%; the "55-year-old
  captain" usability test passes every release).
- **O2** It is the Subchapter M system of record (customers pass TPO audits on
  TugOS exports alone; Sub M record book produced in < 60s).
- **O3** It pays for itself visibly (recovered billables > subscription; median
  invoice-send < 24h).
- **O4** The data moat is real (1,000+ vessel-months; AI beats baseline on a
  holdout).
- **O5** The segment knows it (75+ paying; cited benchmark report; port-authority
  reference).
- **O6** The business stands alone ($150K+ MRR; < 5% monthly logo churn;
  default-alive).

North-star metric: **Weekly Active Vessels (WAV)**. Build so every decision can
be traced back to one of the above.

---

## Operating principles (apply to every commit)

- Evidence before code — every feature traces to an interview quote / ticket /
  telemetry.
- Crew-first, office-second — ships only after a working captain has used it.
- **Compliance is the spine, not a module** — Sub M / TSMS record-keeping is
  designed into the data model, never bolted on. (See the compliance note below
  for why the *tables* are deliberately deferred.)
- Offline is a feature of the foundation — sync correctness tested from the
  first mobile build; one data-loss event halts scaling.
- License hygiene by construction — no copyleft / non-commercial code in the
  product path; a license check runs in CI.
- Autonomy is earned — agents climb log-only → supervised → autonomous; the
  Interrupt Protocol guards financial / compliance / PII actions.
- Gates, not vibes — each phase ends in a written review against pre-committed
  criteria.

---

## Foundation increment (this folder) — status

- [x] Core `tug_` schema: companies, users, vessels, clients, crew, jobs
- [x] Per-tenant `company_id` on every table + tenant-scoping indexes
- [x] RLS enabled + tenant-isolation policy on every table
- [x] **FORCE RLS** (owner is subject to policy, not just other roles)
- [x] Non-superuser `tug_app` role; DML revoked from PUBLIC / anon / authenticated
- [x] Deny-by-default tenant resolver (unset context matches no rows)
- [x] **Composite tenant FKs** (cross-tenant references structurally impossible)
- [x] `updated_at` + trigger on every table (change auditability)
- [x] CHECK constraints on every categorical / required field
- [x] pgTAP isolation suite (11 assertions: read / insert / update / delete /
      cross-tenant FK / deny-by-default)
- [x] All SQL validated against the real PostgreSQL grammar (libpg_query)
- [x] **Applied to the dedicated Supabase project** `TUGOS` (ref `naxqxajzlmisqdnfvhzm`, us-east-2) — migrations 0001/0002/0003
- [x] RLS isolation tests **green on live DB** (11/11) — Gate 0 criterion met; schema left empty (seed rolled back)
- [x] Function `search_path` pinned (advisor 0011); Supabase security advisor returns **0 findings**
- [ ] Pen test focused on cross-tenant access (before first port-authority deal)

## Rest of Phase 0 (Workstream B — technical spike)

- [ ] Deploy genetic template into the dedicated Supabase project
- [ ] Real-time job board via **Supabase Realtime** (NOT WebSockets on Vercel);
      Fly.io socket fallback designed
- [ ] Expo offline-queue prototype: append-only action log, sync replay,
      device-bound refresh token, airplane-mode zero-loss test
- [ ] Two commercial AIS vendors evaluated behind ONE swappable adapter
- [ ] CI license gate across all planned dependencies (no NC / copyleft in path;
      DocuSeal AGPL decision documented)
- [ ] **Gate 0 review** (written, against pre-committed criteria)

> Workstream A (discovery / interviews / advisor) is owner-led and tracked
> separately at your direction.

---

## Risk register → concrete preventions (watch these the whole build)

| Risk | Prevention (where it lives) | Early warning |
|---|---|---|
| **Cross-tenant data leak** (top technical risk) | RLS + FORCE RLS + composite tenant FKs + `tug_app` least-privilege; RLS tests in CI per table; pen test before port-authority deals | any RLS/isolation test regression; pen-test finding |
| Offline sync corrupts records | append-only action log + deterministic server replay; property-based sync tests; weekly sync telemetry | conflict-rate uptick; "missing entry" tickets |
| Real-time fails on serverless | Supabase Realtime from day 1 behind a swappable transport adapter | Realtime latency / connection limits in load tests |
| License violation ships (the CC BY-NC near-miss) | CI license gate; AGPL (DocuSeal) isolated behind adapter pending review | CI license-gate failure; dependency-bump alert |
| **Sub M records implemented wrong** (worst-case: a customer fails an audit) | formats validated by advisor **and** a practicing TPO auditor before build; module labeled beta until a real audit passes | TPO feedback; USCG guidance change |
| AIS vendor cost/terms shift | two vendors, one adapter interface, usage caps + alerts | per-vessel AIS cost above model |
| Crew adoption fails (the classic death) | wheelhouse test every release; offline-first; captain co-design; advisor UX veto | WAV < 70%; sessions concentrated in office roles |
| Feature bloat dilutes the MVP | every feature maps to a quote; one-workflow discipline | backlog items without quotes |
| Autonomous agent takes wrong high-stakes action | autonomy ladder + Interrupt Protocol on $/compliance/PII; MLflow audit trail | draft-acceptance falling; any interrupt override |
| Beacon hallucinates a reg answer | RAG over Catalog of Authority with mandatory citations; "consult your TPO" framing | citation-missing rate; user corrections |
| Runway burns before Gate 2 | phase budgets at Gate 0; default-alive; betas capped at 5 | burn vs budget; gate slippage |

---

## Two deliberate guards recorded now

**Compliance spine — why the Sub M tables are deferred, not forgotten.** The
principle says compliance is designed in from the first migration. The register
says the *worst-case* compliance failure is implementing Sub M records wrong and
a customer failing a TPO audit on our exports. Those reconcile as: the schema is
built **isolation- and audit-ready** now (per-tenant RLS, `updated_at`, composite
FKs), but the actual Sub M / TSMS record tables are authored only **after** the
maritime advisor and a practicing TPO auditor validate the formats. Guessing the
schema now would bake in the exact error the register warns against.

**License gate — armed before the first dependency.** This foundation has no
third-party runtime dependencies, so nothing to scan yet. The guard: a CI
license check must be wired in *before* the spike adds Expo / AIS / PDF / signature
libraries, so no NC or copyleft code ever enters the product path (DocuSeal is
AGPL → stays behind the adapter pending a formal review).

---

## Gate 0 — definition of pass (do not start Phase 1 on a fail)

Advisor retained · 10+ interviews coded · H2 (Sub M pain) confirmed by a majority
of mid-size operators · H3 (~$149/vessel willingness) signal present · **RLS
isolation tests green** · offline prototype survives airplane-mode replay with
zero loss. Fail on H2/H3 → reposition before building.
