/**
 * Lightweight self-tests for the profitability + forecasting engines.
 * Run: `npm run engines:test`
 *
 * Not a real test framework — just asserts that exits non-zero on failure.
 * Good enough to catch regressions in pure-math logic.
 */
import { computeProfitability, computeVoyageTCE } from "./profitability";
import { forecast, toMonthlySeries, type MonthlyPoint } from "./forecasting";
import type { AccountCategory } from "./domain";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  FAIL ${name}`, detail ?? ""); }
}
function approx(a: number, b: number, tol = 1) { return Math.abs(a - b) <= tol; }

console.log("Profitability:");
{
  const accounts = [
    { id: "rev",  name: "Charter",      category: "REVENUE" as AccountCategory, subcategory: null },
    { id: "fuel", name: "Fuel",         category: "OPEX"    as AccountCategory, subcategory: "Voyage" },
    { id: "crew", name: "Crew Wages",   category: "OPEX"    as AccountCategory, subcategory: "Crew" },
    { id: "dock", name: "Drydocking",   category: "CAPEX"   as AccountCategory, subcategory: "Drydock" },
  ];
  const revenues = [
    { accountId: "rev", amountCents: 100_000_00, recognitionDate: new Date("2025-01-15") },
    { accountId: "rev", amountCents: 120_000_00, recognitionDate: new Date("2025-02-15") },
  ];
  const expenses = [
    { accountId: "fuel", amountCents: 30_000_00, expenseDate: new Date("2025-01-10") },
    { accountId: "crew", amountCents: 20_000_00, expenseDate: new Date("2025-01-20") },
    { accountId: "fuel", amountCents: 35_000_00, expenseDate: new Date("2025-02-10") },
    { accountId: "dock", amountCents: 50_000_00, expenseDate: new Date("2025-02-25") },
  ];
  const r = computeProfitability({
    accounts, revenues, expenses,
    from: new Date("2025-01-01"), to: new Date("2025-12-31"),
  });
  check("revenue total", r.totals.revenueCents === 220_000_00);
  check("opex total",    r.totals.opexCents    ===  85_000_00);
  check("capex total",   r.totals.capexCents   ===  50_000_00);
  check("gross profit",  r.totals.grossProfitCents === 135_000_00);
  check("net profit",    r.totals.netProfitCents   ===  85_000_00);
  check("gross margin %", approx(r.totals.grossMarginPct, 61.36, 0.1), r.totals.grossMarginPct);
  check("opex by subcategory ordering", r.opexBySubcategory[0].subcategory === "Voyage");
  check("monthly rows", r.monthly.length === 2);
}

console.log("\nVoyage TCE:");
{
  const accounts = [
    { id: "rev",  name: "Charter",  category: "REVENUE" as AccountCategory, subcategory: null },
    { id: "fuel", name: "Fuel",     category: "OPEX"    as AccountCategory, subcategory: "Voyage" },
    { id: "ins",  name: "Insurance",category: "OPEX"    as AccountCategory, subcategory: "Admin" },
  ];
  const tce = computeVoyageTCE({
    accounts,
    revenues: [{ accountId: "rev", amountCents: 1_500_000_00, recognitionDate: new Date("2025-03-15"), voyageId: "V1" }],
    expenses: [
      { accountId: "fuel", amountCents:   300_000_00, expenseDate: new Date("2025-03-10"), voyageId: "V1" },
      { accountId: "ins",  amountCents:    50_000_00, expenseDate: new Date("2025-03-12"), voyageId: "V1" }, // not Voyage subcategory
    ],
    voyageId: "V1",
    startDate: new Date("2025-03-01"),
    endDate:   new Date("2025-03-31"),
  });
  // (1.5M - 300K) / 30 days = 40,000 USD/day
  check("days at sea", tce.daysAtSea === 30, tce.daysAtSea);
  check("tce usd/day", approx(tce.tceUsdPerDay, 40_000, 1));
}

console.log("\nForecasting — historical average:");
{
  const history: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => ({
    year: 2025, month: i + 1, amountCents: 100_000_00,
  }));
  const r = forecast({ history, horizonMonths: 3, method: "historical-average" });
  check("3 forecast points", r.forecast.length === 3);
  check("flat history -> flat projection", r.forecast.every((p) => p.projectedCents === 100_000_00));
  check("first projection is Jan 2026", r.forecast[0].year === 2026 && r.forecast[0].month === 1);
}

console.log("\nForecasting — linear trend:");
{
  // Monthly amount grows by 1000 each month.
  const history: MonthlyPoint[] = Array.from({ length: 24 }, (_, i) => ({
    year:   2024 + Math.floor(i / 12),
    month:  (i % 12) + 1,
    amountCents: 100_000_00 + i * 1000_00,
  }));
  const r = forecast({ history, horizonMonths: 3, method: "linear-trend" });
  // Next month index = 24 -> projected = 100000 + 24*1000 = 124,000
  check("trend extrapolates", approx(r.forecast[0].projectedCents, 124_000_00, 100_00));
  check("trend ascending", r.forecast[2].projectedCents > r.forecast[0].projectedCents);
}

console.log("\nForecasting — seasonal:");
{
  // Two years of identical seasonal pattern -> projection should mirror prior year.
  const seasonal = [80, 85, 90, 95, 100, 110, 120, 130, 120, 110, 95, 85];
  const history: MonthlyPoint[] = [];
  for (let y of [2024, 2025]) {
    for (let m = 0; m < 12; m++) {
      history.push({ year: y, month: m + 1, amountCents: seasonal[m] * 1000_00 });
    }
  }
  const r = forecast({ history, horizonMonths: 6, method: "seasonal" });
  // Jan 2026 should be close to Jan 2025 (which equals Jan 2024 — no growth)
  check("seasonal Jan~80K", approx(r.forecast[0].projectedCents, 80 * 1000_00, 500_00));
  check("seasonal Jun~110K", approx(r.forecast[5].projectedCents, 110 * 1000_00, 500_00));
}

console.log("\ntoMonthlySeries:");
{
  const s = toMonthlySeries([
    { date: new Date("2025-01-15"), amountCents: 100 },
    { date: new Date("2025-01-25"), amountCents: 200 },
    { date: new Date("2025-02-05"), amountCents: 300 },
  ]);
  check("two months", s.length === 2);
  check("jan aggregated", s[0].amountCents === 300);
  check("feb separate",   s[1].amountCents === 300);
}

console.log(`\n${failed === 0 ? "All engine tests passed." : `FAILED: ${failed}`}`);
if (failed > 0) process.exit(1);
