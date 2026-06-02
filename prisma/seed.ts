/**
 * Deterministic seed: 5 vessels, ~21 accounts, ~15 voyages,
 * 24 months of budgets (2025 + 2026), ~250 expenses, ~80 revenues,
 * and a few budget transfers.
 *
 * Re-runnable: wipes tables in dependency order first.
 */
import { PrismaClient } from "@prisma/client";
import type { VesselType, VesselStatus, AccountCategory, VoyageStatus, ExpenseStatus } from "../src/lib/domain";

const prisma = new PrismaClient();

// ---------- Deterministic PRNG (Mulberry32) ----------
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(42);
const between = (a: number, b: number) => a + (b - a) * rng();
const intBetween = (a: number, b: number) => Math.floor(between(a, b + 1));
const choice = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

// ---------- Reference data ----------
const VESSELS: { name: string; imoNumber: string; type: VesselType; flag: string; owner: string; dwt: number; yearBuilt: number; status: VesselStatus }[] = [
  { name: "Atlantic Pioneer", imoNumber: "IMO9712345", type: "TANKER",          flag: "Liberia",          owner: "Pioneer Shipping Ltd",    dwt: 110_000, yearBuilt: 2018, status: "ACTIVE" },
  { name: "Pacific Voyager",  imoNumber: "IMO9633421", type: "TANKER",          flag: "Marshall Islands", owner: "Voyager Marine Inc",     dwt: 281_000, yearBuilt: 2015, status: "ACTIVE" },
  { name: "Northern Star",    imoNumber: "IMO9412233", type: "BULKER",          flag: "Panama",           owner: "Northstar Bulk Carriers",dwt:  82_500, yearBuilt: 2012, status: "ACTIVE" },
  { name: "MV Eastwind",      imoNumber: "IMO9821100", type: "CONTAINER",       flag: "Singapore",        owner: "Eastwind Lines Pte",     dwt:  95_400, yearBuilt: 2019, status: "ACTIVE" },
  { name: "Sea Horizon",      imoNumber: "IMO9905512", type: "OFFSHORE_SUPPLY", flag: "Norway",           owner: "Horizon Offshore AS",    dwt:   4_500, yearBuilt: 2020, status: "IN_DRYDOCK" },
];

const ACCOUNTS: { code: string; name: string; category: AccountCategory; subcategory: string }[] = [
  // Revenue
  { code: "4000", name: "Charter Hire",       category: "REVENUE", subcategory: "Time Charter" },
  { code: "4010", name: "Freight Revenue",    category: "REVENUE", subcategory: "Voyage Charter" },
  { code: "4020", name: "Demurrage",          category: "REVENUE", subcategory: "Voyage Charter" },
  { code: "4030", name: "Other Revenue",      category: "REVENUE", subcategory: "Misc" },
  // OPEX
  { code: "5000", name: "Crew Wages",                 category: "OPEX", subcategory: "Crew" },
  { code: "5010", name: "Crew Benefits & Travel",     category: "OPEX", subcategory: "Crew" },
  { code: "5020", name: "Fuel - Bunkers",             category: "OPEX", subcategory: "Voyage" },
  { code: "5030", name: "Lubricants",                 category: "OPEX", subcategory: "Voyage" },
  { code: "5040", name: "Port & Canal Fees",          category: "OPEX", subcategory: "Voyage" },
  { code: "5050", name: "Pilotage & Towage",          category: "OPEX", subcategory: "Voyage" },
  { code: "5060", name: "Maintenance & Repairs",      category: "OPEX", subcategory: "Technical" },
  { code: "5070", name: "Spare Parts",                category: "OPEX", subcategory: "Technical" },
  { code: "5080", name: "Insurance (H&M, P&I)",       category: "OPEX", subcategory: "Admin" },
  { code: "5090", name: "Management Fees",            category: "OPEX", subcategory: "Admin" },
  { code: "5100", name: "Stores & Provisions",        category: "OPEX", subcategory: "Crew" },
  { code: "5110", name: "Communications & IT",        category: "OPEX", subcategory: "Admin" },
  // CAPEX
  { code: "6000", name: "Drydocking",        category: "CAPEX", subcategory: "Drydock" },
  { code: "6010", name: "Major Equipment",   category: "CAPEX", subcategory: "Equipment" },
  { code: "6020", name: "Vessel Upgrades",   category: "CAPEX", subcategory: "Upgrades" },
  // Other
  { code: "7000", name: "Bank Fees",                  category: "OTHER", subcategory: "Finance" },
  { code: "7010", name: "Currency Adjustments",       category: "OTHER", subcategory: "Finance" },
];

