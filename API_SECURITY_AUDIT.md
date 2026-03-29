# API Security Audit Report — ThaiClaw

**วันที่:** 2026-03-29
**ประเภท:** Validation, Error Handling, Authentication Check
**ผลการตรวจ:** 23 routes, พบปัญหา 7 ประเภท

---

## 📊 สรุปผลตรวจ (Quick Summary)

| Status | Count | Routes |
|--------|-------|--------|
| 🟢 ปลอดภัย | 8 | `/transactions GET`, `/auth/telegram`, `/debts DELETE` เป็นต้น |
| 🟡 ต้องแก้ | 14 | Missing ID validation, amount check, error handling |
| 🔴 วิกฤต | 2 | `/api/seed` (no auth), `/auth` (no CSRF) |

---

## 📋 รายละเอียด 23 Routes

### 🔴 Critical Issues (วิกฤต)

#### 1. POST /api/seed
```
Method  | POST
Auth    | ❌ ไม่มี (public endpoint!)
Validation | ❌ ไม่มี
Error   | ⚠️ เฉพาะ error msg
Risk    | 🔴 ใครก็ลบข้อมูลทั้งระบบได้
Action  | ต้องเพิ่ม admin check หรือลบ endpoint
```

#### 2. POST /auth
```
Method  | POST
Auth    | ❌ ไม่มี (demo login, ไม่ confirm identity)
Validation | ⚠️ ตรวจ userId ใน DEMO_USERS array เท่านั้น
Error   | ✅ error msg
Risk    | 🔴 CSRF ได้, ข้อมูล demo ถูกรีเซ็ต
Action  | ต้องเพิ่ม CSRF token + nonce
```

---

### 🟡 High Priority (ต้องแก้)

#### 3. GET/POST /transactions, /budgets, /savings-goals, /reminders, /debts, /recurring
```
Issue                | Count | Routes
--------------------|-------|--------
ID validation ขาด    | 6     | DELETE routes ทั้งหมด (delete by ?id=)
Amount <= 0 ขาด     | 6     | POST /budgets, /savings-goals, /debts, /recurring
dueDay range ขาด    | 1     | POST /reminders (ต้องตรวจ 1-31)
Updates validate ขาด| 2     | PUT /reminders, /debts
Error handling ขาด  | 3     | POST /budgets, /savings-goals, /recurring
```

**Example — DELETE /transactions?id=xxx:**
```typescript
// ❌ ปัจจุบัน: ไม่ตรวจ ID format
const id = searchParams.get("id");
if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });
await Transaction.deleteOne({ _id: id, userId }); // Invalid ObjectId passed

// ✅ ต้องแก้:
import { ObjectId } from "mongodb";
if (!id || !ObjectId.isValid(id)) {
  return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
}
```

#### 4. POST /auth/google
```
Issue          | Status
---------------|--------
JWT signature  | ⚠️ ตรวจ iss/aud/exp แต่ decode เอง, ไม่ใช้ google-auth-library
Token parsing  | ⚠️ อ่อน: ไม่ verify signature cryptographically
Risk           | 🟡 JWT could be forged
Action         | ต้องใช้ google-auth-library หรือ OAuth2
```

**Example:**
```typescript
// ❌ ปัจจุบัน: ตรวจแค่ payload structure
const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
if (payload.iss !== "https://accounts.google.com") throw new Error("...");

// ✅ ต้องแก้: ใช้ google-auth-library
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
const payload = ticket.getPayload();
```

#### 5. GET /summary
```
Issue    | $regex injection ผ่าน month parameter
Example  | GET /summary?month=2569-03.*) — regex escape ไม่ถูก
Risk     | 🟡 อาจเข้าถึงข้อมูลเดือนอื่น
Action   | ต้อง escape regex characters หรือใช้ exact match
```

#### 6. POST /ai-chat
```
Issue           | ไม่มี try-catch
Risk            | 🟡 AI timeout ไม่ handle, response ไม่ return
Action          | ต้องเพิ่ม try-catch + timeout
```

#### 7. File Upload Routes (/files, /ai-chat/upload)
```
Issue           | ไม่มี try-catch, R2 failure ไม่ handle
Risk            | 🟡 Upload ล้มเหลว → orphan files in R2
Action          | ต้องเพิ่ม error handling + cleanup
```

