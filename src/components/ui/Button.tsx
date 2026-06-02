import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-accent-600 hover:bg-accent-700 text-white",
  secondary: "bg-white hover:bg-ink-50 text-ink-700 border border-ink-200",
  ghost:     "bg-transparent hover:bg-ink-100 text-ink-700",
  danger:    "bg-bad-500 hover:bg-bad-600 text-white",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1",
        VARIANTS[variant],
        className,
      )}
    />
  );
}
