# 🏡 บัญชีครัวเรือน (ThaiClaw)

ระบบบันทึกรายรับ-รายจ่ายอัจฉริยะสำหรับชาวบ้านไทย พร้อม AI ผู้ช่วย "น้องบัญชี"

## ✨ ความสามารถ

- 📝 **บันทึกรายรับ-รายจ่าย** — พิมพ์ภาษาไทย เช่น "ขายข้าว 3000 บาท" บันทึกอัตโนมัติ
- 🤖 **น้องบัญชี AI** — เลขาส่วนตัวจำบริบทได้ ให้คำแนะนำการเงิน คุยได้ทุกเรื่อง
- 📷 **อ่านรูป slip/ใบเสร็จ** — ส่งรูป → AI วิเคราะห์ → ถามยืนยัน → บันทึกอัตโนมัติ
- 📊 **รายงานกราฟ** — กราฟแท่งรายวัน กราฟวงกลมตามหมวด
- 📁 **เก็บเอกสาร/รูปภาพ** — เก็บถาวรบน Cloudflare R2 แยกตามคน
- 💬 **Telegram Bot** — ใช้ผ่าน Telegram ได้ ส่งข้อความ ส่งรูป เหมือนเว็บ
- 🌙 **ธีมมืด/สว่าง** — เปลี่ยนได้ตามชอบ
- 📱 **ออกแบบสำหรับมือถือ** — ตัวหนังสือใหญ่ ปุ่มใหญ่ ภาษาไทย 100%

## 🏗️ สถาปัตยกรรม

```
ชาวบ้าน
  ├── 📱 Telegram Bot
  └── 🌐 เว็บ (มือถือ)
         │
         ▼
   AI Engine (แกนกลาง)
   ├── Built-in Parser → บันทึกรายรับ-รายจ่าย (แม่นยำ)
   ├── OpenClaw (แกนหลัก) → AI คุยทั่วไป
   └── OpenRouter/Gemini (สำรอง)
         │
         ▼
   MongoDB Atlas (ข้อมูล) + Cloudflare R2 (ไฟล์)
```

## 🛠️ เทคโนโลยี

| ส่วน | เทคโนโลยี |
|------|-----------|
| เว็บ | Next.js 16 + TypeScript + Tailwind CSS |
| ฐานข้อมูล | MongoDB Atlas (Mongoose) |
| เก็บไฟล์ | Cloudflare R2 (S3 compatible) |
| AI | OpenClaw + OpenRouter (Gemini Flash) |
| แชทบอท | Telegram Bot (grammY) |
| กราฟ | Recharts |

## 🚀 วิธีติดตั้ง

### สิ่งที่ต้องมี

- Node.js 20+
- MongoDB Atlas (หรือ MongoDB local)
- Cloudflare R2 bucket
- OpenRouter API key (หรือ OpenClaw)
- Telegram Bot Token (จาก @BotFather)

### ขั้นตอน

```bash
# 1. โคลน
git clone https://github.com/smlsoft/demo001.git
cd demo001

# 2. ติดตั้ง
npm install

# 3. ตั้งค่า
cp .env.example .env.local
# แก้ไขค่าต่างๆ ใน .env.local

# 4. รัน
npm run dev
```

### ตัวแปรสภาพแวดล้อม (.env.local)

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thaiclaw

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=thaiclaw
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# AI (OpenRouter)
AI_API_URL=https://openrouter.ai/api/v1/chat/completions
AI_API_KEY=sk-or-v1-your-key
AI_MODEL=google/gemini-2.5-flash

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-your-token
```

### ตั้งค่า Telegram Webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<DOMAIN>/api/telegram"
```

## 📱 วิธีใช้งาน

### ผ่านเว็บ
1. เปิดเว็บ → กดเลือกบัญชี Demo
2. ไปที่ "ถาม AI" → พิมพ์ "ขายข้าว 3000 บาท"
3. ส่งรูป slip → AI วิเคราะห์ → ตอบ "ใช่" เพื่อบันทึก

### ผ่าน Telegram
1. ค้นหา bot ใน Telegram → กด /start
2. เลือกบัญชี
3. พิมพ์ข้อความ หรือ ส่งรูป slip ได้เลย

## 👥 บัญชี Demo (5 คน)

| ชื่อ | อาชีพ |
|------|--------|
| 🌾 สมชาย | ชาวนา |
| 🏪 สมหญิง | ค้าขาย |
| 🔧 สมศักดิ์ | รับจ้างทั่วไป |
| 🌿 สมใจ | ทำสวน |
| 🐄 สมปอง | เลี้ยงสัตว์ |

## 📂 โครงสร้างโปรเจค

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── ai-chat/      # แชท AI + อัพโหลดรูป
│   │   ├── auth/         # เข้าสู่ระบบ
│   │   ├── files/        # จัดการไฟล์ (R2)
│   │   ├── summary/      # สรุปบัญชี
│   │   ├── telegram/     # Telegram webhook
│   │   └── transactions/ # รายรับ-รายจ่าย
│   ├── dashboard/        # หน้าจอหลัก
│   └── login/            # หน้าเข้าสู่ระบบ
├── components/           # NavBar
└── lib/                  # ระบบหลัก
    ├── ai-engine.ts      # แกนกลาง AI
    ├── chat-compact.ts   # สรุปประวัติแชท (ประหยัด token)
    ├── openclaw.ts       # OpenClaw + OpenRouter
    ├── r2.ts             # Cloudflare R2
    ├── vision.ts         # วิเคราะห์รูปภาพ
    └── models/           # MongoDB schemas
```

## 🐳 Deploy ด้วย Docker

```bash
docker-compose up -d
```

## 📄 สัญญาอนุญาต

MIT
