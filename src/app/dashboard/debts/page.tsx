"use client";

import { useEffect, useState } from "react";

interface Debt {
  _id: string;
  creditor: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  installments: number;
  paidInstallments: number;
  dueDay: number;
  startDate: string;
  note: string;
  active: boolean;
  remainingAmount: number;
  remainingInstallments: number;
  percent: number;
}

const CREDITOR_PRESETS = ["ธ.ก.ส.", "กองทุนหมู่บ้าน", "ธนาคารออมสิน", "สหกรณ์", "เพื่อนบ้าน"];

const CREDITOR_ICONS: Record<string, string> = {
  "ธ.ก.ส.": "🏦",
  "กองทุนหมู่บ้าน": "🏘️",
  "ธนาคารออมสิน": "🏛️",
  "สหกรณ์": "🤝",
  "เพื่อนบ้าน": "👤",
};

function getCreditorIcon(creditor: string): string {
  for (const [key, icon] of Object.entries(CREDITOR_ICONS)) {
    if (creditor.includes(key)) return icon;
  }
  return "💳";
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    creditor: "",
    totalAmount: "",
    monthlyPayment: "",
    installments: "",
    dueDay: "",
    note: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/debts");
      if (res.ok) setDebts(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.creditor || !form.totalAmount || !form.monthlyPayment || !form.installments) return;
    setSaving(true);
    await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creditor: form.creditor,
        totalAmount: parseFloat(form.totalAmount),
        monthlyPayment: parseFloat(form.monthlyPayment),
        installments: parseInt(form.installments),
        dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
        note: form.note || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ creditor: "", totalAmount: "", monthlyPayment: "", installments: "", dueDay: "", note: "" });
    load();
  }

  async function payInstallment(id: string) {
    setPayingId(id);
    await fetch("/api/debts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payInstallment: true }),
    });
    setPayingId(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("ต้องการลบหนี้นี้?")) return;
    await fetch(`/api/debts?id=${id}`, { method: "DELETE" });
    load();
  }

  const activeDebts = debts.filter((d) => d.active);
  const completedDebts = debts.filter((d) => !d.active);
  const totalDebt = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          หนี้สิน &amp; ผ่อนชำระ
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white font-medium"
          style={{ background: "var(--accent)" }}
        >
          + เพิ่มหนี้
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>หนี้ทั้งหมด</div>
          <div className="text-lg font-bold" style={{ color: "var(--expense)" }}>
            {totalDebt.toLocaleString()}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>จ่ายแล้ว</div>
          <div className="text-lg font-bold" style={{ color: "var(--income)" }}>
            {totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>คงเหลือ</div>
          <div className="text-lg font-bold" style={{ color: "var(--blue)" }}>
            {totalRemaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Form + List layout */}
      <div className={showForm ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
        {/* Add Form */}
        {showForm && (
          <form onSubmit={save} className="card space-y-3">
            <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>เพิ่มหนี้ใหม่</h2>

            {/* Creditor presets */}
            <div className="flex flex-wrap gap-2">
              {CREDITOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, creditor: c })}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: form.creditor === c ? "var(--accent)" : "var(--bg-input)",
                    color: form.creditor === c ? "white" : "var(--text-sub)",
                  }}
                >
                  {CREDITOR_ICONS[c]} {c}
                </button>
              ))}
            </div>

            <input
              value={form.creditor}
              onChange={(e) => setForm({ ...form, creditor: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="ชื่อเจ้าหนี้"
              required
            />
            <input
              type="number"
              value={form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="ยอดหนี้ทั้งหมด (บาท)"
              required
              min="0"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.monthlyPayment}
                onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
                placeholder="ผ่อน/เดือน (บาท)"
                required
                min="0"
              />
              <input
                type="number"
                value={form.installments}
                onChange={(e) => setForm({ ...form, installments: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
                placeholder="จำนวนงวด"
                required
                min="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.dueDay}
                onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
                placeholder="วันครบกำหนด (1-31)"
                min="1"
                max="31"
              />
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
                placeholder="หมายเหตุ"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-lg"
              style={{ background: "var(--accent)", opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกหนี้"}
            </button>
          </form>
        )}

        {/* Debt List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="card h-32" />)}
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ไม่มีหนี้สิน</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ เพิ่มหนี้&quot; เพื่อบันทึกหนี้สินที่ต้องผ่อนชำระ</p>
            </div>
          ) : (
            <>
              {/* Active debts */}
              {activeDebts.length > 0 && (
                <div className="space-y-3">
                  {activeDebts.map((debt) => (
                    <DebtCard
                      key={debt._id}
                      debt={debt}
                      paying={payingId === debt._id}
                      onPay={() => payInstallment(debt._id)}
                      onDelete={() => del(debt._id)}
                    />
                  ))}
                </div>
              )}

              {/* Completed debts */}
              {completedDebts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold mt-4" style={{ color: "var(--text-muted)" }}>
                    ✅ ชำระครบแล้ว
                  </h2>
                  {completedDebts.map((debt) => (
                    <DebtCard
                      key={debt._id}
                      debt={debt}
                      paying={false}
                      onPay={() => {}}
                      onDelete={() => del(debt._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DebtCard({
  debt,
  paying,
  onPay,
  onDelete,
}: {
  debt: Debt;
  paying: boolean;
  onPay: () => void;
  onDelete: () => void;
}) {
  const isCompleted = !debt.active;
  const progressColor = isCompleted ? "var(--income)" : "var(--blue)";

  return (
    <div
      className="card space-y-3"
      style={{ opacity: isCompleted ? 0.7 : 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ background: isCompleted ? "var(--accent-light)" : "var(--bg-input)" }}
        >
          {isCompleted ? "✅" : getCreditorIcon(debt.creditor)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color: "var(--text)" }}>
            {debt.creditor}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {debt.dueDay ? `ครบกำหนดทุกวันที่ ${debt.dueDay}` : "ไม่ระบุวันครบกำหนด"}
            {debt.note ? ` · ${debt.note}` : ""}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded-lg shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          ลบ
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--text-sub)" }}>
            จ่ายแล้ว {debt.paidInstallments}/{debt.installments} งวด
          </span>
          <span style={{ color: progressColor, fontWeight: 600 }}>
            {debt.percent}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${debt.percent}%`,
              background: progressColor,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div style={{ color: "var(--text-muted)" }}>ยอดทั้งหมด</div>
          <div className="font-bold" style={{ color: "var(--text)" }}>
            {debt.totalAmount.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)" }}>จ่ายแล้ว</div>
          <div className="font-bold" style={{ color: "var(--income)" }}>
            {debt.paidAmount.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)" }}>คงเหลือ</div>
          <div className="font-bold" style={{ color: "var(--expense)" }}>
            {debt.remainingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Monthly payment info */}
      <div className="text-xs text-center" style={{ color: "var(--text-sub)" }}>
        ผ่อนเดือนละ {debt.monthlyPayment.toLocaleString()} บาท
        {!isCompleted && ` · เหลืออีก ${debt.remainingInstallments} งวด`}
      </div>

      {/* Pay button */}
      {!isCompleted && (
        <button
          onClick={onPay}
          disabled={paying}
          className="w-full py-3 rounded-xl text-white font-bold text-base transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: paying ? 0.5 : 1,
          }}
        >
          {paying ? "กำลังบันทึก..." : `💰 จ่ายงวดนี้ (${debt.monthlyPayment.toLocaleString()} บาท)`}
        </button>
      )}
    </div>
  );
}
