"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";

const FEATURES = [
  { icon: "📝", title: "บันทึกรายรับ-รายจ่าย", desc: "พิมพ์ภาษาไทย เช่น \"ขายข้าว 3000 บาท\" ระบบจัดหมวดหมู่ให้อัตโนมัติ" },
  { icon: "🎤", title: "สั่งด้วยเสียง", desc: "กดปุ่มไมค์ พูดแทนพิมพ์ เหมาะกับชาวบ้านที่พิมพ์ไม่ถนัด" },
  { icon: "🤖", title: "น้องบัญชี AI", desc: "เลขาส่วนตัว จำบริบทได้ เตือนงบ/หนี้/เป้าออม ให้คำแนะนำการเงิน" },
  { icon: "📷", title: "อ่านรูป slip/ใบเสร็จ", desc: "ส่งรูป → AI วิเคราะห์ → ถามยืนยัน → บันทึกให้อัตโนมัติ" },
  { icon: "🎯", title: "ตั้งเป้าออมเงิน", desc: "ตั้งเป้า + ดู progress ฉลองเมื่อถึงเป้า สร้างแรงจูงใจ" },
  { icon: "💰", title: "ตั้งงบประมาณ", desc: "กำหนดงบแต่ละหมวด เตือนเมื่อใกล้เต็ม/เกินงบ" },
  { icon: "🔔", title: "แจ้งเตือน + รายการซ้ำ", desc: "เตือนจ่ายค่าน้ำ/ไฟ ตั้งรายการซ้ำอัตโนมัติทุกเดือน" },
  { icon: "📋", title: "หนี้สิน & ผ่อนชำระ", desc: "จดหนี้ ธ.ก.ส./กองทุนหมู่บ้าน ติดตามงวดผ่อน เตือนวันจ่าย" },
  { icon: "📅", title: "ปฏิทินการเงิน", desc: "ดูภาพรวมรายวัน วันไหนรับเยอะ/จ่ายเยอะ เห็นชัดเจน" },
  { icon: "🔮", title: "AI พยากรณ์รายจ่าย", desc: "วิเคราะห์แนวโน้ม ทำนายเดือนหน้าจะใช้เท่าไหร่" },
  { icon: "👥", title: "กลุ่มออมทรัพย์", desc: "รวมกลุ่มออมกับเพื่อนบ้าน ติดตามยอดแต่ละคน" },
  { icon: "🏅", title: "เหรียญรางวัล", desc: "ได้เหรียญเมื่อจดบัญชีครบ 7 วัน ออมได้ตามเป้า" },
  { icon: "🧾", title: "Slip เงินเข้า/เงินออก", desc: "ถ่ายรูป slip โอนเงิน AI อ่านอัตโนมัติ แยกเงินเข้า-ออก" },
  { icon: "📥", title: "เอกสารเงินเข้า/ออก", desc: "เก็บใบเสร็จ บิล สัญญา แยกหมวดเงินเข้า-เงินออกชัดเจน" },
  { icon: "📊", title: "รายงานกราฟ + PDF", desc: "กราฟรายวัน วงกลมหมวด พิมพ์ PDF ยื่นกู้/ส่ง อบต." },
  { icon: "💬", title: "Telegram Bot", desc: "ใช้ผ่าน Telegram ได้เลย ข้อมูลเชื่อมกันกับเว็บ" },
  { icon: "🔐", title: "Google Sign-In", desc: "เข้าสู่ระบบด้วย Google ข้อมูลแยกตาม Email ส่วนตัว" },
  { icon: "🏮", title: "ภาษาถิ่น", desc: "รองรับภาษากลาง อีสาน เหนือ ใต้ เปลี่ยนแบบ Realtime" },
  { icon: "📱", title: "ออกแบบสำหรับมือถือ", desc: "ตัวหนังสือใหญ่ ปุ่มใหญ่ ภาษาไทย 100% ธีมมืด/สว่าง" },
];

const TECH = [
  { name: "Next.js 16", desc: "เว็บแอปพลิเคชัน" },
  { name: "MongoDB Atlas", desc: "ฐานข้อมูลบน Cloud" },
  { name: "Cloudflare R2", desc: "เก็บไฟล์/รูปภาพ" },
  { name: "OpenClaw + Gemini", desc: "AI อัจฉริยะ" },
  { name: "Telegram Bot", desc: "แชทบอท" },
  { name: "Docker", desc: "ระบบ Deploy" },
];

