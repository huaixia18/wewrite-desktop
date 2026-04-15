import { auth } from "@/auth";
import { PricingPageClient } from "./PricingPageClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";

export default async function PricingPage() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <>
      <Sidebar />
      <main className="min-h-screen bg-[#f3f6fb] pl-[280px]">
        <WorkspaceTopbar />
        <PricingPageClient userId={userId} />
      </main>
    </>
  );
}
