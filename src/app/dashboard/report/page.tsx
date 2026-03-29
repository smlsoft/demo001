"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "@/lib/theme";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Array<{ category: string; type: string; total: number }>;
  daily: Array<{ date: string; type: string; total: number }>;
}

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function ReportPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summary").then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="card h-40" />)}</div>;
  if (!data) return <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>ไม่สามารถโหลดข้อมูลได้</div>;

  const dailyMap = new Map<string, { date: string; income: number; expense: number }>();
  data.daily.forEach((d) => {
    const e = dailyMap.get(d.date) || { date: d.date, income: 0, expense: 0 };
    if (d.type === "income") e.income = d.total; else e.expense = d.total;
    dailyMap.set(d.date, e);
  });
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const expCats = data.byCategory.filter((c) => c.type === "expense").map((c) => ({ name: c.category, value: c.total }));
  const incCats = data.byCategory.filter((c) => c.type === "income").map((c) => ({ name: c.category, value: c.total }));
  const textColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <div className="space-y-5 lg:space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>รายงาน</h1>

      {/* สรุป */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xs sm:text-sm" style={{ color: "var(--income)" }}>รายรับ</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--income)" }}>{data.totalIncome.toLocaleString()}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs sm:text-sm" style={{ color: "var(--expense)" }}>รายจ่าย</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--expense)" }}>{data.totalExpense.toLocaleString()}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs sm:text-sm" style={{ color: "var(--blue)" }}>คงเหลือ</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--blue)" }}>{data.balance.toLocaleString()}</div>
        </div>
      </div>

      {/* กราฟแท่ง */}
      {dailyData.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>รายรับ-รายจ่ายรายวัน</h2>
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px] lg:!h-[340px]">
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: textColor }} />
              <YAxis tick={{ fontSize: 9, fill: textColor }} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString()} บาท`} />
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
            <h2 className="font-bold text-sm sm:text-base mb-2" style={{ color: "var(--text)" }}>สัดส่วนรายรับ</h2>
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
            <h2 className="font-bold text-sm sm:text-base mb-2" style={{ color: "var(--text)" }}>สัดส่วนรายจ่าย</h2>
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
    </div>
  );
}
