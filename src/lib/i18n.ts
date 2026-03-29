/**
 * Multi-language support — ภาษาถิ่นไทย (Realtime)
 * รองรับ: กลาง (default), อีสาน, เหนือ, ใต้
 */

export type Dialect = "central" | "isan" | "northern" | "southern";

export const DIALECT_NAMES: Record<Dialect, string> = {
  central: "ภาษากลาง",
  isan: "ภาษาอีสาน",
  northern: "ภาษาเหนือ (คำเมือง)",
  southern: "ภาษาใต้",
};

export const DIALECT_OPTIONS: Array<{ key: Dialect; label: string; flag: string }> = [
  { key: "central", label: "กลาง", flag: "🇹🇭" },
  { key: "isan", label: "อีสาน", flag: "🏮" },
  { key: "northern", label: "เหนือ", flag: "🏔️" },
  { key: "southern", label: "ใต้", flag: "🌊" },
];

// คำแปลทั้งระบบ
const translations: Record<string, Record<Dialect, string>> = {
  // ===== เมนูหลัก =====
  "หน้าหลัก": { central: "หน้าหลัก", isan: "หน้าหลัก", northern: "หน้าหลัก", southern: "หน้าหลัก" },
  "บันทึก": { central: "บันทึก", isan: "จดบัญชี", northern: "จดบัญชี", southern: "จดบัญชี" },
  "รายงาน": { central: "รายงาน", isan: "สรุปยอด", northern: "สรุปยอด", southern: "สรุปยอด" },
  "ถาม AI": { central: "ถาม AI", isan: "ถาม AI", northern: "ถาม AI", southern: "ถาม AI" },
  "เอกสาร": { central: "เอกสาร", isan: "เอกสาร", northern: "เอกสาร", southern: "เอกสาร" },

  // ===== เมนูเพิ่มเติม =====
  "เป้าออม": { central: "เป้าออม", isan: "เป้าเก็บเงิน", northern: "เป้าเก็บสตางค์", southern: "เป้าเก็บเงิน" },
  "งบประมาณ": { central: "งบประมาณ", isan: "งบเดือน", northern: "งบเดือน", southern: "งบเดือน" },
  "ปฏิทิน": { central: "ปฏิทิน", isan: "ปฏิทิน", northern: "ปฏิทิน", southern: "ปฏิทิน" },
  "แจ้งเตือน": { central: "แจ้งเตือน", isan: "เตือน", northern: "เตือน", southern: "เตือน" },
  "หนี้สิน": { central: "หนี้สิน", isan: "หนี้", northern: "หนี้", southern: "หนี้" },
  "กลุ่มออม": { central: "กลุ่มออม", isan: "กลุ่มเก็บเงิน", northern: "กลุ่มเก็บสตางค์", southern: "กลุ่มเก็บเงิน" },
  "รางวัล": { central: "รางวัล", isan: "รางวัล", northern: "รางวัล", southern: "รางวัล" },
  "พยากรณ์": { central: "พยากรณ์", isan: "ทำนายเงิน", northern: "ทำนายเงิน", southern: "ทำนายเงิน" },
  "Telegram": { central: "Telegram", isan: "Telegram", northern: "Telegram", southern: "Telegram" },
  "เครื่องมือเพิ่มเติม": { central: "เครื่องมือเพิ่มเติม", isan: "เครื่องมืออื่นๆ", northern: "เครื่องมืออื่นๆ", southern: "เครื่องมืออื่นๆ" },
  "เพิ่มเติม": { central: "เพิ่มเติม", isan: "อื่นๆ", northern: "อื่นๆ", southern: "อื่นๆ" },
  "หน้าแรก": { central: "หน้าแรก", isan: "หน้าแรก", northern: "หน้าแรก", southern: "หน้าแรก" },
  "ออกจากระบบ": { central: "ออกจากระบบ", isan: "ออก", northern: "ออก", southern: "ออก" },
  "โหมดมืด": { central: "โหมดมืด", isan: "โหมดมืด", northern: "โหมดมืด", southern: "โหมดมืด" },
  "โหมดสว่าง": { central: "โหมดสว่าง", isan: "โหมดสว่าง", northern: "โหมดสว่าง", southern: "โหมดสว่าง" },
  "ออก": { central: "ออก", isan: "ออก", northern: "ออก", southern: "ออก" },

  // ===== หัวข้อหน้า =====
  "บันทึกรายรับ-รายจ่าย": { central: "บันทึกรายรับ-รายจ่าย", isan: "จดเงินเข้า-เงินออก", northern: "จดเงินเข้า-เงินออก", southern: "จดเงินเข้า-เงินออก" },
  "AI ผู้ช่วยบัญชี": { central: "AI ผู้ช่วยบัญชี", isan: "AI ผู้ช่วยบัญชี", northern: "AI ผู้ช่วยบัญชี", southern: "AI ผู้ช่วยบัญชี" },
  "ตั้งเป้าออมเงิน": { central: "ตั้งเป้าออมเงิน", isan: "ตั้งเป้าเก็บเงิน", northern: "ตั้งเป้าเก็บสตางค์", southern: "ตั้งเป้าเก็บเงิน" },
  "ตั้งงบประมาณ": { central: "ตั้งงบประมาณ", isan: "ตั้งงบเดือน", northern: "ตั้งงบเดือน", southern: "ตั้งงบเดือน" },
  "แจ้งเตือน & รายการซ้ำ": { central: "แจ้งเตือน & รายการซ้ำ", isan: "เตือน & รายการซ้ำ", northern: "เตือน & รายการซ้ำ", southern: "เตือน & รายการซ้ำ" },
  "ปฏิทินการเงิน": { central: "ปฏิทินการเงิน", isan: "ปฏิทินเงิน", northern: "ปฏิทินเงิน", southern: "ปฏิทินเงิน" },
  "หนี้สิน & ผ่อนชำระ": { central: "หนี้สิน & ผ่อนชำระ", isan: "หนี้ & ผ่อน", northern: "หนี้ & ผ่อน", southern: "หนี้ & ผ่อน" },
  "กลุ่มออมทรัพย์": { central: "กลุ่มออมทรัพย์", isan: "กลุ่มเก็บเงิน", northern: "กลุ่มเก็บสตางค์", southern: "กลุ่มเก็บเงิน" },
  "เหรียญรางวัล": { central: "เหรียญรางวัล", isan: "เหรียญรางวัล", northern: "เหรียญรางวัล", southern: "เหรียญรางวัล" },
  "พยากรณ์การเงิน": { central: "พยากรณ์การเงิน", isan: "ทำนายเงินเดือนหน้า", northern: "ทำนายเงินเดือนหน้า", southern: "ทำนายเงินเดือนหน้า" },

  // ===== คำทั่วไป =====
  "รายรับ": { central: "รายรับ", isan: "เงินเข้า", northern: "เงินเข้า", southern: "เงินเข้า" },
  "รายจ่าย": { central: "รายจ่าย", isan: "เงินออก", northern: "เงินออก", southern: "เงินออก" },
  "คงเหลือ": { central: "คงเหลือ", isan: "เหลือ", northern: "เหลือ", southern: "เหลือ" },
  "บาท": { central: "บาท", isan: "บาท", northern: "บาท", southern: "บาท" },
  "รายการ": { central: "รายการ", isan: "รายการ", northern: "รายการ", southern: "รายการ" },
  "เพิ่ม": { central: "+ เพิ่ม", isan: "+ เพิ่ม", northern: "+ เพิ่ม", southern: "+ เพิ่ม" },
  "บันทึกแล้ว": { central: "บันทึกแล้ว!", isan: "จดให้แล้วเด้อ!", northern: "จดหื้อแล้วเจ้า!", southern: "จดให้แล้วน้า!" },
  "สรุปบัญชี": { central: "สรุปบัญชีของคุณ", isan: "สรุปบัญชีของเจ้า", northern: "สรุปบัญชีของเจ้า", southern: "สรุปบัญชีของเธอ" },
  "ส่ง": { central: "ส่ง", isan: "ส่ง", northern: "ส่ง", southern: "ส่ง" },
  "ลบ": { central: "ลบ", isan: "ลบ", northern: "ลบ", southern: "ลบ" },
  "ยืนยัน": { central: "ยืนยัน", isan: "ตกลง", northern: "ตกลง", southern: "ตกลง" },
  "ยกเลิก": { central: "ยกเลิก", isan: "บ่เอา", northern: "บ่เอา", southern: "ไม่เอา" },
  "กำลังโหลด": { central: "กำลังโหลด...", isan: "กำลังโหลด...", northern: "กำลังโหลด...", southern: "กำลังโหลด..." },
  "พิมพ์ PDF": { central: "พิมพ์ PDF", isan: "พิมพ์ PDF", northern: "พิมพ์ PDF", southern: "พิมพ์ PDF" },
  "อัตราออม": { central: "อัตราออม", isan: "อัตราเก็บ", northern: "อัตราเก็บ", southern: "อัตราเก็บ" },

  // ===== Dashboard =====
  "สรุปภาพรวม": { central: "สรุปภาพรวม", isan: "สรุปภาพรวม", northern: "สรุปภาพรวม", southern: "สรุปภาพรวม" },
  "บันทึกรายรับ-รายจ่าย_short": { central: "บันทึกรายรับ-รายจ่าย", isan: "จดเงินเข้า-ออก", northern: "จดเงินเข้า-ออก", southern: "จดเงินเข้า-ออก" },
  "คุยกับน้องบัญชี": { central: "คุยกับน้องบัญชี", isan: "คุยกับน้องบัญชี", northern: "คุยกับน้องบัญชี", southern: "คุยกับน้องบัญชี" },
  "ดูรายงาน/กราฟ": { central: "ดูรายงาน/กราฟ", isan: "ดูสรุปยอด/กราฟ", northern: "ดูสรุปยอด/กราฟ", southern: "ดูสรุปยอด/กราฟ" },
  "เอกสาร/รูปภาพ": { central: "เอกสาร/รูปภาพ", isan: "เอกสาร/รูปภาพ", northern: "เอกสาร/รูปภาพ", southern: "เอกสาร/รูปภาพ" },

  // ===== AI Chat =====
  "สวัสดีค่ะ": { central: "สวัสดีค่ะ!", isan: "สบายดีบ่!", northern: "สวัสดีเจ้า!", southern: "หวัดดีจ้า!" },
  "ฉันคือน้องบัญชี ผู้ช่วยของคุณ": { central: "ฉันคือน้องบัญชี ผู้ช่วยของคุณ", isan: "ข้อยเป็นน้องบัญชี ผู้ช่วยของเจ้า", northern: "เป็นน้องบัญชี ผู้ช่วยของเจ้า", southern: "เป็นน้องบัญชี ผู้ช่วยของเธอจ้า" },
  "พิมพ์ หรือกด 🎤 พูด": { central: "พิมพ์ หรือกด 🎤 พูด", isan: "พิมพ์ หรือกด 🎤 อู้", northern: "พิมพ์ หรือกด 🎤 อู้", southern: "พิมพ์ หรือกด 🎤 พูด" },
  "สรุปยอด": { central: "สรุปยอด", isan: "สรุปยอด", northern: "สรุปยอด", southern: "สรุปยอด" },
  "ดูรายการ": { central: "ดูรายการ", isan: "ดูรายการ", northern: "ดูรายการ", southern: "ดูรายการ" },
  "แนะนำออมเงิน": { central: "แนะนำออมเงิน", isan: "แนะนำเก็บเงิน", northern: "แนะนำเก็บสตางค์", southern: "แนะนำเก็บเงิน" },
  "วิธีใช้": { central: "วิธีใช้", isan: "วิธีใช้", northern: "วิธีใช้", southern: "วิธีใช้" },

  // ===== คำแนะนำ =====
  "เก่งมาก": { central: "เก่งมากค่ะ!", isan: "เก่งหลายเด้อ!", northern: "เก่งแต๊เจ้า!", southern: "เก่งมากจ้า!" },
  "ระวัง": { central: "ระวังนะคะ", isan: "ระวังเด้อ", northern: "ระวังเน้อเจ้า", southern: "ระวังน้า" },
};

export function t(key: string, dialect: Dialect = "central"): string {
  return translations[key]?.[dialect] || translations[key]?.central || key;
}

// AI system prompt suffix ตามภาษาถิ่น
export function getDialectPrompt(dialect: Dialect): string {
  switch (dialect) {
    case "isan":
      return "\nสำคัญ: ตอบเป็นภาษาอีสานผสมกลาง ใช้คำว่า เด้อ, บ่, หลาย, แม่น, สิ, คัก เช่น 'จดให้แล้วเด้อ', 'สบายดีบ่', 'เก่งหลายเด้อ'";
    case "northern":
      return "\nสำคัญ: ตอบเป็นภาษาเหนือ (คำเมือง) ผสมกลาง ใช้คำว่า เจ้า, แต๊, หื้อ, เน้อ, กั๋น เช่น 'จดหื้อแล้วเจ้า', 'สวัสดีเจ้า', 'เก่งแต๊เจ้า'";
    case "southern":
      return "\nสำคัญ: ตอบเป็นภาษาใต้ผสมกลาง ใช้คำว่า หรา, แหละ, จ้า, น้า, ดิ เช่น 'จดให้แล้วน้า', 'หวัดดีจ้า', 'เก่งมากจ้า'";
    default:
      return "";
  }
}
