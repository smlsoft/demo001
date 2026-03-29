"use client";

import { useEffect, useState } from "react";

interface Achievement {
  _id: string;
  type: string;
  title: string;
  icon: string;
  earnedAt?: string;
}

interface AchievementDef {
  type: string;
  title: string;
  icon: string;
  earned: boolean;
}

interface AchievementData {
  achievements: Achievement[];
  newAchievements: Achievement[];
  stats: {
    txCount: number;
    streak: number;
    savingRate: number;
  };
  allDefs: AchievementDef[];
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/achievements");
      if (res.ok) {
        const d: AchievementData = await res.json();
        setData(d);
        if (d.newAchievements && d.newAchievements.length > 0) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      }
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>เหรียญรางวัล</h1>
        <div className="space-y-2 animate-pulse">
          <div className="card h-24" />
          <div className="card h-48" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>เหรียญรางวัล</h1>
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ไม่สามารถโหลดข้อมูลได้</p>
        </div>
      </div>
    );
  }

  const { stats, allDefs, newAchievements } = data;
  const earnedCount = allDefs.filter((d) => d.earned).length;

  return (
    <div className="space-y-4">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="card text-center space-y-4 mx-4"
            style={{ maxWidth: 360, animation: "celebrationPop 0.5s ease-out" }}
          >
            <div className="text-6xl">🎉</div>
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>ยินดีด้วย!</div>
            <div className="text-sm" style={{ color: "var(--text-sub)" }}>คุณได้รับเหรียญรางวัลใหม่!</div>
            <div className="flex flex-wrap justify-center gap-3">
              {newAchievements.map((a) => (
                <div key={a.type} className="text-center">
                  <div className="text-4xl mb-1">{a.icon}</div>
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{a.title}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-2 rounded-xl text-white font-medium"
              style={{ background: "var(--accent)" }}
            >
              เยี่ยมไปเลย!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes celebrationPop {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>เหรียญรางวัล</h1>

      {/* Stats */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-1">📝</div>
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>{stats.txCount}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>รายการทั้งหมด</div>
          </div>
          <div>
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>{stats.streak}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>วันติดต่อกัน</div>
          </div>
          <div>
            <div className="text-3xl mb-1">💰</div>
            <div className="text-xl font-bold" style={{ color: stats.savingRate >= 0 ? "var(--income)" : "var(--expense)" }}>
              {stats.savingRate}%
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>อัตราออม</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>ความสำเร็จ</span>
          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            {earnedCount} / {allDefs.length}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: allDefs.length > 0 ? `${Math.round((earnedCount / allDefs.length) * 100)}%` : "0%",
              background: "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {allDefs.map((def) => {
          const isNew = newAchievements.some((a) => a.type === def.type);
          return (
            <div
              key={def.type}
              className="card text-center py-4 px-2 transition-all"
              style={{
                opacity: def.earned ? 1 : 0.4,
                filter: def.earned ? "none" : "grayscale(1)",
                border: isNew ? "2px solid var(--accent)" : undefined,
                position: "relative",
              }}
            >
              {isNew && (
                <div
                  className="absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full text-white font-bold"
                  style={{ background: "var(--accent)", fontSize: 10 }}
                >
                  ใหม่!
                </div>
              )}
              <div className="text-3xl sm:text-4xl mb-2">{def.icon}</div>
              <div
                className="text-xs font-medium leading-tight"
                style={{ color: def.earned ? "var(--text)" : "var(--text-muted)" }}
              >
                {def.title}
              </div>
              {!def.earned && (
                <div className="text-lg mt-1" style={{ color: "var(--text-muted)" }}>🔒</div>
              )}
            </div>
          );
        })}
      </div>

      {allDefs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีเหรียญรางวัล</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>บันทึกรายรับ-รายจ่ายเพื่อสะสมเหรียญ</p>
        </div>
      )}
    </div>
  );
}
