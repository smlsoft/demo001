"use client";

import { useEffect, useState } from "react";

interface CategoryForecast {
  category: string;
  forecast: number;
}

interface ForecastData {
  forecast: {
    nextMonthIncome: number;
    nextMonthExpense: number;
    trend: number;
    savingRate: number;
    byCategory: CategoryForecast[];
  } | null;
  history: { month: string; income: number; expense: number }[];
  tips: string[];
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/forecast");
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>พยากรณ์การเงิน</h1>
        <div className="space-y-2 animate-pulse">
          <div className="card h-24" />
          <div className="card h-48" />
          <div className="card h-32" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>พยากรณ์การเงิน</h1>
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔮</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ไม่สามารถโหลดข้อมูลได้</p>
        </div>
      </div>
    );
  }

  const { forecast, history, tips } = data;

  // No forecast data yet
  if (!forecast) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>พยากรณ์การเงิน</h1>
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔮</div>
          <p className="text-xl font-bold" style={{ color: "var(--text)" }}>ข้อมูลยังไม่พอ</p>
          <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>
            บันทึกรายรับ-รายจ่ายอย่างน้อย 2-3 เดือน
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            เพื่อให้ AI วิเคราะห์แนวโน้มการเงินของคุณได้
          </p>
        </div>

        {/* Still show tips if available */}
        {tips && tips.length > 0 && (
          <div className="card space-y-2">
            <div className="font-bold text-lg" style={{ color: "var(--text)" }}>💡 คำแนะนำ</div>
            {tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-input)" }}
              >
                <span style={{ color: "var(--accent)" }}>•</span>
                <span style={{ color: "var(--text-sub)" }}>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const predictedSaving = forecast.nextMonthIncome - forecast.nextMonthExpense;
  const trendUp = forecast.trend >= 0;
  const historyMax = Math.max(...history.map((h) => Math.max(h.income, h.expense)), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>พยากรณ์การเงิน</h1>
        <div className="text-2xl">🔮</div>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>รายรับคาดการณ์</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--income)" }}>
            {forecast.nextMonthIncome.toLocaleString()} ฿
          </div>
        </div>
        <div className="card text-center">
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>รายจ่ายคาดการณ์</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--expense)" }}>
            {forecast.nextMonthExpense.toLocaleString()} ฿
          </div>
        </div>
        <div className="card text-center">
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>เงินออมคาดการณ์</div>
          <div
            className="text-xl font-bold mt-1"
            style={{ color: predictedSaving >= 0 ? "var(--income)" : "var(--expense)" }}
          >
            {predictedSaving >= 0 ? "+" : ""}{predictedSaving.toLocaleString()} ฿
          </div>
        </div>
      </div>

      {/* Trend + Saving Rate */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{
                background: trendUp ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                color: trendUp ? "var(--income)" : "var(--expense)",
              }}
            >
              {trendUp ? "↑" : "↓"}
            </div>
            <div>
              <div className="font-bold" style={{ color: "var(--text)" }}>
                แนวโน้มการเงิน
              </div>
              <div className="text-sm" style={{ color: trendUp ? "var(--income)" : "var(--expense)" }}>
                {trendUp ? "ดีขึ้น" : "ลดลง"} {Math.abs(forecast.trend)}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>อัตราออม</div>
            <div
              className="text-lg font-bold"
              style={{ color: forecast.savingRate >= 0 ? "var(--income)" : "var(--expense)" }}
            >
              {forecast.savingRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {forecast.byCategory && forecast.byCategory.length > 0 && (
        <div className="card space-y-3">
          <div className="font-bold text-lg" style={{ color: "var(--text)" }}>คาดการณ์ตามหมวดหมู่</div>
          <div className="space-y-2">
            {forecast.byCategory.map((cat) => {
              const maxCat = Math.max(...forecast.byCategory.map((c) => c.forecast), 1);
              const pct = Math.round((cat.forecast / maxCat) * 100);
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "var(--text-sub)" }}>{cat.category}</span>
                    <span className="text-sm font-bold" style={{ color: "var(--expense)" }}>
                      {cat.forecast.toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: "var(--expense)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly History */}
      {history && history.length > 0 && (
        <div className="card space-y-3">
          <div className="font-bold text-lg" style={{ color: "var(--text)" }}>ย้อนหลังรายเดือน</div>
          <div className="space-y-3">
            {history.map((h) => {
              const incPct = Math.round((h.income / historyMax) * 100);
              const expPct = Math.round((h.expense / historyMax) * 100);
              return (
                <div key={h.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{h.month}</span>
                    <div className="flex gap-3 text-xs">
                      <span style={{ color: "var(--income)" }}>รับ {h.income.toLocaleString()}</span>
                      <span style={{ color: "var(--expense)" }}>จ่าย {h.expense.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${incPct}%`, background: "var(--income)", minWidth: 4 }}
                    />
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${expPct}%`, background: "var(--expense)", minWidth: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs pt-1" style={{ color: "var(--text-muted)" }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: "var(--income)" }} />
              รายรับ
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: "var(--expense)" }} />
              รายจ่าย
            </div>
          </div>
        </div>
      )}

      {/* AI Tips */}
      {tips && tips.length > 0 && (
        <div className="card space-y-2">
          <div className="font-bold text-lg" style={{ color: "var(--text)" }}>💡 AI แนะนำ</div>
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-input)" }}
            >
              <span style={{ color: "var(--accent)" }}>•</span>
              <span style={{ color: "var(--text-sub)" }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
