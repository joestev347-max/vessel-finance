"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const PALETTE = ["#398df2", "#10b981", "#f59e0b", "#ef4444", "#6f7d92", "#9ba6b7", "#5fadf7"];

export function OpexBreakdownChart({ data }: { data: { subcategory: string; amountCents: number }[] }) {
  const total = data.reduce((s, d) => s + d.amountCents, 0) || 1;
  const formatted = data.map((d) => ({
    name: d.subcategory,
    value: d.amountCents / 100,
    pct: (d.amountCents / total) * 100,
  }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={formatted} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {formatted.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
