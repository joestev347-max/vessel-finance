import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export function KpiTile({
  label,
  value,
  delta,
  deltaTone,
  hint,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "neutral";
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-white shadow-card border border-ink-100 p-5", className)}>
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-2xl font-semibold text-ink-900 tabular-nums">{value}</div>
        {delta && <Badge tone={deltaTone ?? "neutral"}>{delta}</Badge>}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}
