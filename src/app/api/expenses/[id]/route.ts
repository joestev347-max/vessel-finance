import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const Patch = z.object({
  vendor: z.string().min(1).optional(),
  amountUsd: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]).optional(),
  voyageId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = Patch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.vendor !== undefined) data.vendor = d.vendor;
  if (d.amountUsd !== undefined) data.amountCents = dollarsToCents(d.amountUsd);
  if (d.description !== undefined) data.description = d.description;
  if (d.status !== undefined) data.status = d.status;
  if (d.voyageId !== undefined) data.voyageId = d.voyageId;
  const expense = await prisma.expense.update({ where: { id: params.id }, data });
  return NextResponse.json({ expense });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
