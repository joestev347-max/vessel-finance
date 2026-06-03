import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CATEGORY_TONE = {
  REVENUE: "good",
  OPEX: "accent",
  CAPEX: "warn",
  OTHER: "neutral",
} as const;

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
  return (
    <>
      <Header title="Accounts" subtitle={`${accounts.length} chart-of-accounts lines`}>
        <Link href="/accounts/new" className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition">
          + New account
        </Link>
      </Header>
      <div className="p-8">
        <Card title="Chart of accounts">
          {accounts.length === 0 ? (
            <p className="text-sm text-ink-500">
              No accounts yet. <Link href="/accounts/new" className="text-accent-700 hover:underline">Add your first account</Link> to start recording expenses, revenues, and budgets against it.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs">{a.code}</td>
                      <td>{a.name}</td>
                      <td><Badge tone={CATEGORY_TONE[a.category as keyof typeof CATEGORY_TONE] ?? "neutral"}>{a.category}</Badge></td>
                      <td className="text-ink-600 text-xs">{a.subcategory ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
