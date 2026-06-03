"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",          label: "Dashboard",      icon: "▣" },
  { href: "/vessels",   label: "Vessels",        icon: "⚓" },
  { href: "/voyages",   label: "Voyages",        icon: "≈" },
  { href: "/accounts",  label: "Accounts",       icon: "▦" },
  { href: "/expenses",  label: "Expenses",       icon: "$" },
  { href: "/revenues",  label: "Revenues",       icon: "+" },
  { href: "/budgets",   label: "Budgets",        icon: "▤" },
  { href: "/forecasts", label: "Forecasts",      icon: "↗" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-ink-900 text-ink-100 flex flex-col">
      <div className="px-5 py-5 border-b border-ink-800">
        <div className="text-lg font-semibold leading-tight">Vessel Finance</div>
        <div className="text-xs text-ink-300">Fleet financial control</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-accent-600 text-white"
                  : "text-ink-200 hover:bg-ink-800 hover:text-white",
              )}
            >
              <span className="text-base w-5 text-center opacity-90">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-ink-800 text-xs text-ink-400">
        Prototype build · v0.1
      </div>
    </aside>
  );
}
