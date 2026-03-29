"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  byCategory: Array<{ category: string; type: string; total: number; count: number }>;
  incomeByCategory: Array<{ category: string; total: number; count: number }>;
  topItems: Array<{ description: string; type: string; total: number; count: number; avg: number }>;
}

// ===== ช่วงเวลา preset =====
type Period = "month" | "3months" | "6months" | "year" | "all" | "custom";

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "month", label: "เดือนนี้" },
  { key: "3months", label: "3 เดือน" },
  { key: "6months", label: "6 เดือน" },
  { key: "year", label: "1 ปี" },
  { key: "all", label: "ทั้งหมด" },
  { key: "custom", label: "กำหนดเอง" },
];

function toBE(d: Date): string {
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getRange(period: Period): { from: string; to: string } | null {
  const now = new Date();
  const to = toBE(now);
  const start = new Date(now);
  switch (period) {
    case "month": start.setDate(1); return { from: toBE(start), to };
    case "3months": start.setMonth(start.getMonth() - 3); return { from: toBE(start), to };
    case "6months": start.setMonth(start.getMonth() - 6); return { from: toBE(start), to };
    case "year": start.setFullYear(start.getFullYear() - 1); return { from: toBE(start), to };
    case "all": return null;
    default: return null;
  }
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function fmtDateShort(d: string) {
  const p = d.split("-");
  return `${parseInt(p[2])} ${THAI_MONTHS[parseInt(p[1]) - 1]} ${p[0]}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let url = "/api/summary";
    if (period === "custom" && customFrom && customTo) {
      url += `?from=${customFrom}&to=${customTo}`;
    } else if (period !== "all") {
      const range = getRange(period);
      if (range) url += `?from=${range.from}&to=${range.to}`;
    }
    try {
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [period, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  function selectPeriod(p: Period) {
    setPeriod(p);
    if (p === "custom") {
      setShowCustom(true);
      const now = new Date();
      const start = new Date(now); start.setDate(1);
      setCustomFrom(toBE(start));
      setCustomTo(toBE(now));
    } else {
      setShowCustom(false);
    }
  }

  const s = data || { totalIncome: 0, totalExpense: 0, balance: 0, incomeCount: 0, expenseCount: 0, byCategory: [], incomeByCategory: [], topItems: [] };
  const expenses = s.byCategory.filter((c) => c.type === "expense").sort((a, b) => b.total - a.total);
  const incomes = s.incomeByCategory || [];
  const savingRate = s.totalIncome > 0 ? Math.round((s.balance / s.totalIncome) * 100) : 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ===== เลือกช่วงเวลา ===== */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => selectPeriod(p.key)}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl font-medium transition-all"
            style={period === p.key
              ? { background: "var(--accent)", color: "white" }
              : { background: "var(--bg-card)", color: "var(--text-sub)", border: "1px solid var(--border)" }
            }>
            {p.label}
          </button>
        ))}
      </div>

      {/* วันที่กำหนดเอง */}
      {showCustom && (
        <div className="card flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>จาก</label>
            <input type="text" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="2569-01-01" />
          </div>
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>ถึง</label>
            <input type="text" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="2569-03-29" />
          </div>
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: "var(--accent)" }}>ดู</button>
        </div>
      )}

      {loading ? <Skeleton /> : (
        <>
          {/* ===== สรุปยอดหลัก ===== */}
          <div className="card">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--income)" }}>รายรับ</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--income)" }}>{s.totalIncome.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{s.incomeCount} รายการ</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--expense)" }}>รายจ่าย</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--expense)" }}>{s.totalExpense.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{s.expenseCount} รายการ</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--blue)" }}>คงเหลือ</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: s.balance >= 0 ? "var(--blue)" : "var(--expense)" }}>{s.balance.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>บาท</div>
              </div>
            </div>

            {/* แถบอัตราส่วน */}
            {s.totalIncome + s.totalExpense > 0 && (
              <div>
                <div className="flex h-4 sm:h-5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                  <div className="h-full transition-all" style={{ width: `${Math.round((s.totalIncome / (s.totalIncome + s.totalExpense)) * 100)}%`, background: "var(--income)" }} />
                  <div className="h-full transition-all" style={{ width: `${Math.round((s.totalExpense / (s.totalIncome + s.totalExpense)) * 100)}%`, background: "var(--expense)" }} />
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  <span>รายรับ {s.totalIncome > 0 ? Math.round((s.totalIncome / (s.totalIncome + s.totalExpense)) * 100) : 0}%</span>
                  <span>อัตราออม {savingRate}%</span>
                  <span>รายจ่าย {s.totalExpense > 0 ? Math.round((s.totalExpense / (s.totalIncome + s.totalExpense)) * 100) : 0}%</span>
                </div>
              </div>
            )}
          </div>

          {/* ===== รายรับ + รายจ่ายแยกหมวด (side by side on lg) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* รายรับแยกหมวด */}
            {incomes.length > 0 && (
              <div className="card">
                <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📥 รายรับแยกหมวด</h2>
                <div className="space-y-2">
                  {incomes.map((cat) => {
                    const pct = s.totalIncome > 0 ? Math.round((cat.total / s.totalIncome) * 100) : 0;
                    return (
                      <div key={cat.category} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                            <span className="font-bold" style={{ color: "var(--income)" }}>{cat.total.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--income)" }} />
                          </div>
                        </div>
                        <span className="text-[10px] w-12 text-right" style={{ color: "var(--text-muted)" }}>{cat.count} ครั้ง</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* รายจ่ายแยกหมวด */}
            {expenses.length > 0 && (
              <div className="card">
                <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📤 รายจ่ายแยกหมวด</h2>
                <div className="space-y-2">
                  {expenses.map((cat) => {
                    const pct = s.totalExpense > 0 ? Math.round((cat.total / s.totalExpense) * 100) : 0;
                    return (
                      <div key={cat.category} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                            <span className="font-bold" style={{ color: "var(--expense)" }}>{cat.total.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--expense)" }} />
                          </div>
                        </div>
                        <span className="text-[10px] w-12 text-right" style={{ color: "var(--text-muted)" }}>{cat.count} ครั้ง</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== รายการยอดสูงสุด ===== */}
          {s.topItems && s.topItems.length > 0 && (
            <div className="card">
              <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>🏆 รายการยอดสูงสุด</h2>
              <div className="space-y-2">
                {s.topItems.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-center font-bold" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                    <span className={`w-5 text-center`}>{item.type === "income" ? "📥" : "📤"}</span>
                    <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{item.description}</span>
                    <span className="font-bold" style={{ color: item.type === "income" ? "var(--income)" : "var(--expense)" }}>{item.total.toLocaleString()}</span>
                    <span className="text-[10px] sm:text-xs w-16 sm:w-24 text-right" style={{ color: "var(--text-muted)" }}>{item.count} ครั้ง ~{item.avg.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ปุ่มลัด ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/transactions", icon: "📝", label: "บันทึกรายรับ-รายจ่าย" },
              { href: "/dashboard/ai-chat", icon: "🤖", label: "คุยกับน้องบัญชี" },
              { href: "/dashboard/report", icon: "📊", label: "ดูรายงาน/กราฟ" },
              { href: "/dashboard/files", icon: "📁", label: "เอกสาร/รูปภาพ" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card text-center hover:scale-[1.02] active:scale-[0.98] transition-transform">
                <span className="text-3xl lg:text-4xl block mb-1">{item.icon}</span>
                <span className="text-sm sm:text-base font-medium" style={{ color: "var(--text)" }}>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* ===== ปุ่มลัดเพิ่มเติม ===== */}
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { href: "/dashboard/savings", icon: "🎯", label: "เป้าออม" },
              { href: "/dashboard/budget", icon: "💰", label: "งบประมาณ" },
              { href: "/dashboard/calendar", icon: "📅", label: "ปฏิทิน" },
              { href: "/dashboard/reminders", icon: "🔔", label: "แจ้งเตือน" },
              { href: "/dashboard/debts", icon: "📋", label: "หนี้สิน" },
              { href: "/dashboard/groups", icon: "👥", label: "กลุ่มออม" },
              { href: "/dashboard/achievements", icon: "🏅", label: "รางวัล" },
              { href: "/dashboard/forecast", icon: "🔮", label: "พยากรณ์" },
              { href: "/dashboard/telegram", icon: "📱", label: "Telegram" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card text-center hover:scale-[1.02] active:scale-[0.98] transition-transform py-3">
                <span className="text-2xl block">{item.icon}</span>
                <span className="text-[11px] sm:text-xs font-medium" style={{ color: "var(--text-sub)" }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card h-32 sm:h-40" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-40" />
        <div className="card h-40" />
      </div>
      <div className="card h-40" />
    </div>
  );
}
