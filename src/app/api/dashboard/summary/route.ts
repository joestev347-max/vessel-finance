import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeProfitability, type AccountRef } from "@/lib/profitability";

export const dynamic = "force-dynamic";

/**
 * Fleet-wide executive summary for the current year-to-date and the trailing
 * 12 months. Returns KPI tiles and per-vessel rollups.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const asOf = url.searchParams.get("asOf") ? new Date(url.searchParams.get("asOf")!) : new Date();
  const ytdFrom = new Date(Date.UTC(asOf.getUTCFullYear(), 0, 1));
  const trailingFrom = new Date(asOf);
  trailingFrom.setUTCFullYear(trailingFrom.getUTCFullYear() - 1);

  const [accounts, expenses, revenues, vessels] = await Promise.all([
    prisma.account.findMany({ select: { id: true, name: true, category: true, subcategory: true } }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: trailingFrom, lte: asOf } },
      select: { vesselId: true, accountId: true, amountCents: true, expenseDate: true },
    }),
    prisma.revenue.findMany({
      where: { recognitionDate: { gte: trailingFrom, lte: asOf } },
      select: { vesselId: true, accountId: true, amountCents: true, recognitionDate: true },
    }),
    prisma.vessel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, status: true, flag: true, dwt: true },
    }),
  ]);

  // YTD totals
  const ytd = computeProfitability({
    accounts: accounts as AccountRef[],
    expenses, revenues,
    from: ytdFrom, to: asOf,
  });
  // Trailing 12-month totals
  const ttm = computeProfitability({
    accounts: accounts as AccountRef[],
    expenses, revenues,
    from: trailingFrom, to: asOf,
  });

  // Per-vessel YTD rollup
  const perVessel = vessels.map((v) => {
    const r = computeProfitability({
      accounts: accounts as AccountRef[],
      expenses: expenses.filter((e) => e.vesselId === v.id),
      revenues: revenues.filter((r) => r.vesselId === v.id),
      from: ytdFrom, to: asOf,
    });
    return {
      vessel: v,
      ytd: {
        revenueCents: r.totals.revenueCents,
        opexCents: r.totals.opexCents,
        capexCents: r.totals.capexCents,
        netProfitCents: r.totals.netProfitCents,
        netMarginPct: r.totals.netMarginPct,
      },
    };
  });

  return NextResponse.json({
    asOf: asOf.toISOString(),
    ytd: { from: ytdFrom.toISOString(), ...ytd.totals, monthly: ytd.monthly, opexBySubcategory: ytd.opexBySubcategory },
    ttm: { from: trailingFrom.toISOString(), ...ttm.totals, monthly: ttm.monthly },
    perVessel,
  });
}
