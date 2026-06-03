import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { formatUSD } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PENDING: "warn",
  APPROVED: "accent",
  PAID: "good",
  REJECTED: "bad",
} as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { vesselId?: string };
}) {
  const where = searchParams.vesselId ? { vesselId: searchParams.vesselId } : undefined;
  const [expenses, vessels] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      take: 100,
      include: {
        vessel: { select: { id: true, name: true } },
        account: { select: { code: true, name: true, category: true } },
      },
    }),
    prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header title="Expenses" subtitle="Recent expense entries across the fleet">
        <Link href="/expenses/new" className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition">
          + New expense
        </Link>
      </Header>
      <div className="p-8 space-y-6">
        <Card title="Filter" subtitle="Refine the expense list">
          <form className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col text-xs text-ink-600 gap-1">
              Vessel
              <select
                name="vesselId"
                defaultValue={searchParams.vesselId ?? ""}
                className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm"
              >
                <option value="">All vessels</option>
                {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <button type="submit" className="inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-sm font-medium bg-ink-700 text-white hover:bg-ink-800">Apply</button>
            {searchParams.vesselId && (
              <Link href="/expenses" className="text-sm text-ink-500 hover:underline">Clear</Link>
            )}
          </form>
        </Card>

        <Card title={`Recent expenses${searchParams.vesselId ? " (filtered)" : ""}`} subtitle={`${expenses.length} most-recent rows`}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vessel</th>
                  <th>Account</th>
                  <th>Vendor</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.expenseDate).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/vessels/${e.vessel.id}`} className="text-accent-700 hover:underline">
                        {e.vessel.name}
                      </Link>
                    </td>
                    <td className="text-ink-600 text-xs">
                      <span className="font-mono">{e.account.code}</span> {e.account.name}
                    </td>
                    <td>{e.vendor}</td>
                    <td className="text-ink-600 text-xs">{e.description}</td>
                    <td className="num">{formatUSD(e.amountCents)}</td>
                    <td><Badge tone={STATUS_TONE[e.status as keyof typeof STATUS_TONE]}>{e.status}</Badge></td>
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
