"use client";

import { useEffect, useState } from "react";

const EXPENSE_CATEGORIES = [
  "ค่าประกอบอาชีพ",
  "อาหาร/ของใช้",
  "การศึกษา",
  "ค่าลงทุน",
  "งานสังคม",
  "พักผ่อน",
  "เสื้อผ้า",
  "อื่นๆ",
];

interface Budget {
  _id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  spent: number;
  remaining: number;
  percent: number;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/budgets");
    if (res.ok) setBudgets(await res.json());
    setLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !monthlyLimit) return;
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, monthlyLimit: parseFloat(monthlyLimit) }),
    });
    setSaving(false);
    setCategory("");
    setMonthlyLimit("");
    load();
  }

  async function del(id: string) {
    if (!confirm("ต้องการลบงบประมาณนี้?")) return;
    await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    load();
  }

  function barColor(percent: number) {
    if (percent > 100) return "var(--expense)";
    if (percent >= 80) return "#eab308";
    return "var(--income)";
  }

  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overCount = budgets.filter((b) => b.percent > 100).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        ตั้งงบประมาณ
      </h1>

      {/* สรุปรวม */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              งบทั้งหมด
            </div>
            <div className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {totalLimit.toLocaleString()} ฿
            </div>
          </div>
          <div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              ใช้ไปแล้ว
            </div>
            <div className="text-lg font-bold" style={{ color: "var(--expense)" }}>
              {totalSpent.toLocaleString()} ฿
            </div>
          </div>
          <div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              คงเหลือ
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: totalRemaining >= 0 ? "var(--income)" : "var(--expense)" }}
            >
              {totalRemaining.toLocaleString()} ฿
            </div>
          </div>
        </div>
        {overCount > 0 && (
          <div
            className="mt-3 px-3 py-2 rounded-xl text-sm font-medium text-center"
            style={{ background: "rgba(220,38,38,0.1)", color: "var(--expense)" }}
          >
            ⚠️ เกินงบ {overCount} หมวดหมู่
          </div>
        )}
      </div>

      {/* ฟอร์ม + รายการ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        {/* ฟอร์มเพิ่มงบ */}
        <form onSubmit={save} className="card space-y-3">
          <div className="font-bold text-lg" style={{ color: "var(--text)" }}>
            เพิ่มงบประมาณ
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            required
          >
            <option value="">-- เลือกหมวดหมู่ --</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            placeholder="วงเงินต่อเดือน (บาท)"
            required
            min="1"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-white font-bold text-lg"
            style={{ background: "var(--accent)", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "กำลังบันทึก..." : "ตั้งงบประมาณ"}
          </button>
        </form>

        {/* รายการงบประมาณ */}
        <div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20" />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>
                ยังไม่มีงบประมาณ
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                ตั้งงบประมาณแต่ละหมวดเพื่อควบคุมค่าใช้จ่าย
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {budgets.map((b) => {
                const pct = Math.min(b.percent, 100);
                const isOver = b.percent > 100;
                return (
                  <div key={b._id} className="card space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {b.category}
                        </span>
                        {isOver && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(220,38,38,0.1)", color: "var(--expense)" }}
                          >
                            ⚠️ เกินงบ
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => del(b._id)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ลบ
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-3 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-input)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: barColor(b.percent),
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-sub)" }}>
                        ใช้ไป {b.spent.toLocaleString()} / {b.monthlyLimit.toLocaleString()} ฿
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: b.remaining >= 0 ? "var(--income)" : "var(--expense)" }}
                      >
                        {b.remaining >= 0 ? `เหลือ ${b.remaining.toLocaleString()}` : `เกิน ${Math.abs(b.remaining).toLocaleString()}`} ฿
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
