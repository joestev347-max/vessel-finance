import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { VoyageForm } from "@/components/voyages/VoyageForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewVoyagePage({ searchParams }: { searchParams: { vesselId?: string } }) {
  const vessels = await prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <>
      <Header title="New voyage" subtitle="Log a voyage for a vessel" />
      <div className="p-8">
        <Card title="Voyage details">
          {vessels.length === 0 ? (
            <p className="text-sm text-ink-500">
              You need a vessel first. <Link href="/vessels/new" className="text-accent-700 hover:underline">Add a vessel</Link>, then come back to log its voyages.
            </p>
          ) : (
            <VoyageForm vessels={vessels} defaultVesselId={searchParams.vesselId} />
          )}
        </Card>
      </div>
    </>
  );
}