export function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ปุ่มธีม */}
      <button onClick={toggle}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {/* ===== Hero ===== */}
      <section className="text-center px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="text-7xl sm:text-8xl mb-4">🏡</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3" style={{ color: "var(--text)" }}>
          บัญชีครัวเรือน
        </h1>
        <p className="text-xl sm:text-2xl mb-2" style={{ color: "var(--text-sub)" }}>
          บันทึกรายรับ-รายจ่ายอัจฉริยะ สำหรับชาวบ้านไทย
        </p>
        <p className="text-sm sm:text-base mb-8" style={{ color: "var(--text-muted)" }}>
          ใช้ง่าย พิมพ์ภาษาไทย ส่งรูป slip AI จัดการให้หมด
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/login"
            className="px-8 py-4 rounded-2xl text-white text-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            style={{ background: "var(--accent)" }}>
            ทดลองใช้ฟรี
          </Link>
          <a href="https://github.com/smlsoft/demo001" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 active:scale-95 transition-transform"
            style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
            ดูโค้ดบน GitHub
          </a>
        </div>
      </section>

      {/* ===== คุณสมบัติ ===== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: "var(--text)" }}>
          คุณสมบัติของระบบ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card text-center hover:scale-[1.02] transition-transform">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-sub)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Demo Users ===== */}
      <section className="py-16 px-4" style={{ background: "var(--bg-card)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--text)" }}>
            ทดลองใช้ได้เลย
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--text-sub)" }}>
            มีบัญชีตัวอย่าง 5 คน ข้อมูลย้อนหลัง 1 ปี สมจริงตามอาชีพชาวบ้านไทย
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { avatar: "🌾", name: "สมชาย", occ: "ชาวนา" },
              { avatar: "🏪", name: "สมหญิง", occ: "ค้าขาย" },
              { avatar: "🔧", name: "สมศักดิ์", occ: "รับจ้าง" },
              { avatar: "🌿", name: "สมใจ", occ: "ทำสวน" },
              { avatar: "🐄", name: "สมปอง", occ: "เลี้ยงสัตว์" },
            ].map((u) => (
              <div key={u.name} className="card text-center">
                <div className="text-4xl mb-1">{u.avatar}</div>
                <div className="font-bold" style={{ color: "var(--text)" }}>{u.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{u.occ}</div>
              </div>
            ))}
          </div>
          <Link href="/login"
            className="inline-block mt-8 px-8 py-4 rounded-2xl text-white text-lg font-bold hover:scale-105 transition-transform"
            style={{ background: "var(--accent)" }}>
            เข้าใช้งาน
          </Link>
        </div>
      </section>

      {/* ===== เทคโนโลยี ===== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: "var(--text)" }}>
          เทคโนโลยีที่ใช้
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Open Source — ดาวน์โหลดไปศึกษาและพัฒนาต่อได้ฟรี
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TECH.map((t) => (
            <div key={t.name} className="card text-center">
              <div className="font-bold text-sm" style={{ color: "var(--accent)" }}>{t.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== สถาปัตยกรรม ===== */}
      <section className="py-16 px-4" style={{ background: "var(--bg-card)" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: "var(--text)" }}>
            สถาปัตยกรรมระบบ
          </h2>
          <div className="card font-mono text-sm sm:text-base overflow-x-auto" style={{ color: "var(--text-sub)" }}>
            <pre>{`ชาวบ้าน (พิมพ์/พูด/ส่งรูป)
  ├── 📱 Telegram Bot
  └── 🌐 เว็บ (มือถือ/คอม)
         │
         ▼
   AI Engine (แกนกลาง)
   ├── Built-in Parser → บันทึกรายรับ-รายจ่าย
   ├── OpenClaw → AI + พยากรณ์ + เตือนงบ/หนี้
   ├── Vision AI → อ่าน slip/ใบเสร็จ
   └── OpenRouter/Gemini (สำรอง)
         │
         ▼
   MongoDB Atlas (ข้อมูล) + R2 (ไฟล์)
   ├── 10+ Compound Indexes
   ├── $facet Aggregation
   └── Connection Pool 20`}</pre>
          </div>
        </div>
      </section>

      {/* ===== GitHub ===== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--text)" }}>
          เปิดให้ศึกษาฟรี
        </h2>
        <p className="text-base mb-6" style={{ color: "var(--text-sub)" }}>
          ดาวน์โหลด Source Code ไปศึกษา ปรับแต่ง หรือพัฒนาต่อยอดได้
        </p>
        <a href="https://github.com/smlsoft/demo001" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition-transform"
          style={{ background: "var(--bg-card)", color: "var(--text)", border: "2px solid var(--border)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          github.com/smlsoft/demo001
        </a>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 px-4 text-center text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        <p>พัฒนาตามปรัชญาเศรษฐกิจพอเพียง — เพื่อชาวบ้านไทย</p>
        <p className="mt-1">Powered by OpenClaw AI + Next.js + MongoDB</p>
      </footer>
    </div>
  );
}
