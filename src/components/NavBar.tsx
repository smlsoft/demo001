"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { t } from "@/lib/i18n";

interface Props {
  user: { id: string; name: string; occupation: string; avatar: string };
}

export function NavBar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle, dialect, setDialect } = useTheme();

  const dialects = [
    { key: "central" as const, label: "กลาง", flag: "🇹🇭" },
    { key: "isan" as const, label: "อีสาน", flag: "🏮" },
    { key: "northern" as const, label: "เหนือ", flag: "🏔️" },
    { key: "southern" as const, label: "ใต้", flag: "🌊" },
  ];

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  const tabs = [
    { href: "/dashboard", label: t("หน้าหลัก", dialect), icon: "🏠" },
    { href: "/dashboard/transactions", label: t("บันทึก", dialect), icon: "📝" },
    { href: "/dashboard/report", label: t("รายงาน", dialect), icon: "📊" },
    { href: "/dashboard/ai-chat", label: t("ถาม AI", dialect), icon: "🤖" },
    { href: "/dashboard/files", label: t("เอกสาร", dialect), icon: "📁" },
  ];

  const moreTabs = [
    { href: "/dashboard/savings", label: t("เป้าออม", dialect), icon: "🎯" },
    { href: "/dashboard/budget", label: t("งบประมาณ", dialect), icon: "💰" },
    { href: "/dashboard/calendar", label: t("ปฏิทิน", dialect), icon: "📅" },
    { href: "/dashboard/reminders", label: t("แจ้งเตือน", dialect), icon: "🔔" },
    { href: "/dashboard/debts", label: t("หนี้สิน", dialect), icon: "📋" },
    { href: "/dashboard/groups", label: t("กลุ่มออม", dialect), icon: "👥" },
    { href: "/dashboard/achievements", label: t("รางวัล", dialect), icon: "🏅" },
    { href: "/dashboard/slips", label: "Slip", icon: "🧾" },
    { href: "/dashboard/docs-income", label: "เอกสารเงินเข้า", icon: "📥" },
    { href: "/dashboard/docs-expense", label: "เอกสารเงินออก", icon: "📤" },
    { href: "/dashboard/forecast", label: t("พยากรณ์", dialect), icon: "🔮" },
    { href: "/dashboard/telegram", label: t("Telegram", dialect), icon: "📱" },
  ];

  const [showMore, setShowMore] = useState(false);

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

          <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="px-4 py-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>{t("เครื่องมือเพิ่มเติม", dialect)}</div>
            {moreTabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: active ? "var(--accent-light)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-sub)",
                  }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ปุ่มล่าง */}
        <div className="p-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
          >
            <span className="text-xl">{theme === "light" ? "🌙" : "☀️"}</span>
            <span className="font-medium">{theme === "light" ? t("โหมดมืด", dialect) : t("โหมดสว่าง", dialect)}</span>
          </button>
          {/* เลือกภาษาถิ่น */}
          <div className="flex gap-1 px-2">
            {dialects.map((d) => (
              <button key={d.key} onClick={() => setDialect(d.key)}
                className="flex-1 py-2 rounded-lg text-center text-xs font-medium transition-colors"
                style={{
                  background: dialect === d.key ? "var(--accent)" : "var(--bg-input)",
                  color: dialect === d.key ? "white" : "var(--text-muted)",
                }}>
                {d.flag} {d.label}
              </button>
            ))}
          </div>
          <Link href="/landing"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
          >
            <span className="text-xl">🏠</span>
            <span className="font-medium">{t("หน้าแรก", dialect)}</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--expense)" }}
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">{t("ออกจากระบบ", dialect)}</span>
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
              {t("ออก", dialect)}
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
          {/* ปุ่ม "เพิ่มเติม" */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex-1 flex flex-col items-center py-2 transition-colors"
            style={{ color: showMore ? "var(--accent)" : "var(--text-muted)" }}
          >
            <span className="text-2xl">⋯</span>
            <span className="text-[11px] mt-0.5 font-medium">{t("เพิ่มเติม", dialect)}</span>
          </button>
        </div>
      </nav>

      {/* ===== Mobile "More" Drawer ===== */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl p-4 safe-bottom"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-3">
              {moreTabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center py-3 rounded-xl transition-colors"
                    style={{
                      background: active ? "var(--accent-light)" : "var(--bg-input)",
                      color: active ? "var(--accent)" : "var(--text-sub)",
                    }}
                  >
                    <span className="text-2xl">{tab.icon}</span>
                    <span className="text-[11px] mt-1 font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
