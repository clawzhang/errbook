import { auth } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="page-shell">
      <div className="relative flex min-h-screen">
        <Sidebar user={session.user} />
        <div className="flex min-w-0 flex-1 flex-col px-3 pb-5 pt-4 md:px-4 lg:px-5">
          <MobileNav user={session.user} />
          <main className="relative z-10 flex-1 pt-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
