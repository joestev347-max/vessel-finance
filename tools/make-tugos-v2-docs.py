# Generate TugOS Whitepaper v2 + Architecture Blueprint v2 (audit corrections folded in)
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether)

OUT = r"C:\Users\joest\vessel-finance\docs"
os.makedirs(OUT, exist_ok=True)

NAVY = colors.HexColor("#0e2a47")
TIDE = colors.HexColor("#1d6fa5")
LIGHT = colors.HexColor("#e8f0f7")
GREY = colors.HexColor("#555555")

ss = getSampleStyleSheet()
S = {}
S["title"] = ParagraphStyle("t", parent=ss["Title"], fontSize=22, leading=27,
                            textColor=NAVY, spaceAfter=6)
S["subtitle"] = ParagraphStyle("st", parent=ss["Normal"], fontSize=11.5, leading=15,
                               textColor=TIDE, alignment=TA_CENTER, spaceAfter=4)
S["meta"] = ParagraphStyle("m", parent=ss["Normal"], fontSize=9, leading=12,
                           textColor=GREY, alignment=TA_CENTER, spaceAfter=14)
S["h1"] = ParagraphStyle("h1", parent=ss["Heading1"], fontSize=14.5, leading=18,
                         textColor=NAVY, spaceBefore=16, spaceAfter=6)
S["h2"] = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=11.5, leading=15,
                         textColor=TIDE, spaceBefore=10, spaceAfter=4)
S["body"] = ParagraphStyle("b", parent=ss["Normal"], fontSize=9.5, leading=13.5,
                           spaceAfter=6)
S["bullet"] = ParagraphStyle("bl", parent=S["body"], leftIndent=14, bulletIndent=4,
                             spaceAfter=3)
S["cell"] = ParagraphStyle("c", parent=ss["Normal"], fontSize=8.5, leading=11)
S["cellhdr"] = ParagraphStyle("ch", parent=S["cell"], textColor=colors.white,
                              fontName="Helvetica-Bold")
S["callout"] = ParagraphStyle("co", parent=S["body"], leftIndent=10, rightIndent=10,
                              borderColor=TIDE, borderWidth=0.8, borderPadding=7,
                              backColor=LIGHT, spaceBefore=6, spaceAfter=10)

def P(t): return Paragraph(t, S["body"])
def B(t): return Paragraph(t, S["bullet"], bulletText="•")
def H1(t): return Paragraph(t, S["h1"])
def H2(t): return Paragraph(t, S["h2"])
def CO(t): return Paragraph(t, S["callout"])

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
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t

# =====================================================================
# DOC 1 - WHITEPAPER v2
# =====================================================================
wp = []
wp.append(Paragraph("TugOS", S["title"]))
wp.append(Paragraph("The Case for a Modern Tugboat Operations Platform", S["subtitle"]))
wp.append(Paragraph("Market Analysis · Technology Gaps · Open Source Landscape · OSL Architecture", S["subtitle"]))
wp.append(Paragraph("OPEN SCAFFOLD LABS · INDUSTRY VERTICAL WHITE PAPER · Version 2.0 · June 2026 · Confidential &amp; Proprietary", S["meta"]))
wp.append(P("The global tugboat and inland marine towing industry operates on razor-thin margins yet "
            "relies on decades-old record-keeping methods — paper logbooks, disconnected spreadsheets, "
            "and legacy desktop software that predates smartphones. This white paper identifies the "
            "operational pain points, surveys the competitive landscape (including the incumbent leader), "
            "examines available open-source foundations with their real license terms, and presents a "
            "strategic architecture for a purpose-built vertical SaaS platform that Open Scaffold Labs is "
            "positioned to deliver as the affordable, mobile-first alternative for small and mid-size operators."))
wp.append(TBL(["$1.2–$2.4B", "10–17.5%", "Largest share: N. America", "Legacy prevalence: HIGH"],
              [["Marine mgmt. software market, 2024 (range across research firms)",
                "Market CAGR estimates, 2025–2034 (range across research firms)",
                "U.S. is the core beachhead geography",
                "Widely reported; exact share unquantified — validated in Phase 1 discovery"]],
              [1.7*inch, 1.7*inch, 1.7*inch, 1.7*inch]))
wp.append(Spacer(1, 8))
wp.append(H2("Table of Contents"))
for i, t in enumerate(["The Tugboat Industry — Operational Context",
                       "The Problem: Why Existing Systems Fail",
                       "Competitive Landscape — Commercial Solutions",
                       "Open Source &amp; Free Software Foundations",
                       "The Gap: What the Market Is Missing",
                       "TugOS — OSL's Proposed Vertical Platform",
                       "Technical Architecture &amp; Stack",
                       "Go-to-Market Strategy",
                       "Conclusion &amp; Next Steps",
                       "The Best-in-Class Gameplan"], 1):
    wp.append(B("%d &nbsp; %s" % (i, t)))

wp.append(H1("01 · The Tugboat Industry — Operational Context"))
wp.append(P("Tugboats are the workhorses of maritime commerce — harbor tugs assist mega-vessels in and "
            "out of berths, inland tow boats push barge trains on river systems, and offshore salvage tugs "
            "respond to emergencies at sea. The U.S. alone operates thousands of commercial tugs and "
            "towboats, from single-boat owner-operators to fleets of 200+ vessels."))
wp.append(H2("Key Operational Domains"))
wp.append(B("<b>Voyage &amp; Job Dispatch</b> — assigning tugs to assist jobs, tracking ETA, communicating "
            "orders from port operations centers to captains."))
wp.append(B("<b>Subchapter M Compliance</b> — since 2018, 46 CFR Subchapter M (Parts 136–144) is the "
            "central U.S. towing-vessel regime: every towing vessel 26 ft and over needs a Certificate of "
            "Inspection, obtained via USCG inspection or a Towing Safety Management System (TSMS) audited "
            "by a Third Party Organization. Record keeping for Sub M is the single largest compliance burden "
            "operators face — and the anchor requirement for any tug software product."))
