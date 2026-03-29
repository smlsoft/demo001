import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Achievement } from "@/lib/models/Achievement";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";

const ACHIEVEMENT_DEFS = [
  { type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐", check: (txCount: number) => txCount >= 1 },
  { type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝", check: (txCount: number) => txCount >= 10 },
  { type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉", check: (txCount: number) => txCount >= 50 },
  { type: "tx_100", title: "นักบัญชีมืออาชีพ", icon: "🥇", check: (txCount: number) => txCount >= 100 },
  { type: "streak_7", title: "จดบัญชีครบ 7 วัน", icon: "🔥", check: (_: number, streak: number) => streak >= 7 },
  { type: "streak_30", title: "จดบัญชีครบ 30 วัน", icon: "💎", check: (_: number, streak: number) => streak >= 30 },
  { type: "saver", title: "นักออม", icon: "🐷", check: (_: number, __: number, savingRate: number) => savingRate >= 20 },
  { type: "super_saver", title: "ซุปเปอร์นักออม", icon: "🏆", check: (_: number, __: number, savingRate: number) => savingRate >= 40 },
];

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();

  // นับรายการ
  const txCount = await Transaction.countDocuments({ userId });

  // คำนวณ streak (จำนวนวันติดต่อกันที่มีรายการ)
  const recentDates = await Transaction.distinct("date", { userId });
  const sortedDates = recentDates.sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1].replace(/^(\d{4})/, (m: string) => String(parseInt(m) - 543)));
      const curr = new Date(sortedDates[i].replace(/^(\d{4})/, (m: string) => String(parseInt(m) - 543)));
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
  }

  // อัตราการออม — 1 query แทน 2
  const totalsResult = await Transaction.aggregate([
    { $match: { userId } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const totalIncome = totalsResult.find((t: any) => t._id === "income")?.total || 0;
  const totalExpense = totalsResult.find((t: any) => t._id === "expense")?.total || 0;
  const savingRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // ตรวจและมอบ achievements ใหม่
  const existing = await Achievement.find({ userId }).lean();
  const existingTypes = new Set(existing.map((a: any) => a.type));

  const newAchievements: any[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!existingTypes.has(def.type) && def.check(txCount, streak, savingRate)) {
      const a = await Achievement.create({ userId, type: def.type, title: def.title, icon: def.icon });
      newAchievements.push(a);
    }
  }

  const all = await Achievement.find({ userId }).sort({ earnedAt: -1 }).lean();

  return NextResponse.json({
    achievements: all,
    newAchievements,
    stats: { txCount, streak, savingRate },
    allDefs: ACHIEVEMENT_DEFS.map((d) => ({
      type: d.type, title: d.title, icon: d.icon,
      earned: existingTypes.has(d.type) || newAchievements.some((n) => n.type === d.type),
    })),
  });
}
