"use client";

import { useState } from "react";

export default function TelegramPage() {
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);

  async function generateLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram-link", { method: "POST" });
      const data = await res.json();
      if (data.link) {
        setLinkUrl(data.link);
      }
    } catch {}
    setLoading(false);
  }

  function openTelegram() {
    if (linkUrl) {
      window.open(linkUrl, "_blank");
      setLinked(true);
    }
  }

  return (
    <div className="space-y-4 lg:max-w-3xl lg:mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>📱 เชื่อมต่อ Telegram</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>เชื่อมบัญชีเว็บกับ Telegram — ข้อมูลเชื่อมกันทันที</p>
      </div>

      {/* ===== วิธีง่าย: กดปุ่มเดียว ===== */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>🔗 เชื่อมต่อแบบง่าย (กดปุ่มเดียว)</h2>

        {!linkUrl ? (
          <>
            <p className="text-sm mb-4" style={{ color: "var(--text-sub)" }}>
              ระบบจะสร้างลิงก์เฉพาะสำหรับคุณ เปิดใน Telegram แล้วกด Start = เชื่อมเสร็จ!
            </p>
            <button onClick={generateLink} disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", opacity: loading ? 0.5 : 1 }}>
              {loading ? "กำลังสร้างลิงก์..." : "🔗 สร้างลิงก์เชื่อมต่อ Telegram"}
            </button>
          </>
        ) : !linked ? (
          <>
            <p className="text-sm mb-3" style={{ color: "var(--text-sub)" }}>
              ลิงก์พร้อมแล้ว! กดปุ่มด้านล่างเพื่อเปิดใน Telegram
            </p>
            <button onClick={openTelegram}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: "#0088cc" }}>
              📱 เปิด Telegram เชื่อมต่อเลย
            </button>
            <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
              ลิงก์ใช้ได้ 10 นาที · กด Start ใน Telegram เพื่อเชื่อมต่อ
            </p>

            {/* QR / Copy */}
            <div className="mt-3 p-3 rounded-xl text-center" style={{ background: "var(--bg-input)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>หรือคัดลอกลิงก์นี้ส่งให้ตัวเอง:</p>
              <div className="flex gap-2">
                <input type="text" value={linkUrl} readOnly className="flex-1 border rounded-lg px-3 py-2 text-xs" />
                <button onClick={() => { navigator.clipboard.writeText(linkUrl); alert("คัดลอกแล้ว!"); }}
                  className="px-3 py-2 rounded-lg text-white text-xs font-medium" style={{ background: "var(--accent)" }}>
                  คัดลอก
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>เปิด Telegram แล้ว!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>กด Start ใน Telegram เพื่อเชื่อมต่อให้เสร็จ</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>แล้วลองพิมพ์ "สรุปยอด" ดู</p>
            <button onClick={() => { setLinkUrl(""); setLinked(false); }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}>
              🔄 สร้างลิงก์ใหม่
            </button>
          </div>
        )}
      </div>

      {/* ===== ขั้นตอนทำอะไรบ้าง ===== */}
      <div className="card">
        <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>📋 ขั้นตอนทั้งหมด</h2>
        <div className="space-y-3">
          {[
            { icon: "1️⃣", title: "กดปุ่ม \"สร้างลิงก์\" ด้านบน", desc: "ระบบสร้างลิงก์เฉพาะสำหรับบัญชีของคุณ" },
            { icon: "2️⃣", title: "กด \"เปิด Telegram\"", desc: "จะเปิดแอป Telegram ไปที่ bot บัญชีครัวเรือน" },
            { icon: "3️⃣", title: "กด START ใน Telegram", desc: "bot จะแจ้งว่าเชื่อมต่อสำเร็จ!" },
            { icon: "4️⃣", title: "เสร็จ! ใช้ได้เลย", desc: "พิมพ์ข้อความ ส่งรูป slip ข้อมูลเชื่อมกับเว็บ" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.title}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
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
            { text: "แนะนำวิธีออมเงิน", desc: "💡 ขอคำแนะนำ" },
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

      {/* ===== สำหรับคนยังไม่มี Telegram ===== */}
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