wp.append(B("<b>Crew Scheduling &amp; Certification</b> — rotating crews on hitch schedules (7-on/7-off is "
            "common), tracking STCW endorsements and Merchant Mariner Credentials, and observing work-hour "
            "limits: licensed towing-vessel operators may not work more than 12 hours in any consecutive "
            "24 (46 U.S.C. 8904), with rest-period rules in 46 CFR 15.1111."))
wp.append(B("<b>Fuel Consumption Tracking</b> — diesel is 30–50% of operating expense. Accurate per-voyage "
            "fuel accounting is essential yet rarely achieved."))
wp.append(B("<b>Maintenance &amp; Class Surveys</b> — Sub M requires documented maintenance and inspection "
            "records; ABS and other class societies conduct periodic surveys requiring deep history."))
wp.append(B("<b>Billing &amp; Invoicing</b> — tug services bill by assist-hour, bollard pull rating, daily "
            "rate, or contract. Disputes are common when records are incomplete."))
wp.append(B("<b>Financial Reporting</b> — multi-vessel operators need per-vessel P&amp;L, "
            "cost-per-operating-hour, and fleet utilization — rarely available in real time."))

wp.append(H1("02 · The Problem: Why Existing Systems Fail"))
wp.append(H2("2.1 The Paper &amp; Spreadsheet Trap"))
wp.append(P("Most small to mid-size operators (2–30 vessels) run on paper job tickets, Excel, and "
            "QuickBooks. The result: invoice leakage when paper logs are lost; certification expiry tracked "
            "in cells nobody watches; no per-voyage fuel feedback loop; crew double-bookings; incomplete "
            "records at TSMS audits and USCG inspections; and billing cycles stretching 30–60 days."))
wp.append(H2("2.2 Enterprise Software Is Overbuilt and Overpriced"))
wp.append(P("Platforms like ABS Nautical Systems, BASS, and Veson IMOS are built for deep-sea fleets of "
            "50+ oceangoing vessels at $50,000–$500,000+ per year with implementation teams. A 10-tug "
            "harbor operator cannot justify that investment."))
wp.append(H2("2.3 Road-Towing Apps Don't Translate"))
wp.append(P("Towbook and similar products were built for road towing (motor-club billing, impound lots, "
            "roadside dispatch). The compliance frameworks, billing models, and crew regulations of marine "
            "towing are entirely different."))
wp.append(H2("2.4 The Incumbent: Helm CONNECT"))
wp.append(P("Helm Operations (Victoria, BC) is the purpose-built incumbent in workboat operations software. "
            "Helm CONNECT covers maintenance, compliance, personnel, dispatch and billing, reports 275+ "
            "companies on the platform, counts majors like Foss Maritime as reference customers, and markets "
            "Subchapter M compliance directly. Any honest strategy for this vertical starts from this fact: "
            "<b>the tug vertical has a leader — at the enterprise and mid-market end.</b> What Helm does "
            "not own is the long tail: thousands of 2–25 tug companies for whom Helm is too heavy, "
            "quote-priced, and office-centric. TugOS is designed for exactly that tail."))
wp.append(H2("2.5 Pain Point Severity Matrix"))
wp.append(TBL(["Pain Point", "Frequency", "Revenue Impact", "Compliance Risk", "Priority"],
              [["Invoice leakage from missing logs", "Daily", "High", "Low", "Critical"],
               ["Sub M / TSMS record keeping &amp; audit prep", "Continuous", "Medium", "High", "Critical"],
               ["Manual crew certification tracking", "Monthly", "Medium", "High", "Critical"],
               ["No real-time fuel cost data", "Per voyage", "High", "Low", "High"],
               ["Billing cycle delay (30–60 days)", "Weekly", "High", "Low", "High"],
               ["No per-vessel P&amp;L reporting", "Monthly", "Medium", "Medium", "Medium"],
               ["Crew scheduling conflicts", "Weekly", "Medium", "Low", "Medium"],
               ["No mobile access from vessel", "Daily", "Medium", "Low", "Medium"]],
              [2.2*inch, 0.9*inch, 1.0*inch, 1.0*inch, 0.9*inch]))

wp.append(H1("03 · Competitive Landscape — Commercial Solutions"))
wp.append(P("The marine software market is fragmented by vessel type, company size, and geography. "
            "The landscape divides into five tiers — and unlike the conventional wisdom, the tug "
            "vertical does have a category leader."))
wp.append(H2("Tier 0 — The Workboat Incumbent"))
wp.append(B("<b>Helm CONNECT (Helm Operations)</b> — purpose-built for workboats and tugs; maintenance, "
            "compliance (incl. Sub M), personnel, dispatch &amp; billing; 275+ companies incl. Foss Maritime. "
            "Quote-based pricing, enterprise/mid-market orientation, office-first workflows. The benchmark "
            "TugOS must position against."))
wp.append(H2("Tier 1 — Enterprise Ship Management ERPs"))
wp.append(B("<b>ABS Nautical Systems</b>, <b>BASS BASSnet</b>, <b>Veson IMOS</b>, <b>VoyageX AI</b>, "
            "<b>Shipmate ERP</b> — deep-sea fleet ERPs, $100K+/yr, on-prem or heavy SaaS; wrong size and "
            "wrong workflows for harbor tug companies."))
wp.append(H2("Tier 2 — Mid-Market Vessel Management"))
wp.append(B("<b>Seahub Fleet</b>, <b>SoftMar</b> (~$1,200+/mo for 10 vessels), <b>DockMaster</b> (marinas), "
            "<b>Quadrum NORIS</b> — generic vessel management; none are tug-workflow specific."))
wp.append(H2("Tier 3 — Inland Marine Specialists"))
wp.append(B("<b>BargeOps</b> — the closest inland specialist: towing, fleeting, crews, liquids, and "
            "analytics modules for barge lines; targets large river operators, priced and scoped beyond "
            "small harbor-tug companies. <b>OpenTug BargeOS</b> — VC-backed barge logistics. "
            "<b>Marine Job Planner</b> — Singapore port-authority job allocation."))
