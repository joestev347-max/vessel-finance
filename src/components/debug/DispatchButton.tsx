"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DispatchButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function dispatch() {
    if (!confirm("Dispatch the self-heal repair agent for this bug? It will open a PR for review — nothing merges automatically.")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/bug-reports/${id}/dispatch`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Dispatch failed");
      setMsg("Dispatched. The Actions workflow is running; it will open a PR.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={dispatch}
        disabled={busy || disabled}
        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium bg-ink-700 text-white hover:bg-ink-800 disabled:opacity-50"
      >
        {busy ? "Dispatching…" : "Dispatch self-heal"}
      </button>
      {msg && <span className="text-[11px] text-ink-500 max-w-[220px] text-right">{msg}</span>}
    </div>
  );
}
