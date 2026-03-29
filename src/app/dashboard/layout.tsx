import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { DEMO_USERS } from "@/lib/demo-users";
import { NavBar } from "@/components/NavBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen dashboard-layout" style={{ background: "var(--bg)" }}>
      <NavBar user={user} />
      {/* Desktop: offset by sidebar width */}
      <div className="dashboard-main lg:ml-[var(--sidebar-w)]">
        <main className="max-w-lg sm:max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-28 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
