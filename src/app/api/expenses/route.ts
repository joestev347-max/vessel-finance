import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const ListQuery = z.object({
  vesselId: z.string().optional(),
  accountId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
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
  if (q.accountId) where.accountId = q.accountId;
  if (q.from || q.to) {
    where.expenseDate = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
  }
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    take: q.limit,
    include: {
      vessel: { select: { id: true, name: true } },
      account: { select: { id: true, code: true, name: true, category: true } },
      voyage: { select: { id: true, voyageNumber: true } },
    },
  });
  return NextResponse.json({ expenses });
}

const CreateExpense = z.object({
  vesselId: z.string(),
  accountId: z.string(),
  voyageId: z.string().optional().nullable(),
  vendor: z.string().min(1),
  amountUsd: z.number().positive(),
  expenseDate: z.string(),         // ISO
  description: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]).default("PENDING"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateExpense.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      vesselId: d.vesselId,
      accountId: d.accountId,
      voyageId: d.voyageId ?? null,
      vendor: d.vendor,
      amountCents: dollarsToCents(d.amountUsd),
      expenseDate: new Date(d.expenseDate),
      description: d.description,
      status: d.status,
    },
  });
  return NextResponse.json({ expense }, { status: 201 });
}