const VENDORS = [
  "Bunker One", "Maersk Supply", "Wilhelmsen Ships Service", "V.Group",
  "Anglo-Eastern", "Lloyd's Register", "DNV", "ABS", "Inchcape Shipping",
  "GAC Shipping", "MAN Energy Solutions", "Wärtsilä", "Castrol Marine",
  "Shell Marine", "ExxonMobil Marine", "Hyundai Heavy Industries",
  "Cosco Shipyard", "Sembcorp Marine", "Kongsberg Maritime", "Survitec",
];

const PORTS_BY_TYPE: Record<VesselType, string[]> = {
  TANKER:          ["Rotterdam", "Houston", "Fujairah", "Singapore", "Ras Tanura", "Antwerp", "Long Beach"],
  BULKER:          ["Newcastle AU", "Qingdao", "Tubarão", "Vancouver BC", "Rotterdam", "Mundra"],
  CONTAINER:       ["Shanghai", "Singapore", "Los Angeles", "Hamburg", "Rotterdam", "Busan", "Felixstowe"],
  OFFSHORE_SUPPLY: ["Aberdeen", "Stavanger", "Esbjerg", "Den Helder", "Bergen"],
  RORO:            ["Bremerhaven", "Baltimore", "Yokohama", "Southampton"],
  LNG_CARRIER:     ["Ras Laffan", "Sabine Pass", "Yokohama", "Zeebrugge"],
};

const CHARTERERS = ["Shell Trading", "BP Shipping", "Vitol", "Trafigura", "Cargill Ocean", "MSC", "ONE", "CMA CGM"];

const ACCOUNT_MONTHLY_USD: Record<string, number> = {
  "4000": 850_000, "4010": 450_000, "4020": 25_000, "4030": 5_000,
  "5000": 145_000, "5010": 22_000, "5020": 240_000, "5030": 18_000,
  "5040": 38_000,  "5050": 14_000, "5060": 60_000,  "5070": 35_000,
  "5080": 28_000,  "5090": 12_000, "5100": 14_000,  "5110": 4_500,
  "6000": 0, "6010": 0, "6020": 0,
  "7000": 3_000, "7010": 1_500,
};

function vesselScale(dwt: number): number {
  if (dwt > 200_000) return 1.4;
  if (dwt > 90_000)  return 1.0;
  if (dwt > 50_000)  return 0.78;
  return 0.45;
}

function toCents(usd: number): number {
  return Math.round(usd * 100);
}

function monthlyJitter(): number {
  return 0.78 + rng() * 0.44;
}

