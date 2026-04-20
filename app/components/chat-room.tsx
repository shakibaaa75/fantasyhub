"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMsg } from "@/lib/types";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import { useChatTimer } from "@/hooks/use-chat-timer";
import {
  User,
  Flag,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { wsService } from "@/lib/websocket-service";

export type ChatTheme =
  | "midnight"
  | "bubblegum"
  | "ocean"
  | "lavender"
  | "neon"
  | "rose";

interface ChatRoomProps {
  strangerName: string;
  sharedTags: string[];
  matchId: string;
  onReport: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const themeConfig: Record<
  ChatTheme,
  {
    name: string;
    bg: string;
    headerBg: string;
    headerBorder: string;
    text: string;
    subtext: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    avatarBg: string;
    avatarRing: string;
    iconHoverBg: string;
    iconHoverText: string;
    menuBg: string;
    menuBorder: string;
    menuItemHover: string;
    menuActiveBg: string;
    menuActiveText: string;
    menuText: string;
    typingBg: string;
    accentColor: string;
  }
> = {
  midnight: {
    name: "Midnight",
    bg: "bg-[#0a0a1a]",
    headerBg: "bg-[#0a0a1a]/95",
    headerBorder: "border-[#1a1a3e]",
    text: "text-[#e0e0ff]",
    subtext: "text-[#6b6b9e]",
    badgeBg: "bg-[#12122a]",
    badgeBorder: "border-[#1e1e4a]",
    badgeText: "text-[#6b6b9e]",
    avatarBg: "bg-[#1a1a3e]",
    avatarRing: "ring-[#0a0a1a]",
    iconHoverBg: "hover:bg-[#1a1a3e]",
    iconHoverText: "hover:text-[#a78bfa]",
    menuBg: "bg-[#12122a]",
    menuBorder: "border-[#1e1e4a]",
    menuItemHover: "hover:bg-[#1a1a3e]",
    menuActiveBg: "bg-[#1a1a3e]",
    menuActiveText: "text-[#a78bfa]",
    menuText: "text-[#6b6b9e]",
    typingBg: "bg-[#1a1a3e]",
    accentColor: "#a78bfa",
  },
  bubblegum: {
    name: "Bubblegum",
    bg: "bg-[#fff0f5]",
    headerBg: "bg-[#fff0f5]/95",
    headerBorder: "border-[#ffcce0]",
    text: "text-[#4a1a3a]",
    subtext: "text-[#b06b8a]",
    badgeBg: "bg-[#ffe0ec]",
    badgeBorder: "border-[#ffcce0]",
    badgeText: "text-[#b06b8a]",
    avatarBg: "bg-[#ffcce0]",
    avatarRing: "ring-[#fff0f5]",
    iconHoverBg: "hover:bg-[#ffcce0]",
    iconHoverText: "hover:text-[#e83e8c]",
    menuBg: "bg-white",
    menuBorder: "border-[#ffcce0]",
    menuItemHover: "hover:bg-[#fff0f5]",
    menuActiveBg: "bg-[#ffe0ec]",
    menuActiveText: "text-[#e83e8c]",
    menuText: "text-[#b06b8a]",
    typingBg: "bg-[#ffe0ec]",
    accentColor: "#e83e8c",
  },
  ocean: {
    name: "Ocean",
    bg: "bg-[#0a1628]",
    headerBg: "bg-[#0a1628]/95",
    headerBorder: "border-[#0d2847]",
    text: "text-[#c8e6ff]",
    subtext: "text-[#4a90d9]",
    badgeBg: "bg-[#0d2847]",
    badgeBorder: "border-[#1a3a5c]",
    badgeText: "text-[#4a90d9]",
    avatarBg: "bg-[#0d2847]",
    avatarRing: "ring-[#0a1628]",
    iconHoverBg: "hover:bg-[#0d2847]",
    iconHoverText: "hover:text-[#00d4ff]",
    menuBg: "bg-[#0d2847]",
    menuBorder: "border-[#1a3a5c]",
    menuItemHover: "hover:bg-[#1a3a5c]",
    menuActiveBg: "bg-[#1a3a5c]",
    menuActiveText: "text-[#00d4ff]",
    menuText: "text-[#4a90d9]",
    typingBg: "bg-[#0d2847]",
    accentColor: "#00d4ff",
  },
  lavender: {
    name: "Lavender",
    bg: "bg-[#f3e8ff]",
    headerBg: "bg-[#f3e8ff]/95",
    headerBorder: "border-[#d8b4fe]",
    text: "text-[#3a1a5c]",
    subtext: "text-[#7c3aed]",
    badgeBg: "bg-[#e9d5ff]",
    badgeBorder: "border-[#d8b4fe]",
    badgeText: "text-[#7c3aed]",
    avatarBg: "bg-[#d8b4fe]",
    avatarRing: "ring-[#f3e8ff]",
    iconHoverBg: "hover:bg-[#d8b4fe]",
    iconHoverText: "hover:text-[#6d28d9]",
    menuBg: "bg-white",
    menuBorder: "border-[#d8b4fe]",
    menuItemHover: "hover:bg-[#f3e8ff]",
    menuActiveBg: "bg-[#e9d5ff]",
    menuActiveText: "text-[#6d28d9]",
    menuText: "text-[#7c3aed]",
    typingBg: "bg-[#e9d5ff]",
    accentColor: "#8b5cf6",
  },
  neon: {
    name: "Neon",
    bg: "bg-[#050505]",
    headerBg: "bg-[#050505]/95",
    headerBorder: "border-[#1a1a1a]",
    text: "text-[#e0e0e0]",
    subtext: "text-[#666]",
    badgeBg: "bg-[#0a0a0a]",
    badgeBorder: "border-[#1a1a1a]",
    badgeText: "text-[#666]",
    avatarBg: "bg-[#111]",
    avatarRing: "ring-[#050505]",
    iconHoverBg: "hover:bg-[#111]",
    iconHoverText: "hover:text-[#ff00ff]",
    menuBg: "bg-[#0a0a0a]",
    menuBorder: "border-[#1a1a1a]",
    menuItemHover: "hover:bg-[#111]",
    menuActiveBg: "bg-[#1a1a1a]",
    menuActiveText: "text-[#ff00ff]",
    menuText: "text-[#666]",
    typingBg: "bg-[#111]",
    accentColor: "#ff00ff",
  },
  rose: {
    name: "Rose Gold",
    bg: "bg-[#1a0a0f]",
    headerBg: "bg-[#1a0a0f]/95",
    headerBorder: "border-[#2a1518]",
    text: "text-[#ffd6e0]",
    subtext: "text-[#c4717a]",
    badgeBg: "bg-[#2a1518]",
    badgeBorder: "border-[#3a2025]",
    badgeText: "text-[#c4717a]",
    avatarBg: "bg-[#2a1518]",
    avatarRing: "ring-[#1a0a0f]",
    iconHoverBg: "hover:bg-[#2a1518]",
    iconHoverText: "hover:text-[#ff6b8a]",
    menuBg: "bg-[#2a1518]",
    menuBorder: "border-[#3a2025]",
    menuItemHover: "hover:bg-[#3a2025]",
    menuActiveBg: "bg-[#3a2025]",
    menuActiveText: "text-[#ff6b8a]",
    menuText: "text-[#c4717a]",
    typingBg: "bg-[#2a1518]",
    accentColor: "#ff6b8a",
  },
};

const MemoizedChatMessage = memo(ChatMessage);

export default function ChatRoom({
  strangerName,
  sharedTags,
  matchId,
  onReport,
  onSkip,
  onBack,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [theme, setTheme] = useState<ChatTheme>("midnight");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatted: timer, start, stop } = useChatTimer();
  const handlersRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = themeConfig[theme];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    start();

    const handleMessage = (data: any) => {
      const newMsg: ChatMsg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: data.content || data,
        sender: "stranger",
        time: getTime(),
      };
      setMessages((prev) => [...prev, newMsg]);
    };

    const handleTyping = () => {
      setIsStrangerTyping(true);
      setTimeout(() => setIsStrangerTyping(false), 2000);
    };

    const handleDisconnected = () => {
      const systemMsg: ChatMsg = {
        id: Date.now().toString(),
        text: "Stranger has disconnected",
        sender: "stranger",
        time: getTime(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    };

    handlersRef.current = { handleMessage, handleTyping, handleDisconnected };

    wsService.on("chat_message", handleMessage);
    wsService.on("typing", handleTyping);
    wsService.on("disconnected", handleDisconnected);

    return () => {
      stop();
      if (handlersRef.current) {
        wsService.off("chat_message", handlersRef.current.handleMessage);
        wsService.off("typing", handlersRef.current.handleTyping);
        wsService.off("disconnected", handlersRef.current.handleDisconnected);
      }
    };
  }, [start, stop]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStrangerTyping]);

  const handleSend = useCallback(
    (text: string) => {
      const userMsg: ChatMsg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text,
        sender: "you",
        time: getTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      wsService.send({
        type: "chat_message",
        data: { content: text },
        to_id: matchId,
      });
      wsService.send({ type: "typing", data: { is_typing: false } });
    },
    [matchId],
  );

  const handleTyping = useCallback((isTyping: boolean) => {
    wsService.send({ type: "typing", data: { is_typing: isTyping } });
  }, []);

  return (
    <div className={`flex flex-col h-screen w-full ${t.bg} overflow-hidden`}>
      {/* HEADER — sticky top-0 */}
      <div
        className={`sticky top-0 z-20 flex-shrink-0 ${t.headerBg} border-b ${t.headerBorder} backdrop-blur-md`}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className={`sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 ${t.iconHoverBg} ${t.iconHoverText} transition-all duration-300 shrink-0`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="relative shrink-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${t.avatarBg} flex items-center justify-center`}
              >
                <User className="w-4 h-4 text-neutral-500" />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ${t.avatarRing}`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className={`text-sm font-semibold ${t.text} truncate`}>
                {strangerName}
              </div>
              <div className="text-[10px] sm:text-xs text-green-500">
                online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-neutral-500 ${t.iconHoverBg} ${t.iconHoverText}`}
              >
                <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className={`absolute right-0 top-12 rounded-xl border p-2 shadow-2xl z-50 min-w-[160px] ${t.menuBg} ${t.menuBorder}`}
                  >
                    {(Object.keys(themeConfig) as ChatTheme[]).map((th) => (
                      <button
                        key={th}
                        onClick={() => {
                          setTheme(th);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium capitalize ${
                          theme === th
                            ? `${t.menuActiveBg} ${t.menuActiveText}`
                            : `${t.menuText} ${t.menuItemHover}`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: themeConfig[th].accentColor,
                            }}
                          />
                          <span className="truncate">
                            {themeConfig[th].name}
                          </span>
                          {theme === th && <span className="ml-auto">✓</span>}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-neutral-500 ${t.iconHoverBg} ${t.iconHoverText}`}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" />
              )}
            </button>

            <button
              onClick={onReport}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-neutral-500 ${t.iconHoverBg} hover:text-red-400`}
            >
              <Flag className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onSkip}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-neutral-500 ${t.iconHoverBg} ${t.iconHoverText}`}
            >
              <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BADGE — sticky below header */}
      <div
        className={`sticky top-[48px] sm:top-[56px] z-10 flex-shrink-0 flex justify-center px-4 pt-2 pb-1 ${t.bg}`}
      >
        <div
          className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border ${t.badgeBg} ${t.badgeBorder} ${t.badgeText} truncate max-w-full`}
        >
          matched on {sharedTags.join(" • ")}
        </div>
      </div>

      {/* MESSAGES — ONLY this scrolls */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 space-y-1"
      >
        {messages.map((msg) => (
          <MemoizedChatMessage key={msg.id} msg={msg} theme={theme} />
        ))}
        {isStrangerTyping && (
          <div className="flex justify-start w-full mb-1">
            <div
              className={`${t.typingBg} rounded-[1.15rem] rounded-tl-md px-3 sm:px-4 py-2.5 sm:py-3`}
            >
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT — stays at bottom */}
      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          timer={timer}
          theme={theme}
        />
      </div>
    </div>
  );
}
