# 🏡 บัญชีครัวเรือน (ThaiClaw)

ระบบบันทึกรายรับ-รายจ่ายอัจฉริยะสำหรับชาวบ้านไทย พร้อม AI ผู้ช่วย "น้องบัญชี"

## ✨ ความสามารถ

### หลัก
- 📝 **บันทึกรายรับ-รายจ่าย** — พิมพ์ภาษาไทย เช่น "ขายข้าว 3000 บาท" บันทึกอัตโนมัติ
- 🎤 **สั่งด้วยเสียง** — กดปุ่มไมค์ พูดแทนพิมพ์ รองรับภาษาไทย
- 🤖 **น้องบัญชี AI** — เลขาส่วนตัวจำบริบทได้ ให้คำแนะนำการเงิน คุยได้ทุกเรื่อง
- 📷 **อ่านรูป slip/ใบเสร็จ** — ส่งรูป → AI วิเคราะห์ → ถามยืนยัน → บันทึกอัตโนมัติ
- 📊 **รายงานกราฟ** — กราฟแท่งรายวัน กราฟวงกลมตามหมวด แยกหมวดรายรับ-รายจ่าย
- 🖨️ **Export PDF** — พิมพ์รายงานสรุปบัญชี ใช้ยื่นกู้ ธ.ก.ส. / อบต.

### เครื่องมือการเงิน
- 🎯 **ตั้งเป้าออมเงิน** — ตั้งเป้า + ดู progress bar + ฉลองเมื่อถึงเป้า
- 💰 **ตั้งงบประมาณ** — กำหนดงบแต่ละหมวด เตือนเมื่อใกล้เต็ม/เกินงบ
- 🔔 **แจ้งเตือน** — เตือนจ่ายค่าน้ำ ค่าไฟ ทุกเดือน
- 🔄 **รายการซ้ำอัตโนมัติ** — ตั้งค่าไฟ 500 ทุกวันที่ 15 → บันทึกให้อัตโนมัติ
- 📋 **หนี้สิน & ผ่อนชำระ** — จดหนี้ ธ.ก.ส./กองทุนหมู่บ้าน ติดตามงวดผ่อน
- 📅 **ปฏิทินการเงิน** — ดูภาพรวมรายวัน วันไหนรับ/จ่ายเท่าไหร่
- 🔮 **AI พยากรณ์** — วิเคราะห์แนวโน้ม ทำนายรายจ่ายเดือนหน้า

### สังคม & แรงจูงใจ
- 👥 **กลุ่มออมทรัพย์** — รวมกลุ่มออมกับเพื่อนบ้าน ติดตามยอดแต่ละคน
- 🏅 **เหรียญรางวัล** — ได้เหรียญเมื่อจดบัญชีครบ 7 วัน, ออมได้ตามเป้า
- 🏮 **ภาษาถิ่น** — รองรับ กลาง / อีสาน / เหนือ / ใต้

### ช่องทางใช้งาน
- 🌐 **เว็บ** — ใช้ผ่านมือถือหรือคอมพิวเตอร์
- 💬 **Telegram Bot** — พิมพ์/ส่งรูปผ่าน Telegram ข้อมูลเชื่อมกัน
- 📁 **เก็บเอกสาร** — อัปโหลดไฟล์ รูปภาพ เก็บถาวรบน Cloud
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
   ├── OpenClaw (แกนหลัก) → AI คุยทั่วไป + พยากรณ์
   ├── OpenRouter/Gemini (สำรอง)
   └── Budget/Debt/Goals Awareness → เตือนงบ/หนี้/เป้าออม
         │
         ▼
   MongoDB Atlas (ข้อมูล) + Cloudflare R2 (ไฟล์)
```

## 🛠️ เทคโนโลยี

| ส่วน | เทคโนโลยี |
|------|-----------|
| เว็บ | Next.js 16 + TypeScript + Tailwind CSS v4 |
| ฐานข้อมูล | MongoDB Atlas (Mongoose) + Compound Indexes |
| เก็บไฟล์ | Cloudflare R2 (S3 compatible) |
| AI | OpenClaw + OpenRouter (Gemini Flash) |
| แชทบอท | Telegram Bot (grammY) |
| กราฟ | Recharts |
| เสียง | Web Speech API (Chrome) |

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
2. ไปที่ "ถาม AI" → พิมพ์ "ขายข้าว 3000 บาท" หรือกด 🎤 พูด
3. ส่งรูป slip → AI วิเคราะห์ → ตอบ "ใช่" เพื่อบันทึก
4. ตั้งเป้าออม / งบประมาณ / แจ้งเตือน ได้จากเมนู "เพิ่มเติม"

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
│   ├── api/                 # API routes
│   │   ├── achievements/    # เหรียญรางวัล
│   │   ├── ai-chat/         # แชท AI + อัพโหลดรูป
│   │   ├── auth/            # เข้าสู่ระบบ
│   │   ├── budgets/         # งบประมาณ
│   │   ├── debts/           # หนี้สิน
│   │   ├── export-pdf/      # ส่งออก PDF
│   │   ├── files/           # จัดการไฟล์ (R2)
│   │   ├── forecast/        # AI พยากรณ์
│   │   ├── recurring/       # รายการซ้ำ
│   │   ├── reminders/       # แจ้งเตือน
│   │   ├── savings-goals/   # เป้าออมเงิน
│   │   ├── savings-groups/  # กลุ่มออมทรัพย์
│   │   ├── summary/         # สรุปบัญชี ($facet optimized)
│   │   ├── telegram/        # Telegram webhook
│   │   └── transactions/    # รายรับ-รายจ่าย (paginated)
│   ├── dashboard/           # หน้าจอหลัก (13 หน้า)
│   └── login/               # หน้าเข้าสู่ระบบ
├── components/              # NavBar, VoiceInput
└── lib/                     # ระบบหลัก
    ├── ai-engine.ts         # แกนกลาง AI (budget/debt/goals aware)
    ├── chat-compact.ts      # สรุปประวัติแชท (ประหยัด token)
    ├── i18n.ts              # ภาษาถิ่น (กลาง/อีสาน/เหนือ/ใต้)
    ├── openclaw.ts          # OpenClaw + OpenRouter
    ├── r2.ts                # Cloudflare R2
    ├── vision.ts            # วิเคราะห์รูปภาพ
    └── models/              # MongoDB schemas (10 models, compound indexes)
```

## ⚡ Performance

- **MongoDB Compound Indexes** — 10+ indexes สำหรับ queries ที่ใช้บ่อย
- **$facet Aggregation** — Summary API รวม 6 queries เป็น 1
- **Connection Pool** — maxPoolSize 20 + zstd compression
- **Pagination** — Transactions/Files มี page/limit ไม่โหลดทั้งหมด
- **Batch Operations** — Recurring ใช้ insertMany แทน loop
- **Caching** — Forecast API cache 30 นาที

## 🐳 Deploy ด้วย Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 📄 สัญญาอนุญาต

MIT
