"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useTheme } from "@/lib/theme";
import { t } from "@/lib/i18n";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  byCategory: Array<{ category: string; type: string; total: number; count: number }>;
  daily: Array<{ date: string; type: string; total: number }>;
  incomeByCategory: Array<{ category: string; total: number; count: number }>;
  topItems: Array<{ description: string; type: string; total: number; count: number; avg: number }>;
}

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function fmtDateShort(dateStr: string): string {
  const p = dateStr.split("-");
  return `${parseInt(p[2])} ${THAI_MONTHS[parseInt(p[1]) - 1]}`;
}

function fmtDateFull(dateStr: string): string {
  const p = dateStr.split("-");
  return `${parseInt(p[2])} ${THAI_MONTHS[parseInt(p[1]) - 1]} ${p[0]}`;
}

export default function ReportPage() {
  const { theme, dialect } = useTheme();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summary").then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="card h-40" />)}</div>;
  if (!data) return <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>ไม่สามารถโหลดข้อมูลได้</div>;

  const dailyMap = new Map<string, { date: string; dateLabel: string; income: number; expense: number }>();
  data.daily.forEach((d) => {
    const e = dailyMap.get(d.date) || { date: d.date, dateLabel: fmtDateShort(d.date), income: 0, expense: 0 };
    if (d.type === "income") e.income = d.total; else e.expense = d.total;
    dailyMap.set(d.date, e);
  });
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const expCats = data.byCategory.filter((c) => c.type === "expense").map((c) => ({ name: c.category, value: c.total }));
  const incCats = data.byCategory.filter((c) => c.type === "income").map((c) => ({ name: c.category, value: c.total }));
  const textColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const savingRate = data.totalIncome > 0 ? Math.round(((data.totalIncome - data.totalExpense) / data.totalIncome) * 100) : 0;

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>📊 {t("รายงาน", dialect)}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>สรุปภาพรวมรายรับ-รายจ่าย</p>
        </div>
        <button
          onClick={() => window.open("/api/export-pdf", "_blank")}
          className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
          style={{ background: "var(--accent)", color: "white" }}>
          🖨️ {t("พิมพ์ PDF", dialect)}
        </button>
      </div>

      {/* สรุปยอด 3 ช่อง + อัตราออม */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--income)" }}>📥 รายรับ</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--income)" }}>{data.totalIncome.toLocaleString()}</div>
            <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{data.incomeCount || 0} รายการ</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--expense)" }}>📤 รายจ่าย</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--expense)" }}>{data.totalExpense.toLocaleString()}</div>
            <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{data.expenseCount || 0} รายการ</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--blue)" }}>💰 คงเหลือ</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: data.balance >= 0 ? "var(--blue)" : "var(--expense)" }}>{data.balance.toLocaleString()}</div>
            <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>บาท</div>
          </div>
        </div>

        {/* แถบอัตราส่วน */}
        {data.totalIncome + data.totalExpense > 0 && (
          <div>
            <div className="flex h-4 sm:h-5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
              <div className="h-full transition-all" style={{ width: `${Math.round((data.totalIncome / (data.totalIncome + data.totalExpense)) * 100)}%`, background: "var(--income)" }} />
              <div className="h-full transition-all" style={{ width: `${Math.round((data.totalExpense / (data.totalIncome + data.totalExpense)) * 100)}%`, background: "var(--expense)" }} />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>รายรับ {Math.round((data.totalIncome / (data.totalIncome + data.totalExpense)) * 100)}%</span>
              <span className="font-bold" style={{ color: savingRate >= 20 ? "var(--income)" : savingRate >= 0 ? "var(--blue)" : "var(--expense)" }}>
                อัตราออม {savingRate}%
              </span>
              <span>รายจ่าย {Math.round((data.totalExpense / (data.totalIncome + data.totalExpense)) * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* กราฟแท่งรายวัน — วันที่เป็นไทย */}
      {dailyData.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📈 รายรับ-รายจ่ายรายวัน</h2>
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px] lg:!h-[340px]">
            <BarChart data={dailyData}>
              <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: textColor }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: textColor }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip
                formatter={(v) => `${Number(v).toLocaleString()} บาท`}
                labelFormatter={(label) => `📅 ${label}`}
                contentStyle={{ background: theme === "dark" ? "#1e293b" : "#fff", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14 }}
              />
              <Legend
                formatter={(value) => <span style={{ color: textColor, fontSize: 12 }}>{value}</span>}
              />
              <Bar dataKey="income" name="รายรับ" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* กราฟวงกลม */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        {incCats.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-sm sm:text-base mb-2" style={{ color: "var(--text)" }}>📥 สัดส่วนรายรับ</h2>
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[220px] lg:!h-[260px]">
              <PieChart>
                <Pie data={incCats} cx="50%" cy="50%" outerRadius="70%" dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {incCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} บาท`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {expCats.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-sm sm:text-base mb-2" style={{ color: "var(--text)" }}>📤 สัดส่วนรายจ่าย</h2>
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[220px] lg:!h-[260px]">
              <PieChart>
                <Pie data={expCats} cx="50%" cy="50%" outerRadius="70%" dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {expCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} บาท`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* รายรับ + รายจ่ายแยกหมวด (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {data.incomeByCategory && data.incomeByCategory.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📥 รายรับแยกหมวด</h2>
            <div className="space-y-2">
              {data.incomeByCategory.map((cat) => {
                const pct = data.totalIncome > 0 ? Math.round((cat.total / data.totalIncome) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                        <span className="font-bold" style={{ color: "var(--income)" }}>{cat.total.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: "var(--bg-input)" }}>
                        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--income)" }} />
                      </div>
                    </div>
                    <span className="text-[10px] w-12 text-right" style={{ color: "var(--text-muted)" }}>{cat.count} ครั้ง</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {expCats.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📤 รายจ่ายแยกหมวด</h2>
            <div className="space-y-2">
              {data.byCategory.filter((c) => c.type === "expense").sort((a, b) => b.total - a.total).map((cat) => {
                const pct = data.totalExpense > 0 ? Math.round((cat.total / data.totalExpense) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                        <span className="font-bold" style={{ color: "var(--expense)" }}>{cat.total.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: "var(--bg-input)" }}>
                        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--expense)" }} />
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

      {/* รายการยอดสูงสุด */}
      {data.topItems && data.topItems.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>🏆 รายการยอดสูงสุด</h2>
          <div className="space-y-2">
            {data.topItems.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  background: i < 3 ? "var(--accent)" : "var(--bg-input)",
                  color: i < 3 ? "white" : "var(--text-muted)",
                }}>{i + 1}</span>
                <span className={`w-5 text-center`}>{item.type === "income" ? "📥" : "📤"}</span>
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{item.description}</span>
                <span className="font-bold" style={{ color: item.type === "income" ? "var(--income)" : "var(--expense)" }}>{item.total.toLocaleString()}</span>
                <span className="text-[10px] sm:text-xs w-20 sm:w-28 text-right" style={{ color: "var(--text-muted)" }}>{item.count} ครั้ง ~{item.avg.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
