import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Sidebar />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#eef4ff_0%,#f6f8fc_42%,#f8f9fa_100%)] lg:pl-[248px]">
        <WorkspaceTopbar />
        {children}
      </main>
    </>
  );
}
