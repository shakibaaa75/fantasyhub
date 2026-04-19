"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  timer: string;
}

export default function ChatInput({ onSend, timer }: ChatInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 px-5 py-4 border-t border-border">
      <div className="flex items-end gap-2.5 max-w-2xl mx-auto">
        <div className="flex-1">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (ref.current) {
                ref.current.style.height = "auto";
                ref.current.style.height = `${Math.min(ref.current.scrollHeight, 100)}px`;
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="say something..."
            rows={1}
            className="w-full px-4 py-3 rounded-xl bg-s3 border-border text-sm placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-700 transition-colors"
            style={{ maxHeight: 100 }}
          />
        </div>
        <button
          onClick={handleSend}
          className="w-10 h-10 rounded-xl bg-white text-void flex items-center justify-center hover:bg-neutral-200 transition-colors shrink-0"
        >
          <i data-lucide="arrow-up" className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 max-w-2xl mx-auto">
        <span className="text-[10px] text-neutral-700">enter to send</span>
        <span className="text-[10px] text-neutral-700 tabular-nums">
          {timer}
        </span>
      </div>
    </div>
  );
}
