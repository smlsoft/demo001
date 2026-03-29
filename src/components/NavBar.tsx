"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";

interface Props {
  user: { id: string; name: string; occupation: string; avatar: string };
}

export function NavBar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  const tabs = [
    { href: "/dashboard", label: "หน้าหลัก", icon: "🏠" },
    { href: "/dashboard/transactions", label: "บันทึก", icon: "📝" },
    { href: "/dashboard/report", label: "รายงาน", icon: "📊" },
    { href: "/dashboard/ai-chat", label: "ถาม AI", icon: "🤖" },
    { href: "/dashboard/files", label: "เอกสาร", icon: "📁" },
  ];

  return (
    <>
      {/* ===== Desktop Sidebar (lg+) ===== */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-50"
        style={{
          width: "var(--sidebar-w)",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* ข้อมูลผู้ใช้ */}
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-4xl">{user.avatar}</span>
          <div className="min-w-0">
            <div className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>{user.name}</div>
            <div className="text-sm" style={{ color: "var(--text-sub)" }}>{user.occupation}</div>
          </div>
        </div>

        {/* เมนู */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-sub)",
                }}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ปุ่มล่าง */}
        <div className="p-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
          >
            <span className="text-xl">{theme === "light" ? "🌙" : "☀️"}</span>
            <span className="font-medium">{theme === "light" ? "โหมดมืด" : "โหมดสว่าง"}</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--expense)" }}
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ===== Mobile/Tablet Header (<lg) ===== */}
      <header
        className="lg:hidden sticky top-0 z-50"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--text)" }}>{user.name}</div>
              <div className="text-sm" style={{ color: "var(--text-sub)" }}>{user.occupation}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: "var(--bg-input)" }}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: "var(--bg-input)", color: "var(--expense)" }}
            >
              ออก
            </button>
          </div>
        </div>
      </header>

      {/* ===== Mobile/Tablet Bottom Tab Bar (<lg) ===== */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{ background: "var(--bg-card)", borderTop: "2px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center py-2 transition-colors"
                style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-[11px] mt-0.5 font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
