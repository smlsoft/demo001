"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import Script from "next/script";

const DEMO_USERS = [
  { id: "demo-1", name: "สมชาย", occ: "ชาวนา", avatar: "🌾", bg: "from-green-500 to-emerald-600" },
  { id: "demo-2", name: "สมหญิง", occ: "ค้าขาย", avatar: "🏪", bg: "from-blue-500 to-indigo-600" },
  { id: "demo-3", name: "สมศักดิ์", occ: "รับจ้าง", avatar: "🔧", bg: "from-orange-500 to-red-500" },
  { id: "demo-4", name: "สมใจ", occ: "ทำสวน", avatar: "🌿", bg: "from-teal-500 to-green-600" },
  { id: "demo-5", name: "สมปอง", occ: "เลี้ยงสัตว์", avatar: "🐄", bg: "from-amber-500 to-orange-600" },
];

declare global {
  interface Window {
    google?: any;
    handleGoogleSignIn?: (response: any) => void;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");

  // ดึง Google Client ID จาก env
  useEffect(() => {
    fetch("/api/auth/google-config")
      .then((r) => r.json())
      .then((d) => setGoogleClientId(d.clientId || ""))
      .catch(() => {});
  }, []);

  // Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response: any) => {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setGoogleError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch {
      setGoogleError("เกิดข้อผิดพลาด ลองใหม่");
    }
    setGoogleLoading(false);
  }, [router]);

  // ตั้ง global callback สำหรับ Google
  useEffect(() => {
    window.handleGoogleSignIn = handleGoogleCallback;
  }, [handleGoogleCallback]);

  // Init Google button เมื่อ script โหลดเสร็จ
  const initGoogle = useCallback(() => {
    if (!window.google || !googleClientId) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCallback,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-btn"),
      { theme: theme === "dark" ? "filled_black" : "outline", size: "large", width: "100%", text: "signin_with", locale: "th" }
    );
  }, [googleClientId, handleGoogleCallback, theme]);

  useEffect(() => {
    if (googleClientId) initGoogle();
  }, [googleClientId, initGoogle]);

  async function login(id: string) {
    setLoading(id);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) router.push("/dashboard");
    setLoading(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg)" }}>
      {/* Google GSI Script */}
      {googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} strategy="lazyOnload" />
      )}

      {/* ปุ่มธีม */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="text-center mb-8">
        <div className="text-6xl sm:text-7xl mb-3">🏡</div>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--text)" }}>บัญชีครัวเรือน</h1>
        <p className="text-lg sm:text-xl mt-1" style={{ color: "var(--text-sub)" }}>บันทึกรายรับ-รายจ่ายง่ายๆ</p>
      </div>

      <div className="card w-full max-w-md sm:max-w-lg">
        {/* ===== Google Sign-In ===== */}
        {googleClientId && (
          <>
            <h2 className="text-lg font-bold text-center mb-4" style={{ color: "var(--text)" }}>
              เข้าสู่ระบบด้วย Google
            </h2>
            <div className="flex justify-center mb-3">
              <div id="google-signin-btn" />
            </div>
            {googleLoading && (
              <div className="text-center text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                กำลังเข้าสู่ระบบ...
              </div>
            )}
            {googleError && (
              <div className="text-center text-sm mb-3" style={{ color: "var(--expense)" }}>
                {googleError}
              </div>
            )}
            <p className="text-xs text-center mb-4" style={{ color: "var(--text-muted)" }}>
              ข้อมูลแยกตาม Email — บัญชีส่วนตัวของคุณ
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>หรือ ทดลองใช้</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          </>
        )}

        {/* ===== Demo Users (ของเดิม) ===== */}
        <h2 className="text-xl font-bold text-center mb-5" style={{ color: "var(--text)" }}>
          {googleClientId ? "เลือกบัญชีทดลอง" : "กดเลือกชื่อเพื่อเข้าใช้"}
        </h2>
        <div className="space-y-3">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => login(u.id)}
              disabled={loading !== null}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r ${u.bg} text-white
                hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] transition-all duration-200
                disabled:opacity-50`}
            >
              <span className="text-5xl">{u.avatar}</span>
              <div className="text-left">
                <div className="text-2xl font-bold">{u.name}</div>
                <div className="text-base opacity-90">{u.occ}</div>
              </div>
              {loading === u.id && (
                <div className="ml-auto w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))}
        </div>
        <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
          ทดลองใช้ — ข้อมูลแต่ละคนแยกกัน
        </p>
      </div>
    </div>
  );
}