wp.append(H2("Tier 4 — Road Towing (Adjacent, Not Applicable)"))
wp.append(B("<b>Towbook</b>, <b>TraxeroGO</b>, <b>OctopusPro</b> — road towing and field service; "
            "wrong domain entirely."))
wp.append(CO("<b>Key takeaway.</b> The vertical has an incumbent (Helm CONNECT) at the top and a hard floor "
             "of paper/Excel at the bottom. What no one owns is the middle: a modern, mobile-first, "
             "self-serve, SMB-priced product for companies operating 2–25 tugs doing port assist, "
             "ship-docking, barge towing, or salvage work. That segment — thousands of U.S. companies — "
             "is TugOS's wedge, and the product must be built so a crew adopts it before an IT department "
             "ever gets involved."))

wp.append(H1("04 · Open Source &amp; Free Software Foundations"))
wp.append(P("Open-source building blocks reduce development cost and time-to-market — but license terms "
            "matter for a commercial SaaS, and each component below is listed with its real license and an "
            "honest note on commercial usability."))
wp.append(B("<b>Signal K</b> (Apache 2.0) — open marine data standard and server: GPS, AIS, engine, fuel "
            "flow via REST/WebSocket. Commercially safe. The backbone for vessel IoT in TugOS."))
wp.append(B("<b>OpenCPN</b> (GPLv2) — mature chart plotter (current release 5.14.x, 2026). Useful for "
            "chart data and navigation primitives in the dispatch view; GPL obligations respected by keeping "
            "it as a separate process/data source, not linked code."))
wp.append(B("<b>AIS data strategy</b> — the MarineTraffic AIS Toolbox (open-sourced June 2022) is licensed "
            "<b>CC BY-NC-SA 4.0 — non-commercial</b> — and is a density-map post-processing toolbox, not a "
            "real-time tracking stack. It is therefore <b>not</b> a foundation for TugOS. Real-time vessel "
            "positions come from commercial AIS APIs (MarineTraffic/Kpler, Spire, aisstream.io) and/or "
            "self-hosted AIS receivers with a permissively-licensed decoder (license-verify at selection)."))
wp.append(B("<b>Flectra ERP maritime module</b> (LGPL) — open-source ERP (Odoo fork) with maritime fleet, "
            "crew, and financial management. Candidate back-office layer; evaluate before committing."))
wp.append(B("<b>STSS</b> (research/MIT, NUS Centre for Maritime Studies) — Python maritime traffic "
            "simulation using AIS data; useful for analytics and route optimization research."))
wp.append(B("<b>OpenShipping.org</b> (open standard) — API standards for port and logistics integration."))

wp.append(H1("05 · The Gap: What the Market Is Missing"))
wp.append(TBL(["Operator Type", "Vessels", "Current Options", "What's Missing"],
              [["Solo owner-operator", "1–2", "Paper / Excel / QuickBooks",
                "Any digital system at all — even basic job tracking"],
               ["Small tug company", "3–10", "Paper/Excel; road-towing apps hacked to fit",
                "Maritime-compliant crew records, Sub M record keeping, tug-specific billing, self-serve pricing"],
               ["Mid-size operator", "10–30", "Helm CONNECT (if budget allows), BargeOps, legacy Shipmate",
                "Mobile-first UI, transparent SaaS pricing, fast deployment without implementation projects"],
               ["Large tug fleet", "30–100+", "Helm CONNECT, enterprise ERPs",
                "Served — not TugOS's entry market"]],
              [1.3*inch, 0.7*inch, 2.2*inch, 2.6*inch]))
wp.append(P("The 3–30 vessel rows are the beachhead: real revenue, serious operational pain, and no "
            "product that is simultaneously tug-specific, affordable, self-serve, and crew-first. TugOS "
            "wins not by claiming the market is empty, but by being 10x easier to adopt than the incumbent "
            "for operators the incumbent was never designed for."))

wp.append(H1("06 · TugOS — OSL's Proposed Vertical Platform"))
wp.append(P("TugOS is a purpose-built, mobile-first SaaS platform for tugboat and inland marine towing "
            "operators — laser-focused on day-to-day tug workflows. Eight feature pillars:"))
wp.append(H2("Pillar 01: Dispatch &amp; Job Board"))
wp.append(B("Real-time job board; drag-and-drop tug assignment with mobile push; GPS-tracked job progress "
            "(en route, on scene, assist complete, clear); VHF/voice memos attached to job records; port "
            "authority intake via OpenShipping-style APIs."))
wp.append(H2("Pillar 02: Subchapter M &amp; Crew Compliance"))
wp.append(B("The compliance pillar is built around <b>46 CFR Subchapter M</b>: digital TSMS record keeping "
            "(drills, inspections, maintenance, manning), TPO audit-ready binders, and one-tap generation of "
            "a vessel's Sub M record book for a boarding USCG inspector."))
wp.append(B("Digital crew profiles — STCW endorsements, MMC, medical certs — with 90/30/7-day expiry "
            "alerts pushed to crew and management; hitch scheduling (7/7, 14/14, custom) with work-hour "
            "compliance against 46 U.S.C. 8904 and 46 CFR 15.1111."))
wp.append(H2("Pillar 03: Fuel Tracking &amp; Efficiency"))
wp.append(B("Per-voyage fuel logging (manual or Signal K IoT); cost-per-operating-hour dashboards; fleet "
            "fuel-efficiency benchmarking; bunkering records. Positioned as <b>direct cost savings</b> — "
            "tugs under 5,000 GT sit outside IMO CII scope, so the sell is economics, not regulation."))
wp.append(H2("Pillar 04: Maintenance &amp; Class Records"))
wp.append(B("Planned maintenance by calendar or engine hours; digital work orders with photos; Sub M and "
            "ABS inspection checklist templates; dry dock planning; parts inventory."))
wp.append(H2("Pillar 05: Billing &amp; Invoicing Engine"))
wp.append(B("Hourly assist / bollard pull / daily charter / contract models; auto-generated invoices from "
            "completed job records; client self-service portal; QuickBooks and Xero sync; disputed-invoice "
            "workflow with GPS track and log evidence attached."))
