import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { RevenueForm } from "@/components/revenues/RevenueForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewRevenuePage() {
  const [vessels, accounts, voyages] = await Promise.all([
    prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ select: { id: true, code: true, name: true, category: true }, orderBy: { code: "asc" } }),
    prisma.voyage.findMany({ select: { id: true, vesselId: true, voyageNumber: true }, orderBy: { startDate: "desc" } }),
  ]);
  const missing: string[] = [];
  if (vessels.length === 0) missing.push("a vessel");
  if (accounts.length === 0) missing.push("an account");

  return (
    <>
      <Header title="New revenue" subtitle="Record revenue recognized against a vessel" />
      <div className="p-8">
        <Card title="Revenue details">
          {missing.length > 0 ? (
            <p className="text-sm text-ink-500">
              You need {missing.join(" and ")} first.{" "}
              {vessels.length === 0 && <Link href="/vessels/new" className="text-accent-700 hover:underline">Add a vessel</Link>}
              {missing.length === 2 && " · "}
              {accounts.length === 0 && <Link href="/accounts/new" className="text-accent-700 hover:underline">Add an account</Link>}
              {" "}before recording revenue.
            </p>
          ) : (
            <RevenueForm vessels={vessels} accounts={accounts} voyages={voyages} />
          )}
        </Card>
      </div>
    </>
  );
}
