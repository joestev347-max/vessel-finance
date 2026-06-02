import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const ListQuery = z.object({
  vesselId: z.string().optional(),
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
  if (q.from || q.to) {
    where.recognitionDate = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
  }
  const revenues = await prisma.revenue.findMany({
    where,
    orderBy: { recognitionDate: "desc" },
    take: q.limit,
    include: {
      vessel: { select: { id: true, name: true } },
      account: { select: { id: true, code: true, name: true } },
    },
  });
  return NextResponse.json({ revenues });
}

const CreateRevenue = z.object({
  vesselId: z.string(),
  accountId: z.string(),
  voyageId: z.string().optional().nullable(),
  source: z.string().min(1),
  amountUsd: z.number().positive(),
  recognitionDate: z.string(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateRevenue.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const revenue = await prisma.revenue.create({
    data: {
      vesselId: d.vesselId,
      accountId: d.accountId,
      voyageId: d.voyageId ?? null,
      source: d.source,
      amountCents: dollarsToCents(d.amountUsd),
      recognitionDate: new Date(d.recognitionDate),
      description: d.description ?? null,
    },
  });
  return NextResponse.json({ revenue }, { status: 201 });
}
