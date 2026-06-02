import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const Body = z.object({
  fromBudgetId: z.string(),
  toBudgetId: z.string(),
  amountUsd: z.number().positive(),
  reason: z.string().min(1),
  transferredBy: z.string().default("demo.user"),
});

/**
 * Atomic budget transfer. Decrements source, increments destination, and
 * records a BudgetTransfer row. Rejects if source has insufficient balance
 * or if source/destination belong to different vessels.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { fromBudgetId, toBudgetId, amountUsd, reason, transferredBy } = parsed.data;
  if (fromBudgetId === toBudgetId) {
    return NextResponse.json({ error: "Source and destination budgets must differ" }, { status: 400 });
  }
  const amountCents = dollarsToCents(amountUsd);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const from = await tx.budget.findUnique({ where: { id: fromBudgetId } });
      const to   = await tx.budget.findUnique({ where: { id: toBudgetId } });
      if (!from || !to) throw new Error("Budget not found");
      if (from.vesselId !== to.vesselId) {
        throw new Error("Cross-vessel transfers are not allowed in this prototype");
      }
      if (from.amountCents < amountCents) {
        throw new Error("Insufficient balance in source budget");
      }
      await tx.budget.update({
        where: { id: fromBudgetId },
        data: { amountCents: { decrement: amountCents } },
      });
      await tx.budget.update({
        where: { id: toBudgetId },
        data: { amountCents: { increment: amountCents } },
      });
      const transfer = await tx.budgetTransfer.create({
        data: { fromBudgetId, toBudgetId, amountCents, reason, transferredBy },
      });
      return transfer;
    });
    return NextResponse.json({ transfer: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
