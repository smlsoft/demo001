"use client";

import { useEffect, useState } from "react";

interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
}

const ICONS = ["🎯", "🚗", "🏠", "📱", "💰", "🐷", "🎓", "✈️", "💍", "🏥", "👶", "🎁"];

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", icon: "🎯", deadline: "" });
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/savings-goals");
      if (res.ok) setGoals(await res.json());
    } catch {}
    setLoading(false);
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return;
    setSaving(true);
    await fetch("/api/savings-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        icon: form.icon,
        deadline: form.deadline || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", targetAmount: "", icon: "🎯", deadline: "" });
    load();
  }

  async function addSavings(id: string) {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) return;
    await fetch("/api/savings-goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, addAmount: amt }),
    });
    setAddingId(null);
    setAddAmount("");
    load();
  }

  async function deleteGoal(id: string) {
    if (!confirm("ต้องการลบเป้าหมายนี้?")) return;
    await fetch(`/api/savings-goals?id=${id}`, { method: "DELETE" });
    load();
  }

  function pct(goal: SavingsGoal) {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>ตั้งเป้าออมเงิน</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white font-medium"
          style={{ background: "var(--accent)" }}
        >
          + เพิ่มเป้าหมาย
        </button>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🐷</div>
          <div className="flex-1">
            <div className="text-sm" style={{ color: "var(--text-sub)" }}>ออมได้ทั้งหมด</div>
            <div className="text-2xl font-bold" style={{ color: "var(--income)" }}>
              {totalSaved.toLocaleString()} <span className="text-base font-normal" style={{ color: "var(--text-muted)" }}>/ {totalTarget.toLocaleString()} บาท</span>
            </div>
          </div>
        </div>
        {totalTarget > 0 && (
          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(100, Math.round((totalSaved / totalTarget) * 100))}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <div className="text-right text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {Math.min(100, Math.round((totalSaved / totalTarget) * 100))}%
            </div>
          </div>
        )}
      </div>

      {/* Form + List layout */}
      <div className={showForm ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
        {/* Create Form */}
        {showForm && (
          <form onSubmit={createGoal} className="card space-y-3">
            <div className="font-bold text-lg" style={{ color: "var(--text)" }}>สร้างเป้าหมายใหม่</div>

            {/* Icon Picker */}
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: "var(--text-sub)" }}>เลือกไอคอน</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className="w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all"
                    style={{
                      background: form.icon === icon ? "var(--accent-light)" : "var(--bg-input)",
                      border: form.icon === icon ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="ชื่อเป้าหมาย เช่น ซื้อรถ"
              required
            />
            <input
              type="number"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="จำนวนเงินเป้าหมาย (บาท)"
              required
              min="1"
            />
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              style={{ color: form.deadline ? "var(--text)" : "var(--text-muted)" }}
            />
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>กำหนดเส้นตาย (ไม่บังคับ)</div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-base"
                style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-bold text-base"
                style={{ background: "var(--accent)", opacity: saving ? 0.5 : 1 }}
              >
                {saving ? "กำลังบันทึก..." : "สร้างเป้าหมาย"}
              </button>
            </div>
          </form>
        )}

        {/* Goals List */}
        <div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="card h-24" />)}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีเป้าหมาย</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ เพิ่มเป้าหมาย&quot; เพื่อเริ่มออม</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const percent = pct(goal);
                const isComplete = percent >= 100;

                return (
                  <div key={goal._id} className="card space-y-2">
                    {/* Goal header */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                        style={{ background: isComplete ? "var(--accent-light)" : "var(--bg-input)" }}
                      >
                        {goal.icon || "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate" style={{ color: "var(--text)" }}>
                          {goal.name}
                          {isComplete && <span className="ml-2 text-sm">🎉</span>}
                        </div>
                        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                          {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} บาท
                          {goal.deadline && (
                            <span> · เส้นตาย {goal.deadline}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className="text-lg font-bold"
                          style={{ color: isComplete ? "var(--income)" : "var(--accent)" }}
                        >
                          {percent}%
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${percent}%`,
                          background: isComplete
                            ? "var(--income)"
                            : percent >= 70
                              ? "var(--accent)"
                              : "var(--blue)",
                        }}
                      />
                    </div>

                    {/* Congratulations */}
                    {isComplete && (
                      <div
                        className="text-center py-2 rounded-xl text-sm font-bold"
                        style={{ background: "var(--accent-light)", color: "var(--income)" }}
                      >
                        🎊 ยินดีด้วย! ออมครบเป้าหมายแล้ว!
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isComplete && (
                        <>
                          {addingId === goal._id ? (
                            <div className="flex flex-1 gap-2">
                              <input
                                type="number"
                                value={addAmount}
                                onChange={(e) => setAddAmount(e.target.value)}
                                className="flex-1 border rounded-xl px-3 py-2"
                                placeholder="จำนวนเงิน"
                                min="1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") addSavings(goal._id);
                                  if (e.key === "Escape") { setAddingId(null); setAddAmount(""); }
                                }}
                              />
                              <button
                                onClick={() => addSavings(goal._id)}
                                className="px-4 py-2 rounded-xl text-white font-medium shrink-0"
                                style={{ background: "var(--accent)" }}
                              >
                                เพิ่ม
                              </button>
                              <button
                                onClick={() => { setAddingId(null); setAddAmount(""); }}
                                className="px-3 py-2 rounded-xl font-medium shrink-0"
                                style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingId(goal._id); setAddAmount(""); }}
                              className="flex-1 py-2 rounded-xl font-medium text-sm"
                              style={{ background: "var(--bg-input)", color: "var(--accent)" }}
                            >
                              💰 เพิ่มเงินออม
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => deleteGoal(goal._id)}
                        className="px-3 py-2 rounded-xl text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ลบ
                      </button>
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
