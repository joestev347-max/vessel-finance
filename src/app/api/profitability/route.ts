import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeProfitability, type AccountRef } from "@/lib/profitability";

export const dynamic = "force-dynamic";

const Query = z.object({
  vesselId: z.string().optional(),
  from: z.string(),
  to: z.string(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;
  const from = new Date(q.from);
  const to = new Date(q.to);

  const where = q.vesselId ? { vesselId: q.vesselId } : {};
  const [expenses, revenues, accounts] = await Promise.all([
    prisma.expense.findMany({
      where: { ...where, expenseDate: { gte: from, lte: to } },
      select: { accountId: true, amountCents: true, expenseDate: true, voyageId: true },
    }),
    prisma.revenue.findMany({
      where: { ...where, recognitionDate: { gte: from, lte: to } },
      select: { accountId: true, amountCents: true, recognitionDate: true, voyageId: true },
    }),
    prisma.account.findMany({
      select: { id: true, name: true, category: true, subcategory: true },
    }),
  ]);

  const result = computeProfitability({
    expenses, revenues, accounts: accounts as AccountRef[], from, to,
  });
  return NextResponse.json(result);
}
