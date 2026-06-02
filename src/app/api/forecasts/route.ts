import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { forecast, toMonthlySeries, type ForecastMethod } from "@/lib/forecasting";

export const dynamic = "force-dynamic";

const Query = z.object({
  vesselId: z.string().optional(),
  series: z.enum(["revenue", "opex", "net"]).default("revenue"),
  horizon: z.coerce.number().int().min(1).max(36).default(12),
  method: z.enum(["historical-average", "linear-trend", "seasonal"]).default("seasonal"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;
  const where = q.vesselId ? { vesselId: q.vesselId } : {};

  const [expenses, revenues, accounts] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: { accountId: true, amountCents: true, expenseDate: true },
    }),
    prisma.revenue.findMany({
      where,
      select: { amountCents: true, recognitionDate: true },
    }),
    prisma.account.findMany({ select: { id: true, category: true } }),
  ]);

  const opexIds = new Set(accounts.filter((a) => a.category === "OPEX").map((a) => a.id));

  let series: { date: Date; amountCents: number }[];
  if (q.series === "revenue") {
    series = revenues.map((r) => ({ date: r.recognitionDate, amountCents: r.amountCents }));
  } else if (q.series === "opex") {
    series = expenses
      .filter((e) => opexIds.has(e.accountId))
      .map((e) => ({ date: e.expenseDate, amountCents: e.amountCents }));
  } else {
    // net: revenue - opex per month
    const revMonthly = toMonthlySeries(revenues.map((r) => ({ date: r.recognitionDate, amountCents: r.amountCents })));
    const opexMonthly = toMonthlySeries(
      expenses.filter((e) => opexIds.has(e.accountId)).map((e) => ({ date: e.expenseDate, amountCents: e.amountCents })),
    );
    const byKey = new Map<string, number>();
    for (const r of revMonthly) byKey.set(`${r.year}-${r.month}`, (byKey.get(`${r.year}-${r.month}`) ?? 0) + r.amountCents);
    for (const o of opexMonthly) byKey.set(`${o.year}-${o.month}`, (byKey.get(`${o.year}-${o.month}`) ?? 0) - o.amountCents);
    const history = [...byKey.entries()]
      .map(([k, v]) => {
        const [y, m] = k.split("-").map(Number);
        return { year: y, month: m, amountCents: v };
      })
      .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
    const result = forecast({ history, horizonMonths: q.horizon, method: q.method as ForecastMethod });
    return NextResponse.json({ ...result, series: q.series, history });
  }

  const history = toMonthlySeries(series);
  const result = forecast({ history, horizonMonths: q.horizon, method: q.method as ForecastMethod });
  return NextResponse.json({ ...result, series: q.series, history });
}
