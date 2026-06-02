import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ accounts });
}
