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
      <main className="min-h-screen bg-[#f3f6fb] pl-[280px]">
        <WorkspaceTopbar />
        {children}
      </main>
    </>
  );
}
