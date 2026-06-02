import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const vessel = await prisma.vessel.findUnique({
    where: { id: params.id },
    include: {
      voyages: { orderBy: { startDate: "desc" } },
    },
  });
  if (!vessel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ vessel });
}
