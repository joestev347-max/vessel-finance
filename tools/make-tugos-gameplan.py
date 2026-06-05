# Generate the TugOS Build Gameplan v1.0 (PDF) - references Architecture Blueprint v2
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)

OUT = r"C:\Users\joest\vessel-finance\docs"
os.makedirs(OUT, exist_ok=True)

NAVY = colors.HexColor("#0e2a47")
TIDE = colors.HexColor("#1d6fa5")
LIGHT = colors.HexColor("#e8f0f7")
GREY = colors.HexColor("#555555")
AMBER = colors.HexColor("#fdf3e0")

ss = getSampleStyleSheet()
S = {}
S["title"] = ParagraphStyle("t", parent=ss["Title"], fontSize=21, leading=26, textColor=NAVY, spaceAfter=6)
S["subtitle"] = ParagraphStyle("st", parent=ss["Normal"], fontSize=11.5, leading=15, textColor=TIDE,
                               alignment=TA_CENTER, spaceAfter=4)
S["meta"] = ParagraphStyle("m", parent=ss["Normal"], fontSize=9, leading=12, textColor=GREY,
                           alignment=TA_CENTER, spaceAfter=14)
S["h1"] = ParagraphStyle("h1", parent=ss["Heading1"], fontSize=14, leading=17.5, textColor=NAVY,
                         spaceBefore=15, spaceAfter=6)
S["h2"] = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=11.5, leading=15, textColor=TIDE,
                         spaceBefore=9, spaceAfter=4)
S["body"] = ParagraphStyle("b", parent=ss["Normal"], fontSize=9.5, leading=13.5, spaceAfter=6)
S["bullet"] = ParagraphStyle("bl", parent=S["body"], leftIndent=14, bulletIndent=4, spaceAfter=3)
S["cell"] = ParagraphStyle("c", parent=ss["Normal"], fontSize=8.3, leading=10.8)
S["cellhdr"] = ParagraphStyle("ch", parent=S["cell"], textColor=colors.white, fontName="Helvetica-Bold")
S["callout"] = ParagraphStyle("co", parent=S["body"], leftIndent=10, rightIndent=10, borderColor=TIDE,
                              borderWidth=0.8, borderPadding=7, backColor=LIGHT, spaceBefore=6, spaceAfter=10)
S["gate"] = ParagraphStyle("ga", parent=S["body"], leftIndent=10, rightIndent=10,
                           borderColor=colors.HexColor("#b07d2b"), borderWidth=0.8, borderPadding=7,
                           backColor=AMBER, spaceBefore=6, spaceAfter=10)

def P(t): return Paragraph(t, S["body"])
def B(t): return Paragraph(t, S["bullet"], bulletText="•")
def H1(t): return Paragraph(t, S["h1"])
def H2(t): return Paragraph(t, S["h2"])
def CO(t): return Paragraph(t, S["callout"])
def GATE(t): return Paragraph(t, S["gate"])

