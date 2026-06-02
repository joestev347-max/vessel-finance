import { Header } from "@/components/layout/Header";
import { ForecastsClient } from "@/components/forecasts/ForecastsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ForecastsPage() {
  const vessels = await prisma.vessel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <>
      <Header title="Forecasts" subtitle="Project revenue, expenses, and net income forward" />
      <div className="p-8">
        <ForecastsClient vessels={vessels} />
      </div>
    </>
  );
}
