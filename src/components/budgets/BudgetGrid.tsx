"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatUSDCompact } from "@/lib/money";

type Account = { id: string; code: string; name: string; category: string; subcategory: string | null };
type Budget = {
  id: string;
  vesselId: string;
  accountId: string;
  fiscalYear: number;
  fiscalMonth: number;
  amountCents: number;
  account: Account;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cellId(b: Budget) { return b.id; }

function BudgetCell({ budget, dragging }: { budget: Budget; dragging: boolean }) {
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({ id: `drag-${budget.id}` });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${budget.id}` });
  // Merge two refs
  const ref = (node: HTMLElement | null) => { setDragRef(node); setDropRef(node); };
  return (
    <td
      ref={ref}
      {...attributes}
      {...listeners}
      className={cn(
        "px-2 py-1.5 text-right tabular-nums select-none cursor-grab transition border border-transparent",
        isDragging && "opacity-40",
        isOver && !isDragging && "bg-accent-100 border-accent-300 ring-1 ring-accent-400",
        !isDragging && !isOver && "hover:bg-ink-50",
        dragging && !isDragging && !isOver && "outline-dashed outline-1 outline-ink-200",
      )}
      title={`${budget.account.name} · ${MONTHS[budget.fiscalMonth - 1]} ${budget.fiscalYear}`}
    >
      {formatUSDCompact(budget.amountCents)}
    </td>
  );
}

export function BudgetGrid({
  budgets,
  vesselName,
  year,
}: {
  budgets: Budget[];
  vesselName: string;
  year: number;
}) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [pendingDrag, setPendingDrag] = useState(false);
  const [transferModal, setTransferModal] = useState<{ from: Budget; to: Budget } | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group budgets by account, then by month
  const { rows, byId } = useMemo(() => {
    const map = new Map<string, { account: Account; cells: (Budget | null)[] }>();
    for (const b of budgets) {
      if (!map.has(b.accountId)) {
        map.set(b.accountId, { account: b.account, cells: Array(12).fill(null) });
      }
      map.get(b.accountId)!.cells[b.fiscalMonth - 1] = b;
    }
    const sorted = [...map.values()].sort((a, b) => {
      const order = (c: string) => c === "REVENUE" ? 0 : c === "OPEX" ? 1 : 2;
      return order(a.account.category) - order(b.account.category) || a.account.code.localeCompare(b.account.code);
    });
    const byId = new Map<string, Budget>();
    for (const b of budgets) byId.set(b.id, b);
    return { rows: sorted, byId };
  }, [budgets]);

  function onDragEnd(e: DragEndEvent) {
    setPendingDrag(false);
    if (!e.over) return;
    const fromId = String(e.active.id).replace(/^drag-/, "");
    const toId = String(e.over.id).replace(/^drop-/, "");
    if (fromId === toId) return;
    const from = byId.get(fromId);
    const to = byId.get(toId);
    if (!from || !to) return;
    setTransferModal({ from, to });
    setTransferAmount("");
    setTransferReason("");
    setError(null);
  }

  async function submitTransfer() {
    if (!transferModal) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBudgetId: transferModal.from.id,
          toBudgetId: transferModal.to.id,
          amountUsd: Number(transferAmount),
          reason: transferReason,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Transfer failed");
      }
      setTransferModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={() => setPendingDrag(true)}
        onDragCancel={() => setPendingDrag(false)}
        onDragEnd={onDragEnd}
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="min-w-[200px]">Account</th>
                <th>Category</th>
                {MONTHS.map((m) => <th key={m} className="num">{m}</th>)}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = row.cells.reduce((s, c) => s + (c?.amountCents ?? 0), 0);
                return (
                  <tr key={row.account.id}>
                    <td className="font-medium">
                      <span className="font-mono text-xs text-ink-500">{row.account.code}</span> {row.account.name}
                    </td>
                    <td><Badge tone={row.account.category === "REVENUE" ? "accent" : "neutral"}>{row.account.category}</Badge></td>
                    {row.cells.map((c, i) =>
                      c ? <BudgetCell key={i} budget={c} dragging={pendingDrag} /> : <td key={i} className="text-ink-300 text-right">—</td>
                    )}
                    <td className="num font-semibold">{formatUSDCompact(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DndContext>

      <p className="mt-4 text-xs text-ink-500">
        Tip: drag any cell onto another cell on the same vessel to initiate a budget transfer.
        Showing {vesselName} — {year}.
      </p>

      {transferModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4" onClick={() => !submitting && setTransferModal(null)}>
          <div className="bg-white rounded-lg shadow-xl border border-ink-200 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink-900">Transfer budget</h3>
            <p className="text-sm text-ink-600 mt-2">
              From <span className="font-medium">{transferModal.from.account.name}</span>
              {" "}({MONTHS[transferModal.from.fiscalMonth - 1]} {transferModal.from.fiscalYear})
              {" "}<span className="text-ink-500">— available {formatUSDCompact(transferModal.from.amountCents)}</span>
            </p>
            <p className="text-sm text-ink-600">
              To <span className="font-medium">{transferModal.to.account.name}</span>
              {" "}({MONTHS[transferModal.to.fiscalMonth - 1]} {transferModal.to.fiscalYear})
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-xs text-ink-600">
                Amount (USD)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="rounded-md border border-ink-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-600">
                Reason
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="rounded-md border border-ink-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g. Higher bunker prices in Q2"
                />
              </label>
              {error && <p className="text-sm text-bad-600">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTransferModal(null)} disabled={submitting}>Cancel</Button>
              <Button onClick={submitTransfer} disabled={submitting || !transferAmount || !transferReason}>
                {submitting ? "Transferring…" : "Confirm transfer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
