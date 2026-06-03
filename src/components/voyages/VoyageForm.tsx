"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VOYAGE_STATUSES } from "@/lib/domain";

type Vessel = { id: string; name: string };

const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

export function VoyageForm({ vessels, defaultVesselId }: { vessels: Vessel[]; defaultVesselId?: string }) {
  const router = useRouter();
  const [vesselId, setVesselId] = useState(defaultVesselId ?? vessels[0]?.id ?? "");
  const [voyageNumber, setVoyageNumber] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<(typeof VOYAGE_STATUSES)[number]>("PLANNED");
  const [charterer, setCharterer] = useState("");
  const [distanceNm, setDistanceNm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/voyages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselId,
          voyageNumber,
          origin,
          destination,
          startDate,
          endDate: endDate || null,
          status,
          charterer: charterer || null,
          distanceNm: distanceNm ? Number(distanceNm) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save voyage");
      }
      router.push("/voyages");
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
        Voyage number
        <input className={inputClass} value={voyageNumber} onChange={(e) => setVoyageNumber(e.target.value)} required maxLength={60} placeholder="e.g. V-2026-014" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Origin
        <input className={inputClass} value={origin} onChange={(e) => setOrigin(e.target.value)} required maxLength={120} placeholder="e.g. Rotterdam" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Destination
        <input className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={120} placeholder="e.g. Singapore" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Start date
        <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        End date (optional)
        <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Status
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as (typeof VOYAGE_STATUSES)[number])}>
          {VOYAGE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Charterer (optional)
        <input className={inputClass} value={charterer} onChange={(e) => setCharterer(e.target.value)} maxLength={200} placeholder="e.g. Cargill" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Distance (nautical miles, optional)
        <input className={inputClass} type="number" min="0" step="1" value={distanceNm} onChange={(e) => setDistanceNm(e.target.value)} placeholder="e.g. 8400" />
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save voyage"}</Button>
      </div>
    </form>
  );
}