wp.append(H2("Pillar 06: Financial Reporting &amp; Fleet P&amp;L"))
wp.append(B("Per-vessel revenue, cost, and margin; OPEX breakdown (fuel, wages, maintenance, port fees); "
            "utilization and idle time; budget vs. actual; custom report builder. <i>(Prototyped today in "
            "Vessel Finance.)</i>"))
wp.append(H2("Pillar 07: Mobile App (Captain &amp; Crew)"))
wp.append(B("React Native app, iOS first; <b>offline-first with sync on reconnect</b> — non-negotiable for "
            "vessel connectivity; fuel/maintenance/job logging from the wheelhouse; digital signature "
            "capture at job completion."))
wp.append(H2("Pillar 08: Integrations &amp; Open Data"))
wp.append(B("Commercial AIS feed overlay on the dispatch map; OpenCPN chart data; Signal K sensors; NOAA "
            "weather and tides; port authority APIs where available."))

wp.append(H1("07 · Technical Architecture &amp; Stack"))
wp.append(P("TugOS is built as App 24 on OSL's existing production architecture (the OSL Orchestrator "
            "Model — see the companion Architecture Blueprint v2). One stack, stated once:"))
wp.append(TBL(["Layer", "Technology", "Rationale"],
              [["Web Frontend", "React 19 + Vite + Tailwind",
                "OSL component library and existing expertise; dispatch board and dashboards"],
               ["Mobile App", "React Native (Expo), iOS first",
                "Shared logic with web; offline-first is critical on vessels"],
               ["API Layer", "Express.js on Vercel serverless",
                "Same pattern as all OSL apps; REST + WebSocket for live job board"],
               ["Database", "Supabase PostgreSQL — dedicated TugOS project, RLS multi-tenant",
                "Maritime clients and SOC 2 require a clean isolation story; TugOS runs in its own Supabase "
                "project rather than the shared OSL instance, with row-level security per tenant"],
               ["Auth", "JWT (15-min web tokens) + refresh-token grace for offline mobile",
                "Roles: Fleet Admin, Port Captain, Dispatcher, Captain, Crew, Billing, Client; offline "
                "sessions must outlive short web tokens by design"],
               ["IoT / Vessel Data", "Signal K Server (Apache 2.0)",
                "Fuel flow, engine hours, GPS without proprietary lock-in"],
               ["AI / Intelligence", "Paperclip (OSL) + Claude API",
                "Fuel anomaly detection, predictive maintenance, auto-invoice drafting"],
               ["AIS / Tracking", "Commercial AIS API (+ optional self-hosted receivers)",
                "Real-time positions and ETA; NC-licensed open toolboxes excluded from the product"],
               ["Billing", "QuickBooks API + Stripe", "Two-way accounting sync; card/ACH on client portal"],
               ["Back-office (evaluate)", "Flectra ERP maritime module (LGPL)",
                "Possible accounting/reporting accelerator; decision after MVP"]],
              [1.0*inch, 2.1*inch, 3.7*inch]))
wp.append(P("Multi-tenant from day one: each tug company is an isolated tenant enforced at the database "
            "layer. The dedicated-project deviation from OSL's shared-instance default is deliberate — it is "
            "the difference between passing and failing a port authority's security review."))

wp.append(H1("08 · Go-to-Market Strategy"))
wp.append(H2("Positioning"))
wp.append(CO("<b>“The modern alternative for working tug companies.”</b> Helm CONNECT is the system "
             "enterprises buy; TugOS is the system crews adopt. Self-serve signup, transparent per-vessel "
             "pricing, live in a week, runs in the wheelhouse."))
wp.append(H2("Pricing Model"))
wp.append(TBL(["Tier", "Price", "Includes"],
              [["Deckhand (Free)", "$0/mo", "1 vessel, 5 crew, basic job log, 30-day history — the "
                "zero-friction entry for solo operators"],
               ["Harbor (SMB)", "$149/vessel/mo", "Up to 10 vessels; full dispatch, Sub M records, crew "
                "compliance, fuel, billing, QuickBooks sync; minimum $299/mo"],
               ["Fleet (Growth)", "$99/vessel/mo", "11–50 vessels; volume discount, priority support, "
                "custom reporting, API access, white-label portal"],
               ["Enterprise", "Custom", "50+ vessels or port authority deployment; SLA, dedicated "
                "implementation, custom integrations"]],
              [1.2*inch, 1.1*inch, 4.5*inch]))
wp.append(H2("Acquisition Channels"))
wp.append(B("American Waterways Operators (AWO) — the primary U.S. towing trade association: conference "
            "presence, newsletter ads, Gulf Region chapter entry."))
wp.append(B("Workboat magazine and maritime trade press; direct outreach via port dispatcher relationships; "
            "$500 referral credits (captains talk to captains); content marketing — paper log vs. TugOS "
            "workflow videos, SEO for 'tugboat dispatch software' and 'Subchapter M software'."))
wp.append(B("Free Deckhand tier as the funnel; conversion to Harbor as companies grow."))
wp.append(H2("Beachhead Market"))
wp.append(P("Gulf Coast first — Texas and Louisiana have the highest U.S. concentration of harbor tugs, "
            "inland towboats, and offshore support vessels. Sign 5 comped beta customers within 90 days of "
            "MVP; 20 paying companies by end of Year 1."))

wp.append(H1("09 · Conclusion &amp; Next Steps"))
wp.append(P("The tug software market is not empty — it has an incumbent that owns the top and a paper "
            "trap that owns the bottom. The opportunity is the underserved middle: thousands of 2–25 tug "
            "companies with real revenue and no product built for how they actually work. OSL brings an "
            "existing production architecture, AI orchestration via Paperclip, and open-source acceleration "
            "where licenses genuinely permit it. The wedge is focus: tug-specific workflows, Sub M-grade "
            "compliance, crew-first mobile UX, and pricing an owner can say yes to without a procurement "
            "process."))
