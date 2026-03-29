"use client";

import { useEffect, useState } from "react";

interface MemberDetail {
  userId: string;
  name: string;
  avatar: string;
  total: number;
}

interface SavingsGroup {
  _id: string;
  name: string;
  description: string;
  members: string[];
  targetPerMember: number;
  totalAll: number;
  memberDetails: MemberDetail[];
  recentDeposits: { userId: string; name: string; amount: number; date: string; note?: string }[];
}

const DEMO_USERS = [
  { id: "demo-1", name: "สมชาย", avatar: "🌾" },
  { id: "demo-2", name: "สมหญิง", avatar: "🏪" },
  { id: "demo-3", name: "สมศักดิ์", avatar: "🔧" },
  { id: "demo-4", name: "สมใจ", avatar: "🌿" },
  { id: "demo-5", name: "สมปอง", avatar: "🐄" },
];

export default function SavingsGroupsPage() {
  const [groups, setGroups] = useState<SavingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", targetPerMember: "", memberIds: [] as string[] });
  const [depositGroupId, setDepositGroupId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/savings-groups");
      if (res.ok) setGroups(await res.json());
    } catch {}
    setLoading(false);
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || form.memberIds.length === 0) return;
    setSaving(true);
    await fetch("/api/savings-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        targetPerMember: form.targetPerMember ? parseFloat(form.targetPerMember) : undefined,
        memberIds: form.memberIds,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", description: "", targetPerMember: "", memberIds: [] });
    load();
  }

  async function deposit(groupId: string) {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    await fetch("/api/savings-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deposit",
        groupId,
        amount: amt,
        note: depositNote || undefined,
      }),
    });
    setDepositGroupId(null);
    setDepositAmount("");
    setDepositNote("");
    load();
  }

  async function deleteGroup(id: string) {
    if (!confirm("ต้องการลบกลุ่มออมทรัพย์นี้?")) return;
    await fetch(`/api/savings-groups?id=${id}`, { method: "DELETE" });
    load();
  }

  function toggleMember(id: string) {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  }

  const totalAllGroups = groups.reduce((sum, g) => sum + g.totalAll, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>กลุ่มออมทรัพย์</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-white font-medium"
          style={{ background: "var(--accent)" }}
        >
          + สร้างกลุ่ม
        </button>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🏦</div>
          <div className="flex-1">
            <div className="text-sm" style={{ color: "var(--text-sub)" }}>เงินออมรวมทุกกลุ่ม</div>
            <div className="text-2xl font-bold" style={{ color: "var(--income)" }}>
              {totalAllGroups.toLocaleString()} <span className="text-base font-normal" style={{ color: "var(--text-muted)" }}>บาท</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>{groups.length} กลุ่ม</div>
          </div>
        </div>
      </div>

      {/* Form + List */}
      <div className={showForm ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start" : ""}>
        {/* Create Form */}
        {showForm && (
          <form onSubmit={createGroup} className="card space-y-3">
            <div className="font-bold text-lg" style={{ color: "var(--text)" }}>สร้างกลุ่มใหม่</div>

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="ชื่อกลุ่ม เช่น กลุ่มออมทรัพย์หมู่บ้าน"
              required
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="รายละเอียด (ไม่บังคับ)"
            />
            <input
              type="number"
              value={form.targetPerMember}
              onChange={(e) => setForm({ ...form, targetPerMember: e.target.value })}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="เป้าหมายต่อคน (บาท, ไม่บังคับ)"
              min="1"
            />

            {/* Member Selection */}
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: "var(--text-sub)" }}>
                เลือกสมาชิก ({form.memberIds.length} คน)
              </label>
              <div className="flex flex-wrap gap-2">
                {DEMO_USERS.map((user) => {
                  const selected = form.memberIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: selected ? "var(--accent-light)" : "var(--bg-input)",
                        border: selected ? "2px solid var(--accent)" : "2px solid transparent",
                        color: selected ? "var(--accent)" : "var(--text-sub)",
                      }}
                    >
                      <span className="text-lg">{user.avatar}</span>
                      {user.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-base"
                style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || form.memberIds.length === 0}
                className="flex-1 py-3 rounded-xl text-white font-bold text-base"
                style={{ background: "var(--accent)", opacity: saving || form.memberIds.length === 0 ? 0.5 : 1 }}
              >
                {saving ? "กำลังสร้าง..." : "สร้างกลุ่ม"}
              </button>
            </div>
          </form>
        )}

        {/* Groups List */}
        <div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="card h-32" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🏦</div>
              <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีกลุ่มออมทรัพย์</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>กด &quot;+ สร้างกลุ่ม&quot; เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expandedId === group._id;
                const isDepositing = depositGroupId === group._id;

                return (
                  <div key={group._id} className="card space-y-3">
                    {/* Group Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : group._id)}
                      >
                        <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{group.name}</div>
                        {group.description && (
                          <div className="text-sm" style={{ color: "var(--text-muted)" }}>{group.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                            {group.members.length} สมาชิก
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>·</span>
                          <span className="text-sm font-bold" style={{ color: "var(--income)" }}>
                            {group.totalAll.toLocaleString()} บาท
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteGroup(group._id)}
                        className="px-2 py-1 rounded-lg text-sm shrink-0"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ลบ
                      </button>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex flex-wrap gap-1">
                      {group.memberDetails.map((m) => (
                        <div
                          key={m.userId}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm"
                          style={{ background: "var(--bg-input)" }}
                          title={`${m.name}: ${m.total.toLocaleString()} บาท`}
                        >
                          <span>{m.avatar}</span>
                          <span style={{ color: "var(--text-sub)" }}>{m.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Target progress per member */}
                    {group.targetPerMember > 0 && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                          เป้าหมายต่อคน: {group.targetPerMember.toLocaleString()} บาท
                        </div>
                        {group.memberDetails.map((m) => {
                          const pct = Math.min(100, Math.round((m.total / group.targetPerMember) * 100));
                          return (
                            <div key={m.userId} className="flex items-center gap-2 mb-1">
                              <span className="text-sm w-16 truncate" style={{ color: "var(--text-sub)" }}>
                                {m.avatar} {m.name}
                              </span>
                              <div className="progress-bar flex-1">
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pct >= 100 ? "var(--income)" : "var(--accent)",
                                  }}
                                />
                              </div>
                              <span className="text-xs w-16 text-right" style={{ color: "var(--text-muted)" }}>
                                {m.total.toLocaleString()} ฿
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Deposit Form */}
                    {isDepositing ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full border rounded-xl px-4 py-3"
                          placeholder="จำนวนเงินฝาก (บาท)"
                          min="1"
                          autoFocus
                        />
                        <input
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          className="w-full border rounded-xl px-4 py-3"
                          placeholder="บันทึก (ไม่บังคับ)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") deposit(group._id);
                            if (e.key === "Escape") { setDepositGroupId(null); setDepositAmount(""); setDepositNote(""); }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDepositGroupId(null); setDepositAmount(""); setDepositNote(""); }}
                            className="flex-1 py-2 rounded-xl font-medium"
                            style={{ background: "var(--bg-input)", color: "var(--text-sub)" }}
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => deposit(group._id)}
                            className="flex-1 py-2 rounded-xl text-white font-medium"
                            style={{ background: "var(--accent)" }}
                          >
                            ฝากเงิน
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setDepositGroupId(group._id); setDepositAmount(""); setDepositNote(""); }}
                        className="w-full py-2 rounded-xl font-medium text-sm"
                        style={{ background: "var(--bg-input)", color: "var(--accent)" }}
                      >
                        💰 ฝากเงินเข้ากลุ่ม
                      </button>
                    )}

                    {/* Expanded: Recent Deposits + Member Contributions */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        {/* Member contributions */}
                        <div>
                          <div className="text-sm font-bold mb-2" style={{ color: "var(--text-sub)" }}>ยอดสะสมแต่ละคน</div>
                          <div className="space-y-1">
                            {group.memberDetails.map((m) => (
                              <div key={m.userId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{m.avatar}</span>
                                  <span style={{ color: "var(--text)" }}>{m.name}</span>
                                </div>
                                <span className="font-bold" style={{ color: "var(--income)" }}>
                                  {m.total.toLocaleString()} บาท
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Deposits */}
                        {group.recentDeposits && group.recentDeposits.length > 0 && (
                          <div>
                            <div className="text-sm font-bold mb-2" style={{ color: "var(--text-sub)" }}>รายการฝากล่าสุด</div>
                            <div className="space-y-1">
                              {group.recentDeposits.map((d, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <div style={{ color: "var(--text-sub)" }}>
                                    {d.name} {d.note && <span style={{ color: "var(--text-muted)" }}>- {d.note}</span>}
                                  </div>
                                  <span className="font-medium" style={{ color: "var(--income)" }}>
                                    +{d.amount.toLocaleString()} ฿
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : group._id)}
                      className="w-full text-center text-sm py-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {isExpanded ? "ซ่อนรายละเอียด ▲" : "ดูรายละเอียด ▼"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
