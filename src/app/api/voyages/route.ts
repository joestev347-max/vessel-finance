import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const vesselId = url.searchParams.get("vesselId") ?? undefined;
  const voyages = await prisma.voyage.findMany({
    where: vesselId ? { vesselId } : undefined,
    orderBy: { startDate: "desc" },
    include: { vessel: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ voyages });
}