wp.append(H2("Discovery hypotheses (validate in weeks 1–2 before code)"))
wp.append(B("H1: A large majority of 2–25 tug operators still run on paper/Excel (the oft-quoted ~85% "
            "figure is unsourced — measure it in interviews)."))
wp.append(B("H2: Sub M record keeping and TPO audit prep is a top-3 pain and a purchase trigger."))
wp.append(B("H3: Operators priced out of or overwhelmed by Helm CONNECT will pay ~$149/vessel/mo for a "
            "lighter product."))
wp.append(B("H4: A spot-assist job marketplace has real liquidity (harbor work is heavily "
            "contract/relationship-driven — do not build Phase 3's marketplace until this tests true)."))
wp.append(TBL(["Timeline", "Milestone", "Description"],
              [["Week 1–2", "Customer Discovery", "10–15 structured interviews across operator sizes; "
                "validate the hypotheses above; pick the three highest-priority MVP features"],
               ["Week 3–4", "Technical Spike", "Signal K integration PoC; dedicated Supabase multi-tenant "
                "schema; basic dispatch board; commercial AIS feed evaluation"],
               ["Month 2", "MVP Build", "Dispatch, job logging, basic crew records, invoice generation; "
                "internal alpha with one friendly operator"],
               ["Month 3", "Beta Launch", "5 Gulf Coast beta customers; Deckhand tier live"],
               ["Month 4–6", "Commercial Launch", "Harbor tier priced and marketed; AWO presence; 20 paying "
                "customers"],
               ["Month 6–12", "Scale &amp; Expand", "Fleet tier, port authority integrations, Series A data "
                "room if traction warrants"]],
              [0.9*inch, 1.4*inch, 4.5*inch]))

wp.append(H1("10 · The Best-in-Class Gameplan — Achieving Industry Leadership"))
wp.append(P("Launching TugOS is the starting gun, not the finish line. The first company to build genuine "
            "operational trust with operators and crews in the SMB segment will define its standard. Four "
            "phases across 36 months:"))
wp.append(H2("Phase 1 · Months 1–6 · Build Trust on the Water"))
wp.append(B("Customer discovery before code — 15+ structured interviews; every MVP feature maps to a "
            "specific interview quote."))
wp.append(B("<b>Hire or partner with a maritime domain expert</b> — a retired port captain or operations "
            "manager who has stood a watch. The Catalog of Authority (regulatory data connections) "
            "complements but does not replace a human who carries credibility at AWO conferences and in "
            "sales calls."))
wp.append(B("MVP nails one workflow: digital job dispatch with crew notification and time-stamped logging. "
            "Offline-first from day 1 — if the app loses data when LTE drops, captains never trust it."))
wp.append(B("5 free Gulf Coast betas in exchange for weekly feedback, usage data, and case studies."))
wp.append(P("<b>Targets:</b> 5 beta customers · 15+ interviews · 500+ jobs logged · 0 data-loss events."))
wp.append(H2("Phase 2 · Months 6–18 · Become the Operator's Operating System"))
wp.append(B("Launch the Sub M/TSMS compliance module — operators who keep years of compliance records in "
            "TugOS never leave. Cert tracking with 90/30/7 alerts; manning compliance reports."))
wp.append(B("Automate billing from job records — two clicks from completed job to invoice with GPS track "
            "and crew list attached; this alone recovers more than the subscription cost."))
wp.append(B("Captain app with signature capture; fleet analytics dashboard (utilization, revenue per "
            "operating hour, fuel trends — data most operators have never seen visualized)."))
wp.append(B("SOC 2 Type I in parallel (Vanta/Drata) — made credible by the dedicated-project tenant "
            "isolation; one port authority reference customer (target the 3rd–4th largest Gulf port)."))
wp.append(P("<b>Targets:</b> 20+ paying companies · $40K+ MRR · 200+ crew profiles · &lt;5% monthly churn."))
wp.append(H2("Phase 3 · Months 18–30 · Win the Category"))
wp.append(B("AI predictive maintenance on 18+ months of accumulated fleet data (Paperclip + Claude) — a "
            "data moat competitors cannot purchase."))
wp.append(B("Annual 'State of Tugboat Operations' benchmark report from anonymized fleet data — positions "
            "TugOS as the industry's data authority."))
wp.append(B("Spot Job Board marketplace (2–5% take) — <b>gated on hypothesis H4</b>: build only if "
            "Phase 1–2 evidence shows real spot-market liquidity."))
wp.append(B("Public API and integration partners (payroll, insurance, bridge systems); international "
            "expansion (IMO/STCW frameworks travel well; multi-currency; Spanish and Bahasa)."))
wp.append(B("Series A at 75+ customers / $150K+ MRR with the data moat as the story."))
wp.append(P("<b>Targets:</b> 75+ paying companies · $150K+ MRR · 1,000+ vessel-months of data · 3+ countries."))
wp.append(H2("Phase 4 · Months 30–36+ · Best in Class — What Separates OSL"))
wp.append(B("<b>The data moat</b> — every vessel-month of fuel, maintenance, and compliance history "
            "compounds; later entrants face a 2–3 year deficit."))
wp.append(B("<b>Obsessive crew UX</b> — if a 55-year-old captain can't use it in the wheelhouse without "
            "training, it fails, regardless of how clever it is."))
wp.append(B("<b>Compliance as the system</b> — when a USCG inspector boards, the captain pulls out an iPad "
            "and produces the Sub M record book in under 60 seconds. That moment is the best sales tool "
            "TugOS will ever have."))
wp.append(B("<b>Community &amp; trust</b> — AWO and Workboat every year, real customer stories with real "
            "numbers, a user community where operators swap practices."))
wp.append(B("<b>Relentless iteration</b> — public roadmap, quarterly customer advisory board, 24-hour bug "
            "response SLA for paying customers."))
