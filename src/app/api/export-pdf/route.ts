import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { DEMO_USERS, toBuddhistYear, formatThaiDate } from "@/lib/demo-users";

/**
 * Export รายงาน HTML (พิมพ์เป็น PDF ผ่าน window.print)
 * ไม่ต้องพึ่ง library PDF — ใช้ browser print เลย
 */
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  await connectDb();
  const user = DEMO_USERS.find((u) => u.id === userId);

  const query: any = { userId };
  if (from && to) query.date = { $gte: from, $lte: to };

  // จำกัด 1000 รายการ เพื่อไม่ให้ HTML ใหญ่เกินไป
  const txs = await Transaction.find(query).sort({ date: -1 }).limit(1000).lean();

  const totalIncome = txs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = txs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const today = toBuddhistYear(new Date());

  // สร้าง HTML สำหรับพิมพ์
  const rows = (txs as any[]).map((t) =>
    `<tr>
      <td>${formatThaiDate(t.date)}</td>
      <td>${t.type === "income" ? "รายรับ" : "รายจ่าย"}</td>
      <td>${t.description}</td>
      <td>${t.category}</td>
      <td style="text-align:right;color:${t.type === "income" ? "#16a34a" : "#dc2626"}">${t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}</td>
    </tr>`
  ).join("");

  // แยกตามหมวด
  const catMap: Record<string, { income: number; expense: number }> = {};
  for (const t of txs as any[]) {
    if (!catMap[t.category]) catMap[t.category] = { income: 0, expense: 0 };
    catMap[t.category][t.type as "income" | "expense"] += t.amount;
  }
  const catRows = Object.entries(catMap).map(([cat, v]) =>
    `<tr><td>${cat}</td><td style="text-align:right;color:#16a34a">${v.income.toLocaleString()}</td><td style="text-align:right;color:#dc2626">${v.expense.toLocaleString()}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานบัญชีครัวเรือน - ${user?.name || ""}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
    body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto; }
    h1 { color: #16a34a; text-align: center; }
    h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 700; }
    .summary { display: flex; gap: 24px; justify-content: center; margin: 16px 0; }
    .summary-box { text-align: center; padding: 12px 24px; border-radius: 8px; }
    .income { background: #dcfce7; color: #16a34a; }
    .expense { background: #fee2e2; color: #dc2626; }
    .balance { background: #dbeafe; color: #2563eb; }
    .summary-box .amount { font-size: 24px; font-weight: 700; }
    .summary-box .label { font-size: 12px; }
    .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 0; } button { display: none !important; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="background:#16a34a;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;margin-bottom:16px;font-family:Sarabun">🖨️ พิมพ์ / บันทึก PDF</button>

  <h1>🌾 รายงานบัญชีครัวเรือน</h1>
  <p style="text-align:center">${user?.name || ""} | ${user?.occupation || ""} | ${from && to ? `${formatThaiDate(from)} ถึง ${formatThaiDate(to)}` : "ทั้งหมด"}</p>

  <div class="summary">
    <div class="summary-box income"><div class="label">รายรับรวม</div><div class="amount">${totalIncome.toLocaleString()}</div></div>
    <div class="summary-box expense"><div class="label">รายจ่ายรวม</div><div class="amount">${totalExpense.toLocaleString()}</div></div>
    <div class="summary-box balance"><div class="label">คงเหลือ</div><div class="amount">${balance.toLocaleString()}</div></div>
  </div>

  <h2>📊 สรุปตามหมวด</h2>
  <table><tr><th>หมวด</th><th>รายรับ</th><th>รายจ่าย</th></tr>${catRows}</table>

  <h2>📋 รายการทั้งหมด (${txs.length} รายการ)</h2>
  <table><tr><th>วันที่</th><th>ประเภท</th><th>รายการ</th><th>หมวด</th><th>จำนวน (บาท)</th></tr>${rows}</table>

  <div class="footer">พิมพ์จากระบบบัญชีครัวเรือน (ThaiClaw) | วันที่พิมพ์: ${formatThaiDate(today)}</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
