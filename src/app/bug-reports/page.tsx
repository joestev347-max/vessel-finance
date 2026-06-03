import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { diagnosisAvailable } from "@/lib/self-heal/diagnose";
import { DispatchButton } from "@/components/debug/DispatchButton";

export const dynamic = "force-dynamic";

const SEVERITY_TONE = { low: "neutral", medium: "warn", high: "bad", critical: "bad" } as const;
const STATUS_TONE = { pending: "warn", diagnosed: "accent", dispatched: "accent", resolved: "good", failed: "bad" } as const;

type Diagnosis = {
  root_cause?: string;
  suspected_files?: string[];
  proposed_fix?: string;
  narrative?: string;
};

function parse<T>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

export default async function BugReportsPage() {
  const reports = await prisma.bugReport.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const repairConfigured = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);

  return (
    <>
      <Header title="Bug Reports" subtitle="Self-healing pipeline — captured bugs, diagnoses, and repair dispatch" />
      <div className="p-8 space-y-6">
        {!diagnosisAvailable() && (
          <Card title="Diagnosis disabled">
            <p className="text-sm text-ink-500">
              Set <span className="font-mono">ANTHROPIC_API_KEY</span> in the environment to enable automatic
              diagnosis. Reports are still captured and stored. See <span className="font-mono">SELF-HEAL-SETUP.md</span>.
            </p>
          </Card>
        )}

        {reports.length === 0 ? (
          <Card title="No reports yet">
            <p className="text-sm text-ink-500">
              Click the 🐞 button (bottom-right) on any page to file a bug. It captures the page, your viewport,
              and recent JS errors, and Claude diagnoses it automatically.
            </p>
          </Card>
        ) : (
          reports.map((r) => {
            const dx = parse<Diagnosis>(r.diagnosis);
            return (
              <Card key={r.id} title={`Bug ${r.id.slice(0, 8)}`} subtitle={new Date(r.createdAt).toLocaleString()}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? "neutral"}>{r.status}</Badge>
                    {r.severity && <Badge tone={SEVERITY_TONE[r.severity as keyof typeof SEVERITY_TONE] ?? "neutral"}>severity: {r.severity}</Badge>}
                    {r.confidence && <Badge tone="neutral">confidence: {r.confidence}</Badge>}
                    {r.pageRoute && <span className="text-xs font-mono text-ink-500">{r.pageRoute}</span>}
                    {r.selfHealStatus && <Badge tone="accent">self-heal: {r.selfHealStatus}</Badge>}
                  </div>

                  <p className="text-sm text-ink-800"><span className="text-ink-500">Report:</span> {r.description}</p>

                  {dx && (
                    <div className="rounded-md bg-ink-50 border border-ink-100 p-3 space-y-2 text-sm">
                      <div><span className="text-ink-500">Root cause:</span> {dx.root_cause}</div>
                      {dx.suspected_files && dx.suspected_files.length > 0 && (
                        <div>
                          <span className="text-ink-500">Suspected files:</span>{" "}
                          {dx.suspected_files.map((f) => <span key={f} className="font-mono text-xs bg-white border border-ink-200 rounded px-1.5 py-0.5 mr-1">{f}</span>)}
                        </div>
                      )}
                      {dx.proposed_fix && <div><span className="text-ink-500">Proposed fix:</span> {dx.proposed_fix}</div>}
                      {dx.narrative && <div className="text-ink-600 text-xs">{dx.narrative}</div>}
                    </div>
                  )}

                  {r.resolutionNotes && <p className="text-xs text-bad-600">{r.resolutionNotes}</p>}
                  {r.selfHealPrUrl && (
                    <a href={r.selfHealPrUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-700 hover:underline">
                      View pull request →
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-ink-400">
                      {r.diagnosisMs ? `diagnosed in ${(r.diagnosisMs / 1000).toFixed(1)}s` : ""}
                    </span>
                    {r.status === "diagnosed" && (
                      <DispatchButton id={r.id} disabled={!repairConfigured} />
                    )}
                  </div>
                  {r.status === "diagnosed" && !repairConfigured && (
                    <p className="text-[11px] text-ink-400 text-right">
                      Repair dispatch needs GITHUB_TOKEN + GITHUB_REPO (see SELF-HEAL-SETUP.md).
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