---

## 🟢 Secure Routes (ปลอดภัย)

| Route | Status | Note |
|-------|--------|------|
| GET /transactions | ✅ | page/limit bounds, auth check |
| POST /auth/telegram | ✅ | HMAC verify, auth_date check |
| GET /budgets, /savings-goals, /reminders, /debts | ✅ | Read-only, DB only |
| GET /forecast, /achievements, /summary | ✅ | Read-only, aggregate only |
| DELETE /savings-groups | ✅ | createdBy check |
| POST /telegram | ✅ | async handler, timeout |

---

## 📝 Validation Checklist

### Amount Fields (ต้องตรวจ)
```
Routes: POST /transactions, /budgets, /savings-goals, /debts, /recurring

❌ ปัจจุบัน:
- /transactions: ตรวจ range (1-10M) ✅ but others: ไม่ตรวจ amount <= 0
- /budgets: monthlyLimit ไม่ตรวจ <= 0
- /savings-goals: targetAmount ไม่ตรวจ <= 0
- /debts: ไม่ตรวจ totalAmount/monthlyPayment <= 0
- /recurring: amount ไม่ตรวจ <= 0

✅ ต้องเพิ่ม:
if (!amount || amount <= 0 || amount > MAX_AMOUNT) {
  return NextResponse.json({ error: "จำนวนเงินต้อง > 0" }, { status: 400 });
}
```

### ID Validation (ต้องตรวจ)
```
Routes: DELETE /transactions, /budgets, /savings-goals, /reminders, /debts, /recurring, /files

❌ ปัจจุบัน:
const id = searchParams.get("id");
if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });
await Model.deleteOne({ _id: id, userId }); // No ObjectId validation!

✅ ต้องเพิ่ม:
import { ObjectId } from "mongodb";
const id = searchParams.get("id");
if (!id || !ObjectId.isValid(id)) {
  return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
}
await Model.deleteOne({ _id: id, userId });
```

### dueDay Range (ต้องตรวจ)
```
Route: POST /reminders, /recurring

❌ ปัจจุบัน:
if (!title || !dueDay) { ... } // ไม่ตรวจ dueDay range

✅ ต้องเพิ่ม:
if (!dueDay || dueDay < 1 || dueDay > 31) {
  return NextResponse.json({ error: "วันที่ต้องระหว่าง 1-31" }, { status: 400 });
}
```

---

## 🛠️ Error Handling Pattern

### ปัจจุบัน (ไม่มี error handling)
```typescript
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req); // ❌ ไม่ handle parseJsonBody error
  const { category, monthlyLimit } = body;

  if (!category || !monthlyLimit) {
    return NextResponse.json({ error: "กรุณากรอกหมวดและงบประมาณ" }, { status: 400 });
  }

  await connectDb(); // ❌ ไม่ handle DB error
  await Budget.updateOne(...); // ❌ ไม่ handle update error

  return NextResponse.json({ success: true });
}
```

### ต้องแก้ (with error handling)
```typescript
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    let body;
    try {
      body = await parseJsonBody(req);
    } catch {
      return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
    }

    const { category, monthlyLimit } = body;

    if (!category || !monthlyLimit) {
      return NextResponse.json({ error: "กรุณากรอกหมวดและงบประมาณ" }, { status: 400 });
    }

    if (monthlyLimit <= 0 || monthlyLimit > 100000000) {
      return NextResponse.json({ error: "งบประมาณต้อง > 0" }, { status: 400 });
    }

    await connectDb();
    await Budget.updateOne(
      { userId, category, month: currentMonth },
      { $set: { monthlyLimit } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Budget POST Error]", err?.message);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด ลองใหม่" }, { status: 500 });
  }
}
```

---

## 📊 Full Routes Table

