import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { BudgetGrid } from "@/components/budgets/BudgetGrid";
import { formatUSDCompact } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { vesselId?: string; year?: string };
}) {
  const vessels = await prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  if (vessels.length === 0) return notFound();
  const vesselId = searchParams.vesselId ?? vessels[0].id;
  const year = Number(searchParams.year ?? new Date().getUTCFullYear());

  const vessel = vessels.find((v) => v.id === vesselId);
  if (!vessel) return notFound();

  const [budgets, recentTransfers] = await Promise.all([
    prisma.budget.findMany({
      where: { vesselId, fiscalYear: year },
      include: { account: true },
    }),
    prisma.budgetTransfer.findMany({
      where: { fromBudget: { vesselId } },
      orderBy: { transferredAt: "desc" },
      take: 10,
      include: {
        fromBudget: { include: { account: { select: { name: true, code: true } } } },
        toBudget:   { include: { account: { select: { name: true, code: true } } } },
      },
    }),
  ]);

  return (
    <>
      <Header title="Budgets" subtitle={`Drag-and-drop budget transfers · ${vessel.name} · FY ${year}`} />
      <div className="p-8 space-y-6">
        <Card title="Filters">
          <form className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col text-xs text-ink-600 gap-1">
              Vessel
              <select name="vesselId" defaultValue={vesselId} className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm">
                {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-xs text-ink-600 gap-1">
              Year
              <select name="year" defaultValue={String(year)} className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm">
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </label>
            <button type="submit" className="inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-sm font-medium bg-ink-700 text-white hover:bg-ink-800">
              Apply
            </button>
          </form>
        </Card>

        <Card title="Budget grid" subtitle="Drag a cell onto another to transfer">
          <BudgetGrid budgets={budgets} vesselName={vessel.name} year={year} />
        </Card>

        <Card title="Recent transfers" subtitle={`Last ${recentTransfers.length} transfers for this vessel`}>
          {recentTransfers.length === 0 ? (
            <p className="text-sm text-ink-500">No transfers recorded for this vessel yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th className="num">Amount</th>
                    <th>Reason</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransfers.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.transferredAt).toLocaleString()}</td>
                      <td className="text-xs">
                        <span className="font-mono">{t.fromBudget.account.code}</span> {t.fromBudget.account.name}
                        <Badge tone="neutral" className="ml-2">{t.fromBudget.fiscalYear}-{String(t.fromBudget.fiscalMonth).padStart(2, "0")}</Badge>
                      </td>
                      <td className="text-xs">
                        <span className="font-mono">{t.toBudget.account.code}</span> {t.toBudget.account.name}
                        <Badge tone="neutral" className="ml-2">{t.toBudget.fiscalYear}-{String(t.toBudget.fiscalMonth).padStart(2, "0")}</Badge>
                      </td>
                      <td className="num">{formatUSDCompact(t.amountCents)}</td>
                      <td className="text-ink-600 text-xs">{t.reason}</td>
                      <td className="text-ink-600 text-xs">{t.transferredBy}</td>
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
