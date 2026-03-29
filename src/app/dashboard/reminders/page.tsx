"use client";

import { useEffect, useState } from "react";

const EXPENSE_CATEGORIES = ["ค่าประกอบอาชีพ", "อาหาร/ของใช้", "การศึกษา", "ค่าลงทุน", "งานสังคม", "พักผ่อน", "เสื้อผ้า", "อื่นๆ"];
const INCOME_CATEGORIES = ["รายได้อาชีพหลัก", "สวัสดิการ", "ขาย/เช่าทรัพย์สิน", "เงินกู้ยืม", "รายได้อื่นๆ"];

interface Reminder {
  _id: string;
  title: string;
  amount?: number;
  dueDay: number;
  category?: string;
  type?: "income" | "expense";
  active: boolean;
  isDueSoon?: boolean;
  isDueToday?: boolean;
}

interface Recurring {
  _id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  dueDay: number;
  active: boolean;
  lastCreated?: string;
}

type Tab = "reminders" | "recurring";

export default function RemindersPage() {
  const [tab, setTab] = useState<Tab>("reminders");

  // --- Reminders state ---
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingR, setLoadingR] = useState(true);
  const [showFormR, setShowFormR] = useState(false);
  const [savingR, setSavingR] = useState(false);
  const [formR, setFormR] = useState({ title: "", amount: "", dueDay: "", type: "expense" as "income" | "expense" });

  // --- Recurring state ---
  const [recurrings, setRecurrings] = useState<Recurring[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [showFormC, setShowFormC] = useState(false);
  const [savingC, setSavingC] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [formC, setFormC] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", dueDay: "" });

  useEffect(() => { loadReminders(); loadRecurrings(); }, []);

  // --- Reminders API ---
  async function loadReminders() {
    setLoadingR(true);
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) setReminders(await res.json());
    } catch { /* ignore */ }
    setLoadingR(false);
  }

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!formR.title || !formR.dueDay) return;
    setSavingR(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formR.title,
        amount: formR.amount ? parseFloat(formR.amount) : undefined,
        dueDay: parseInt(formR.dueDay),
        type: formR.type,
      }),
    });
    setSavingR(false);
    setShowFormR(false);
    setFormR({ title: "", amount: "", dueDay: "", type: "expense" });
    loadReminders();
  }

  async function deleteReminder(id: string) {
    if (!confirm("ต้องการลบแจ้งเตือนนี้?")) return;
    await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
    loadReminders();
  }

  // --- Recurring API ---
  async function loadRecurrings() {
    setLoadingC(true);
    try {
      const res = await fetch("/api/recurring");
      if (res.ok) setRecurrings(await res.json());
    } catch { /* ignore */ }
    setLoadingC(false);
  }

  async function saveRecurring(e: React.FormEvent) {
    e.preventDefault();
    if (!formC.description || !formC.amount || !formC.category || !formC.dueDay) return;
    setSavingC(true);
    await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: formC.description,
        amount: parseFloat(formC.amount),
        type: formC.type,
        category: formC.category,
        dueDay: parseInt(formC.dueDay),
      }),
    });
    setSavingC(false);
    setShowFormC(false);
    setFormC({ description: "", amount: "", type: "expense", category: "", dueDay: "" });
    loadRecurrings();
  }

  async function executeRecurring() {
    if (!confirm("สร้างรายการซ้ำทั้งหมดสำหรับเดือนนี้?")) return;
    setExecuting(true);
    await fetch("/api/recurring", { method: "PUT" });
    setExecuting(false);
    loadRecurrings();
  }

  async function deleteRecurring(id: string) {
    if (!confirm("ต้องการลบรายการซ้ำนี้?")) return;
    await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
    loadRecurrings();
  }

  function dueBadge(r: Reminder) {
    if (r.isDueToday) return { label: "ครบวันนี้!", bg: "var(--expense)", color: "#fff" };
    if (r.isDueSoon) return { label: "ใกล้ครบกำหนด", bg: "#f97316", color: "#fff" };
    return null;
  }

  const catsC = formC.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>แจ้งเตือน & รายการซ้ำ</h1>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        {([
          { key: "reminders" as Tab, label: "🔔 แจ้งเตือน" },
          { key: "recurring" as Tab, label: "🔄 รายการซ้ำ" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-3 rounded-xl text-base font-bold transition-colors"
            style={{
              background: tab === t.key ? "var(--accent)" : "var(--bg-input)",
              color: tab === t.key ? "white" : "var(--text-sub)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== Section 1: Reminders ==================== */}
      {tab === "reminders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>รายการแจ้งเตือน</h2>
            <button
              onClick={() => setShowFormR(!showFormR)}
              className="px-4 py-2 rounded-xl text-white font-medium"
              style={{ background: "var(--accent)" }}
            >
              + เพิ่ม
            </button>
          </div>

          <div className={showFormR ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
            {showFormR && (
              <form onSubmit={saveReminder} className="card space-y-3">
                <div className="flex gap-2">
                  {(["income", "expense"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormR({ ...formR, type: t })}
                      className="flex-1 py-3 rounded-xl text-base font-bold transition-colors"
                      style={{
                        background: formR.type === t ? (t === "income" ? "var(--income)" : "var(--expense)") : "var(--bg-input)",
                        color: formR.type === t ? "white" : "var(--text-sub)",
                      }}
                    >
                      {t === "income" ? "📥 รายรับ" : "📤 รายจ่าย"}
                    </button>
                  ))}
                </div>
                <input
                  value={formR.title}
                  onChange={(e) => setFormR({ ...formR, title: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="ชื่อแจ้งเตือน เช่น จ่ายค่าไฟ"
                  required
                />
                <input
                  type="number"
                  value={formR.amount}
                  onChange={(e) => setFormR({ ...formR, amount: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="จำนวนเงิน (บาท) - ไม่บังคับ"
                  min="0"
                />
                <select
                  value={formR.dueDay}
                  onChange={(e) => setFormR({ ...formR, dueDay: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  required
                >
                  <option value="">-- วันที่ครบกำหนด (1-31) --</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>วันที่ {d}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingR}
                  className="w-full py-3 rounded-xl text-white font-bold text-lg"
                  style={{ background: "var(--accent)", opacity: savingR ? 0.5 : 1 }}
                >
                  {savingR ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </form>
            )}

            <div>
              {loadingR ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="card h-16" />)}
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🔔</div>
                  <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีแจ้งเตือน</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ เพิ่ม&quot; เพื่อตั้งแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((r) => {
                    const badge = dueBadge(r);
                    return (
                      <div
                        key={r._id}
                        className="card flex items-center gap-3"
                        style={{
                          borderLeft: badge ? `4px solid ${badge.bg}` : undefined,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                          style={{
                            background: r.isDueToday
                              ? "rgba(220,38,38,0.15)"
                              : r.isDueSoon
                              ? "rgba(249,115,22,0.15)"
                              : "var(--bg-input)",
                          }}
                        >
                          {r.isDueToday ? "🚨" : r.isDueSoon ? "⏰" : "🔔"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" style={{ color: "var(--text)" }}>
                            {r.title}
                          </div>
                          <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                            <span>ทุกวันที่ {r.dueDay}</span>
                            {r.type && (
                              <span style={{ color: r.type === "income" ? "var(--income)" : "var(--expense)" }}>
                                {r.type === "income" ? "รายรับ" : "รายจ่าย"}
                              </span>
                            )}
                          </div>
                          {badge && (
                            <span
                              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {r.amount != null && (
                            <div className="font-bold" style={{ color: r.type === "income" ? "var(--income)" : "var(--expense)" }}>
                              {r.amount.toLocaleString()} ฿
                            </div>
                          )}
                          <button onClick={() => deleteReminder(r._id)} className="text-xs" style={{ color: "var(--text-muted)" }}>
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
      )}

      {/* ==================== Section 2: Recurring ==================== */}
      {tab === "recurring" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>รายการซ้ำอัตโนมัติ</h2>
            <div className="flex gap-2">
              <button
                onClick={executeRecurring}
                disabled={executing}
                className="px-4 py-2 rounded-xl text-white font-medium text-sm"
                style={{ background: "var(--blue)", opacity: executing ? 0.5 : 1 }}
              >
                {executing ? "กำลังสร้าง..." : "🔄 สร้างรายการเดือนนี้"}
              </button>
              <button
                onClick={() => setShowFormC(!showFormC)}
                className="px-4 py-2 rounded-xl text-white font-medium"
                style={{ background: "var(--accent)" }}
              >
                + เพิ่ม
              </button>
            </div>
          </div>

          <div className={showFormC ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
            {showFormC && (
              <form onSubmit={saveRecurring} className="card space-y-3">
                <div className="flex gap-2">
                  {(["income", "expense"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormC({ ...formC, type: t, category: "" })}
                      className="flex-1 py-3 rounded-xl text-base font-bold transition-colors"
                      style={{
                        background: formC.type === t ? (t === "income" ? "var(--income)" : "var(--expense)") : "var(--bg-input)",
                        color: formC.type === t ? "white" : "var(--text-sub)",
                      }}
                    >
                      {t === "income" ? "📥 รายรับ" : "📤 รายจ่าย"}
                    </button>
                  ))}
                </div>
                <input
                  value={formC.description}
                  onChange={(e) => setFormC({ ...formC, description: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="รายละเอียด เช่น ค่าไฟรายเดือน"
                  required
                />
                <input
                  type="number"
                  value={formC.amount}
                  onChange={(e) => setFormC({ ...formC, amount: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="จำนวนเงิน (บาท)"
                  required
                  min="0"
                />
                <select
                  value={formC.category}
                  onChange={(e) => setFormC({ ...formC, category: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  required
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {catsC.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={formC.dueDay}
                  onChange={(e) => setFormC({ ...formC, dueDay: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3"
                  required
                >
                  <option value="">-- วันที่ทำรายการ (1-31) --</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>วันที่ {d}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingC}
                  className="w-full py-3 rounded-xl text-white font-bold text-lg"
                  style={{ background: "var(--accent)", opacity: savingC ? 0.5 : 1 }}
                >
                  {savingC ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </form>
            )}

            <div>
              {loadingC ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="card h-16" />)}
                </div>
              ) : recurrings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🔄</div>
                  <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีรายการซ้ำ</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ เพิ่ม&quot; เพื่อตั้งรายการซ้ำรายเดือน</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recurrings.map((rc) => (
                    <div key={rc._id} className="card flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                        style={{
                          background: rc.type === "income" ? "var(--accent-light)" : "rgba(220,38,38,0.1)",
                          opacity: rc.active ? 1 : 0.4,
                        }}
                      >
                        {rc.type === "income" ? "📥" : "📤"}
                      </div>
                      <div className="flex-1 min-w-0" style={{ opacity: rc.active ? 1 : 0.5 }}>
                        <div className="font-medium truncate" style={{ color: "var(--text)" }}>
                          {rc.description}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          ทุกวันที่ {rc.dueDay} · {rc.category}
                          {rc.lastCreated && (
                            <span> · สร้างล่าสุด {rc.lastCreated}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="font-bold" style={{ color: rc.type === "income" ? "var(--income)" : "var(--expense)" }}>
                          {rc.type === "income" ? "+" : "-"}{rc.amount.toLocaleString()} ฿
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: rc.active ? "var(--accent)" : "var(--bg-input)",
                              color: rc.active ? "#fff" : "var(--text-muted)",
                            }}
                          >
                            {rc.active ? "เปิด" : "ปิด"}
                          </span>
                          <button onClick={() => deleteRecurring(rc._id)} className="text-xs" style={{ color: "var(--text-muted)" }}>
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
