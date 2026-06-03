import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { diagnose, diagnosisAvailable } from "@/lib/self-heal/diagnose";

export const dynamic = "force-dynamic";

export async function GET() {
  const reports = await prisma.bugReport.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ reports });
}

const CreateBug = z.object({
  description: z.string().min(1).max(4000),
  pageRoute: z.string().max(500).optional().nullable(),
  contextBundle: z.unknown().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateBug.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // 1. Persist the report immediately.
  const report = await prisma.bugReport.create({
    data: {
      description: d.description,
      pageRoute: d.pageRoute ?? null,
      contextBundle: d.contextBundle !== undefined ? JSON.stringify(d.contextBundle) : null,
      status: "pending",
    },
  });

  // 2. Diagnose if a key is configured; otherwise store-and-skip (no failure).
  if (!diagnosisAvailable()) {
    return NextResponse.json(
      { report, diagnosed: false, note: "ANTHROPIC_API_KEY not set — report stored, diagnosis skipped." },
      { status: 201 },
    );
  }

  try {
    const { diagnosis, tokens, ms } = await diagnose({
      description: d.description,
      pageRoute: d.pageRoute,
      contextBundle: d.contextBundle,
    });
    const updated = await prisma.bugReport.update({
      where: { id: report.id },
      data: {
        status: "diagnosed",
        diagnosis: JSON.stringify(diagnosis),
        severity: diagnosis.severity,
        confidence: diagnosis.confidence,
        diagnosisTokens: JSON.stringify(tokens),
        diagnosisMs: ms,
      },
    });
    return NextResponse.json({ report: updated, diagnosed: true }, { status: 201 });
  } catch (e) {
    const updated = await prisma.bugReport.update({
      where: { id: report.id },
      data: {
        status: "failed",
        resolutionNotes: "Diagnosis error: " + (e instanceof Error ? e.message : String(e)),
      },
    });
    return NextResponse.json({ report: updated, diagnosed: false, error: "diagnosis failed" }, { status: 201 });
  }
}
