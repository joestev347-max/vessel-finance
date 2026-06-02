import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  ACTIVE: "good",
  IN_DRYDOCK: "warn",
  LAID_UP: "neutral",
  DECOMMISSIONED: "bad",
} as const;

export default async function VesselsPage() {
  const vessels = await prisma.vessel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { voyages: true, expenses: true, revenues: true } } },
  });
  return (
    <>
      <Header title="Vessels" subtitle={`${vessels.length} vessels under management`} />
      <div className="p-8">
        <Card title="Fleet">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>IMO</th>
                  <th>Type</th>
                  <th>Flag</th>
                  <th>Owner</th>
                  <th className="num">DWT</th>
                  <th className="num">Built</th>
                  <th>Status</th>
                  <th className="num">Voyages</th>
                </tr>
              </thead>
              <tbody>
                {vessels.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/vessels/${v.id}`} className="text-accent-700 hover:underline font-medium">
                        {v.name}
                      </Link>
                    </td>
                    <td className="text-ink-600 font-mono text-xs">{v.imoNumber}</td>
                    <td className="text-ink-600">{v.type.replace(/_/g, " ")}</td>
                    <td className="text-ink-600">{v.flag}</td>
                    <td className="text-ink-600">{v.owner}</td>
                    <td className="num">{v.dwt.toLocaleString()}</td>
                    <td className="num">{v.yearBuilt}</td>
                    <td><Badge tone={STATUS_TONE[v.status]}>{v.status.replace(/_/g, " ")}</Badge></td>
                    <td className="num">{v._count.voyages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
