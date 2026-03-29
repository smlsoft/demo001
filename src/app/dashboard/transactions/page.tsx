"use client";

import { useEffect, useState } from "react";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatThaiDate, toBuddhistYear } from "@/lib/demo-users";

interface Tx {
  _id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [form, setForm] = useState({ date: toBuddhistYear(new Date()), description: "", amount: "", category: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/transactions");
    if (res.ok) setTxs(await res.json());
    setLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount || !form.category) return;
    setSaving(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), type: formType }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ date: toBuddhistYear(new Date()), description: "", amount: "", category: "", note: "" });
    load();
  }

  async function del(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    load();
  }

  const cats = formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>บันทึกรายรับ-รายจ่าย</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: "var(--accent)" }}>
          + เพิ่ม
        </button>
      </div>

      {/* Desktop: form + list side-by-side when form is open */}
      <div className={showForm ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
        {showForm && (
          <form onSubmit={save} className="card space-y-3">
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setFormType(t); setForm({ ...form, category: "" }); }}
                  className="flex-1 py-3 rounded-xl text-base font-bold transition-colors"
                  style={{
                    background: formType === t ? (t === "income" ? "var(--income)" : "var(--expense)") : "var(--bg-input)",
                    color: formType === t ? "white" : "var(--text-sub)",
                  }}
                >
                  {t === "income" ? "📥 รายรับ" : "📤 รายจ่าย"}
                </button>
              ))}
            </div>
            <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-xl px-4 py-3" placeholder="วันที่ (พ.ศ.)" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-4 py-3" placeholder="รายละเอียด เช่น ขายข้าว" required />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-xl px-4 py-3" placeholder="จำนวนเงิน (บาท)" required min="0" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-4 py-3" required>
              <option value="">-- เลือกหมวดหมู่ --</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-white font-bold text-lg" style={{ background: "var(--accent)", opacity: saving ? 0.5 : 1 }}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>
        )}

        {/* รายการ */}
        <div>
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="card h-16" />)}</div>
          ) : txs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีรายการ</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ เพิ่ม&quot; หรือคุยกับน้องบัญชี</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <div key={tx._id} className="card flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: tx.type === "income" ? "var(--accent-light)" : "rgba(220,38,38,0.1)" }}>
                    {tx.type === "income" ? "📥" : "📤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--text)" }}>{tx.description}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{formatThaiDate(tx.date)} · {tx.category}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold" style={{ color: tx.type === "income" ? "var(--income)" : "var(--expense)" }}>
                      {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()}
                    </div>
                    <button onClick={() => del(tx._id)} className="text-xs" style={{ color: "var(--text-muted)" }}>ลบ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
