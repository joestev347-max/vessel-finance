import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import { formatUSD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function RevenuesPage({ searchParams }: { searchParams: { vesselId?: string } }) {
  const where = searchParams.vesselId ? { vesselId: searchParams.vesselId } : undefined;
  const [revenues, vessels] = await Promise.all([
    prisma.revenue.findMany({
      where,
      orderBy: { recognitionDate: "desc" },
      take: 100,
      include: {
        vessel: { select: { id: true, name: true } },
        account: { select: { code: true, name: true } },
        voyage: { select: { voyageNumber: true } },
      },
    }),
    prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header title="Revenues" subtitle="Recognized revenue across the fleet">
        <Link href="/revenues/new" className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition">
          + New revenue
        </Link>
      </Header>
      <div className="p-8 space-y-6">
        <Card title="Filter" subtitle="Refine the revenue list">
          <form className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col text-xs text-ink-600 gap-1">
              Vessel
              <select name="vesselId" defaultValue={searchParams.vesselId ?? ""} className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm">
                <option value="">All vessels</option>
                {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <button type="submit" className="inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-sm font-medium bg-ink-700 text-white hover:bg-ink-800">Apply</button>
            {searchParams.vesselId && (
              <Link href="/revenues" className="text-sm text-ink-500 hover:underline">Clear</Link>
            )}
          </form>
        </Card>

        <Card title={`Recent revenues${searchParams.vesselId ? " (filtered)" : ""}`} subtitle={`${revenues.length} most-recent rows`}>
          {revenues.length === 0 ? (
            <p className="text-sm text-ink-500">
              No revenue recorded yet. <Link href="/revenues/new" className="text-accent-700 hover:underline">Record your first revenue</Link>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vessel</th>
                    <th>Account</th>
                    <th>Source</th>
                    <th>Voyage</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.recognitionDate).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/vessels/${r.vessel.id}`} className="text-accent-700 hover:underline">{r.vessel.name}</Link>
                      </td>
                      <td className="text-ink-600 text-xs">
                        <span className="font-mono">{r.account.code}</span> {r.account.name}
                      </td>
                      <td>{r.source}</td>
                      <td className="text-ink-600 text-xs font-mono">{r.voyage?.voyageNumber ?? "—"}</td>
                      <td className="num">{formatUSD(r.amountCents)}</td>
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
