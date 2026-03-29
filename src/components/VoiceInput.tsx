"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onResult, className }: Props) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("เบราว์เซอร์นี้ไม่รองรับการพูด กรุณาใช้ Chrome");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recogRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center rounded-full transition-all ${className || ""}`}
      style={{
        width: 48, height: 48,
        background: listening ? "var(--expense)" : "var(--bg-input)",
        color: listening ? "white" : "var(--text-sub)",
        animation: listening ? "pulse 1.5s infinite" : "none",
      }}
      title={listening ? "กำลังฟัง... กดเพื่อหยุด" : "กดเพื่อพูด"}
    >
      <span className="text-xl">{listening ? "⏹️" : "🎤"}</span>
    </button>
  );
}