wp.append(H2("The Competitive Separation Summary"))
wp.append(TBL(["Dimension", "Incumbent / later entrants", "TugOS"],
              [["Target buyer", "Enterprise &amp; mid-market fleets, office-led purchase",
                "2–25 tug companies, crew-led adoption, self-serve"],
               ["Pricing", "Quote-based, implementation projects", "Transparent per-vessel SaaS, live in a week"],
               ["Compliance", "A compliance module", "The Sub M record system used during actual USCG "
                "inspections"],
               ["Crew adoption", "Office-friendly UI", "Wheelhouse-tested offline-first mobile UX"],
               ["Data &amp; AI", "Dashboards", "Predictive maintenance and fuel anomaly detection that "
                "compound with every vessel-month"],
               ["Network effects", "None", "Benchmark reports; marketplace if and when liquidity is proven"]],
              [1.1*inch, 2.7*inch, 3.0*inch]))
wp.append(Spacer(1, 10))
wp.append(Paragraph("Prepared by Open Scaffold Labs · Version 2.0 · June 2026 · Confidential &amp; "
                    "Proprietary", S["meta"]))

# =====================================================================
# DOC 2 - ARCHITECTURE BLUEPRINT v2
# =====================================================================
ar = []
ar.append(Paragraph("TugOS · Vertical Architecture Blueprint", S["title"]))
ar.append(Paragraph("OSL Orchestrator Model — Applied to Maritime Operations", S["subtitle"]))
ar.append(Paragraph("OPEN SCAFFOLD LABS · VERTICAL APPLICATION BLUEPRINT · Version 2.0 · June 2026 · "
                    "App 24 · Table Prefix: tug_", S["meta"]))
ar.append(P("TugOS is App 24 in the OSL ecosystem. Every architectural primitive — the three-surface "
            "model, the MCP layer, the Catalog of Authority, the genetic template — maps onto tugboat "
            "operations. Version 2 makes one deliberate deviation from the template (database isolation) "
            "and corrects the regulatory and licensing assumptions of v1."))
ar.append(CO("<b>v2 architecture decisions.</b> (1) TugOS runs in a <b>dedicated Supabase project</b>, not "
             "the shared 23-app instance — SOC 2 and port-authority security reviews require a clean tenant "
             "isolation story, enforced with per-tenant RLS. (2) The compliance core is <b>46 CFR "
             "Subchapter M / TSMS</b>. (3) Real-time AIS comes from <b>commercial APIs</b>; the CC BY-NC "
             "MarineTraffic toolbox is excluded from the product. (4) Mobile auth uses refresh-token grace "
             "so offline-first sessions survive 15-minute web tokens. (5) A human <b>maritime domain "
             "advisor</b> complements the Catalog of Authority."))

ar.append(H1("01 · The Genetic Template — Deploy in Under 5 Minutes"))
ar.append(P("FRAMEWORK AS A SERVICE — shared across all 23 OSL apps: @openscaffold/core, "
            "@openscaffold/integrations, scaffold.config.js. Run deploy-new-app.sh tug_ and TugOS inherits "
            "StandardHeader, the Scaffold Beacon AI widget, role-based sidebar, JWT auth, theme system, "
            "CRUD generation standards, and all integration adapters (pdf-lib, PptxGenJS, React Email, "
            "DocuSeal, LlamaIndex). The one v2 deviation: the Supabase connection points at a dedicated "
            "TugOS project (see 07)."))
ar.append(H2("Domain Layer — TugOS Domain UI"))
ar.append(P("Dispatch · Crew · Fuel · Maintenance · Billing — vessel dispatch board, crew hitch "
            "scheduler, per-voyage fuel log, Sub M/TSMS compliance tracker, invoice generator."))
ar.append(H2("Expertise Layer — Catalog of Authority + Domain Advisor"))
ar.append(P("Validated MCP connections to the authorities a maritime expert consults (see 06), <b>plus</b> a "
            "retained human advisor — a retired port captain or ops manager — for workflow validation, "
            "sales credibility, and conference presence. Data connections answer regulatory questions; the "
            "advisor answers 'would a captain actually use this?'"))
ar.append(H2("Intelligence Layer — Paperclip + Claude API"))
ar.append(P("OSL's production AI orchestration. Fuel anomaly detection · maintenance prediction · crew "
            "cert risk scoring · auto-invoice from job log · dispatch optimization."))

ar.append(H1("02 · The Three-Surface Architecture"))
ar.append(B("<b>Surface 1 — UI (human-facing):</b> React 19 + Vite + Tailwind. Role-filtered sidebar: "
            "Dispatcher sees the job board, Captain sees the vessel log, Fleet Manager sees P&amp;L. Roles: "
            "Dispatcher, Captain, Crew, Port Captain, Fleet Admin, Billing Clerk, Client (read-only)."))
ar.append(B("<b>Surface 2 — REST API (programmatic):</b> Express.js on Vercel serverless. Every UI action "
            "is an API call. Also serves AIS webhooks, Signal K pushes, QuickBooks callbacks, and port "
            "authority job intake."))
ar.append(B("<b>Surface 3 — MCP layer (AI-native):</b> as MCP client, TugOS consumes maritime authority "
            "expertise; as MCP server, it exposes fleet data to AI agents. Inbound: USCG regs, AIS, weather, "
            "Signal K. Outbound: fleet status, crew records, job logs, fuel data."))
ar.append(H2("Auth across surfaces"))
ar.append(P("JWT + bcrypt with 15-minute access tokens on the web. The captain app pairs short access "
            "tokens with long-lived, device-bound refresh tokens and an offline grace policy: actions queue "
            "locally with the last-valid identity and sync on reconnect, where the refresh token re-validates "
            "before the queue commits. Offline-first (whitepaper Pillar 07) and short tokens coexist by "
            "design rather than by accident."))

ar.append(H1("03 · Five MCP Servers — Adapted for Maritime Operations"))
ar.append(B("<b>tug-orchestration</b> (the brain, 20+ tools): list_vessels, get_vessel_status, "
            "list_active_jobs, get_crew_roster, trigger_dispatch, approve_fuel_alert, get_fleet_health, "
            "search_authority_catalog, get_job_briefing, generate_invoice."))
ar.append(B("<b>tug-data-connectors</b> (the senses, 15+ tools): get_ais_position (commercial API), "
            "get_signal_k_data, get_weather_noaa, get_port_schedule, get_ais_eta, get_fuel_price, "
            "get_tidal_data, sync_quickbooks."))
