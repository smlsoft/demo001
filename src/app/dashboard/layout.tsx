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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <NavBar user={user} />
      <main className="max-w-lg mx-auto px-4 pt-4 pb-28">{children}</main>
    </div>
  );
}