async function main() {
  console.log("Wiping existing data...");
  await prisma.budgetTransfer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.voyage.deleteMany();
  await prisma.vessel.deleteMany();
  await prisma.account.deleteMany();

  console.log("Seeding accounts...");
  const accounts = [];
  for (const a of ACCOUNTS) {
    accounts.push(await prisma.account.create({ data: a }));
  }
  const accountByCode = new Map(accounts.map((a) => [a.code, a]));

  console.log("Seeding vessels...");
  const vessels = [];
  for (const v of VESSELS) {
    vessels.push(await prisma.vessel.create({ data: v }));
  }

  console.log("Seeding voyages...");
  const voyagesByVessel = new Map<string, { id: string; startDate: Date; endDate: Date | null }[]>();
  for (const v of vessels) {
    const ports = PORTS_BY_TYPE[v.type as VesselType];
    const list: { id: string; startDate: Date; endDate: Date | null }[] = [];
    const voyagePlans: { startMonth: number; durationDays: number; status: VoyageStatus; year: number }[] = [
      { startMonth: 3,  durationDays: 32, status: "COMPLETED",    year: 2025 },
      { startMonth: 9,  durationDays: 28, status: "COMPLETED",    year: 2025 },
      { startMonth: 2,  durationDays: 35, status: "COMPLETED",    year: 2026 },
      { startMonth: 5,  durationDays: 30, status: "IN_PROGRESS",  year: 2026 },
    ];
    for (let i = 0; i < voyagePlans.length; i++) {
      const plan = voyagePlans[i];
      const start = new Date(Date.UTC(plan.year, plan.startMonth - 1, intBetween(1, 20)));
      const end = plan.status === "IN_PROGRESS"
        ? null
        : new Date(start.getTime() + plan.durationDays * 24 * 3600 * 1000);
      const origin = choice(ports);
      let destination = choice(ports);
      while (destination === origin) destination = choice(ports);
      const voyage = await prisma.voyage.create({
        data: {
          vesselId: v.id,
          voyageNumber: `V-${plan.year}-${String(i + 1).padStart(3, "0")}`,
          origin,
          destination,
          startDate: start,
          endDate: end,
          status: plan.status,
          charterer: choice(CHARTERERS),
          distanceNm: intBetween(3_500, 12_000),
        },
      });
      list.push({ id: voyage.id, startDate: start, endDate: end });
    }
    voyagesByVessel.set(v.id, list);
  }

  console.log("Seeding budgets (2025 + 2026)...");
  const budgetedAccounts = accounts.filter((a) => a.category === "REVENUE" || a.category === "OPEX");
  const budgetByKey = new Map<string, { id: string }>();
  for (const v of vessels) {
    const scale = vesselScale(v.dwt);
    for (const acc of budgetedAccounts) {
      const baseline = ACCOUNT_MONTHLY_USD[acc.code] ?? 0;
      for (const year of [2025, 2026]) {
        for (let month = 1; month <= 12; month++) {
          const yearFactor = year === 2026 ? 1.04 : 1.0;
          const jitter = 0.9 + rng() * 0.2;
          const amountUsd = baseline * scale * yearFactor * jitter;
          const created = await prisma.budget.create({
            data: {
              vesselId: v.id,
              accountId: acc.id,
              fiscalYear: year,
              fiscalMonth: month,
              amountCents: toCents(amountUsd),
            },
          });
          budgetByKey.set(`${v.id}|${acc.id}|${year}|${month}`, { id: created.id });
        }
      }
    }
  }

  console.log("Seeding expenses (Jan 2024 -> May 2026)...");
  const opexAccounts = accounts.filter((a) => a.category === "OPEX");
  const capexAccounts = accounts.filter((a) => a.category === "CAPEX");
  const HISTORY_START = new Date(Date.UTC(2024, 0, 1));
  const HISTORY_END   = new Date(Date.UTC(2026, 4, 31));

  let cursor = new Date(HISTORY_START);
  let expenseCount = 0;
  while (cursor < HISTORY_END) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    for (const v of vessels) {
      const scale = vesselScale(v.dwt);
      const voyages = voyagesByVessel.get(v.id) ?? [];
      for (const acc of opexAccounts) {
        const baseline = ACCOUNT_MONTHLY_USD[acc.code] ?? 0;
        const linesThisMonth = acc.code === "5020" ? intBetween(2, 3) : (rng() < 0.85 ? 1 : 0);
        for (let i = 0; i < linesThisMonth; i++) {
          const dayOfMonth = intBetween(1, 27);
          const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
          const amount = (baseline / Math.max(1, linesThisMonth)) * scale * monthlyJitter();
          const overlapping = voyages.find(
            (vy) => vy.startDate <= date && (vy.endDate ?? new Date()) >= date,
          );
          const status: ExpenseStatus = rng() < 0.85 ? "PAID" : "APPROVED";
          await prisma.expense.create({
            data: {
              vesselId: v.id,
              accountId: acc.id,
              voyageId: overlapping?.id ?? null,
              vendor: choice(VENDORS),
              amountCents: toCents(amount),
              expenseDate: date,
              description: `${acc.name} — ${date.toISOString().slice(0, 7)}`,
              status,
            },
          });
          expenseCount++;
        }
      }
    }
    cursor = new Date(Date.UTC(year, month, 1));
  }

  console.log("Seeding CAPEX (lumpy)...");
  for (const v of vessels) {
    const scale = vesselScale(v.dwt);
    const ddYear = 2024 + Math.floor(rng() * 2);
    const ddMonth = intBetween(1, 12);
    await prisma.expense.create({
      data: {
        vesselId: v.id,
        accountId: accountByCode.get("6000")!.id,
        vendor: choice(["Cosco Shipyard", "Hyundai Heavy Industries", "Sembcorp Marine"]),
        amountCents: toCents(800_000 * scale * (0.85 + rng() * 0.4)),
        expenseDate: new Date(Date.UTC(ddYear, ddMonth - 1, intBetween(1, 27))),
        description: "Scheduled drydocking",
        status: "PAID",
      },
    });
    expenseCount++;
    const equipEvents = intBetween(0, 2);
    for (let i = 0; i < equipEvents; i++) {
      const y = 2024 + intBetween(0, 2);
      const m = intBetween(1, 12);
      await prisma.expense.create({
        data: {
          vesselId: v.id,
          accountId: choice(capexAccounts.filter((a) => a.code !== "6000")).id,
          vendor: choice(VENDORS),
          amountCents: toCents(120_000 * scale * (0.6 + rng() * 0.8)),
          expenseDate: new Date(Date.UTC(y, m - 1, intBetween(1, 27))),
          description: "Major capital expenditure",
          status: "APPROVED",
        },
      });
      expenseCount++;
    }
  }

  console.log(`  ${expenseCount} expense rows`);

  console.log("Seeding revenues...");
  let revenueCount = 0;
  cursor = new Date(HISTORY_START);
  while (cursor < HISTORY_END) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    for (const v of vessels) {
      const scale = vesselScale(v.dwt);
      const voyages = voyagesByVessel.get(v.id) ?? [];
      if (rng() < 0.92) {
        const baseline = ACCOUNT_MONTHLY_USD["4000"];
        const dayOfMonth = intBetween(1, 27);
        const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
        const overlapping = voyages.find(
          (vy) => vy.startDate <= date && (vy.endDate ?? new Date()) >= date,
        );
        await prisma.revenue.create({
          data: {
            vesselId: v.id,
            accountId: accountByCode.get("4000")!.id,
            voyageId: overlapping?.id ?? null,
            source: choice(CHARTERERS),
            amountCents: toCents(baseline * scale * monthlyJitter()),
            recognitionDate: date,
            description: `Time charter hire — ${date.toISOString().slice(0, 7)}`,
          },
        });
        revenueCount++;
      }
      if (rng() < 0.35) {
        const baseline = ACCOUNT_MONTHLY_USD["4010"];
        const dayOfMonth = intBetween(1, 27);
        const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
        await prisma.revenue.create({
          data: {
            vesselId: v.id,
            accountId: accountByCode.get("4010")!.id,
            source: choice(CHARTERERS),
            amountCents: toCents(baseline * scale * monthlyJitter()),
            recognitionDate: date,
            description: `Voyage freight — ${date.toISOString().slice(0, 7)}`,
          },
        });
        revenueCount++;
      }
      if (rng() < 0.2) {
        const baseline = ACCOUNT_MONTHLY_USD["4020"];
        const dayOfMonth = intBetween(1, 27);
        const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
        await prisma.revenue.create({
          data: {
            vesselId: v.id,
            accountId: accountByCode.get("4020")!.id,
            source: choice(CHARTERERS),
            amountCents: toCents(baseline * scale * (0.5 + rng() * 1.5)),
            recognitionDate: date,
            description: "Demurrage settlement",
          },
        });
        revenueCount++;
      }
    }
    cursor = new Date(Date.UTC(year, month, 1));
  }
  console.log(`  ${revenueCount} revenue rows`);

  console.log("Seeding budget transfers...");
  const firstVessel = vessels[0];
  const fuel = budgetByKey.get(`${firstVessel.id}|${accountByCode.get("5020")!.id}|2026|5`);
  const maint = budgetByKey.get(`${firstVessel.id}|${accountByCode.get("5060")!.id}|2026|5`);
  if (fuel && maint) {
    await prisma.budgetTransfer.create({
      data: {
        fromBudgetId: maint.id,
        toBudgetId: fuel.id,
        amountCents: 1_500_000_00,
        reason: "Higher bunker prices in Q2",
        transferredBy: "demo.user",
      },
    });
  }
  const secondVessel = vessels[1];
  const crewWages = budgetByKey.get(`${secondVessel.id}|${accountByCode.get("5000")!.id}|2026|4`);
  const benefits  = budgetByKey.get(`${secondVessel.id}|${accountByCode.get("5010")!.id}|2026|4`);
  if (crewWages && benefits) {
    await prisma.budgetTransfer.create({
      data: {
        fromBudgetId: benefits.id,
        toBudgetId: crewWages.id,
        amountCents: 800_000_00,
        reason: "Crew rotation overtime",
        transferredBy: "demo.user",
      },
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
