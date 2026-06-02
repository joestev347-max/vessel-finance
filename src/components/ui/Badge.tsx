import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

const TONE: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  good:    "bg-good-500/10 text-good-600",
  warn:    "bg-warn-500/10 text-warn-600",
  bad:     "bg-bad-500/10 text-bad-600",
  accent:  "bg-accent-500/10 text-accent-700",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TONE[tone], className)}>
      {children}
    </span>
  );
}
