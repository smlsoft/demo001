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

/** Format Buddhist year date string: "2569-03-29" */
function toBE(d: Date): string {
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build a date key in พ.ศ. format from year (พ.ศ.), month (0-based), day */
function makeDateKey(beYear: number, month: number, day: number): string {
  return `${beYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [beYear, setBeYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(toBE(now));

  // CE year for JS Date calculations
  const ceYear = beYear - 543;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions?limit=200");
        if (res.ok) {
          const json = await res.json();
          setTxs(Array.isArray(json) ? json : json.data || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Group transactions by date
  const txByDate = useMemo(() => {
    const map: Record<string, Tx[]> = {};
    for (const tx of txs) {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    }
    return map;
  }, [txs]);

  // Calendar cells for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(ceYear, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(ceYear, month + 1, 0).getDate();
    const cells: Array<{ day: number; dateKey: string } | null> = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateKey: makeDateKey(beYear, month, d) });
    }
    return cells;
  }, [ceYear, month, beYear]);

  // Month summary
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

  // Selected day transactions
  const selectedTxs = useMemo(() => txByDate[selectedDate] || [], [txByDate, selectedDate]);
  const selectedIncome = selectedTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Navigation
  const goPrev = useCallback(() => {
    if (month === 0) { setMonth(11); setBeYear(beYear - 1); }
    else setMonth(month - 1);
  }, [month, beYear]);

  const goNext = useCallback(() => {
    if (month === 11) { setMonth(0); setBeYear(beYear + 1); }
    else setMonth(month + 1);
  }, [month, beYear]);

  // Today key for highlighting
  const todayKey = toBE(now);

  // Parse selected date for display
  const selParts = selectedDate.split("-");
  const selDisplay = `${parseInt(selParts[2])} ${THAI_MONTHS[parseInt(selParts[1]) - 1]} ${selParts[0]}`;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        ปฏิทินการเงิน
      </h1>

      {/* Month summary */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--income)" }}>รายรับ</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--income)" }}>
              {monthSummary.income.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--expense)" }}>รายจ่าย</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--expense)" }}>
              {monthSummary.expense.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--blue)" }}>คงเหลือ</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: monthSummary.balance >= 0 ? "var(--blue)" : "var(--expense)" }}>
              {monthSummary.balance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Month/Year navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrev}
            className="px-3 py-2 rounded-xl font-bold text-lg"
            style={{ background: "var(--bg-input)", color: "var(--text)" }}
          >
            &lt;
          </button>
          <span className="text-lg sm:text-xl font-bold" style={{ color: "var(--text)" }}>
            {THAI_MONTHS_FULL[month]} {beYear}
          </span>
          <button
            onClick={goNext}
            className="px-3 py-2 rounded-xl font-bold text-lg"
            style={{ background: "var(--bg-input)", color: "var(--text)" }}
          >
            &gt;
          </button>
        </div>

        {/* Day headers */}
        <div className="calendar-grid mb-1">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-bold py-1"
              style={{ color: "var(--text-muted)" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="h-48 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            กำลังโหลด...
          </div>
        ) : (
          <div className="calendar-grid">
            {calendarDays.map((cell, i) => {
              if (!cell) {
                return <div key={`empty-${i}`} className="calendar-cell" />;
              }
              const dayTxs = txByDate[cell.dateKey] || [];
              const dayIncome = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const dayExpense = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const net = dayIncome - dayExpense;
              const isSelected = cell.dateKey === selectedDate;
              const isToday = cell.dateKey === todayKey;

              return (
                <div
                  key={cell.dateKey}
                  className="calendar-cell"
                  onClick={() => setSelectedDate(cell.dateKey)}
                  style={{
                    background: isSelected
                      ? "var(--accent)"
                      : isToday
                        ? "var(--bg-input)"
                        : "transparent",
                    color: isSelected ? "white" : "var(--text)",
                    fontWeight: isToday || isSelected ? "bold" : "normal",
                    border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                  }}
                >
                  <span className="text-sm">{cell.day}</span>
                  {/* Dot indicator */}
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      marginTop: 2,
                      background: dayTxs.length === 0
                        ? "transparent"
                        : net > 0
                          ? isSelected ? "white" : "var(--income)"
                          : net < 0
                            ? isSelected ? "white" : "var(--expense)"
                            : isSelected ? "white" : "var(--text-muted)",
                    }}
                  />
                  {/* Small amount if there are transactions */}
                  {dayTxs.length > 0 && (
                    <span
                      className="text-[8px] leading-none"
                      style={{
                        color: isSelected
                          ? "rgba(255,255,255,0.8)"
                          : net >= 0
                            ? "var(--income)"
                            : "var(--expense)",
                      }}
                    >
                      {net >= 0 ? "+" : ""}{net.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      <div className="card">
        <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>
          {selDisplay}
        </h2>

        {selectedTxs.length > 0 && (
          <div className="flex gap-4 mb-3 text-sm">
            <span style={{ color: "var(--income)" }}>
              รายรับ <strong>{selectedIncome.toLocaleString()}</strong>
            </span>
            <span style={{ color: "var(--expense)" }}>
              รายจ่าย <strong>{selectedExpense.toLocaleString()}</strong>
            </span>
            <span style={{ color: "var(--blue)" }}>
              สุทธิ <strong>{(selectedIncome - selectedExpense).toLocaleString()}</strong>
            </span>
          </div>
        )}

        {selectedTxs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">-</div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>ไม่มีรายการในวันนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedTxs.map((tx) => (
              <div key={tx._id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{
                    background: tx.type === "income" ? "var(--accent-light)" : "rgba(220,38,38,0.1)",
                  }}
                >
                  {tx.type === "income" ? "+" : "-"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm" style={{ color: "var(--text)" }}>{tx.description}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{tx.category}</div>
                </div>
                <div
                  className="font-bold text-sm shrink-0"
                  style={{ color: tx.type === "income" ? "var(--income)" : "var(--expense)" }}
                >
                  {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
