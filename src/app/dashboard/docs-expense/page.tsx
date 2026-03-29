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

export default function DocsExpensePage() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/files");
    if (res.ok) {
      const all = await res.json();
      setFiles(all.filter((f: any) => f.category === "เอกสารเงินออก"));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 lg:max-w-4xl lg:mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--expense)" }}>📤 เอกสารเงินออก</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>ใบเสร็จจ่ายเงิน บิล หลักฐานรายจ่าย — ส่งรูปผ่าน Telegram จะแสดงที่นี่</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="card h-40 rounded-xl" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📤</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>ยังไม่มีเอกสารเงินออก</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>ส่งรูปเอกสารผ่าน Telegram จะแสดงที่นี่อัตโนมัติ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((f) => (
            <a key={f._id} href={`/api/files/${f._id}`} target="_blank" rel="noopener noreferrer"
              className="card overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer block"
              style={{ borderLeft: "3px solid var(--expense)" }}>
              {/* Thumbnail */}
              <div className="w-full h-32 sm:h-40 overflow-hidden rounded-t-lg" style={{ background: "var(--bg-input)" }}>
                {f.mimeType.startsWith("image/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/files/${f._id}`}
                    alt={f.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl">📤</div>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📄</div>
                )}
              </div>
              {/* Info */}
              <div className="p-2">
                <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                  {f.description || f.originalName}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {new Date(f.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
