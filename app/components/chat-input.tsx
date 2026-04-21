// chat-input.tsx
"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { ChatTheme } from "./chat-room";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  timer: string;
  theme?: ChatTheme;
}

function getThemeStyles(theme: ChatTheme) {
  switch (theme) {
    case "midnight":
      return {
        container: "bg-[#0a0a1a] border-[#1a1a3e]",
        input: "bg-[#12122a] border-[#1e1e4a] text-white placeholder-[#4a4a7a]",
        icon: "text-[#a78bfa]",
      };
    case "bubblegum":
      return {
        container: "bg-[#fff0f5] border-[#ffcce0]",
        input: "bg-white border-[#ffcce0] text-[#4a1a3a] placeholder-[#d4a5bc]",
        icon: "text-[#e83e8c]",
      };
    case "ocean":
      return {
        container: "bg-[#0a1628] border-[#0d2847]",
        input: "bg-[#0d2847] border-[#1a3a5c] text-white placeholder-[#2a5a8a]",
        icon: "text-[#00d4ff]",
      };
    case "lavender":
      return {
        container: "bg-[#f3e8ff] border-[#d8b4fe]",
        input: "bg-white border-[#d8b4fe] text-[#3a1a5c] placeholder-[#a78bfa]",
        icon: "text-[#8b5cf6]",
      };
    case "neon":
      return {
        container: "bg-[#050505] border-[#1a1a1a]",
        input: "bg-[#0a0a0a] border-[#1a1a1a] text-white placeholder-[#333]",
        icon: "text-[#ff00ff]",
      };
    case "rose":
      return {
        container: "bg-[#1a0a0f] border-[#2a1518]",
        input: "bg-[#2a1518] border-[#3a2025] text-white placeholder-[#6b3a42]",
        icon: "text-[#ff6b8a]",
      };
    default:
      return {
        container: "bg-[#0a0a1a] border-[#1a1a3e]",
        input: "bg-[#12122a] border-[#1e1e4a] text-white placeholder-[#4a4a7a]",
        icon: "text-[#a78bfa]",
      };
  }
}

export default function ChatInput({
  onSend,
  onTyping,
  timer,
  theme = "midnight",
}: ChatInputProps) {
  const [isEmpty, setIsEmpty] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = getThemeStyles(theme);

  const handleSend = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.value.trim();
    if (!text) return;

    onSend(text);

    textarea.value = "";
    textarea.style.height = "auto";
    setIsEmpty(true);

    if (onTyping) onTyping(false);

    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setIsEmpty(!val.trim());

    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
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
    <div className={`flex-shrink-0 border-t ${styles.container}`}>
      <div
        className="flex items-end gap-2 px-3"
        style={{
          paddingTop: "8px",
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex-1 min-w-0 flex items-end">
          <textarea
            ref={textareaRef}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className={`w-full px-3.5 py-2 rounded-2xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${styles.input}`}
            style={{
              maxHeight: "80px",
              minHeight: "36px",
              fontSize: "15px",
              lineHeight: "1.35",
              touchAction: "manipulation",
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />
        </div>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          disabled={isEmpty}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-opacity duration-150 disabled:opacity-20 disabled:cursor-not-allowed ${styles.icon}`}
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            marginBottom: "0px",
          }}
          aria-label="Send message"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
