import { formatUSDCompact } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

type Row = {
  accountId: string;
  accountName: string;
  category: string;
  budgetedCents: number;
  actualCents: number;
  varianceCents: number;
  variancePct: number;
};

export function BudgetVarianceTable({ rows }: { rows: Row[] }) {
  const sorted = [...rows].sort((a, b) => Math.abs(b.varianceCents) - Math.abs(a.varianceCents));
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Category</th>
            <th className="num">Budgeted</th>
            <th className="num">Actual</th>
            <th className="num">Variance</th>
            <th className="num">%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            // For OPEX, over-budget (positive variance) is bad. For REVENUE, under-budget (negative) is bad.
            const isExpense = r.category === "OPEX" || r.category === "CAPEX" || r.category === "OTHER";
            const isBad = isExpense ? r.varianceCents > 0 : r.varianceCents < 0;
            const tone = Math.abs(r.variancePct) < 5 ? "neutral" : isBad ? "bad" : "good";
            return (
              <tr key={r.accountId}>
                <td className="font-medium">{r.accountName}</td>
                <td><Badge tone="neutral">{r.category}</Badge></td>
                <td className="num">{formatUSDCompact(r.budgetedCents)}</td>
                <td className="num">{formatUSDCompact(r.actualCents)}</td>
                <td className={"num " + (isBad ? "text-bad-600" : r.varianceCents !== 0 ? "text-good-600" : "")}>
                  {r.varianceCents >= 0 ? "+" : ""}{formatUSDCompact(r.varianceCents)}
                </td>
                <td className="num"><Badge tone={tone}>{r.variancePct >= 0 ? "+" : ""}{r.variancePct.toFixed(1)}%</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