ar.append(B("<b>tug-notifications</b> (the voice, 12+ tools): send_captain_push, send_dispatch_slack, "
            "send_cert_expiry_alert, send_fuel_anomaly_alert, send_subm_audit_reminder, "
            "send_client_job_complete, send_maintenance_urgent, send_invoice_ready."))
ar.append(B("<b>tug-scaffold-core</b> (the memory, 15+ tools): search_subchapter_m, get_tsms_requirements, "
            "search_uscg_regulations, get_stcw_requirements, get_abs_survey_standards, get_workhour_rules "
            "(46 USC 8904 / 46 CFR 15.1111), get_architecture_pattern, search_playbook."))
ar.append(B("<b>tug-client-portal</b> (the handshake, 8 tools, client-scoped): my_jobs, my_job_history, "
            "my_invoices, my_invoice_status, my_vessels_assisted, my_compliance_certs, my_account_health, "
            "download_job_report."))
ar.append(B("<b>Persistent memory (6th layer) — NotebookLM:</b> USCG/Sub M Inspection Playbook · Fleet "
            "Maintenance Encyclopedia · Crew Performance Records · Client Relationship History · TugOS "
            "Architecture Docs."))

ar.append(H1("04 · Six AI Agents — Governed Autonomy"))
ar.append(B("<b>Fuel Agent</b> (auto-limited) — monitors per-vessel consumption vs baseline; flags "
            "anomalies &gt;8%; approves efficiency adjustments under $2K; higher routes to fleet manager."))
ar.append(B("<b>Compliance Agent</b> (supervised) — daily scan of cert expiry, manning compliance, and "
            "<b>Sub M/TSMS record completeness</b> (drills due, inspections due, audit-item gaps); all "
            "recommendations require Port Captain review."))
ar.append(B("<b>Dispatch Agent</b> (supervised) — recommends vessel assignment by AIS proximity, crew "
            "availability, bollard pull, fuel cost; dispatcher approves before push."))
ar.append(B("<b>Fleet Health Agent</b> (autonomous) — hourly scoring on maintenance, fuel trend, "
            "compliance, utilization; Slack alert below 70."))
ar.append(B("<b>Daily Briefing Agent</b> (autonomous, 6am) — today's jobs, crew on/off hitch, certs "
            "expiring, maintenance due, fuel vs budget, open invoices; email + Slack."))
ar.append(B("<b>Invoice Agent</b> (autonomous) — drafts invoices from completed job logs within 1 hour; "
            "billing clerk 1-click approval."))
ar.append(CO("<b>The Interrupt Protocol.</b> High-stakes actions hit an interrupt_before node in the "
             "LangGraph workflow; the Port Captain reviews in the War Room with full execution trace. "
             "Triggers: fuel procurement &gt;$5K · crew certification waivers · client billing dispute "
             "resolution · USCG deviation reporting · any crew PII change. LangGraph + MLflow governance "
             "is inherited unchanged."))

ar.append(H1("05 · Seven Scheduled Automations"))
ar.append(TBL(["Task", "Schedule", "What it does", "Connectors"],
              [["daily-fleet-briefing", "6am daily", "Jobs, crew changes, cert expirations, fuel budget, "
                "open invoices to email + Slack", "Orchestration, Notifications"],
               ["vessel-health-monitor", "Hourly", "Scores fleet health; Slack alert below 70; urgent push "
                "for critical maintenance", "Orchestration, Notifications, Captain App"],
               ["cert-expiry-sweep", "7am daily", "Scans STCW/MMC/drug-test/medical dates; alerts at "
                "90/30/7-day windows", "Orchestration, Notifications, Email"],
               ["subm-audit-readiness", "Weekly", "Checks TSMS record completeness per vessel (drills, "
                "inspections, maintenance logs); flags gaps before the TPO does", "Orchestration, Notifications"],
               ["invoice-generation", "Every 60 min", "Finds completed jobs with no invoice; drafts from job "
                "log; pushes to billing queue", "Orchestration, Notifications, QuickBooks"],
               ["fuel-anomaly-check", "Per voyage", "Compares voyage fuel to baseline; flags &gt;8% deviation",
                "Signal K, Orchestration, Notifications"],
               ["ais-position-sync", "Every 5 min", "Pulls live AIS for fleet vessels; updates dispatch map; "
                "ETAs for active jobs", "AIS API, Data Connectors, UI WebSocket"]],
              [1.25*inch, 0.75*inch, 3.0*inch, 1.8*inch]))
ar.append(P("(v1's authority-catalog-sync to Notion remains available via the template; v1's CII reporting "
            "automation is removed — IMO CII applies at 5,000 GT and above, which excludes the target fleet.)"))

ar.append(H1("06 · The Catalog of Authority — Maritime Authorities"))
ar.append(H2("Regulatory Authorities"))
ar.append(B("<b>46 CFR Subchapter M (Parts 136–144)</b> — the centerpiece: certification (COI), TSMS, "
            "operations, lifesaving, construction, and record-keeping requirements for U.S. towing vessels."))
ar.append(B("<b>46 CFR Part 15</b> (manning; 15.1111 work hours/rest) and <b>46 U.S.C. 8904</b> (12-hour "
            "rule for licensed towing-vessel operators)."))
ar.append(B("<b>STCW Convention</b> — competency and endorsement requirements per rank."))
ar.append(B("<b>ABS Rules</b> — survey intervals, classification standards for classed tugs."))
ar.append(B("<b>IMO MARPOL</b> — fuel oil record-keeping where applicable by tonnage; CII explicitly out "
            "of scope for the under-5,000 GT fleet."))
ar.append(H2("Data Authorities"))
ar.append(B("<b>Signal K</b> (Apache 2.0) — real-time vessel telemetry standard. <b>Commercial AIS APIs</b> "
            "(MarineTraffic/Kpler, Spire, aisstream.io — select on coverage and terms) for live positions; "
            "optional self-hosted receivers with permissively-licensed decoders. <b>NOAA</b> weather and "
            "tides. <b>OpenCPN</b> (GPLv2) chart primitives, process-isolated. <b>OpenShipping.org</b> port "
            "integration standards. The MarineTraffic AIS Toolbox (CC BY-NC-SA 4.0) may inform internal "
            "research only — it cannot ship in the product."))
