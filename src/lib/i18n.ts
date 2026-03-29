/**
 * Multi-language support — ภาษาถิ่นไทย
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

// คำแปลหลัก
const translations: Record<string, Record<Dialect, string>> = {
  // เมนู
  "หน้าหลัก": { central: "หน้าหลัก", isan: "หน้าหลัก", northern: "หน้าหลัก", southern: "หน้าหลัก" },
  "บันทึก": { central: "บันทึก", isan: "จดบัญชี", northern: "จดบัญชี", southern: "จดบัญชี" },
  "รายงาน": { central: "รายงาน", isan: "สรุปยอด", northern: "สรุปยอด", southern: "สรุปยอด" },
  "ถาม AI": { central: "ถาม AI", isan: "ถาม AI", northern: "ถาม AI", southern: "ถาม AI" },
  "เอกสาร": { central: "เอกสาร", isan: "เอกสาร", northern: "เอกสาร", southern: "เอกสาร" },

  // ทั่วไป
  "สวัสดีค่ะ": { central: "สวัสดีค่ะ", isan: "สบายดีบ่", northern: "สวัสดีเจ้า", southern: "หวัดดีจ้า" },
  "รายรับ": { central: "รายรับ", isan: "เงินเข้า", northern: "เงินเข้า", southern: "เงินเข้า" },
  "รายจ่าย": { central: "รายจ่าย", isan: "เงินออก", northern: "เงินออก", southern: "เงินออก" },
  "คงเหลือ": { central: "คงเหลือ", isan: "เหลือ", northern: "เหลือ", southern: "เหลือ" },
  "บาท": { central: "บาท", isan: "บาท", northern: "บาท", southern: "บาท" },
  "บันทึกแล้ว": { central: "บันทึกแล้ว!", isan: "จดให้แล้วเด้อ!", northern: "จดหื้อแล้วเจ้า!", southern: "จดให้แล้วน้า!" },
  "สรุปบัญชี": { central: "สรุปบัญชีของคุณ", isan: "สรุปบัญชีของเจ้า", northern: "สรุปบัญชีของเจ้า", southern: "สรุปบัญชีของเธอ" },

  // ออมเงิน
  "ตั้งเป้าออม": { central: "ตั้งเป้าออมเงิน", isan: "ตั้งเป้าเก็บเงิน", northern: "ตั้งเป้าเก็บสตางค์", southern: "ตั้งเป้าเก็บเงิน" },
  "งบประมาณ": { central: "งบประมาณ", isan: "งบเดือน", northern: "งบเดือน", southern: "งบเดือน" },
  "แจ้งเตือน": { central: "แจ้งเตือน", isan: "เตือน", northern: "เตือน", southern: "เตือน" },
  "หนี้สิน": { central: "หนี้สิน", isan: "หนี้", northern: "หนี้", southern: "หนี้" },
  "กลุ่มออม": { central: "กลุ่มออมทรัพย์", isan: "กลุ่มเก็บเงิน", northern: "กลุ่มเก็บสตางค์", southern: "กลุ่มเก็บเงิน" },
  "เหรียญรางวัล": { central: "เหรียญรางวัล", isan: "เหรียญรางวัล", northern: "เหรียญรางวัล", southern: "เหรียญรางวัล" },
  "พยากรณ์": { central: "พยากรณ์การเงิน", isan: "ทำนายเงิน", northern: "ทำนายเงิน", southern: "ทำนายเงิน" },
  "ปฏิทิน": { central: "ปฏิทินการเงิน", isan: "ปฏิทินเงิน", northern: "ปฏิทินเงิน", southern: "ปฏิทินเงิน" },

  // คำแนะนำ
  "เก่งมาก": { central: "เก่งมากค่ะ!", isan: "เก่งหลายเด้อ!", northern: "เก่งแต๊เจ้า!", southern: "เก่งมากจ้า!" },
  "ระวัง": { central: "ระวังนะคะ", isan: "ระวังเด้อ", northern: "ระวังเน้อเจ้า", southern: "ระวังน้า" },
  "ออกจากระบบ": { central: "ออกจากระบบ", isan: "ออก", northern: "ออก", southern: "ออก" },
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
