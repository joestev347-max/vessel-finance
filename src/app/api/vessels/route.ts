import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { VESSEL_TYPES, VESSEL_STATUSES } from "@/lib/domain";

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

const nextYear = new Date().getUTCFullYear() + 1;

const CreateVessel = z.object({
  name: z.string().min(1).max(200),
  imoNumber: z.string().min(1).max(40),
  type: z.enum(VESSEL_TYPES),
  flag: z.string().min(1).max(80),
  owner: z.string().min(1).max(200),
  dwt: z.number().int().nonnegative(),
  yearBuilt: z.number().int().min(1900).max(nextYear),
  status: z.enum(VESSEL_STATUSES).default("ACTIVE"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateVessel.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const vessel = await prisma.vessel.create({ data: d });
    return NextResponse.json({ vessel }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const field = Array.isArray(e.meta?.target) ? (e.meta?.target as string[])[0] : "name or IMO number";
      return NextResponse.json({ error: `A vessel with that ${field} already exists.` }, { status: 409 });
    }
    throw e;
  }
}
