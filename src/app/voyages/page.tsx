import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PLANNED: "neutral",
  IN_PROGRESS: "accent",
  COMPLETED: "good",
  CANCELLED: "bad",
} as const;

export default async function VoyagesPage() {
  const voyages = await prisma.voyage.findMany({
    orderBy: { startDate: "desc" },
    include: { vessel: { select: { id: true, name: true } } },
  });
  return (
    <>
      <Header title="Voyages" subtitle={`${voyages.length} voyages across the fleet`}>
        <Link href="/voyages/new" className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition">
          + New voyage
        </Link>
      </Header>
      <div className="p-8">
        <Card title="All voyages">
          {voyages.length === 0 ? (
            <p className="text-sm text-ink-500">
              No voyages yet. <Link href="/voyages/new" className="text-accent-700 hover:underline">Log your first voyage</Link>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voyage</th>
                    <th>Vessel</th>
                    <th>Route</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Charterer</th>
                    <th className="num">Distance (nm)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {voyages.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono text-xs">{v.voyageNumber}</td>
                      <td>
                        <Link href={`/vessels/${v.vessel.id}`} className="text-accent-700 hover:underline">{v.vessel.name}</Link>
                      </td>
                      <td className="text-ink-600 text-xs">{v.origin} → {v.destination}</td>
                      <td className="text-xs">{new Date(v.startDate).toLocaleDateString()}</td>
                      <td className="text-xs">{v.endDate ? new Date(v.endDate).toLocaleDateString() : "—"}</td>
                      <td className="text-ink-600 text-xs">{v.charterer ?? "—"}</td>
                      <td className="num">{v.distanceNm?.toLocaleString() ?? "—"}</td>
                      <td><Badge tone={STATUS_TONE[v.status as keyof typeof STATUS_TONE] ?? "neutral"}>{v.status.replace(/_/g, " ")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
