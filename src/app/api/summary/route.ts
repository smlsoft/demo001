import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");     // 2569-03
  const from = searchParams.get("from");       // 2569-03-01
  const to = searchParams.get("to");           // 2569-03-31

  await connectDb();

  const filter: Record<string, any> = { userId };
  if (from && to) {
    filter.date = { $gte: from, $lte: to };
  } else if (month) {
    filter.date = { $regex: `^${month}` };
  }

  const [incomeResult, expenseResult, byCategory, daily, incomeByCategory, topItems] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...filter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { ...filter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: { category: "$category", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: { date: "$date", type: "$type" }, total: { $sum: "$amount" } } },
      { $sort: { "_id.date": 1 } },
    ]),
    // รายรับแยกหมวด
    Transaction.aggregate([
      { $match: { ...filter, type: "income" } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    // รายการยอดสูงสุด
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: { desc: "$description", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 }, avg: { $avg: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totalIncome = incomeResult[0]?.total || 0;
  const totalExpense = expenseResult[0]?.total || 0;
  const incomeCount = incomeResult[0]?.count || 0;
  const expenseCount = expenseResult[0]?.count || 0;

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    byCategory: byCategory.map((c: any) => ({
      category: c._id.category,
      type: c._id.type,
      total: c.total,
      count: c.count,
    })),
    daily: daily.map((d: any) => ({
      date: d._id.date,
      type: d._id.type,
      total: d.total,
    })),
    incomeByCategory: incomeByCategory.map((c: any) => ({
      category: c._id,
      total: c.total,
      count: c.count,
    })),
    topItems: topItems.map((t: any) => ({
      description: t._id.desc,
      type: t._id.type,
      total: t.total,
      count: t.count,
      avg: Math.round(t.avg),
    })),
  });
}
