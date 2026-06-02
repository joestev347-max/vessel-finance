import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { KpiTile } from "@/components/ui/KpiTile";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { OpexBreakdownChart } from "@/components/dashboard/OpexBreakdownChart";
import { FleetSummaryTable } from "@/components/dashboard/FleetSummaryTable";
import { prisma } from "@/lib/db";
import { computeProfitability, type AccountRef } from "@/lib/profitability";
import { formatUSDCompact } from "@/lib/money";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const asOf = new Date();
  const ytdFrom = new Date(Date.UTC(asOf.getUTCFullYear(), 0, 1));
  const trailingFrom = new Date(asOf);
  trailingFrom.setUTCFullYear(trailingFrom.getUTCFullYear() - 1);

  const [accounts, expenses, revenues, vessels] = await Promise.all([
    prisma.account.findMany({ select: { id: true, name: true, category: true, subcategory: true } }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: trailingFrom, lte: asOf } },
      select: { vesselId: true, accountId: true, amountCents: true, expenseDate: true },
    }),
    prisma.revenue.findMany({
      where: { recognitionDate: { gte: trailingFrom, lte: asOf } },
      select: { vesselId: true, accountId: true, amountCents: true, recognitionDate: true },
    }),
    prisma.vessel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, status: true, flag: true, dwt: true },
    }),
  ]);

  const ttm = computeProfitability({
    accounts: accounts as AccountRef[],
    expenses, revenues,
    from: trailingFrom, to: asOf,
  });
  const ytd = computeProfitability({
    accounts: accounts as AccountRef[],
    expenses, revenues,
    from: ytdFrom, to: asOf,
  });

  const perVessel = vessels.map((v) => {
    const r = computeProfitability({
      accounts: accounts as AccountRef[],
      expenses: expenses.filter((e) => e.vesselId === v.id),
      revenues: revenues.filter((r) => r.vesselId === v.id),
      from: ytdFrom, to: asOf,
    });
    return {
      vessel: v,
      ytd: {
        revenueCents: r.totals.revenueCents,
        opexCents: r.totals.opexCents,
        capexCents: r.totals.capexCents,
        netProfitCents: r.totals.netProfitCents,
        netMarginPct: r.totals.netMarginPct,
      },
    };
  });

  return { asOf, ttm, ytd, perVessel };
}

export default async function DashboardPage() {
  const { asOf, ttm, ytd, perVessel } = await loadDashboard();
  const activeVessels = perVessel.filter((p) => p.vessel.status === "ACTIVE").length;

  return (
    <>
      <Header
        title="Executive dashboard"
        subtitle={`Fleet financial summary as of ${asOf.toLocaleDateString()}`}
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiTile
            label="YTD Revenue"
            value={formatUSDCompact(ytd.totals.revenueCents)}
            hint={`Trailing 12mo: ${formatUSDCompact(ttm.totals.revenueCents)}`}
          />
          <KpiTile
            label="YTD OPEX"
            value={formatUSDCompact(ytd.totals.opexCents)}
            hint={`Trailing 12mo: ${formatUSDCompact(ttm.totals.opexCents)}`}
          />
          <KpiTile
            label="YTD Net Profit"
            value={formatUSDCompact(ytd.totals.netProfitCents)}
            deltaTone={ytd.totals.netProfitCents >= 0 ? "good" : "bad"}
            delta={ytd.totals.netProfitCents >= 0 ? "Profit" : "Loss"}
          />
          <KpiTile
            label="Net margin (YTD)"
            value={`${ytd.totals.netMarginPct.toFixed(1)}%`}
          />
          <KpiTile
            label="Active vessels"
            value={`${activeVessels}/${perVessel.length}`}
            hint="Of total fleet"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card title="Revenue vs Expense" subtitle="Trailing 12 months · fleet-wide" className="lg:col-span-2">
            <RevenueExpenseChart data={ttm.monthly} />
          </Card>
          <Card title="OPEX breakdown" subtitle="Year to date · by subcategory">
            <OpexBreakdownChart data={ytd.opexBySubcategory} />
          </Card>
        </div>

        <Card title="Fleet summary" subtitle="Per-vessel YTD performance">
          <FleetSummaryTable rows={perVessel} />
        </Card>
      </div>
    </>
  );
}