def TBL(headers, rows, widths):
    data = [[Paragraph(h, S["cellhdr"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(c, S["cell"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b9c8d6")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t

s = []
s.append(Paragraph("TugOS Build Gameplan", S["title"]))
s.append(Paragraph("From Zero to Best-in-Class — The Methodical Route", S["subtitle"]))
s.append(Paragraph("Companion to the Vertical Architecture Blueprint v2 and Whitepaper v2", S["subtitle"]))
s.append(Paragraph("OPEN SCAFFOLD LABS · EXECUTION PLAN · Version 1.0 · June 2026 · Confidential &amp; Proprietary",
                   S["meta"]))
s.append(P("This document is the execution layer on top of the TugOS Whitepaper v2 (the why and the what) "
           "and the Architecture Blueprint v2 (the how). It defines the end-state that 'best app in the "
           "field' actually means in measurable terms, sequences every build step against the blueprint's "
           "components, places a decision gate at the end of every phase, and maintains a risk register that "
           "pairs each failure mode with a prevention, an early-warning signal, and a contingency. It is a "
           "living document: every gate review updates it."))

# 01 ------------------------------------------------------------------
s.append(H1("01 · Definition of Done: What 'Best in the Field' Means"))
s.append(P("'Best' is not a feeling; it is a set of conditions that can each be checked. TugOS is the best "
           "app in its field when, by roughly Month 36, all of the following are simultaneously true:"))
s.append(TBL(["#", "End-state outcome", "How it is measured"],
             [["O1", "Crews choose it: captains and deckhands prefer TugOS to paper",
               "Weekly active vessels / contracted vessels at 80%+; crew-side app sessions on a majority of "
               "active vessels; the '55-year-old captain' usability test passes on every release"],
              ["O2", "It is the Subchapter M system of record for its customers",
               "Customers pass TPO audits using TugOS exports alone; documented cases of USCG boardings "
               "where the Sub M record book was produced from the app in under 60 seconds"],
              ["O3", "It pays for itself visibly", "Recovered billable hours and faster invoicing per "
               "customer exceed subscription cost; median invoice-send time under 24h from job completion"],
              ["O4", "The data moat is real", "1,000+ vessel-months of operational data; AI maintenance and "
               "fuel models measurably outperform baseline rules (tracked vs. holdout)"],
              ["O5", "The segment knows it", "75+ paying companies; an annual benchmark report cited in "
               "trade press; a port-authority reference; AWO presence every year"],
              ["O6", "The business stands on its own", "$150K+ MRR, under 5% monthly logo churn, gross "
               "margin consistent with SaaS norms, default-alive without Series A"]],
             [0.35*inch, 2.55*inch, 4.0*inch]))
s.append(CO("<b>North-star metric: Weekly Active Vessels (WAV).</b> One number that forces everything "
            "else to be true — a vessel is 'active' only when its crew logged a job, fuel entry, or "
            "maintenance item that week. Revenue follows vessels; vessels follow crews; crews follow UX."))

# 02 ------------------------------------------------------------------
s.append(H1("02 · Operating Principles (apply to every decision)"))
s.append(B("<b>Evidence before code.</b> Every feature traces to an interview quote, a support ticket, or "
           "usage telemetry. The audit that produced the v2 docs exists because desk assumptions failed; "
           "the same discipline applies to ourselves."))
s.append(B("<b>Crew-first, office-second.</b> The buyer is the owner, but the adoption decision is made in "
           "the wheelhouse. Every feature ships only after a working captain has used it."))
s.append(B("<b>Compliance is the spine, not a module.</b> 46 CFR Subchapter M / TSMS record-keeping is "
           "designed into the data model from the first schema migration, not bolted on in Phase 2."))
s.append(B("<b>Offline is a feature of the foundation.</b> Sync correctness is tested from the first "
           "mobile build; a single beta data-loss event halts scaling until root-caused."))
s.append(B("<b>License hygiene by construction.</b> No copyleft or non-commercial code in the product "
           "path; a license check runs in CI. (This is how the CC BY-NC AIS toolbox error stays fixed.)"))
s.append(B("<b>Autonomy is earned, not granted.</b> AI agents climb a ladder — log-only, then supervised, "
           "then autonomous-with-interrupt — and financial or compliance actions never skip rungs."))
s.append(B("<b>Gates, not vibes.</b> Each phase ends in a written gate review against pre-committed "
           "criteria. Passing is explicit; failing triggers the documented contingency, not improvisation."))

# 03 ------------------------------------------------------------------
s.append(H1("03 · The Reference Architecture and Its Build Order"))
s.append(P("The Architecture Blueprint v2 defines the destination: three surfaces (UI, REST API, MCP), "
           "five MCP servers plus NotebookLM memory, six governed agents, seven scheduled automations, the "
           "Catalog of Authority, a dedicated Supabase project with per-tenant RLS, and offline "
           "refresh-token auth. The gameplan's job is sequencing — what gets built when, and why."))
s.append(TBL(["Blueprint component", "Phase", "Sequencing rationale"],
             [["Genetic template deploy + dedicated Supabase project + core tug_ schema", "0–1",
               "Everything sits on it; isolation decisions are cheap now, expensive later"],
              ["Surface 2 (Express REST API) + roles/auth", "1", "Every UI action is an API call; the API "
               "is the contract everything else builds against"],
              ["Surface 1 (dispatch board UI)", "1", "The MVP workflow; the thing that replaces the radio "
               "log and phone calls"],
              ["Mobile app core (offline job log)", "1", "Crew adoption is the wedge; offline correctness "
               "must mature for 12+ months before it matters at scale"],
              ["Real-time layer — Supabase Realtime (NOT WebSockets on Vercel)", "1",
               "Verified: Vercel serverless cannot hold WebSocket connections; Supabase Realtime "
               "subscriptions deliver the live job board within the chosen stack; a Fly.io socket service "
               "is the fallback if Realtime limits bind"],
              ["Billing engine + QuickBooks sync", "2", "Highest visible ROI; needs trustworthy job records "
               "as input, which Phase 1 produces"],
              ["Sub M / TSMS compliance module", "2", "Highest retention lever; needs advisor + TPO "
               "validation loops that start in Phase 0"],
              ["Fuel logging (manual first, Signal K optional)", "2", "Manual entry proves the habit; "
               "hardware integration only after software value is proven"],
              ["Analytics / fleet P&amp;L dashboard", "2", "Needs months of accumulated data to be "
               "non-empty; Vessel Finance patterns (money-as-cents, engines) port here"],
              ["MCP surfaces (orchestration read-only, client portal)", "2", "AI-native surface starts "
               "read-only; write tools follow the autonomy ladder"],
              ["Agents: Daily Briefing, Invoice (draft-only)", "2", "Lowest-risk agents first; both produce "
               "drafts a human approves"],
              ["Agents: Fuel, Compliance, Dispatch, Fleet Health + Interrupt Protocol", "3",
               "Need 12+ months of baseline data to be better than rules; supervised before autonomous"],
              ["Predictive maintenance models + benchmark report", "3", "The data moat monetized; "
               "requires vessel-month volume only Phase 2 retention can produce"],
              ["Public API, marketplace (gated), international", "3", "Defensibility layers on top of an "
               "embedded product, never before it"]],
             [2.45*inch, 0.5*inch, 3.95*inch]))

# 04 ------------------------------------------------------------------
s.append(H1("04 · Phase 0 — Foundations (Weeks 1–4): Earn the Right to Build"))
s.append(H2("Workstream A — Discovery (the main event)"))
s.append(B("Recruit and retain the <b>maritime domain advisor</b> (retired port captain / ops manager) — "
           "they gate interview access, Sub M validation, and AWO credibility. Start here; week 1."))
s.append(B("Write the <b>interview instrument</b> around the four whitepaper hypotheses: H1 paper/Excel "
           "prevalence, H2 Sub M audit pain as purchase trigger, H3 willingness-to-pay ~$149/vessel below "
           "Helm, H4 spot-market liquidity. Add open workflow mapping: how a job arrives, who writes what, "
           "what a TPO audit looks like."))
s.append(B("Run <b>10–15 structured interviews</b> across operator sizes (solo, 3–10, 10–30 vessels, one "
           "port authority), recruited via the advisor, AWO Gulf Region, and port dispatcher relationships. "
           "Record, transcribe, and code against the hypotheses; every MVP feature must map to a quote."))
s.append(H2("Workstream B — Technical spike (parallel, timeboxed)"))
s.append(B("Deploy the genetic template into a <b>dedicated Supabase project</b>; stand up core tug_ "
           "schema (vessels, jobs, crew, clients) with per-tenant RLS and write the first RLS isolation "
           "tests the same week."))
s.append(B("Prove the <b>real-time job board</b> path with Supabase Realtime subscriptions end-to-end "
           "(insert job, see board update); document the Fly.io fallback design."))
s.append(B("Prototype the <b>offline queue</b> on Expo: local store, append-only action log, sync replay, "
           "device-bound refresh token; kill-the-radio test on airplane mode."))
s.append(B("Evaluate <b>two commercial AIS APIs</b> on coverage, latency, and terms; wrap behind one "
           "adapter so the vendor is swappable. Bench-test Signal K on a single sensor kit but defer "
           "productization."))
s.append(B("Run the <b>license gate</b> across all planned dependencies (no NC/copyleft in product path; "
           "DocuSeal AGPL decision documented) and wire it into CI."))
s.append(GATE("<b>Gate 0 (end of Week 4).</b> PASS requires: advisor retained · 10+ interviews coded · "
              "H2 confirmed by a majority of mid-size operators (Sub M pain in their top 3) · H3 signal "
              "present (multiple operators say yes at ~$149/vessel) · RLS isolation tests green · offline "
              "prototype survives airplane-mode replay with zero loss. "
              "FAIL on H2/H3 → reposition before building (see Kill/Pivot, section 09). "
              "Do not start Phase 1 on a failed gate."))

# 05 ------------------------------------------------------------------
s.append(H1("05 · Phase 1 — Trust on the Water (Months 1–6)"))
s.append(P("One workflow, nailed: digital job dispatch with crew notification and time-stamped logging. "
           "If a dispatcher can replace the radio log and phone calls in 90 days, everything else follows."))
s.append(H2("Build sequence"))
s.append(B("M1–M2: Surface 2 API (jobs, vessels, crew, clients; role middleware) → dispatch board UI with "
           "Realtime updates → mobile job acceptance + status progression (en route / on scene / complete / "
           "clear) with offline queue."))
s.append(B("M2–M3: time-stamped job logging with photo capture; GPS breadcrumbs on active jobs; "
           "draft-invoice export (manual trigger, PDF via pdf-lib) — early because recovered billables are "
           "the first visible ROI."))
s.append(B("M3–M6: hardening loop with betas — sync telemetry (sync-failure rate, conflict rate, "
           "crash-free sessions) on a dashboard watched weekly; UX iteration with working captains aboard."))
s.append(H2("Beta program"))
s.append(B("5 Gulf Coast operators, comped 6 months, in exchange for weekly feedback calls, telemetry "
           "access, and a case study. Onboard in person; the advisor joins the first call with each."))
s.append(B("Instrumentation from day 1: every feature emits usage events; WAV is computed from week one."))
s.append(GATE("<b>Gate 1 (end of Month 6).</b> PASS requires: 5 active betas · 500+ jobs logged · "
              "0 data-loss events · WAV at 70%+ of beta vessels · 2+ dispatchers state they would not go "
              "back to paper (recorded). FAIL on adoption → UX root-cause with captains before any new "
              "features. FAIL on data loss → freeze features, fix sync, re-run 30-day soak."))

# 06 ------------------------------------------------------------------
s.append(H1("06 · Phase 2 — Become the Operator's OS (Months 6–18)"))
s.append(B("<b>Sub M / TSMS module:</b> drills, inspections, maintenance logs, manning records, "
           "audit-readiness sweeps (the blueprint's subm-audit-readiness automation). Validate the record "
           "formats with the advisor AND a practicing TPO auditor before launch; pilot with one beta "
           "through a real audit cycle. This is the retention moat: years of compliance records that live "
           "nowhere else."))
s.append(B("<b>Billing engine:</b> hourly assist / bollard pull / charter / contract models; two-click "
           "invoice from completed job with GPS track and crew list attached; QuickBooks two-way sync; "
           "disputed-invoice workflow. Measure recovered billables per customer and publish the number to "
           "the customer monthly."))
s.append(B("<b>Captain app completion:</b> fuel log entry, maintenance reporting with photos, client "
           "signature capture (DocuSeal behind the adapter, pending license review), push notifications. "
           "90/30/7 cert-expiry alerts to crew and office."))
s.append(B("<b>Analytics layer:</b> utilization, revenue per operating hour, fuel trend, top clients — "
           "porting Vessel Finance's proven patterns (integer-cents money, profitability/forecast "
           "engines)."))
s.append(B("<b>First agents (draft-only):</b> Daily Briefing (6am compile) and Invoice (draft within 1 "
           "hour of job completion, human approves). Both run weeks in log-only mode first; their outputs "
           "are compared to human baselines before anyone sees them."))
s.append(B("<b>Trust infrastructure:</b> SOC 2 Type I via Vanta/Drata (made credible by the dedicated "
           "project isolation); third-party pen test focused on cross-tenant access before the first port "
           "authority conversation; public status page."))
s.append(B("<b>Port authority reference:</b> target the 3rd–4th largest Gulf port (they move faster); the "
           "pen test, SOC 2, and the advisor open the door."))
s.append(GATE("<b>Gate 2 (Month 18).</b> PASS requires: 20+ paying companies · $40K+ MRR · &lt;5% monthly "
              "logo churn · 200+ crew profiles · 1+ customer passed a TPO audit using TugOS records · "
              "SOC 2 Type I issued · invoice agent draft-acceptance above 80%. FAIL on churn → stop "
              "acquisition spend, run win-back interviews, fix the top-2 cancellation causes before "
              "resuming. FAIL on audit validation → compliance module stays 'beta'-labeled until a real "
              "audit passes."))

# 07 ------------------------------------------------------------------
s.append(H1("07 · Phase 3 — Win the Category (Months 18–30)"))
s.append(B("<b>Agent suite to full strength</b> under the Interrupt Protocol: Fuel (auto-limited under "
           "$2K), Compliance (supervised; Sub M completeness), Dispatch (supervised recommendations), "
           "Fleet Health (autonomous scoring). Each climbs log-only → supervised → autonomous with "
           "pre-committed promotion criteria (accuracy vs. human baseline over a defined window) and "
           "automatic demotion on error."))
s.append(B("<b>Predictive maintenance + fuel anomaly models</b> trained on accumulated fleet data; "
           "performance tracked against a holdout and against the simple-rules baseline — the moat claim "
           "must be measured, not asserted."))
s.append(B("<b>Annual 'State of Tugboat Operations' benchmark report</b> from anonymized aggregate data; "
           "launch at AWO/Workboat; this is the inbound engine and the authority position."))
s.append(B("<b>Public API + integration partners:</b> payroll, insurance cert validation, port systems. "
           "Each integration deepens switching costs."))
s.append(B("<b>Spot Job Board marketplace — built ONLY if hypothesis H4 tested true</b> in Phases 0–2 "
           "evidence (operators repeatedly asking for spot capacity matching). If liquidity is absent, the "
           "network effect comes from benchmark data instead; do not build a ghost-town marketplace."))
s.append(B("<b>International expansion</b> (IMO/STCW frameworks travel; multi-currency; Spanish, Bahasa) "
           "and <b>Series A</b> from strength: 75+ customers, $150K+ MRR, measured data moat — or skip the "
           "raise if default-alive economics make it optional."))
s.append(GATE("<b>Gate 3 (Month 30).</b> PASS requires: 75+ paying · $150K+ MRR · 1,000+ vessel-months · "
              "agent suite at target autonomy with zero uncontained high-stakes errors · benchmark report "
              "published and cited. FAIL on agent safety → demote autonomy and extend supervised period; "
              "the Interrupt Protocol's audit trail is the evidence base either way."))

# 08 ------------------------------------------------------------------
s.append(H1("08 · Phase 4 — Best in Class as a Posture (Months 30–36+)"))
s.append(P("By Month 30 the remaining work is organizational, not architectural: the data moat compounds "
           "(every vessel-month deepens the deficit later entrants face); crew UX is re-validated on every "
           "release against the wheelhouse test; compliance depth means customers run actual USCG "
           "boardings from the app; community trust is renewed annually at AWO and Workboat with real "
           "customer stories; the public roadmap, quarterly customer advisory board, and 24-hour bug SLA "
           "keep the feedback flywheel spinning. Best-in-class is held, not reached: section 01's outcomes "
           "O1–O6 are re-measured quarterly forever."))

# 09 ------------------------------------------------------------------
s.append(PageBreak())
s.append(H1("09 · Risk Register — What Could Go Wrong, and the Countermeasure"))
s.append(P("Each risk carries a prevention (built in advance), an early-warning signal (watched on a "
           "dashboard or in gate reviews), and a contingency (pre-decided response). The register is "
           "reviewed monthly and at every gate."))
s.append(H2("A · Market &amp; competitive"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["Helm CONNECT moves down-market with an SMB tier",
               "Speed + self-serve + crew UX as structural advantages an enterprise vendor is slow to copy; "
               "transparent pricing as the anchor",
               "Helm pricing/packaging announcements; losses in deals citing Helm",
               "Compete on adoption speed and wheelhouse UX; never on feature count"],
              ["Discovery invalidates H1/H3 (market is more digital or poorer than assumed)",
               "Phase 0 gate exists precisely for this; hypotheses pre-written",
               "Interview coding shows &lt;40% hypothesis confirmation",
               "Reposition (different segment, price, or wedge workflow) before any build spend"],
              ["Marketplace assumption fails (H4)",
               "Marketplace is gated, not scheduled; benchmark-data network effect is the alternative",
               "No organic spot-capacity requests from customers by Phase 2",
               "Ship benchmark reports as the network layer; revisit marketplace yearly"],
              ["A VC-funded copycat outspends marketing",
               "Compliance records + data history = switching costs that ads cannot buy",
               "Funded entrant announcements; CAC inflation",
               "Double down on retention levers (Sub M records, analytics); publish the benchmark report"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))
s.append(H2("B · Adoption &amp; product"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["Crews reject the app (the classic maritime-software death)",
               "Wheelhouse test every release; offline-first; captain co-design in betas; the advisor's "
               "veto on UX",
               "WAV below 70% of contracted vessels; crew sessions concentrated in office roles",
               "Feature freeze; field visits; fix the top-3 crew complaints before anything else"],
              ["Beta data loss destroys trust",
               "Append-only sync log; soak tests; sync telemetry watched weekly; 0-loss gate",
               "Any sync-failure or conflict-rate uptick",
               "Halt scaling; root-cause; 30-day clean soak before resuming"],
              ["Feature bloat dilutes the MVP",
               "Every feature maps to an interview quote; one-workflow MVP discipline",
               "Backlog items without quotes attached",
               "Cut scope at gate reviews; the gate criteria do not include feature count"],
              ["Free tier attracts support load, not conversions",
               "Deckhand tier capped (1 vessel, 30-day history); self-serve onboarding",
               "Support tickets per free account; free-to-paid conversion under 3%",
               "Tighten tier limits; add in-product upgrade prompts; never staff support for free tier"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))
s.append(H2("C · Technical &amp; architecture"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["Real-time job board fails on serverless (verified: Vercel cannot host WebSockets)",
               "Supabase Realtime subscriptions from day 1; adapter so transport is swappable",
               "Realtime latency/connection limits in load tests",
               "Dedicated Fly.io socket service (design documented in Phase 0)"],
              ["Offline sync conflicts corrupt records",
               "Append-only action log + server-side replay with deterministic conflict rules; "
               "property-based sync tests",
               "Conflict-rate telemetry; support tickets mentioning 'missing' entries",
               "Freeze, reproduce, fix, soak; compensating audit log preserves every raw action"],
              ["Cross-tenant data leak (RLS misconfiguration)",
               "Dedicated project; RLS tests in CI per table; tenant-scoped connections; pen test before "
               "port-authority deals",
               "Any RLS test regression; pen-test findings",
               "Disclose per SOC 2 obligations; incident runbook written in Phase 2"],
              ["AIS vendor cost or terms shift",
               "Two vendors evaluated; one adapter interface; usage caps and alerts",
               "Per-vessel AIS cost trending above model",
               "Swap vendor behind the adapter; degrade to lower polling before degrading UX"],
              ["Signal K hardware variance burns integration time",
               "Manual fuel entry first; IoT optional per vessel; supported-hardware list kept short",
               "Integration hours per vessel rising",
               "Pause hardware onboarding; certify one kit; revisit quarterly"],
              ["Genetic-template drift (dedicated project diverges from OSL core)",
               "Template updates pulled on a cadence; deviations documented in the blueprint",
               "Merge pain on template updates",
               "Quarterly reconciliation sprint; never fork silently"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))
s.append(H2("D · Compliance &amp; legal"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["Sub M records implemented wrong (worst case: a customer fails an audit using our exports)",
               "Advisor + practicing TPO auditor validate formats before launch; pilot through a real "
               "audit; module labeled beta until one passes",
               "TPO feedback on pilot; USCG guidance changes",
               "Immediate correction release; customer notification; regulatory-watch automation"],
              ["License violation ships (the CC BY-NC near-miss, repeated)",
               "License gate in CI; no NC/copyleft in product path; AGPL components isolated and reviewed",
               "CI license-gate failures; dependency-bump alerts",
               "Remove/replace component; legal review; document in the register"],
              ["Crew PII mishandled",
               "PII changes route through the Interrupt Protocol; data minimization; SOC 2 controls",
               "Access-log anomalies",
               "Incident runbook; disclosure per obligations"],
              ["Advisor key-person dependency",
               "Build an advisory board of 3+ by Phase 2 (the gameplan's customer advisory board "
               "doubles here)",
               "Single advisor on every critical path",
               "Retain a second advisor; document advisor knowledge in the wiki"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))
s.append(H2("E · AI &amp; agents"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["An autonomous agent takes a wrong high-stakes action",
               "Autonomy ladder (log-only → supervised → autonomous); Interrupt Protocol on financial/"
               "compliance/PII actions; MLflow audit trail",
               "Draft-acceptance rate falling; any interrupt override",
               "Automatic demotion one rung; incident review; promotion criteria re-run from zero"],
              ["Beacon assistant hallucinates a regulatory answer",
               "RAG over the Catalog of Authority with mandatory citations; advisor spot-audits; "
               "'consult your TPO' framing on compliance answers",
               "Citation-missing rate; user corrections",
               "Constrain to retrieval-only answers for regulatory queries"],
              ["Model/API cost outgrows unit economics",
               "Per-tenant AI cost telemetry from first agent; caching; small-model routing",
               "AI cost per vessel-month trending up",
               "Batch schedules; cheaper models for routine drafts; reprice Enterprise tier"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))
s.append(H2("F · Business &amp; execution"))
s.append(TBL(["Risk", "Prevention", "Early warning", "Contingency"],
             [["Runway burns before Gate 2 economics arrive",
               "Phase budgets set at Gate 0; default-alive plan; comped betas capped at 5",
               "Burn vs. budget monthly; gate slippage",
               "Cut scope to the retention core (dispatch + Sub M + billing); extend timeline, not burn"],
              ["Churn from support gaps as customer count grows",
               "24h bug SLA for paying customers; public roadmap; quarterly advisory board",
               "Time-to-first-response; churn interviews citing support",
               "Hire support before sales; the gameplan staffs retention before acquisition"],
              ["Pricing set wrong (too low to sustain, too high to land)",
               "H3 tested in Phase 0; recovered-billables ROI published per customer",
               "Win/loss notes; discount frequency",
               "Reprice with grandfathering; value-anchor on recovered revenue, not features"],
              ["Series A dependence forces bad terms",
               "Default-alive as the planning baseline; raise from strength or not at all",
               "Plan requires capital before Gate 2 passes",
               "Slow hiring; focus on Gulf density over geographic spread"]],
             [1.55*inch, 2.0*inch, 1.55*inch, 1.8*inch]))

# 10 ------------------------------------------------------------------
s.append(H1("10 · Kill / Pivot Criteria (decided now, while heads are cool)"))
s.append(B("<b>Reposition</b> if Gate 0 fails on H2/H3: the segment, price point, or wedge workflow "
           "changes before MVP code is written."))
s.append(B("<b>Halt scaling</b> on any beta data-loss event or cross-tenant finding: features freeze "
           "until a clean 30-day soak passes."))
s.append(B("<b>Stop acquisition</b> if monthly logo churn exceeds 8% for two consecutive months: "
           "retention is fixed before another dollar of marketing."))
s.append(B("<b>Do not build the marketplace</b> unless H4 evidence exists by Gate 2; revisit annually."))
s.append(B("<b>Re-plan the venture</b> if Gate 1 passes but Gate 2's paying-customer criterion misses by "
           "more than 50% at Month 18: the honest options (niche lifestyle business, acquihire "
           "conversations, or a different vertical on the same template) get a written decision memo."))

# 11 ------------------------------------------------------------------
s.append(H1("11 · Measurement System"))
s.append(TBL(["Layer", "Metrics", "Cadence"],
             [["North star", "Weekly Active Vessels (WAV) and WAV / contracted vessels", "Weekly"],
              ["Adoption", "Crew-side sessions per vessel; jobs logged; time-to-first-job for new "
               "customers; '55-year-old captain' test pass rate", "Weekly"],
              ["Reliability", "Sync-failure rate; conflict rate; crash-free sessions; data-loss events "
               "(target: zero, forever)", "Continuous dashboard"],
              ["Economics", "MRR; logo + revenue churn; CAC by channel; recovered billables per customer; "
               "AI cost per vessel-month", "Monthly"],
              ["Compliance value", "Customers through TPO audits on TugOS records; inspection-report "
               "generation time", "Per event + quarterly"],
              ["AI quality", "Draft-acceptance rates; model-vs-baseline lift on holdout; interrupt "
               "overrides", "Weekly once agents ship"],
              ["Risk", "Register review; early-warning signal scan", "Monthly + every gate"]],
             [1.1*inch, 4.3*inch, 1.5*inch]))

# 12 ------------------------------------------------------------------
s.append(H1("12 · Governance &amp; Cadence"))
s.append(B("<b>Weekly:</b> beta/customer feedback call; reliability dashboard review; WAV review."))
s.append(B("<b>Monthly:</b> risk-register review; burn vs. phase budget; metrics pack."))
s.append(B("<b>Per gate:</b> written gate review against the pre-committed criteria in this document; "
           "the gameplan is amended in writing, never informally."))
s.append(B("<b>Quarterly (from Phase 2):</b> customer advisory board (5–8 operators); roadmap publication; "
           "O1–O6 re-measurement."))
s.append(B("<b>Always:</b> every feature ships with telemetry; every incident gets a written post-mortem "
           "that updates the risk register; the wiki and this document stay in sync (Limitless Stack "
           "session discipline)."))

# 13 ------------------------------------------------------------------
s.append(H1("13 · Audit Record (audit-before-claim)"))
s.append(P("This plan distinguishes verified facts from working assumptions. Verified this session "
           "(2026-06-04, web-checked): Helm CONNECT's market position and Sub M marketing; 46 CFR "
           "Subchapter M as the central towing compliance regime; IMO CII applying at 5,000 GT and above; "
           "the MarineTraffic AIS Toolbox's CC BY-NC-SA license; work-hour rules at 46 U.S.C. 8904 / "
           "46 CFR 15.1111; Vercel serverless functions' inability to host WebSocket connections; market "
           "size estimates ranging $1.2–2.4B at 10–17.5% CAGR across research firms."))
s.append(P("Working assumptions, to be validated and never treated as facts: H1–H4 (legacy prevalence, "
           "Sub M purchase trigger, willingness-to-pay, marketplace liquidity); all pricing; all phase "
           "targets and gate thresholds (chosen judgments, not derived constants); agent performance "
           "expectations; Supabase Realtime fitness at production scale (proven only to spike level in "
           "Phase 0). Every gate review re-tests the assumptions its phase depended on."))
s.append(Spacer(1, 10))
s.append(Paragraph("Open Scaffold Labs · TugOS Build Gameplan · Version 1.0 · June 2026 · Companion to "
                   "Whitepaper v2 and Architecture Blueprint v2", S["meta"]))

path = os.path.join(OUT, "tugos-build-gameplan.pdf")
doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch,
                        topMargin=0.7*inch, bottomMargin=0.7*inch,
                        title="TugOS Build Gameplan v1.0", author="Open Scaffold Labs")
doc.build(s)
print("BUILT", path)

from pypdf import PdfReader
r = PdfReader(path)
print("pages:", len(r.pages))
