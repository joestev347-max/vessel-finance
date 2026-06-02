import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatUSDCompact } from "@/lib/money";

type Row = {
  vessel: { id: string; name: string; type: string; status: string; flag: string; dwt: number };
  ytd: { revenueCents: number; opexCents: number; capexCents: number; netProfitCents: number; netMarginPct: number };
};

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  ACTIVE: "good",
  IN_DRYDOCK: "warn",
  LAID_UP: "neutral",
  DECOMMISSIONED: "bad",
};

export function FleetSummaryTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Vessel</th>
            <th>Type</th>
            <th>Flag</th>
            <th>Status</th>
            <th className="num">DWT</th>
            <th className="num">YTD Revenue</th>
            <th className="num">YTD OPEX</th>
            <th className="num">YTD Net</th>
            <th className="num">Net %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.vessel.id}>
              <td>
                <Link href={`/vessels/${r.vessel.id}`} className="text-accent-700 hover:underline font-medium">
                  {r.vessel.name}
                </Link>
              </td>
              <td className="text-ink-600">{r.vessel.type.replace(/_/g, " ")}</td>
              <td className="text-ink-600">{r.vessel.flag}</td>
              <td><Badge tone={STATUS_TONE[r.vessel.status] ?? "neutral"}>{r.vessel.status.replace(/_/g, " ")}</Badge></td>
              <td className="num">{r.vessel.dwt.toLocaleString()}</td>
              <td className="num">{formatUSDCompact(r.ytd.revenueCents)}</td>
              <td className="num">{formatUSDCompact(r.ytd.opexCents)}</td>
              <td className={"num " + (r.ytd.netProfitCents >= 0 ? "text-good-600" : "text-bad-600")}>
                {formatUSDCompact(r.ytd.netProfitCents)}
              </td>
              <td className="num">{r.ytd.netMarginPct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
