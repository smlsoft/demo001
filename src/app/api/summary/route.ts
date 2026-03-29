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

  // ใช้ $facet รวมทุก aggregation เป็น 1 query เดียว → ลด DB round-trips 6→1
  const [result] = await Transaction.aggregate([
    { $match: filter },
    {
      $facet: {
        totals: [
          { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ],
        byCategory: [
          { $group: { _id: { category: "$category", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        daily: [
          { $group: { _id: { date: "$date", type: "$type" }, total: { $sum: "$amount" } } },
          { $sort: { "_id.date": 1 } },
        ],
        incomeByCategory: [
          { $match: { type: "income" } },
          { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        topItems: [
          { $group: { _id: { desc: "$description", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 }, avg: { $avg: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  const incomeTotal = result.totals.find((t: any) => t._id === "income");
  const expenseTotal = result.totals.find((t: any) => t._id === "expense");
  const totalIncome = incomeTotal?.total || 0;
  const totalExpense = expenseTotal?.total || 0;

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeCount: incomeTotal?.count || 0,
    expenseCount: expenseTotal?.count || 0,
    byCategory: result.byCategory.map((c: any) => ({
      category: c._id.category,
      type: c._id.type,
      total: c.total,
      count: c.count,
    })),
    daily: result.daily.map((d: any) => ({
      date: d._id.date,
      type: d._id.type,
      total: d.total,
    })),
    incomeByCategory: result.incomeByCategory.map((c: any) => ({
      category: c._id,
      total: c.total,
      count: c.count,
    })),
    topItems: result.topItems.map((t: any) => ({
      description: t._id.desc,
      type: t._id.type,
      total: t.total,
      count: t.count,
      avg: Math.round(t.avg),
    })),
  });
}
