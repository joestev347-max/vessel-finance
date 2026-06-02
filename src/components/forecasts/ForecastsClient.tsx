"use client";
import { useEffect, useState } from "react";
import { ForecastChart } from "./ForecastChart";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatUSDCompact } from "@/lib/money";
import { monthLabel } from "@/lib/utils";

type Vessel = { id: string; name: string };

interface ForecastResponse {
  method: string;
  horizonMonths: number;
  baseline: { meanCents: number; stdDevCents: number; pointsUsed: number };
  forecast: { year: number; month: number; projectedCents: number; lowerCents: number; upperCents: number }[];
  series: string;
  history: { year: number; month: number; amountCents: number }[];
}

export function ForecastsClient({ vessels }: { vessels: Vessel[] }) {
  const [vesselId, setVesselId] = useState<string>("");
  const [series, setSeries] = useState<"revenue" | "opex" | "net">("revenue");
  const [method, setMethod] = useState<"historical-average" | "linear-trend" | "seasonal">("seasonal");
  const [horizon, setHorizon] = useState(12);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (vesselId) params.set("vesselId", vesselId);
    params.set("series", series);
    params.set("method", method);
    params.set("horizon", String(horizon));
    setLoading(true);
    setError(null);
    fetch(`/api/forecasts?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load forecast");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [vesselId, series, method, horizon]);

  const selectClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <Card title="Forecast inputs">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col text-xs text-ink-600 gap-1">
            Vessel
            <select className={selectClass} value={vesselId} onChange={(e) => setVesselId(e.target.value)}>
              <option value="">All vessels (fleet-wide)</option>
              {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-xs text-ink-600 gap-1">
            Series
            <select className={selectClass} value={series} onChange={(e) => setSeries(e.target.value as "revenue" | "opex" | "net")}>
              <option value="revenue">Revenue</option>
              <option value="opex">OPEX</option>
              <option value="net">Net (Revenue − OPEX)</option>
            </select>
          </label>
          <label className="flex flex-col text-xs text-ink-600 gap-1">
            Method
            <select className={selectClass} value={method} onChange={(e) => setMethod(e.target.value as "historical-average" | "linear-trend" | "seasonal")}>
              <option value="historical-average">Historical average</option>
              <option value="linear-trend">Linear trend</option>
              <option value="seasonal">Seasonal (recommended)</option>
            </select>
          </label>
          <label className="flex flex-col text-xs text-ink-600 gap-1">
            Horizon
            <select className={selectClass} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
              {[3, 6, 12, 18, 24].map((n) => <option key={n} value={n}>{n} months</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Forecast" subtitle={data ? `${data.method.replace(/-/g, " ")} · using ${data.baseline.pointsUsed} months of history · 90% confidence band` : "Loading…"}>
        {error && <p className="text-sm text-bad-600 mb-3">{error}</p>}
        {loading && !data && <p className="text-sm text-ink-500">Loading forecast…</p>}
        {data && <ForecastChart history={data.history} forecast={data.forecast} />}
      </Card>

      {data && (
        <Card title="Monthly projection table" subtitle={`Next ${data.forecast.length} months`}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Projected</th>
                  <th className="num">Lower bound</th>
                  <th className="num">Upper bound</th>
                  <th className="num">Spread</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f) => {
                  const spread = f.upperCents - f.lowerCents;
                  return (
                    <tr key={`${f.year}-${f.month}`}>
                      <td>{monthLabel(f.year, f.month)}</td>
                      <td className="num font-medium">{formatUSDCompact(f.projectedCents)}</td>
                      <td className="num text-ink-600">{formatUSDCompact(f.lowerCents)}</td>
                      <td className="num text-ink-600">{formatUSDCompact(f.upperCents)}</td>
                      <td className="num"><Badge tone="neutral">±{formatUSDCompact(spread / 2)}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
