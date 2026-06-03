import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewBudgetPage() {
  const [vessels, accounts] = await Promise.all([
    prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ select: { id: true, code: true, name: true, category: true }, orderBy: { code: "asc" } }),
  ]);
  const missing: string[] = [];
  if (vessels.length === 0) missing.push("a vessel");
  if (accounts.length === 0) missing.push("an account");

  return (
    <>
      <Header title="New budget line" subtitle="Set a budgeted amount for a vessel, account, and month" />
      <div className="p-8">
        <Card title="Budget details">
          {missing.length > 0 ? (
            <p className="text-sm text-ink-500">
              You need {missing.join(" and ")} first.{" "}
              {vessels.length === 0 && <Link href="/vessels/new" className="text-accent-700 hover:underline">Add a vessel</Link>}
              {missing.length === 2 && " · "}
              {accounts.length === 0 && <Link href="/accounts/new" className="text-accent-700 hover:underline">Add an account</Link>}
              {" "}before creating budget lines.
            </p>
          ) : (
            <BudgetForm vessels={vessels} accounts={accounts} />
          )}
        </Card>
      </div>
    </>
  );
}
