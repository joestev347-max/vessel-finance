"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Vessel = { id: string; name: string };
type Account = { id: string; code: string; name: string; category: string };
type Voyage = { id: string; vesselId: string; voyageNumber: string };

export function ExpenseForm({
  vessels,
  accounts,
  voyages,
}: {
  vessels: Vessel[];
  accounts: Account[];
  voyages: Voyage[];
}) {
  const router = useRouter();
  const [vesselId, setVesselId] = useState(vessels[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accounts.find((a) => a.category === "OPEX")?.id ?? accounts[0]?.id ?? "");
  const [voyageId, setVoyageId] = useState<string>("");
  const [vendor, setVendor] = useState("");
  const [amountUsd, setAmountUsd] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "PAID" | "REJECTED">("PENDING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voyagesForVessel = voyages.filter((v) => v.vesselId === vesselId);
  const opexAndCapex = accounts.filter((a) => a.category === "OPEX" || a.category === "CAPEX" || a.category === "OTHER");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselId,
          accountId,
          voyageId: voyageId || null,
          vendor,
          amountUsd: Number(amountUsd),
          expenseDate,
          description,
          status,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save expense");
      }
      router.push("/expenses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Vessel
        <select className={inputClass} value={vesselId} onChange={(e) => { setVesselId(e.target.value); setVoyageId(""); }} required>
          {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Account
        <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          {opexAndCapex.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Voyage (optional)
        <select className={inputClass} value={voyageId} onChange={(e) => setVoyageId(e.target.value)}>
          <option value="">— None —</option>
          {voyagesForVessel.map((v) => <option key={v.id} value={v.id}>{v.voyageNumber}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Vendor
        <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} required maxLength={200} />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Amount (USD)
        <input className={inputClass} type="number" step="0.01" min="0.01" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Expense date
        <input className={inputClass} type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
      </label>

      <label className="md:col-span-2 flex flex-col gap-1 text-xs text-ink-600">
        Description
        <textarea className={inputClass + " min-h-[72px]"} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={500} />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Status
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "PENDING" | "APPROVED" | "PAID" | "REJECTED")}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save expense"}</Button>
      </div>
    </form>
  );
}
