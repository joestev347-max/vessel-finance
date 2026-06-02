import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KpiTile } from "@/components/ui/KpiTile";
import { VoyageList } from "@/components/vessels/VoyageList";
import { BudgetVarianceTable } from "@/components/vessels/BudgetVarianceTable";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { prisma } from "@/lib/db";
import { computeProfitability, computeBudgetVariance, type AccountRef } from "@/lib/profitability";
import { formatUSDCompact } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function VesselDetailPage({ params }: { params: { id: string } }) {
  const vessel = await prisma.vessel.findUnique({
    where: { id: params.id },
    include: { voyages: { orderBy: { startDate: "desc" } } },
  });
  if (!vessel) return notFound();

  const asOf = new Date();
  const year = asOf.getUTCFullYear();
  const ytdFrom = new Date(Date.UTC(year, 0, 1));
  const ttmFrom = new Date(asOf);
  ttmFrom.setUTCFullYear(ttmFrom.getUTCFullYear() - 1);

  const [accounts, expenses, revenues, budgets] = await Promise.all([
    prisma.account.findMany({ select: { id: true, name: true, category: true, subcategory: true } }),
    prisma.expense.findMany({
      where: { vesselId: vessel.id, expenseDate: { gte: ttmFrom, lte: asOf } },
      select: { accountId: true, amountCents: true, expenseDate: true, voyageId: true },
    }),
    prisma.revenue.findMany({
      where: { vesselId: vessel.id, recognitionDate: { gte: ttmFrom, lte: asOf } },
      select: { accountId: true, amountCents: true, recognitionDate: true, voyageId: true },
    }),
    prisma.budget.findMany({
      where: { vesselId: vessel.id, fiscalYear: year },
      select: { accountId: true, fiscalYear: true, fiscalMonth: true, amountCents: true },
    }),
  ]);

  const ttm = computeProfitability({ accounts: accounts as AccountRef[], expenses, revenues, from: ttmFrom, to: asOf });
  const ytd = computeProfitability({ accounts: accounts as AccountRef[], expenses, revenues, from: ytdFrom, to: asOf });
  const variance = computeBudgetVariance({
    budgets, expenses, revenues, accounts: accounts as AccountRef[], year,
  });

  return (
    <>
      <Header title={vessel.name} subtitle={`IMO ${vessel.imoNumber} · ${vessel.type.replace(/_/g, " ")} · ${vessel.flag}`}>
        <Badge tone={vessel.status === "ACTIVE" ? "good" : vessel.status === "IN_DRYDOCK" ? "warn" : "neutral"}>
          {vessel.status.replace(/_/g, " ")}
        </Badge>
      </Header>
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiTile label="YTD Revenue" value={formatUSDCompact(ytd.totals.revenueCents)} />
          <KpiTile label="YTD OPEX"    value={formatUSDCompact(ytd.totals.opexCents)} />
          <KpiTile label="YTD CAPEX"   value={formatUSDCompact(ytd.totals.capexCents)} />
          <KpiTile
            label="YTD Net"
            value={formatUSDCompact(ytd.totals.netProfitCents)}
            deltaTone={ytd.totals.netProfitCents >= 0 ? "good" : "bad"}
            delta={`${ytd.totals.netMarginPct.toFixed(1)}% margin`}
          />
          <KpiTile label="DWT" value={vessel.dwt.toLocaleString()} hint={`Built ${vessel.yearBuilt}`} />
        </div>

        <Card title="Profit & loss" subtitle="Trailing 12 months">
          <RevenueExpenseChart data={ttm.monthly} />
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title={`Budget vs actual (${year})`} subtitle="Sorted by largest variance">
            <BudgetVarianceTable rows={variance.byAccount} />
          </Card>
          <Card title="Voyages" subtitle={`${vessel.voyages.length} on record`}>
            <VoyageList voyages={vessel.voyages} />
          </Card>
        </div>
      </div>
    </>
  );
}
