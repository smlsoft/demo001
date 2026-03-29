import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { toBuddhistYear } from "@/lib/demo-users";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();

  // ดึงข้อมูล 6 เดือนย้อนหลัง
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fromDate = toBuddhistYear(sixMonthsAgo);

  const txs = await Transaction.find({ userId, date: { $gte: fromDate } }).lean();

  // จัดกลุ่มตามเดือน
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  for (const tx of txs as any[]) {
    const month = tx.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    if (tx.type === "income") monthlyData[month].income += tx.amount;
    else monthlyData[month].expense += tx.amount;
  }

  const months = Object.keys(monthlyData).sort();
  if (months.length < 2) {
    return NextResponse.json({
      message: "ข้อมูลยังไม่พอสำหรับการพยากรณ์ (ต้องมีอย่างน้อย 2 เดือน)",
      forecast: null,
      history: monthlyData,
    });
  }

  // คำนวณค่าเฉลี่ย + แนวโน้ม (simple linear trend)
  const incomes = months.map((m) => monthlyData[m].income);
  const expenses = months.map((m) => monthlyData[m].expense);

  const avgIncome = Math.round(incomes.reduce((a, b) => a + b, 0) / incomes.length);
  const avgExpense = Math.round(expenses.reduce((a, b) => a + b, 0) / expenses.length);

  // แนวโน้ม: เทียบ 3 เดือนล่าสุดกับ 3 เดือนก่อน
  const recentExp = expenses.slice(-3);
  const olderExp = expenses.slice(0, Math.min(3, expenses.length));
  const avgRecent = recentExp.reduce((a, b) => a + b, 0) / recentExp.length;
  const avgOlder = olderExp.reduce((a, b) => a + b, 0) / olderExp.length;
  const trend = avgOlder > 0 ? Math.round(((avgRecent - avgOlder) / avgOlder) * 100) : 0;

  // พยากรณ์แยกหมวด
  const categoryForecast: Record<string, number> = {};
  for (const tx of txs as any[]) {
    if (tx.type === "expense") {
      categoryForecast[tx.category] = (categoryForecast[tx.category] || 0) + tx.amount;
    }
  }
  const monthCount = months.length;
  const catForecasted = Object.entries(categoryForecast)
    .map(([cat, total]) => ({ category: cat, forecast: Math.round(total / monthCount) }))
    .sort((a, b) => b.forecast - a.forecast);

  // คำแนะนำ
  const tips: string[] = [];
  if (trend > 10) tips.push(`รายจ่ายมีแนวโน้มเพิ่มขึ้น ${trend}% ลองหาทางลดค่าใช้จ่ายนะคะ`);
  if (trend < -10) tips.push(`รายจ่ายลดลง ${Math.abs(trend)}% เก่งมากค่ะ! ทำต่อไป`);
  if (avgExpense > avgIncome) tips.push("ระวัง: รายจ่ายเฉลี่ยเกินรายรับ ควรหาทางเพิ่มรายได้หรือลดรายจ่าย");
  const savingRate = avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0;
  if (savingRate > 0 && savingRate < 20) tips.push(`อัตราออมเฉลี่ย ${savingRate}% — ลองตั้งเป้าให้ถึง 20% นะคะ`);

  const res = NextResponse.json({
    forecast: {
      nextMonthIncome: avgIncome,
      nextMonthExpense: Math.round(avgRecent),
      trend,
      savingRate,
      byCategory: catForecasted,
    },
    history: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
    tips,
  });
  // cache 30 นาที — forecast ไม่เปลี่ยนบ่อย
  res.headers.set("Cache-Control", "private, max-age=1800, stale-while-revalidate=3600");
  return res;
}
