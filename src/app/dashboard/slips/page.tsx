"use client";

import { useEffect, useState, useRef } from "react";

interface SlipFile {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string;
  linkedTxId: string;
  createdAt: string;
}

type SlipType = "slip เงินเข้า" | "slip เงินออก";

export default function SlipsPage() {
  const [tab, setTab] = useState<SlipType>("slip เงินเข้า");
  const [files, setFiles] = useState<SlipFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/files");
    if (res.ok) {
      const all = await res.json();
      setFiles(all.filter((f: any) => f.category === "slip เงินเข้า" || f.category === "slip เงินออก"));
    }
    setLoading(false);
  }

  async function uploadSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setAnalyzing(true);
    setAiResult(null);

    // 1. อัปโหลดไฟล์ไปเก็บ
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", tab);
    fd.append("description", tab === "slip เงินเข้า" ? "Slip โอนเงินเข้า" : "Slip จ่ายเงินออก");
    await fetch("/api/files", { method: "POST", body: fd });

    // 2. ส่งให้ AI วิเคราะห์ slip
    try {
      const aiForm = new FormData();
      aiForm.append("file", file);
      const res = await fetch("/api/ai-chat/upload", { method: "POST", body: aiForm });
      const data = await res.json();
      setAiResult(data.reply || "วิเคราะห์ไม่สำเร็จ");
    } catch {
      setAiResult("เกิดข้อผิดพลาดในการวิเคราะห์");
    }

    setUploading(false);
    setAnalyzing(false);
    load();
  }

  async function del(id: string) {
    if (!confirm("ลบ slip นี้?")) return;
    await fetch(`/api/files?id=${id}`, { method: "DELETE" });
    load();
  }

  const filtered = files.filter((f) => f.category === tab);

  return (
    <div className="space-y-4 lg:max-w-4xl lg:mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>🧾 Slip เงินเข้า / เงินออก</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>ถ่ายรูป slip โอนเงิน → AI อ่านให้ → บันทึกอัตโนมัติ</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {(["slip เงินเข้า", "slip เงินออก"] as SlipType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 rounded-xl text-base font-bold transition-colors"
            style={{
              background: tab === t ? (t === "slip เงินเข้า" ? "var(--income)" : "var(--expense)") : "var(--bg-input)",
              color: tab === t ? "white" : "var(--text-sub)",
            }}>
            {t === "slip เงินเข้า" ? "📥 Slip เงินเข้า" : "📤 Slip เงินออก"}
          </button>
        ))}
      </div>

      {/* ปุ่มถ่ายรูป / อัปโหลด */}
      <div className="card">
        <input type="file" ref={fileRef} onChange={uploadSlip} accept="image/*" className="hidden" />
        <div className="flex gap-3">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex-1 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
            style={{ background: tab === "slip เงินเข้า" ? "var(--income)" : "var(--expense)", opacity: uploading ? 0.5 : 1 }}>
            📷 {uploading ? "กำลังอัปโหลด..." : `ถ่ายรูป / เลือกรูป ${tab === "slip เงินเข้า" ? "เงินเข้า" : "เงินออก"}`}
          </button>
        </div>

        {/* ผลวิเคราะห์ AI */}
        {analyzing && (
          <div className="mt-3 p-4 rounded-xl flex items-center gap-3" style={{ background: "var(--bg-input)" }}>
            <div className="w-6 h-6 border-3 rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            <span style={{ color: "var(--text-sub)" }}>AI กำลังอ่าน slip...</span>
          </div>
        )}
        {aiResult && !analyzing && (
          <div className="mt-3 p-4 rounded-xl whitespace-pre-wrap text-sm" style={{ background: "var(--bg-input)", color: "var(--text)" }}>
            {aiResult}
          </div>
        )}
      </div>

      {/* รายการ Slips */}
      <div>
        <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>
          {tab === "slip เงินเข้า" ? "📥" : "📤"} รายการ{tab} ({filtered.length})
        </h2>

        {loading ? (
          <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="card h-16" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🧾</div>
            <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มี {tab}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>กดปุ่มด้านบนเพื่อถ่ายรูป slip</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((f) => (
              <div key={f._id} className="card flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: f.category === "slip เงินเข้า" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)" }}>
                  {f.category === "slip เงินเข้า" ? "📥" : "📤"}
                </div>
                <div className="flex-1 min-w-0">
                  <a href={`/api/files/${f._id}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium truncate block" style={{ color: "var(--blue)" }}>
                    {f.originalName}
                  </a>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(f.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                    {f.description && ` · ${f.description}`}
                  </div>
                </div>
                <button onClick={() => del(f._id)} className="text-xs px-2 py-1 rounded shrink-0" style={{ color: "var(--text-muted)" }}>ลบ</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