| # | Route | Method | Validation | Error Handling | Auth | Risk | Priority |
|---|-------|--------|-----------|---|---|---|---|
| 1 | /auth | POST | ⚠️ Basic | ✅ | ❌ | 🔴 | Critical |
| 2 | /auth/google | POST | ✅ | ✅ | ⚠️ | 🟡 | High |
| 3 | /auth/google-config | GET | ❌ | ❌ | ❌ | 🟢 | Low |
| 4 | /auth/telegram | POST | ✅ | ✅ | ✅ | 🟢 | Low |
| 5 | /transactions | GET | ✅ | ✅ | ✅ | 🟢 | Low |
| 6 | /transactions | POST | ✅ | ✅ | ✅ | 🟢 | Low |
| 7 | /transactions | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 8 | /ai-chat | GET | ❌ | ✅ | ✅ | 🟡 | Medium |
| 9 | /ai-chat | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 10 | /ai-chat/upload | POST | ✅ | ❌ | ✅ | 🟡 | High |
| 11 | /budgets | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 12 | /budgets | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 13 | /budgets | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 14 | /savings-goals | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 15 | /savings-goals | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 16 | /savings-goals | PUT | ⚠️ | ❌ | ✅ | 🟡 | High |
| 17 | /savings-goals | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 18 | /reminders | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 19 | /reminders | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 20 | /reminders | PUT | ❌ | ❌ | ✅ | 🟡 | High |
| 21 | /reminders | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 22 | /debts | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 23 | /debts | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 24 | /debts | PUT | ⚠️ | ❌ | ✅ | 🟡 | High |
| 25 | /debts | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 26 | /recurring | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 27 | /recurring | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 28 | /recurring | PUT | ❌ | ❌ | ✅ | 🟡 | High |
| 29 | /recurring | DELETE | ❌ | ✅ | ✅ | 🟡 | Medium |
| 30 | /forecast | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 31 | /achievements | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 32 | /summary | GET | ⚠️ | ❌ | ✅ | 🟡 | High |
| 33 | /files | GET | ✅ | ❌ | ✅ | 🟡 | Medium |
| 34 | /files | POST | ✅ | ❌ | ✅ | 🟡 | High |
| 35 | /files | DELETE | ❌ | ❌ | ✅ | 🟡 | High |
| 36 | /files/[id] | GET | ❌ | ❌ | ✅ | 🟡 | Medium |
| 37 | /savings-groups | GET | ❌ | ❌ | ✅ | 🟢 | Low |
| 38 | /savings-groups | POST | ⚠️ | ❌ | ✅ | 🟡 | High |
| 39 | /savings-groups | DELETE | ✅ | ✅ | ✅ | 🟢 | Low |
| 40 | /export-pdf | GET | ⚠️ | ❌ | ✅ | 🟡 | Medium |
| 41 | /telegram-link | POST | ❌ | ❌ | ✅ | 🟡 | Medium |
| 42 | /telegram | POST | ⚠️ | ✅ | ⚠️ | 🟡 | Medium |
| 43 | /telegram/callback | POST | ❌ | ❌ | ❌ | 🟢 | Low |
| 44 | /seed | POST | ❌ | ❌ | ❌ | 🔴 | Critical |

---

## ✅ Recommended Actions (ลำดับความสำคัญ)

### Immediate (วันนี้)
1. **Disable /api/seed** — ไม่ให้ใครลบข้อมูล
   ```typescript
   export async function POST() {
     return NextResponse.json({ error: "Endpoint disabled" }, { status: 403 });
   }
   ```

2. **Add ObjectId validation helper**
   ```typescript
   // lib/validation.ts
   import { ObjectId } from "mongodb";
   export const validateId = (id: any): boolean => ObjectId.isValid(id);
   ```

3. **Add amount validation**
   ```typescript
   export const validateAmount = (amount: any, min = 1, max = 100000000): boolean => {
     const num = Number(amount);
     return !isNaN(num) && num >= min && num <= max;
   };
   ```

### This Week
4. Replace Google JWT decode with google-auth-library
5. Add try-catch to all POST/PUT routes
6. Add dueDay range validation (1-31)
7. Fix /summary regex injection
8. Add error handling for file uploads

### Next Sprint
9. Add CSRF tokens to /auth
10. Add rate limiting to auth endpoints
11. Add request logging/monitoring
12. Security testing (penetration test)

---

## 📌 Notes

- **Lines to modify:** ~200 lines across 20+ routes
- **Time estimate:** 6-8 hours (validate + test)
- **Testing:** Need integration tests for all validation paths
- **Review checklist:** See code review comments in each route file
