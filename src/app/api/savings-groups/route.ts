import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { SavingsGroup, GroupDeposit } from "@/lib/models/SavingsGroup";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";
import { DEMO_USERS } from "@/lib/demo-users";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const groups = await SavingsGroup.find({ members: userId }).lean();

  if (groups.length === 0) return NextResponse.json([]);

  // ดึง deposits ทั้งหมดในครั้งเดียว แทน N+1 queries
  const groupIds = groups.map((g: any) => g._id.toString());
  const allDeposits = await GroupDeposit.find({ groupId: { $in: groupIds } })
    .sort({ createdAt: -1 })
    .lean();

  // จัดกลุ่ม deposits ตาม groupId
  const depositsByGroup: Record<string, any[]> = {};
  for (const d of allDeposits) {
    const gid = (d as any).groupId;
    if (!depositsByGroup[gid]) depositsByGroup[gid] = [];
    depositsByGroup[gid].push(d);
  }

  const result = groups.map((g: any) => {
    const deposits = depositsByGroup[g._id.toString()] || [];
    const totalByMember: Record<string, number> = {};
    for (const d of deposits) {
      totalByMember[d.userId] = (totalByMember[d.userId] || 0) + d.amount;
    }
    const totalAll = Object.values(totalByMember).reduce((a, b) => a + b, 0);
    const memberDetails = g.members.map((mid: string) => {
      const user = DEMO_USERS.find((u) => u.id === mid);
      return { userId: mid, name: user?.name || mid, avatar: user?.avatar || "👤", total: totalByMember[mid] || 0 };
    });
    return { ...g, totalAll, memberDetails, recentDeposits: deposits.slice(0, 10) };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { action } = body;

  await connectDb();

  // ฝากเงินเข้ากลุ่ม
  if (action === "deposit") {
    const { groupId, amount, date, note } = body;
    if (!groupId || !amount) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    await GroupDeposit.create({ groupId, userId, amount, date: date || "", note: note || "" });
    return NextResponse.json({ success: true });
  }

  // สร้างกลุ่มใหม่
  const { name, description, targetPerMember, memberIds } = body;
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อกลุ่ม" }, { status: 400 });

  const members = memberIds || [userId];
  if (!members.includes(userId)) members.push(userId);

  const group = await SavingsGroup.create({
    name, description: description || "", members, targetPerMember: targetPerMember || 0, createdBy: userId,
  });

  return NextResponse.json({ success: true, id: group._id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบกลุ่ม" }, { status: 400 });

  await connectDb();
  const group = await SavingsGroup.findOne({ _id: id, createdBy: userId });
  if (!group) return NextResponse.json({ error: "ไม่มีสิทธิ์ลบ" }, { status: 403 });

  await GroupDeposit.deleteMany({ groupId: id });
  await SavingsGroup.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
}
