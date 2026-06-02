import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const vessels = await prisma.vessel.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { voyages: true, expenses: true, revenues: true } },
    },
  });
  return NextResponse.json({ vessels });
}
