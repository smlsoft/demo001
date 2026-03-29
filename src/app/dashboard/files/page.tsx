"use client";

import { useEffect, useState } from "react";

interface FileItem {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string;
  createdAt: string;
}

const CATS = ["ทั้งหมด", "เอกสาร", "รูปภาพ", "ใบเสร็จ", "สัญญา", "slip เงินเข้า", "slip เงินออก", "เอกสารเงินเข้า", "เอกสารเงินออก", "อื่นๆ"];
const UPLOAD_CATS = ["เอกสาร", "รูปภาพ", "ใบเสร็จ", "สัญญา", "slip เงินเข้า", "slip เงินออก", "เอกสารเงินเข้า", "เอกสารเงินออก", "อื่นๆ"];

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

/** Category → icon + color สำหรับไฟล์ที่ไม่ใช่รูปภาพ */
function catStyle(category: string): { icon: string; bg: string; color: string } {
  switch (category) {
    case "slip เงินเข้า":
    case "เอกสารเงินเข้า":
      return { icon: "💰", bg: "#dcfce7", color: "#16a34a" };
    case "slip เงินออก":
    case "เอกสารเงินออก":
      return { icon: "💸", bg: "#fee2e2", color: "#dc2626" };
    case "ใบเสร็จ":
      return { icon: "🧾", bg: "#fef9c3", color: "#ca8a04" };
    case "สัญญา":
      return { icon: "📋", bg: "#e0e7ff", color: "#4f46e5" };
    case "รูปภาพ":
      return { icon: "🖼️", bg: "#f3e8ff", color: "#9333ea" };
    case "เอกสาร":
      return { icon: "📄", bg: "#f0f9ff", color: "#0284c7" };
    default:
      return { icon: "📎", bg: "var(--bg-input)", color: "var(--text-sub)" };
  }
}

function mimeIcon(mime: string): { icon: string; bg: string; color: string } {
  if (mime.includes("pdf")) return { icon: "📄", bg: "#fee2e2", color: "#dc2626" };
  if (mime.includes("word") || mime.includes("doc")) return { icon: "📝", bg: "#dbeafe", color: "#2563eb" };
  if (mime.includes("sheet") || mime.includes("xls")) return { icon: "📊", bg: "#dcfce7", color: "#16a34a" };
  return { icon: "📎", bg: "var(--bg-input)", color: "var(--text-sub)" };
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [cat, setCat] = useState("อื่นๆ");
  const [desc, setDesc] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/files");
    if (res.ok) setFiles(await res.json());
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
    fd.append("category", cat);
    fd.append("description", desc);
    await fetch("/api/files", { method: "POST", body: fd });
    setUploading(false);
    setShowUpload(false);
    setDesc("");
    setCat("อื่นๆ");
    load();
  }

  async function del(id: string) {
    if (!confirm("ลบไฟล์นี้?")) return;
    await fetch(`/api/files?id=${id}`, { method: "DELETE" });
    load();
  }

  const filtered = filter === "ทั้งหมด" ? files : files.filter((f) => f.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>เอกสาร/รูปภาพ</h1>
        <button onClick={() => setShowUpload(!showUpload)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: "var(--accent)" }}>
          + อัพโหลด
        </button>
      </div>

      {showUpload && (
        <form onSubmit={upload} className="card space-y-3 lg:max-w-xl">
          <input type="file" required accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="w-full text-sm" style={{ color: "var(--text)" }} />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full border rounded-xl px-4 py-3">
            {UPLOAD_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="คำอธิบาย (ถ้ามี)"
            className="w-full border rounded-xl px-4 py-3" />
          <button type="submit" disabled={uploading} className="w-full py-3 rounded-xl text-white font-bold"
            style={{ background: "var(--accent)", opacity: uploading ? 0.5 : 1 }}>
            {uploading ? "กำลังอัพโหลด..." : "อัพโหลด"}
          </button>
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>ขนาดไม่เกิน 10MB · รูปที่ส่งจาก Telegram จะแสดงที่นี่ด้วย</p>
        </form>
      )}

      {/* ตัวกรอง */}
      <div className="flex gap-2 flex-wrap">
        {CATS.map((c) => {
          const cs = catStyle(c);
          const isActive = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium transition-colors"
              style={isActive
                ? { background: "var(--accent)", color: "white" }
                : { background: "var(--bg-input)", color: "var(--text-sub)", border: "1px solid var(--border)" }
              }>
              {c !== "ทั้งหมด" ? `${cs.icon} ` : "📁 "}{c}
            </button>
          );
        })}
      </div>

      {/* รายการ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📁</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีไฟล์</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>อัพโหลดที่นี่ หรือส่งรูปผ่าน Telegram</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((f) => {
            const isImage = f.mimeType.startsWith("image/");
            const style = isImage ? catStyle(f.category) : mimeIcon(f.mimeType);
            // ใช้ category style ถ้ามี category ที่เจาะจง, ไม่งั้นใช้ mime icon
            const iconInfo = f.category !== "อื่นๆ" ? catStyle(f.category) : style;

            return (
              <div key={f._id} className="card flex items-center gap-3 overflow-hidden">
                {/* Thumbnail หรือ Icon */}
                {isImage ? (
                  <a href={`/api/files/${f._id}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden" style={{ background: "var(--bg-input)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/files/${f._id}`}
                        alt={f.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback ถ้าโหลดไม่ได้
                          const el = e.currentTarget;
                          el.style.display = "none";
                          el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${iconInfo.icon}</div>`;
                        }}
                      />
                    </div>
                  </a>
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: iconInfo.bg, color: iconInfo.color }}
                  >
                    {iconInfo.icon}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <a href={`/api/files/${f._id}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium truncate block" style={{ color: "var(--blue)" }}>
                    {f.originalName}
                  </a>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium mr-1"
                      style={{ background: iconInfo.bg, color: iconInfo.color }}>
                      {f.category}
                    </span>
                    {fmtSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("th-TH")}
                  </div>
                  {f.description && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-sub)" }}>{f.description}</div>}
                </div>
                <button onClick={() => del(f._id)} className="text-xs px-2 py-1 rounded shrink-0 hover:bg-red-50 hover:text-red-500 transition-colors" style={{ color: "var(--text-muted)" }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
