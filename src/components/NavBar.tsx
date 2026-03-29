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
      {/* แถบบน */}
      <header className="sticky top-0 z-50" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
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

      {/* แถบเมนูล่าง */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={{ background: "var(--bg-card)", borderTop: "2px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex">
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
