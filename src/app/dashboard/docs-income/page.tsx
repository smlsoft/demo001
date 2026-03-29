"use client";

import { useEffect, useState } from "react";

interface DocFile {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string;
  createdAt: string;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("word") || mime.includes("doc")) return "📝";
  return "📎";
}

export default function DocsIncomePage() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/files");
    if (res.ok) {
      const all = await res.json();
      setFiles(all.filter((f: any) => f.category === "เอกสารเงินเข้า"));
    }
    setLoading(false);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    fd.append("category", "เอกสารเงินเข้า");
    fd.append("description", desc || "เอกสารรายรับ");
    await fetch("/api/files", { method: "POST", body: fd });
    setUploading(false);
    setShowForm(false);
    setDesc("");
    load();
  }

  async function del(id: string) {
    if (!confirm("ลบเอกสารนี้?")) return;
    await fetch(`/api/files?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4 lg:max-w-4xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--income)" }}>📥 เอกสารเงินเข้า</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>ใบเสร็จรับเงิน สัญญา ใบแจ้งรายได้ หลักฐานรายรับ</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: "var(--income)" }}>
          + อัปโหลด
        </button>
      </div>

      {showForm && (
        <form onSubmit={upload} className="card space-y-3 lg:max-w-xl">
          <input type="file" required accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="w-full text-sm" style={{ color: "var(--text)" }} />
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="คำอธิบาย เช่น ใบเสร็จรับเงินขายข้าว, สัญญาเช่าที่ดิน"
            className="w-full border rounded-xl px-4 py-3" />
          <div className="flex gap-2 flex-wrap text-xs" style={{ color: "var(--text-muted)" }}>
            {["ใบเสร็จรับเงิน", "สัญญาเช่าที่ดิน", "หลักฐานรับเงินสวัสดิการ", "ใบแจ้งเงินเดือน", "สัญญาซื้อขาย"].map((s) => (
              <button key={s} type="button" onClick={() => setDesc(s)}
                className="px-2 py-1 rounded-lg" style={{ background: "var(--bg-input)" }}>{s}</button>
            ))}
          </div>
          <button type="submit" disabled={uploading} className="w-full py-3 rounded-xl text-white font-bold"
            style={{ background: "var(--income)", opacity: uploading ? 0.5 : 1 }}>
            {uploading ? "กำลังอัปโหลด..." : "📥 อัปโหลดเอกสารเงินเข้า"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="card h-16" />)}</div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📥</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีเอกสารเงินเข้า</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>อัปโหลดใบเสร็จรับเงิน สัญญา หลักฐานรายรับต่างๆ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f._id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: "rgba(22,163,74,0.1)" }}>
                {fmtIcon(f.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <a href={`/api/files/${f._id}`} target="_blank" rel="noopener noreferrer"
                  className="font-medium truncate block" style={{ color: "var(--income)" }}>
                  {f.originalName}
                </a>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {fmtSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                {f.description && <div className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{f.description}</div>}
              </div>
              <button onClick={() => del(f._id)} className="text-xs px-2 py-1 rounded shrink-0" style={{ color: "var(--text-muted)" }}>ลบ</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
