import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Dispatch the self-heal repair agent for a diagnosed bug.
 * Fires a GitHub repository_dispatch event; the Actions workflow runs the sandboxed
 * agent and opens a PR. Gated on the report being diagnosed; nothing merges automatically.
 *
 * Requires env: GITHUB_TOKEN (fine-grained PAT: contents:write, pull-requests:write),
 * GITHUB_REPO ("owner/repo"). Optional: SELF_HEAL_CALLBACK_URL (public origin for callbacks).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return NextResponse.json(
      { error: "Repair not configured: set GITHUB_TOKEN and GITHUB_REPO (see SELF-HEAL-SETUP.md)." },
      { status: 400 },
    );
  }

  const report = await prisma.bugReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.status !== "diagnosed") {
    return NextResponse.json({ error: "Report must be diagnosed before dispatch." }, { status: 400 });
  }

  let diagnosis: Record<string, unknown> = {};
  try { diagnosis = report.diagnosis ? JSON.parse(report.diagnosis) : {}; } catch { /* keep empty */ }

  const origin = process.env.SELF_HEAL_CALLBACK_URL || new URL(req.url).origin;
  const callback_url = `${origin}/api/self-heal/callback`;

  const resp = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      event_type: "self-heal-bug",
      client_payload: {
        bug_id: report.id,
        description: report.description,
        diagnosis: {
          ...diagnosis,
          severity: report.severity,
          confidence: report.confidence,
          page_route: report.pageRoute,
        },
        callback_url,
      },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    return NextResponse.json({ error: `GitHub dispatch failed: ${resp.status} ${t.slice(0, 200)}` }, { status: 502 });
  }

  const updated = await prisma.bugReport.update({
    where: { id: report.id },
    data: { status: "dispatched", selfHealStatus: "queued" },
  });
  return NextResponse.json({ report: updated, dispatched: true });
}
