"use client";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { monthLabel } from "@/lib/utils";

type History = { year: number; month: number; amountCents: number };
type Forecast = { year: number; month: number; projectedCents: number; lowerCents: number; upperCents: number };

export function ForecastChart({ history, forecast }: { history: History[]; forecast: Forecast[] }) {
  // Trim history to trailing 18 months for readability
  const sortedHistory = [...history].sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
  const recent = sortedHistory.slice(-18);

  const data = [
    ...recent.map((h) => ({
      label: monthLabel(h.year, h.month),
      Actual: h.amountCents / 100,
    })),
    ...forecast.map((f) => ({
      label: monthLabel(f.year, f.month),
      Forecast: f.projectedCents / 100,
      band: [f.lowerCents / 100, f.upperCents / 100],
    })),
  ];

  const cutoffLabel = recent.length > 0
    ? monthLabel(recent[recent.length - 1].year, recent[recent.length - 1].month)
    : null;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ee" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6f7d92" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6f7d92" }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {cutoffLabel && <ReferenceLine x={cutoffLabel} stroke="#9ba6b7" strokeDasharray="4 4" label={{ value: "today", fontSize: 10, fill: "#6f7d92" }} />}
          <Area type="monotone" dataKey="band" stroke="none" fill="#398df2" fillOpacity={0.15} name="Confidence band" />
          <Line type="monotone" dataKey="Actual"   stroke="#1f2735" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="Forecast" stroke="#398df2" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
