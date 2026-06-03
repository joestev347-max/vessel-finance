import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ACCOUNT_CATEGORIES } from "@/lib/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ accounts });
}

const CreateAccount = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  category: z.enum(ACCOUNT_CATEGORIES),
  subcategory: z.string().max(120).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateAccount.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const account = await prisma.account.create({
      data: {
        code: d.code,
        name: d.name,
        category: d.category,
        subcategory: d.subcategory || null,
      },
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: `An account with code "${d.code}" already exists.` }, { status: 409 });
    }
    throw e;
  }
}
