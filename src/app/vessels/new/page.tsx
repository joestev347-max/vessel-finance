import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { VesselForm } from "@/components/vessels/VesselForm";

export const dynamic = "force-dynamic";

export default function NewVesselPage() {
  return (
    <>
      <Header title="New vessel" subtitle="Add a vessel to the fleet" />
      <div className="p-8">
        <Card title="Vessel details">
          <VesselForm />
        </Card>
      </div>
    </>
  );
}
