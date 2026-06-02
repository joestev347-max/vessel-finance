import { Badge } from "@/components/ui/Badge";

type Voyage = {
  id: string;
  voyageNumber: string;
  origin: string;
  destination: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  charterer: string | null;
  distanceNm: number | null;
};

const STATUS_TONE = {
  PLANNED: "neutral",
  IN_PROGRESS: "accent",
  COMPLETED: "good",
  CANCELLED: "bad",
} as const;

export function VoyageList({ voyages }: { voyages: Voyage[] }) {
  if (voyages.length === 0) {
    return <p className="text-sm text-ink-500">No voyages recorded.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Voyage #</th>
            <th>Route</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Charterer</th>
            <th className="num">Distance (NM)</th>
          </tr>
        </thead>
        <tbody>
          {voyages.map((v) => (
            <tr key={v.id}>
              <td className="font-mono text-xs">{v.voyageNumber}</td>
              <td>{v.origin} → {v.destination}</td>
              <td>{new Date(v.startDate).toLocaleDateString()}</td>
              <td>{v.endDate ? new Date(v.endDate).toLocaleDateString() : "—"}</td>
              <td><Badge tone={STATUS_TONE[v.status as keyof typeof STATUS_TONE] ?? "neutral"}>{v.status.replace(/_/g, " ")}</Badge></td>
              <td className="text-ink-600">{v.charterer ?? "—"}</td>
              <td className="num">{v.distanceNm?.toLocaleString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
