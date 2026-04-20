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
    container: "bg-[#0a0a1a]/80 border-[#1a1a3e]",
    input:
      "bg-[#12122a] border-[#1e1e4a] text-[#e0e0ff] placeholder-[#4a4a7a] focus:border-[#7c3aed]",
    button: "bg-[#7c3aed] hover:bg-[#6d28d9]",
  },
  bubblegum: {
    container: "bg-[#fff0f5]/80 border-[#ffcce0]",
    input:
      "bg-white border-[#ffcce0] text-[#4a1a3a] placeholder-[#d4a5bc] focus:border-[#e83e8c]",
    button: "bg-[#e83e8c] hover:bg-[#d62d7a]",
  },
  ocean: {
    container: "bg-[#0a1628]/80 border-[#0d2847]",
    input:
      "bg-[#0d2847] border-[#1a3a5c] text-[#c8e6ff] placeholder-[#2a5a8a] focus:border-[#0066cc]",
    button: "bg-[#0066cc] hover:bg-[#0052a3]",
  },
  lavender: {
    container: "bg-[#f3e8ff]/80 border-[#d8b4fe]",
    input:
      "bg-white border-[#d8b4fe] text-[#3a1a5c] placeholder-[#a78bfa] focus:border-[#8b5cf6]",
    button: "bg-[#8b5cf6] hover:bg-[#7c3aed]",
  },
  neon: {
    container: "bg-[#050505]/80 border-[#1a1a1a]",
    input:
      "bg-[#0a0a0a] border-[#1a1a1a] text-[#e0e0e0] placeholder-[#333] focus:border-[#ff00ff]",
    button: "bg-[#ff00ff] hover:bg-[#e600e6] text-black",
  },
  rose: {
    container: "bg-[#1a0a0f]/80 border-[#2a1518]",
    input:
      "bg-[#2a1518] border-[#3a2025] text-[#ffd6e0] placeholder-[#6b3a42] focus:border-[#ff6b8a]",
    button: "bg-[#ff6b8a] hover:bg-[#e85a78]",
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
    if (ref.current) ref.current.style.height = "auto";
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
      className={`shrink-0 px-4 py-3 border-t backdrop-blur-sm transition-colors duration-500 ${style.container}`}
    >
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div className="flex-1">
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`w-full px-4 py-2.5 rounded-[1.15rem] border text-[15px] resize-none focus:outline-none transition-colors duration-500 ${style.input}`}
            style={{ maxHeight: 100 }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shrink-0 mb-0.5 ${style.button}`}
        >
          <svg
            className="w-4 h-4 ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 max-w-2xl mx-auto px-1">
        <span className="text-[10px] text-neutral-500">enter to send</span>
        <span className="text-[10px] text-neutral-500 tabular-nums">
          {timer}
        </span>
      </div>
    </div>
  );
}