ar.append(H2("Financial Authorities"))
ar.append(B("<b>QuickBooks API</b> (two-way sync), <b>Stripe</b> (portal payments, ACH), <b>Ship &amp; "
            "Bunker</b> fuel price feeds, <b>AWO rate benchmarks</b> for assist-tug market pricing."))
ar.append(H2("OSL Native Integrations (reused)"))
ar.append(B("pdf-lib (MIT) — Sub M record books, work orders, invoice PDFs · PptxGenJS (MIT) — fleet "
            "reports · React Email — transactional templates · DocuSeal (AGPL-3.0) — signature capture, "
            "kept behind the adapter pattern pending a formal license review · LlamaIndex — RAG over "
            "Sub M/USCG regulations and maintenance history for the Beacon assistant."))

ar.append(H1("07 · Shared Technology Stack — Inherit vs New"))
ar.append(TBL(["Layer", "Status", "Technology", "TugOS usage"],
              [["Frontend", "REUSE", "React 19 + Vite 5 + Tailwind", "Dispatch board, crew scheduler, fuel "
                "dashboard, billing; dark maritime theme"],
               ["Mobile", "NEW", "React Native (Expo), iOS first", "Captain/crew app; offline-first with "
                "refresh-token grace; job acceptance, fuel log, photos, signatures"],
               ["Backend", "REUSE", "Express.js 4 + Vercel serverless", "OSL pattern; direct SQL with "
                "per-tenant RLS policies enforced via tenant-scoped connections"],
               ["Database", "CHANGED", "PostgreSQL on Supabase — dedicated TugOS project", "tug_ tables: "
                "vessels, jobs, crew, fuel_logs, maintenance, invoices, certs, clients (+ tug_agent_runs); "
                "isolation for SOC 2 and port-authority reviews"],
               ["Auth", "REUSE+", "JWT + bcrypt, 15-min web tokens + mobile refresh grace", "Roles: "
                "fleet_admin, port_captain, dispatcher, captain, crew, billing, client"],
               ["AI Service", "REUSE", "callAI + Paperclip", "Dual-model setup powers the TugOS Beacon and "
                "the six maritime agents"],
               ["IoT Bridge", "NEW", "Signal K Server (Apache 2.0)", "Fuel flow meters, GPS, engine monitors "
                "to TugOS via WebSocket"],
               ["AIS Tracking", "NEW", "Commercial AIS API (+ optional receivers)", "Live dispatch map "
                "overlay, ETAs; license-clean by construction"],
               ["Agent Framework", "REUSE", "LangGraph + MLflow", "Interrupt Protocol; all runs logged to "
                "tug_agent_runs"],
               ["Deployment", "REUSE", "Vercel + Supabase + GitHub CI/CD", "Auto-deploy on push; Fly.io for "
                "compute-heavy Signal K bridge workers if needed"]],
              [0.85*inch, 0.7*inch, 1.9*inch, 3.35*inch]))

ar.append(H1("08 · The OSL Network Effect — How TugOS Compounds the Moat"))
ar.append(P("Each new OSL vertical enriches the Catalog of Authority. TugOS launches as App 24 and adds "
            "the maritime authorities — Subchapter M, TSMS, STCW, ABS, Signal K — growing the catalog "
            "from 15 to 25+ entries and making every future marine vertical (PortOS, MarineInspector) "
            "cheaper to build. The flywheel compounds: each vertical means less time to the next."))

ar.append(H1("09 · Build vs Reuse — The Honest Accounting"))
ar.append(H2("Inherited from the OSL genetic template"))
ar.append(P("StandardHeader and Scaffold Beacon · role-based sidebar + requireRole middleware · JWT auth + "
            "session management · Supabase connection layer + RLS patterns · all @openscaffold/integrations "
            "adapters · Vercel pipeline + GitHub CI/CD · LangGraph + MLflow governance · Paperclip "
            "orchestration · MCP server SDK + five-server pattern · Interrupt Protocol · callAI utility · "
            "theme system · CRUD standards."))
ar.append(H2("Net new for TugOS"))
ar.append(P("Dedicated Supabase project + tug_ schema (9 tables) · Signal K IoT bridge · commercial AIS "
            "integration + dispatch map · React Native captain app with offline-first sync · maritime "
            "Catalog of Authority entries (Sub M, TSMS, 46 CFR 15, STCW, ABS) · dispatch board UI · hitch "
            "scheduler · Sub M/TSMS compliance tracker · per-voyage fuel log + anomaly logic · tug billing "
            "engine (hourly / bollard pull / charter) · six maritime AI agents · QuickBooks two-way sync · "
            "NOAA weather + tidal connector · mobile refresh-token auth design."))
ar.append(Spacer(1, 10))
ar.append(Paragraph("Open Scaffold Labs · TugOS Architecture Blueprint · Version 2.0 · June 2026 · "
                    "App 24 · Table Prefix: tug_", S["meta"]))

# Build both
for fname, story, title in [
    ("tugos-whitepaper-v2.pdf", wp, "TugOS Whitepaper v2"),
    ("tugos-osl-architecture-v2.pdf", ar, "TugOS OSL Architecture Blueprint v2"),
]:
    path = os.path.join(OUT, fname)
    doc = SimpleDocTemplate(path, pagesize=letter,
                            leftMargin=0.8*inch, rightMargin=0.8*inch,
                            topMargin=0.7*inch, bottomMargin=0.7*inch,
                            title=title, author="Open Scaffold Labs")
    doc.build(story)
    print("BUILT", path)

# Verify
from pypdf import PdfReader
for fname in ["tugos-whitepaper-v2.pdf", "tugos-osl-architecture-v2.pdf"]:
    r = PdfReader(os.path.join(OUT, fname))
    print(fname, len(r.pages), "pages")
