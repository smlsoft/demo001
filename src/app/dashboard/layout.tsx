import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { DEMO_USERS } from "@/lib/demo-users";
import { NavBar } from "@/components/NavBar";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  // ลองหาจาก demo users ก่อน ถ้าไม่เจอดูจาก DB (Google user)
  let user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) {
    await connectDb();
    const dbUser = await User.findOne({ demoId: userId }).lean() as any;
    if (!dbUser) redirect("/login");
    user = { id: dbUser.demoId, name: dbUser.name, occupation: dbUser.occupation || "ผู้ใช้ Google", avatar: dbUser.avatar || "👤" };
  }

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
