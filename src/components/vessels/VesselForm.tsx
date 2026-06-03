"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VESSEL_TYPES, VESSEL_STATUSES } from "@/lib/domain";

const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

export function VesselForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [imoNumber, setImoNumber] = useState("");
  const [type, setType] = useState<(typeof VESSEL_TYPES)[number]>("TANKER");
  const [flag, setFlag] = useState("");
  const [owner, setOwner] = useState("");
  const [dwt, setDwt] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [status, setStatus] = useState<(typeof VESSEL_STATUSES)[number]>("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/vessels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imoNumber,
          type,
          flag,
          owner,
          dwt: Number(dwt),
          yearBuilt: Number(yearBuilt),
          status,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save vessel");
      }
      router.push("/vessels");
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
        Name
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} placeholder="e.g. MV Northern Star" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        IMO number
        <input className={inputClass} value={imoNumber} onChange={(e) => setImoNumber(e.target.value)} required maxLength={40} placeholder="e.g. 9321483" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Type
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as (typeof VESSEL_TYPES)[number])} required>
          {VESSEL_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Flag
        <input className={inputClass} value={flag} onChange={(e) => setFlag(e.target.value)} required maxLength={80} placeholder="e.g. Panama" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Owner
        <input className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} required maxLength={200} placeholder="e.g. Northern Shipping Co." />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Deadweight tonnage (DWT)
        <input className={inputClass} type="number" min="0" step="1" value={dwt} onChange={(e) => setDwt(e.target.value)} required placeholder="e.g. 75000" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Year built
        <input className={inputClass} type="number" min="1900" step="1" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} required placeholder="e.g. 2014" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Status
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as (typeof VESSEL_STATUSES)[number])}>
          {VESSEL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save vessel"}</Button>
      </div>
    </form>
  );
}
