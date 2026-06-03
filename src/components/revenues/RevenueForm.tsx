"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Vessel = { id: string; name: string };
type Account = { id: string; code: string; name: string; category: string };
type Voyage = { id: string; vesselId: string; voyageNumber: string };

const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

export function RevenueForm({ vessels, accounts, voyages }: { vessels: Vessel[]; accounts: Account[]; voyages: Voyage[] }) {
  const router = useRouter();
  const revenueAccounts = accounts.filter((a) => a.category === "REVENUE" || a.category === "OTHER");
  const [vesselId, setVesselId] = useState(vessels[0]?.id ?? "");
  const [accountId, setAccountId] = useState(revenueAccounts[0]?.id ?? accounts[0]?.id ?? "");
  const [voyageId, setVoyageId] = useState("");
  const [source, setSource] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [recognitionDate, setRecognitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voyagesForVessel = voyages.filter((v) => v.vesselId === vesselId);
  const accountChoices = revenueAccounts.length > 0 ? revenueAccounts : accounts;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/revenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselId,
          accountId,
          voyageId: voyageId || null,
          source,
          amountUsd: Number(amountUsd),
          recognitionDate,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save revenue");
      }
      router.push("/revenues");
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
        <select className={inputClass} value={vesselId} onChange={(e) => { setVesselId(e.target.value); setVoyageId(""); }} required>
          {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Account
        <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          {accountChoices.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
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
        Source
        <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} required maxLength={200} placeholder="e.g. Freight — Cargill" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Amount (USD)
        <input className={inputClass} type="number" step="0.01" min="0.01" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Recognition date
        <input className={inputClass} type="date" value={recognitionDate} onChange={(e) => setRecognitionDate(e.target.value)} required />
      </label>

      <label className="md:col-span-2 flex flex-col gap-1 text-xs text-ink-600">
        Description (optional)
        <textarea className={inputClass + " min-h-[72px]"} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save revenue"}</Button>
      </div>
    </form>
  );
}
