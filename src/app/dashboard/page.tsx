"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Array<{ category: string; type: string; total: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summary").then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const s = data || { totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [] };
  const expenses = s.byCategory.filter((c) => c.type === "expense").sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* สรุปยอด 3 ช่อง */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="รายรับ" amount={s.totalIncome} color="var(--income)" bg="var(--accent-light)" />
        <SummaryCard label="รายจ่าย" amount={s.totalExpense} color="var(--expense)" bg={undefined} />
        <SummaryCard label="คงเหลือ" amount={s.balance} color="var(--blue)" bg={undefined} />
      </div>

      {/* รายจ่ายตามหมวด */}
      {expenses.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text)" }}>รายจ่ายตามหมวด</h2>
          <div className="space-y-3">
            {expenses.map((cat) => {
              const pct = s.totalExpense > 0 ? Math.round((cat.total / s.totalExpense) * 100) : 0;
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                    <span className="font-bold" style={{ color: "var(--text)" }}>{cat.total.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--expense)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ปุ่มลัด */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/dashboard/transactions", icon: "📝", label: "บันทึกรายรับ-รายจ่าย" },
          { href: "/dashboard/ai-chat", icon: "🤖", label: "คุยกับน้องบัญชี" },
          { href: "/dashboard/report", icon: "📊", label: "ดูรายงาน" },
          { href: "/dashboard/files", icon: "📁", label: "เอกสาร/รูปภาพ" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card text-center hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <span className="text-4xl block mb-2">{item.icon}</span>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* เคล็ดลับ */}
      <div className="card" style={{ background: "var(--accent-light)" }}>
        <div className="font-bold mb-1" style={{ color: "var(--accent)" }}>💡 เคล็ดลับวันนี้</div>
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>
          ส่งรูป slip โอนเงิน หรือใบเสร็จให้น้องบัญชี จะบันทึกให้อัตโนมัติ ทั้งใน Telegram และเว็บ
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, amount, color, bg }: { label: string; amount: number; color: string; bg?: string }) {
  return (
    <div className="card text-center" style={bg ? { background: bg } : {}}>
      <div className="text-xs font-medium mb-1" style={{ color }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{amount.toLocaleString()}</div>
      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>บาท</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="card h-20" />)}
      </div>
      <div className="card h-40" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card h-24" />)}
      </div>
    </div>
  );
}
