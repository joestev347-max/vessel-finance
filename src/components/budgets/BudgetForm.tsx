"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Vessel = { id: string; name: string };
type Account = { id: string; code: string; name: string; category: string };

const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BudgetForm({ vessels, accounts }: { vessels: Vessel[]; accounts: Account[] }) {
  const router = useRouter();
  const thisYear = new Date().getUTCFullYear();
  const [vesselId, setVesselId] = useState(vessels[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [fiscalYear, setFiscalYear] = useState(String(thisYear));
  const [fiscalMonth, setFiscalMonth] = useState("1");
  const [amountUsd, setAmountUsd] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselId,
          accountId,
          fiscalYear: Number(fiscalYear),
          fiscalMonth: Number(fiscalMonth),
          amountUsd: Number(amountUsd),
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save budget");
      }
      router.push(`/budgets?vesselId=${vesselId}&year=${fiscalYear}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Vessel
        <select className={inputClass} value={vesselId} onChange={(e) => setVesselId(e.target.value)} required>
          {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Account
        <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Fiscal year
        <input className={inputClass} type="number" min="2000" step="1" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Fiscal month
        <select className={inputClass} value={fiscalMonth} onChange={(e) => setFiscalMonth(e.target.value)} required>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Budgeted amount (USD)
        <input className={inputClass} type="number" step="0.01" min="0" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} required />
      </label>

      <label className="md:col-span-2 flex flex-col gap-1 text-xs text-ink-600">
        Notes (optional)
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save budget line"}</Button>
      </div>
    </form>
  );
}
