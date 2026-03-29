import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: 2569-03

  await connectDb();

  const filter: Record<string, any> = { userId };
  if (month) {
    filter.date = { $regex: `^${month}` };
  }

  const [incomeResult, expenseResult, byCategory, daily] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...filter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { ...filter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: { category: "$category", type: "$type" }, total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: { date: "$date", type: "$type" }, total: { $sum: "$amount" } } },
      { $sort: { "_id.date": 1 } },
    ]),
  ]);

  const totalIncome = incomeResult[0]?.total || 0;
  const totalExpense = expenseResult[0]?.total || 0;

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory: byCategory.map((c: any) => ({
      category: c._id.category,
      type: c._id.type,
      total: c.total,
    })),
    daily: daily.map((d: any) => ({
      date: d._id.date,
      type: d._id.type,
      total: d.total,
    })),
  });
}
