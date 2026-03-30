"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface Tx {
  _id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function toBE(d: Date): string {
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeDateKey(beYear: number, month: number, day: number): string {
  return `${beYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fmtAmount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return n.toLocaleString();
}

export default function CalendarPage() {
  const now = new Date();
  const [beYear, setBeYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth());
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(toBE(now));

  const ceYear = beYear - 543;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions?limit=500");
        if (res.ok) {
          const json = await res.json();
          setTxs(Array.isArray(json) ? json : json.data || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const txByDate = useMemo(() => {
    const map: Record<string, Tx[]> = {};
    for (const tx of txs) {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    }
    return map;
  }, [txs]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(ceYear, month, 1).getDay();
    const daysInMonth = new Date(ceYear, month + 1, 0).getDate();
    const cells: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateKey: makeDateKey(beYear, month, d) });
    }
    return cells;
  }, [ceYear, month, beYear]);

  const monthSummary = useMemo(() => {
    const prefix = `${beYear}-${String(month + 1).padStart(2, "0")}-`;
    let income = 0, expense = 0;
    for (const tx of txs) {
      if (tx.date.startsWith(prefix)) {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return { income, expense, balance: income - expense };
  }, [txs, beYear, month]);

  const selectedTxs = useMemo(() => txByDate[selectedDate] || [], [txByDate, selectedDate]);
  const selectedIncome = selectedTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const goPrev = useCallback(() => {
    if (month === 0) { setMonth(11); setBeYear(beYear - 1); }
    else setMonth(month - 1);
  }, [month, beYear]);

  const goNext = useCallback(() => {
    if (month === 11) { setMonth(0); setBeYear(beYear + 1); }
    else setMonth(month + 1);
  }, [month, beYear]);

  const todayKey = toBE(now);

  const selParts = selectedDate.split("-");
  const selDay = parseInt(selParts[2]);
  const selDisplay = `${selDay} ${THAI_MONTHS[parseInt(selParts[1]) - 1]} ${selParts[0]}`;

  // Category emoji
  function catEmoji(cat: string): string {
    if (cat.includes("อาหาร") || cat.includes("กิน")) return "🍚";
    if (cat.includes("เดินทาง") || cat.includes("น้ำมัน") || cat.includes("รถ")) return "🚗";
    if (cat.includes("ค่าไฟ") || cat.includes("ค่าน้ำ") || cat.includes("สาธารณูปโภค")) return "💡";
    if (cat.includes("ขาย") || cat.includes("รายได้")) return "💰";
    if (cat.includes("เกษตร") || cat.includes("ปุ๋ย") || cat.includes("นา")) return "🌾";
    if (cat.includes("สุขภาพ") || cat.includes("ยา") || cat.includes("หมอ")) return "🏥";
    if (cat.includes("การศึกษา") || cat.includes("โรงเรียน")) return "📚";
    if (cat.includes("บ้าน") || cat.includes("ที่อยู่")) return "🏠";
    if (cat.includes("โอน") || cat.includes("ธนาคาร")) return "🏦";
    return cat.includes("รับ") ? "📥" : "📤";
  }

  return (
    <div className="space-y-4 lg:max-w-3xl lg:mx-auto">
      {/* Header + Nav */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform"
          style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          ‹
        </button>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
            {THAI_MONTHS_FULL[month]}
          </h1>
          <div className="text-base" style={{ color: "var(--text-muted)" }}>{beYear}</div>
        </div>
        <button onClick={goNext}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform"
          style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          ›
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl p-3 sm:p-4 text-center" style={{ background: "rgba(22,163,74,0.1)" }}>
          <div className="text-2xl mb-1">📥</div>
          <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>รายรับ</div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: "var(--income)" }}>
            {monthSummary.income.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 text-center" style={{ background: "rgba(220,38,38,0.1)" }}>
          <div className="text-2xl mb-1">📤</div>
          <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>รายจ่าย</div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: "var(--expense)" }}>
            {monthSummary.expense.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 text-center" style={{ background: monthSummary.balance >= 0 ? "rgba(37,99,235,0.1)" : "rgba(220,38,38,0.05)" }}>
          <div className="text-2xl mb-1">{monthSummary.balance >= 0 ? "✨" : "⚠️"}</div>
          <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>คงเหลือ</div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: monthSummary.balance >= 0 ? "var(--blue)" : "var(--expense)" }}>
            {monthSummary.balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card" style={{ padding: "12px" }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d, i) => (
            <div key={d} className="text-center text-sm sm:text-base font-bold py-2"
              style={{ color: i === 0 ? "var(--expense)" : i === 6 ? "var(--blue)" : "var(--text-muted)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <div className="text-center">
              <div className="text-4xl mb-2 animate-bounce">📅</div>
              <div className="text-lg">กำลังโหลด...</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-[2px]">
            {calendarDays.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} className="aspect-square" />;

              const dayTxs = txByDate[cell.dateKey] || [];
              const dayIncome = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const dayExpense = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const net = dayIncome - dayExpense;
              const hasTx = dayTxs.length > 0;
              const isSelected = cell.dateKey === selectedDate;
              const isToday = cell.dateKey === todayKey;

              return (
                <button key={cell.dateKey}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative"
                  style={{
                    background: isSelected
                      ? "var(--accent)"
                      : isToday
                        ? "var(--bg-input)"
                        : hasTx
                          ? net > 0 ? "rgba(22,163,74,0.08)" : net < 0 ? "rgba(220,38,38,0.06)" : "var(--bg-input)"
                          : "transparent",
                    color: isSelected ? "white" : "var(--text)",
                    fontWeight: isToday || isSelected ? "bold" : "normal",
                    border: isToday && !isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                  }}>
                  <span className="text-base sm:text-lg">{cell.day}</span>
                  {hasTx && (
                    <span className="text-[9px] sm:text-[10px] leading-none font-bold"
                      style={{
                        color: isSelected ? "rgba(255,255,255,0.85)"
                          : net > 0 ? "var(--income)"
                          : net < 0 ? "var(--expense)"
                          : "var(--text-muted)",
                      }}>
                      {net > 0 ? "+" : ""}{fmtAmount(net)}
                    </span>
                  )}
                  {/* Activity dots */}
                  {hasTx && !isSelected && (
                    <div className="flex gap-[2px] mt-[1px]">
                      {dayIncome > 0 && <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--income)" }} />}
                      {dayExpense > 0 && <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--expense)" }} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>
            📅 {selDisplay}
          </h2>
          {selectedTxs.length > 0 && (
            <span className="text-sm px-3 py-1 rounded-full font-bold"
              style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}>
              {selectedTxs.length} รายการ
            </span>
          )}
        </div>

        {selectedTxs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl p-2 text-center" style={{ background: "rgba(22,163,74,0.08)" }}>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>รับ</div>
              <div className="text-base sm:text-lg font-bold" style={{ color: "var(--income)" }}>
                +{selectedIncome.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl p-2 text-center" style={{ background: "rgba(220,38,38,0.06)" }}>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>จ่าย</div>
              <div className="text-base sm:text-lg font-bold" style={{ color: "var(--expense)" }}>
                -{selectedExpense.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl p-2 text-center" style={{ background: "rgba(37,99,235,0.08)" }}>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>สุทธิ</div>
              <div className="text-base sm:text-lg font-bold"
                style={{ color: selectedIncome - selectedExpense >= 0 ? "var(--blue)" : "var(--expense)" }}>
                {(selectedIncome - selectedExpense).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {selectedTxs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">😊</div>
            <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ไม่มีรายการในวันนี้</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>พิมพ์หรือส่งรูป slip ผ่าน Telegram เพื่อบันทึก</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedTxs.map((tx) => (
              <div key={tx._id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: tx.type === "income" ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.04)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{ background: tx.type === "income" ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.12)" }}>
                  {catEmoji(tx.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate" style={{ color: "var(--text)" }}>
                    {tx.description}
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>{tx.category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold"
                    style={{ color: tx.type === "income" ? "var(--income)" : "var(--expense)" }}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>บาท</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
