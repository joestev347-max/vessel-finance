import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Webhook the GitHub Actions self-heal workflow posts status updates to.
 * Authenticated by a shared secret (SELF_HEAL_CALLBACK_TOKEN, must match the workflow secret).
 * Phases: started -> running, pr-opened -> completed (+ PR url), failed -> failed.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const expected = process.env.SELF_HEAL_CALLBACK_TOKEN;
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bugId = typeof body.bug_id === "string" ? body.bug_id : null;
  if (!bugId) return NextResponse.json({ error: "missing bug_id" }, { status: 400 });

  const data: Prisma.BugReportUpdateInput = {};
  switch (body.phase) {
    case "started":
      data.selfHealStatus = "running";
      if (body.run_id != null) data.selfHealRunId = String(body.run_id);
      break;
    case "pr-opened":
      data.selfHealStatus = "completed";
      data.status = "resolved";
      if (typeof body.pr_url === "string") data.selfHealPrUrl = body.pr_url;
      if (body.pr_number != null) data.selfHealPrNumber = Number(body.pr_number);
      if (typeof body.branch === "string") data.selfHealBranch = body.branch;
      break;
    case "failed":
      data.selfHealStatus = "failed";
      if (typeof body.message === "string") data.resolutionNotes = body.message;
      break;
    default:
      return NextResponse.json({ error: "unknown phase" }, { status: 400 });
  }

  try {
    await prisma.bugReport.update({ where: { id: bugId }, data });
  } catch {
    return NextResponse.json({ error: "bug not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
