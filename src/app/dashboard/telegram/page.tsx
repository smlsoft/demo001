"use client";

import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function TelegramPage() {
  const [status, setStatus] = useState<"idle" | "linking" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const botUsername = "ThaiClawBot";

  // Telegram Login Widget callback
  const handleTelegramAuth = useCallback(async (user: any) => {
    setStatus("linking");
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "เชื่อมต่อไม่สำเร็จ");
      }
    } catch {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาด ลองใหม่");
    }
  }, []);

  // ตั้ง global callback + ฝัง Widget ผ่าน DOM
  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;

    if (widgetRef.current && status === "idle") {
      widgetRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?23";
      script.async = true;
      script.setAttribute("data-telegram-login", botUsername);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "12");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      widgetRef.current.appendChild(script);
    }
  }, [handleTelegramAuth, status]);

  // สร้าง deep link (ทางเลือก)
  async function generateLink() {
    setLinkLoading(true);
    try {
      const res = await fetch("/api/telegram-link", { method: "POST" });
      const data = await res.json();
      if (data.link) setLinkUrl(data.link);
    } catch {}
    setLinkLoading(false);
  }

  return (
    <div className="space-y-4 lg:max-w-3xl lg:mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>📱 เชื่อมต่อ Telegram</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>เชื่อมบัญชีเว็บกับ Telegram — ข้อมูลเชื่อมกันทันที</p>
      </div>

      {/* ===== วิธีที่ 1: Telegram Login Widget (ง่ายที่สุด) ===== */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>🔗 วิธีที่ 1: กดปุ่มเชื่อมต่อ (ง่ายที่สุด)</h2>

        {status === "idle" && (
          <>
            <p className="text-sm mb-4" style={{ color: "var(--text-sub)" }}>
              กดปุ่มด้านล่าง → เข้าสู่ระบบ Telegram → เชื่อมเสร็จทันที!
            </p>

            {/* Telegram Login Widget — ฝังผ่าน DOM */}
            <div className="flex justify-center py-4" ref={widgetRef} />

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              กดปุ่ม &quot;Log in with Telegram&quot; ด้านบน
            </p>
          </>
        )}

        {status === "linking" && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            <p style={{ color: "var(--text-sub)" }}>กำลังเชื่อมต่อ...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>เชื่อมต่อสำเร็จ!</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>{message}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>เปิด Telegram แล้วพิมพ์ &quot;สรุปยอด&quot; ลองได้เลย!</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">❌</div>
            <p className="text-lg font-bold" style={{ color: "var(--expense)" }}>{message}</p>
            <button onClick={() => setStatus("idle")}
              className="mt-4 px-4 py-2 rounded-xl font-medium"
              style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}>
              ลองใหม่
            </button>
          </div>
        )}
      </div>

      {/* ===== วิธีที่ 2: Deep Link (สำหรับมือถือ) ===== */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>📱 วิธีที่ 2: เปิดลิงก์ในมือถือ</h2>
        <p className="text-sm mb-3" style={{ color: "var(--text-sub)" }}>
          สำหรับมือถือ — กดสร้างลิงก์ แล้วเปิดใน Telegram กด Start เชื่อมเลย
        </p>

        {!linkUrl ? (
          <button onClick={generateLink} disabled={linkLoading}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ background: "var(--bg-input)", color: "var(--text)", border: "1px solid var(--border)", opacity: linkLoading ? 0.5 : 1 }}>
            {linkLoading ? "กำลังสร้าง..." : "📱 สร้างลิงก์สำหรับมือถือ"}
          </button>
        ) : (
          <div className="space-y-2">
            <button onClick={() => window.open(linkUrl, "_blank")}
              className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
              style={{ background: "#0088cc" }}>
              📱 เปิด Telegram เชื่อมต่อ
            </button>
            <div className="flex gap-2">
              <input type="text" value={linkUrl} readOnly className="flex-1 border rounded-lg px-3 py-2 text-xs" />
              <button onClick={() => { navigator.clipboard.writeText(linkUrl); alert("คัดลอกแล้ว!"); }}
                className="px-3 py-2 rounded-lg text-white text-xs font-medium" style={{ background: "var(--accent)" }}>
                คัดลอก
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>ลิงก์ใช้ได้ 10 นาที · กด Start ใน Telegram</p>
          </div>
        )}
      </div>

      {/* ===== ตัวอย่างใช้งาน ===== */}
      <div className="card">
        <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>💡 ตัวอย่างใช้งานผ่าน Telegram</h2>
        <div className="space-y-2">
          {[
            { text: "ขายข้าว 3000 บาท", desc: "📥 บันทึกรายรับ" },
            { text: "ซื้อปุ๋ย 500 บาท", desc: "📤 บันทึกรายจ่าย" },
            { text: "สรุปยอด", desc: "📊 ดูยอดคงเหลือ" },
            { text: "📷 ส่งรูป slip", desc: "🧾 AI อ่าน slip อัตโนมัติ" },
          ].map((ex) => (
            <div key={ex.text} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: "var(--accent)" }}>{ex.text}</div>
                <div className="text-xs" style={{ color: "var(--text-sub)" }}>{ex.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ยังไม่มี Telegram ===== */}
      <div className="card">
        <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📲 ยังไม่มี Telegram?</h2>
        <p className="text-sm mb-3" style={{ color: "var(--text-sub)" }}>ดาวน์โหลดฟรี ใช้เบอร์โทรสมัคร</p>
        <div className="flex gap-3 flex-wrap">
          <a href="https://play.google.com/store/apps/details?id=org.telegram.messenger" target="_blank" rel="noopener"
            className="px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
            style={{ background: "var(--accent)", color: "white" }}>
            🤖 Android
          </a>
          <a href="https://apps.apple.com/app/telegram-messenger/id686449807" target="_blank" rel="noopener"
            className="px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
            style={{ background: "var(--blue)", color: "white" }}>
            🍎 iPhone
          </a>
        </div>
      </div>
    </div>
  );
}
