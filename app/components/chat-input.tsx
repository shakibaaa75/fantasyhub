"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { ChatTheme } from "./chat-room";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  timer: string;
  theme?: ChatTheme;
}

export default function ChatInput({
  onSend,
  onTyping,
  timer,
  theme = "midnight",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Theme-based colors
  const getThemeStyles = () => {
    switch (theme) {
      case "midnight":
        return {
          container: "bg-[#0a0a1a] border-[#1a1a3e]",
          input:
            "bg-[#12122a] border-[#1e1e4a] text-white placeholder-[#4a4a7a]",
          button: "bg-[#7c3aed] active:bg-[#6d28d9]",
        };
      case "bubblegum":
        return {
          container: "bg-[#fff0f5] border-[#ffcce0]",
          input:
            "bg-white border-[#ffcce0] text-[#4a1a3a] placeholder-[#d4a5bc]",
          button: "bg-[#e83e8c] active:bg-[#d62d7a]",
        };
      case "ocean":
        return {
          container: "bg-[#0a1628] border-[#0d2847]",
          input:
            "bg-[#0d2847] border-[#1a3a5c] text-white placeholder-[#2a5a8a]",
          button: "bg-[#0066cc] active:bg-[#0052a3]",
        };
      case "lavender":
        return {
          container: "bg-[#f3e8ff] border-[#d8b4fe]",
          input:
            "bg-white border-[#d8b4fe] text-[#3a1a5c] placeholder-[#a78bfa]",
          button: "bg-[#8b5cf6] active:bg-[#7c3aed]",
        };
      case "neon":
        return {
          container: "bg-[#050505] border-[#1a1a1a]",
          input: "bg-[#0a0a0a] border-[#1a1a1a] text-white placeholder-[#333]",
          button: "bg-[#ff00ff] active:bg-[#e600e6]",
        };
      case "rose":
        return {
          container: "bg-[#1a0a0f] border-[#2a1518]",
          input:
            "bg-[#2a1518] border-[#3a2025] text-white placeholder-[#6b3a42]",
          button: "bg-[#ff6b8a] active:bg-[#e85a78]",
        };
      default:
        return {
          container: "bg-[#0a0a1a] border-[#1a1a3e]",
          input:
            "bg-[#12122a] border-[#1e1e4a] text-white placeholder-[#4a4a7a]",
          button: "bg-[#7c3aed] active:bg-[#6d28d9]",
        };
    }
  };

  const styles = getThemeStyles();

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    if (onTyping) onTyping(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
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
    <div className={`border-t backdrop-blur-md ${styles.container}`}>
      <div className="flex items-end gap-2 px-3 py-3 max-w-2xl mx-auto">
        {/* Textarea */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`w-full px-4 py-3 rounded-2xl border text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${styles.input}`}
            style={{
              maxHeight: "120px",
              minHeight: "48px",
              fontSize: "16px",
              lineHeight: "1.4",
            }}
          />
        </div>

        {/* Send Button - Always visible */}
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`w-12 h-12 rounded-full text-white flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${styles.button}`}
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Timer and hint */}
      <div className="flex items-center justify-between pb-3 px-4 max-w-2xl mx-auto">
        <span className="text-[10px] text-neutral-500 hidden sm:block">
          Press Enter to send
        </span>
        <span className="text-[10px] text-neutral-500 tabular-nums sm:ml-auto">
          {timer}
        </span>
      </div>
    </div>
  );
}
