"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { ChatTheme, themeConfig } from "./chat-room";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  timer: string;
  theme?: ChatTheme;
}

const inputStyles: Record<
  ChatTheme,
  { container: string; input: string; button: string }
> = {
  midnight: {
    container: "bg-[#0a0a1a]/95 border-[#1a1a3e]",
    input:
      "bg-[#12122a] border-[#1e1e4a] text-[#e0e0ff] placeholder-[#4a4a7a] focus:border-[#7c3aed]",
    button: "bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95",
  },
  bubblegum: {
    container: "bg-[#fff0f5]/95 border-[#ffcce0]",
    input:
      "bg-white border-[#ffcce0] text-[#4a1a3a] placeholder-[#d4a5bc] focus:border-[#e83e8c]",
    button: "bg-[#e83e8c] hover:bg-[#d62d7a] active:scale-95",
  },
  ocean: {
    container: "bg-[#0a1628]/95 border-[#0d2847]",
    input:
      "bg-[#0d2847] border-[#1a3a5c] text-[#c8e6ff] placeholder-[#2a5a8a] focus:border-[#0066cc]",
    button: "bg-[#0066cc] hover:bg-[#0052a3] active:scale-95",
  },
  lavender: {
    container: "bg-[#f3e8ff]/95 border-[#d8b4fe]",
    input:
      "bg-white border-[#d8b4fe] text-[#3a1a5c] placeholder-[#a78bfa] focus:border-[#8b5cf6]",
    button: "bg-[#8b5cf6] hover:bg-[#7c3aed] active:scale-95",
  },
  neon: {
    container: "bg-[#050505]/95 border-[#1a1a1a]",
    input:
      "bg-[#0a0a0a] border-[#1a1a1a] text-[#e0e0e0] placeholder-[#333] focus:border-[#ff00ff]",
    button: "bg-[#ff00ff] hover:bg-[#e600e6] text-black active:scale-95",
  },
  rose: {
    container: "bg-[#1a0a0f]/95 border-[#2a1518]",
    input:
      "bg-[#2a1518] border-[#3a2025] text-[#ffd6e0] placeholder-[#6b3a42] focus:border-[#ff6b8a]",
    button: "bg-[#ff6b8a] hover:bg-[#e85a78] active:scale-95",
  },
};

export default function ChatInput({
  onSend,
  onTyping,
  timer,
  theme = "midnight",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const style = inputStyles[theme];

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (ref.current) {
      ref.current.style.height = "auto";
    }
    if (onTyping) onTyping(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 100)}px`;
    }
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (onTyping) onTyping(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`shrink-0 px-2 sm:px-4 py-2 sm:py-3 border-t backdrop-blur-md transition-colors duration-500 ${style.container}`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0.5rem)",
      }}
    >
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <div className="flex-1 min-w-0">
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border text-sm sm:text-[15px] resize-none focus:outline-none transition-colors duration-500 ${style.input}`}
            style={{
              maxHeight: 100,
              fontSize: "16px",
              lineHeight: "1.4",
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`w-11 h-11 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0 ${style.button}`}
          style={{
            touchAction: "manipulation",
          }}
        >
          <svg
            className="w-5 h-5 sm:w-4 sm:h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 max-w-2xl mx-auto px-1">
        <span className="text-[10px] text-neutral-500 hidden sm:block">
          press Enter to send
        </span>
        <span className="text-[10px] text-neutral-500 tabular-nums sm:ml-auto">
          {timer}
        </span>
      </div>
    </div>
  );
}
