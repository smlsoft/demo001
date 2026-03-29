"use client";

import { useState } from "react";

export default function TelegramPage() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "1. เปิด Telegram",
      icon: "📱",
      content: (
        <div className="space-y-3">
          <p>ดาวน์โหลดแอป <b>Telegram</b> ก่อน (ถ้ายังไม่มี)</p>
          <div className="flex gap-3 flex-wrap">
            <a href="https://play.google.com/store/apps/details?id=org.telegram.messenger" target="_blank" rel="noopener"
              className="px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
              style={{ background: "var(--accent)", color: "white" }}>
              🤖 Android (Google Play)
            </a>
            <a href="https://apps.apple.com/app/telegram-messenger/id686449807" target="_blank" rel="noopener"
              className="px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
              style={{ background: "var(--blue)", color: "white" }}>
              🍎 iPhone (App Store)
            </a>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            สมัคร Telegram ใช้เบอร์โทรศัพท์ ฟรีไม่มีค่าใช้จ่าย
          </p>
        </div>
      ),
    },
    {
      title: "2. ค้นหาบอท บัญชีครัวเรือน",
      icon: "🔍",
      content: (
        <div className="space-y-3">
          <p>ใน Telegram กดปุ่ม <b>ค้นหา (Search)</b> ด้านบน แล้วพิมพ์:</p>
          <div className="card text-center text-xl font-bold" style={{ color: "var(--accent)" }}>
            @ThaiClawBot
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            หรือกดลิงก์นี้ได้เลย:
          </p>
          <a href="https://t.me/ThaiClawBot" target="_blank" rel="noopener"
            className="block text-center px-4 py-3 rounded-xl font-medium"
            style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
            🔗 เปิดบอท t.me/ThaiClawBot
          </a>
          <div className="p-3 rounded-xl text-sm" style={{ background: "var(--bg-input)" }}>
            <p className="font-bold">📌 ถ้าหาไม่เจอ:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1" style={{ color: "var(--text-sub)" }}>
              <li>ตรวจสอบว่าพิมพ์ถูก: @ThaiClawBot (มี @ นำหน้า)</li>
              <li>ลองกดลิงก์ด้านบนแทน</li>
              <li>ต้องมีอินเทอร์เน็ต</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "3. กด START เริ่มใช้งาน",
      icon: "▶️",
      content: (
        <div className="space-y-3">
          <p>เมื่อเปิดบอทแล้ว กดปุ่ม <b>START</b> หรือ <b>เริ่ม</b> ด้านล่าง</p>
          <div className="card text-center">
            <div className="text-4xl mb-2">👆</div>
            <div className="inline-block px-8 py-3 rounded-xl text-white font-bold" style={{ background: "var(--accent)" }}>
              START
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            บอทจะทักทายและพร้อมใช้งาน
          </p>
        </div>
      ),
    },
    {
      title: "4. เลือกตัวตน (ผู้ใช้)",
      icon: "👤",
      content: (
        <div className="space-y-3">
          <p>บอทจะถามว่าคุณเป็นใคร กดเลือกชื่อของคุณ:</p>
          <div className="space-y-2">
            {[
              { name: "สมชาย", job: "ชาวนา", icon: "🌾" },
              { name: "สมหญิง", job: "ค้าขาย", icon: "🏪" },
              { name: "สมศักดิ์", job: "รับจ้าง", icon: "🔧" },
              { name: "สมใจ", job: "ทำสวน", icon: "🌿" },
              { name: "สมปอง", job: "เลี้ยงสัตว์", icon: "🐄" },
            ].map((u) => (
              <div key={u.name} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                <span className="text-2xl">{u.icon}</span>
                <div>
                  <div className="font-bold" style={{ color: "var(--text)" }}>{u.name}</div>
                  <div className="text-sm" style={{ color: "var(--text-sub)" }}>{u.job}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "5. เริ่มใช้งาน! พิมพ์ได้เลย",
      icon: "✅",
      content: (
        <div className="space-y-3">
          <p>เชื่อมต่อเสร็จแล้ว! ลองพิมพ์ข้อความ:</p>
          <div className="space-y-2">
            {[
              { text: "ขายข้าว 3000 บาท", desc: "บันทึกรายรับ" },
              { text: "ซื้อปุ๋ย 500 บาท", desc: "บันทึกรายจ่าย" },
              { text: "สรุปยอด", desc: "ดูยอดคงเหลือ" },
              { text: "📷 ส่งรูป slip", desc: "อ่านรูปใบเสร็จ" },
            ].map((ex) => (
              <div key={ex.text} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                <div className="flex-1">
                  <div className="font-bold" style={{ color: "var(--accent)" }}>{ex.text}</div>
                  <div className="text-sm" style={{ color: "var(--text-sub)" }}>{ex.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--accent-light)" }}>
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold" style={{ color: "var(--accent)" }}>ข้อมูลเชื่อมกันทั้ง เว็บ และ Telegram!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>
              บันทึกผ่าน Telegram → เห็นในเว็บทันที
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 lg:max-w-3xl lg:mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>📱 เชื่อมต่อ Telegram</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>ใช้บัญชีครัวเรือนผ่าน Telegram ได้ง่ายๆ ทำตามขั้นตอนนี้</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-2 rounded-full transition-all"
            style={{ background: i <= step ? "var(--accent)" : "var(--bg-input)" }} />
        ))}
      </div>

      {/* Current step */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{steps[step].icon}</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{steps[step].title}</h2>
        </div>
        {steps[step].content}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl font-bold"
            style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}>
            ← ย้อนกลับ
          </button>
        )}
        {step < steps.length - 1 && (
          <button onClick={() => setStep(step + 1)}
            className="flex-1 py-3 rounded-xl font-bold text-white"
            style={{ background: "var(--accent)" }}>
            ขั้นตอนถัดไป →
          </button>
        )}
      </div>

      {/* All steps overview */}
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: "var(--text)" }}>📋 ขั้นตอนทั้งหมด</h3>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-colors"
              style={{
                background: i === step ? "var(--accent-light)" : "transparent",
                color: i <= step ? "var(--accent)" : "var(--text-muted)",
              }}>
              <span className="text-lg">{i < step ? "✅" : i === step ? s.icon : "⬜"}</span>
              <span className="font-medium text-sm">{s.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
