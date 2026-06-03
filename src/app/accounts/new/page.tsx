import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { AccountForm } from "@/components/accounts/AccountForm";

export const dynamic = "force-dynamic";

export default function NewAccountPage() {
  return (
    <>
      <Header title="New account" subtitle="Add a chart-of-accounts line" />
      <div className="p-8">
        <Card title="Account details">
          <AccountForm />
        </Card>
      </div>
    </>
  );
}
