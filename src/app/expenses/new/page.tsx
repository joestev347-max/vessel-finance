import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const [vessels, accounts, voyages] = await Promise.all([
    prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ select: { id: true, code: true, name: true, category: true }, orderBy: { code: "asc" } }),
    prisma.voyage.findMany({ select: { id: true, vesselId: true, voyageNumber: true }, orderBy: { startDate: "desc" } }),
  ]);
  return (
    <>
      <Header title="New expense" subtitle="Record an expense against a vessel" />
      <div className="p-8">
        <Card title="Expense details">
          <ExpenseForm vessels={vessels} accounts={accounts} voyages={voyages} />
        </Card>
      </div>
    </>
  );
}
