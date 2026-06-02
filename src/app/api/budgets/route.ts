import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
