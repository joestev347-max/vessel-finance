"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ACCOUNT_CATEGORIES } from "@/lib/domain";

const inputClass = "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500";

export function AccountForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof ACCOUNT_CATEGORIES)[number]>("OPEX");
  const [subcategory, setSubcategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, category, subcategory: subcategory || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save account");
      }
      router.push("/accounts");
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
        Code
        <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required maxLength={40} placeholder="e.g. 5100" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Name
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} placeholder="e.g. Bunker Fuel" />
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Category
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as (typeof ACCOUNT_CATEGORIES)[number])} required>
          {ACCOUNT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-ink-600">
        Subcategory (optional)
        <input className={inputClass} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} maxLength={120} placeholder="e.g. Voyage costs" />
      </label>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
        {error && <span className="text-sm text-bad-600">{error}</span>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save account"}</Button>
      </div>
    </form>
  );
}
