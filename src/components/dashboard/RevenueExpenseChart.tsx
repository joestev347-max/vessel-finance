"use client";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { monthLabel } from "@/lib/utils";

type Row = { year: number; month: number; revenueCents: number; opexCents: number; capexCents: number; netProfitCents: number };

export function RevenueExpenseChart({ data }: { data: Row[] }) {
  const formatted = data.map((d) => ({
    label: monthLabel(d.year, d.month),
    Revenue: d.revenueCents / 100,
    OPEX:    d.opexCents    / 100,
    CAPEX:   d.capexCents   / 100,
    Net:     d.netProfitCents / 100,
  }));
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formatted} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ee" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6f7d92" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6f7d92" }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Revenue" fill="#398df2" radius={[2, 2, 0, 0]} />
          <Bar dataKey="OPEX"    fill="#f59e0b" radius={[2, 2, 0, 0]} />
          <Bar dataKey="CAPEX"   fill="#9ba6b7" radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="Net" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
