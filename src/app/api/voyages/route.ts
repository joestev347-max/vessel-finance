import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { VOYAGE_STATUSES } from "@/lib/domain";

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

const CreateVoyage = z.object({
  vesselId: z.string().min(1),
  voyageNumber: z.string().min(1).max(60),
  origin: z.string().min(1).max(120),
  destination: z.string().min(1).max(120),
  startDate: z.string(),                 // ISO date
  endDate: z.string().optional().nullable(),
  status: z.enum(VOYAGE_STATUSES).default("PLANNED"),
  charterer: z.string().max(200).optional().nullable(),
  distanceNm: z.number().int().nonnegative().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateVoyage.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const voyage = await prisma.voyage.create({
      data: {
        vesselId: d.vesselId,
        voyageNumber: d.voyageNumber,
        origin: d.origin,
        destination: d.destination,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
        status: d.status,
        charterer: d.charterer || null,
        distanceNm: d.distanceNm ?? null,
      },
    });
    return NextResponse.json({ voyage }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: `This vessel already has a voyage numbered "${d.voyageNumber}".` }, { status: 409 });
    }
    throw e;
  }
}
