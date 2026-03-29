export interface DemoUser {
  id: string;
  name: string;
  occupation: string;
  avatar: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "demo-1", name: "สมชาย", occupation: "ชาวนา", avatar: "🌾" },
  { id: "demo-2", name: "สมหญิง", occupation: "ค้าขาย", avatar: "🏪" },
  { id: "demo-3", name: "สมศักดิ์", occupation: "รับจ้างทั่วไป", avatar: "🔧" },
  { id: "demo-4", name: "สมใจ", occupation: "ทำสวน", avatar: "🌿" },
  { id: "demo-5", name: "สมปอง", occupation: "เลี้ยงสัตว์", avatar: "🐄" },
];

export const INCOME_CATEGORIES = [
  "รายได้อาชีพหลัก",
  "สวัสดิการ",
  "ขาย/เช่าทรัพย์สิน",
  "เงินกู้ยืม",
  "รายได้อื่นๆ",
];

export const EXPENSE_CATEGORIES = [
  "ค่าประกอบอาชีพ",
  "อาหาร/ของใช้",
  "การศึกษา",
  "ค่าลงทุน",
  "งานสังคม",
  "พักผ่อน",
  "เสื้อผ้า",
  "อื่นๆ",
];

export function toBuddhistYear(date: Date): string {
  const year = date.getFullYear() + 543;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatThaiDate(dateStr: string): string {
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const parts = dateStr.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  return `${day} ${thaiMonths[month]} ${year}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}
