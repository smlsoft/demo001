"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceInput } from "@/components/VoiceInput";
import { useTheme } from "@/lib/theme";
import { t } from "@/lib/i18n";

interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
}

export default function AiChatPage() {
  const { dialect } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/ai-chat")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setMessages(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, dialect }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply || data.error || "เกิดข้อผิดพลาด" }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "เกิดข้อผิดพลาด ลองใหม่นะคะ" }]);
    }
    setSending(false);
  }

  const [pendingAction, setPendingAction] = useState(false); // มี pending tx รอยืนยัน

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    e.target.value = "";

    setMessages((p) => [...p, { role: "user", content: `📷 ส่งรูป: ${file.name}` }]);
    setSending(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ai-chat/upload", { method: "POST", body: fd });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply || data.error || "เกิดข้อผิดพลาด" }]);
      // ถ้าเป็นเอกสารการเงิน → แสดงปุ่มเลือก
      if (data.action === "vision_financial") {
        setPendingAction(true);
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "วิเคราะห์รูปไม่สำเร็จ ลองใหม่" }]);
    }
    setSending(false);
  }

  // กดปุ่มเลือก รายรับ/รายจ่าย/ยกเลิก
  async function confirmPending(choice: string) {
    setPendingAction(false);
    setMessages((p) => [...p, { role: "user", content: choice }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: choice, dialect }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply || "เกิดข้อผิดพลาด" }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "เกิดข้อผิดพลาด" }]);
    }
    setSending(false);
  }

  const quick = [
    { label: t("สรุปยอด", dialect), msg: "สรุปยอดบัญชี" },
    { label: t("ดูรายการ", dialect), msg: "ดูรายการล่าสุด" },
    { label: t("แนะนำออมเงิน", dialect), msg: "แนะนำวิธีออมเงิน" },
    { label: t("วิธีใช้", dialect), msg: "ช่วยแนะนำวิธีใช้" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-48px)] lg:max-w-3xl lg:mx-auto">
      <div className="mb-2">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>{t("AI ผู้ช่วยบัญชี", dialect)}</h1>
        <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>คุยกับ AI ได้ทุกเรื่อง — บันทึกบัญชี ขอคำแนะนำ ส่งรูป slip</p>
      </div>

      {/* ปุ่มลัด */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {quick.map((q) => (
          <button key={q.label} onClick={() => setInput(q.msg)}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full font-medium"
            style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
            {q.label}
          </button>
        ))}
      </div>

      {/* ข้อความ */}
      <div className="flex-1 overflow-y-auto card mb-2 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🤖</div>
            <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{t("สวัสดีค่ะ", dialect)}</p>
            <p style={{ color: "var(--text-sub)" }}>{t("ฉันคือน้องบัญชี ผู้ช่วยของคุณ", dialect)}</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>พิมพ์ &quot;ขายข้าว 3000&quot; หรือส่งรูป slip ได้เลย!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-3 text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed"
                style={msg.role === "user"
                  ? { background: "var(--accent)", color: "white", borderBottomRightRadius: "4px" }
                  : { background: "var(--bg-input)", color: "var(--text)", borderBottomLeftRadius: "4px" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {/* ปุ่มเลือก รายรับ/รายจ่าย/ยกเลิก */}
        {pendingAction && !sending && (
          <div className="flex gap-2 justify-start">
            <button onClick={() => confirmPending("รายรับ")}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: "var(--income)" }}>
              📥 รายรับ
            </button>
            <button onClick={() => confirmPending("รายจ่าย")}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: "var(--expense)" }}>
              📤 รายจ่าย
            </button>
            <button onClick={() => confirmPending("ยกเลิก")}
              className="px-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
              ❌ ยกเลิก
            </button>
          </div>
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-input)", borderBottomLeftRadius: "4px" }}>
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input + ปุ่มส่งรูป + ปุ่มพูด */}
      <form onSubmit={send} className="flex gap-2 items-end">
        <input type="file" ref={fileRef} onChange={uploadPhoto} accept="image/*" className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={sending}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
          📷
        </button>
        <VoiceInput onResult={useCallback((text: string) => setInput(text), [])} />
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={sending}
          className="flex-1 border rounded-xl px-4 py-3"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }}
          placeholder={t("พิมพ์ หรือกด 🎤 พูด", dialect)} />
        <button type="submit" disabled={sending || !input.trim()}
          className="px-5 py-3 rounded-xl text-white font-bold shrink-0"
          style={{ background: "var(--accent)", opacity: sending || !input.trim() ? 0.5 : 1 }}>
          {t("ส่ง", dialect)}
        </button>
      </form>
    </div>
  );
}
