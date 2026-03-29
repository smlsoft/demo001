import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Debt } from "@/lib/models/Debt";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const debts = await Debt.find({ userId }).sort({ createdAt: -1 }).lean();

  const result = debts.map((d: any) => ({
    ...d,
    remainingAmount: d.totalAmount - d.paidAmount,
    remainingInstallments: d.installments - d.paidInstallments,
    percent: Math.round((d.paidAmount / d.totalAmount) * 100),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { creditor, totalAmount, monthlyPayment, installments, dueDay, startDate, note } = body;

  if (!creditor || !totalAmount || !monthlyPayment || !installments) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  await connectDb();
  const debt = await Debt.create({
    userId, creditor, totalAmount, monthlyPayment, installments,
    dueDay: dueDay || 1, startDate: startDate || "", note: note || "",
  });

  return NextResponse.json({ success: true, id: debt._id });
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { id, payInstallment, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  if (payInstallment) {
    // atomic: findOneAndUpdate + เช็คจบในคำสั่งเดียว
    const debt = await Debt.findOneAndUpdate(
      { _id: id, userId, active: true },
      { $inc: { paidAmount: 0, paidInstallments: 1 } },
      { new: false } // return ค่าก่อน update เพื่อเอา monthlyPayment
    );
    if (debt) {
      const willComplete = debt.paidInstallments + 1 >= debt.installments;
      await Debt.updateOne({ _id: id, userId }, {
        $inc: { paidAmount: debt.monthlyPayment },
        ...(willComplete ? { $set: { active: false } } : {}),
      });
    }
  } else {
    await Debt.updateOne({ _id: id, userId }, { $set: updates });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await Debt.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
