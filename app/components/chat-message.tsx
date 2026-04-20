import { ChatMsg } from "@/lib/types";
import { motion } from "framer-motion";
import { ChatTheme, themeConfig } from "./chat-room";

interface ChatMessageProps {
  msg: ChatMsg;
  theme?: ChatTheme;
}

const bubbleStyles: Record<ChatTheme, { you: string; stranger: string }> = {
  midnight: {
    you: "bg-[#7c3aed] text-white rounded-[1.15rem] rounded-tr-md",
    stranger: "bg-[#1a1a3e] text-[#c8c8ff] rounded-[1.15rem] rounded-tl-md",
  },
  bubblegum: {
    you: "bg-[#e83e8c] text-white rounded-[1.15rem] rounded-tr-md",
    stranger: "bg-[#ffe0ec] text-[#4a1a3a] rounded-[1.15rem] rounded-tl-md",
  },
  ocean: {
    you: "bg-[#0066cc] text-white rounded-[1.15rem] rounded-tr-md",
    stranger: "bg-[#0d2847] text-[#a8d4ff] rounded-[1.15rem] rounded-tl-md",
  },
  lavender: {
    you: "bg-[#8b5cf6] text-white rounded-[1.15rem] rounded-tr-md",
    stranger: "bg-[#e9d5ff] text-[#3a1a5c] rounded-[1.15rem] rounded-tl-md",
  },
  neon: {
    you: "bg-[#ff00ff] text-black font-medium rounded-[1.15rem] rounded-tr-md",
    stranger:
      "bg-[#111] text-[#ff00ff] border border-[#ff00ff]/30 rounded-[1.15rem] rounded-tl-md",
  },
  rose: {
    you: "bg-[#ff6b8a] text-white rounded-[1.15rem] rounded-tr-md",
    stranger: "bg-[#2a1518] text-[#ffd6e0] rounded-[1.15rem] rounded-tl-md",
  },
};

export default function ChatMessage({
  msg,
  theme = "midnight",
}: ChatMessageProps) {
  const isYou = msg.sender === "you";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex w-full mb-1 ${isYou ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[75%]">
        <div
          className={`px-4 py-2.5 text-[15px] leading-snug ${isYou ? bubbleStyles[theme].you : bubbleStyles[theme].stranger} transition-colors duration-500`}
        >
          {msg.text}
        </div>
        <div
          className={`text-[10px] mt-0.5 px-1 ${isYou ? "text-right" : "text-left"} text-neutral-500`}
        >
          {msg.time}
        </div>
      </div>
    </motion.div>
  );
}
