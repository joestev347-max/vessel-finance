"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Module-level ring buffer of recent client errors, populated by global listeners.
const recentErrors: string[] = [];
function pushError(msg: string) {
  recentErrors.push(`${new Date().toISOString()} ${msg}`);
  while (recentErrors.length > 20) recentErrors.shift();
}

export function BugReporter() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const installed = useRef(false);

  useEffect(() => {
    if (installed.current) return;
    installed.current = true;
    const onErr = (e: ErrorEvent) => pushError(`error: ${e.message} @ ${e.filename}:${e.lineno}`);
    const onRej = (e: PromiseRejectionEvent) => pushError(`unhandledrejection: ${String(e.reason)}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const contextBundle = {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        userAgent: navigator.userAgent,
        recentErrors: [...recentErrors],
        capturedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, pageRoute: pathname, contextBundle }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Failed to submit");
      if (body.diagnosed) setResult("Submitted and diagnosed. See the Bug Reports page.");
      else if (body.note) setResult(body.note);
      else setResult("Submitted. See the Bug Reports page.");
      setDescription("");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Report a bug"
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-ink-900 text-white shadow-lg hover:bg-ink-800 flex items-center justify-center text-lg"
      >
        🐞
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 rounded-lg border border-ink-200 bg-white shadow-xl p-4">
          <div className="text-sm font-semibold text-ink-800 mb-1">Report a bug</div>
          <p className="text-xs text-ink-500 mb-3">
            Captures this page, your viewport, and recent JS errors. Claude diagnoses it automatically.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={4000}
              placeholder="What went wrong? What did you expect?"
              className="w-full min-h-[90px] rounded-md border border-ink-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-ink-400 font-mono truncate">{pathname}</span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Submit"}
              </button>
            </div>
            {result && <p className="text-xs text-ink-600">{result}</p>}
          </form>
        </div>
      )}
    </>
  );
}
