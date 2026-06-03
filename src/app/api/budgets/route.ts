import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const ListQuery = z.object({
  vesselId: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;
  const where: Record<string, unknown> = {};
  if (q.vesselId) where.vesselId = q.vesselId;
  if (q.year) where.fiscalYear = q.year;
  const budgets = await prisma.budget.findMany({
    where,
    orderBy: [{ fiscalYear: "asc" }, { fiscalMonth: "asc" }],
    include: {
      account: { select: { id: true, code: true, name: true, category: true, subcategory: true } },
      vessel: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ budgets });
}

const nextYear = new Date().getUTCFullYear() + 1;

const CreateBudget = z.object({
  vesselId: z.string().min(1),
  accountId: z.string().min(1),
  fiscalYear: z.number().int().min(2000).max(nextYear + 5),
  fiscalMonth: z.number().int().min(1).max(12),
  amountUsd: z.number().nonnegative(),
  notes: z.string().max(300).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateBudget.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const budget = await prisma.budget.create({
      data: {
        vesselId: d.vesselId,
        accountId: d.accountId,
        fiscalYear: d.fiscalYear,
        fiscalMonth: d.fiscalMonth,
        amountCents: dollarsToCents(d.amountUsd),
        notes: d.notes || null,
      },
    });
    return NextResponse.json({ budget }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A budget line already exists for this vessel, account, and month. Edit that line or pick a different month." },
        { status: 409 },
      );
    }
    throw e;
  }
}
