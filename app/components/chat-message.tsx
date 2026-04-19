import { ChatMsg } from "@/lib/types";

interface ChatMessageProps {
  msg: ChatMsg;
}

export default function ChatMessage({ msg }: ChatMessageProps) {
  const isYou = msg.sender === "you";

  return (
    <div
      className={`flex gap-2.5 max-w-[85%] mb-4 msg-in ${isYou ? "ml-auto flex-row-reverse" : ""}`}
    >
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
          isYou ? "bg-purple/20 border-purple/30" : "bg-s3 border-border"
        }`}
      >
        {isYou ? (
          <span className="text-[10px] font-bold text-lavender">you</span>
        ) : (
          <i data-lucide="user" className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </div>

      <div>
        <div
          className={`px-3.5 py-2.5 rounded-2xl border ${
            isYou
              ? "rounded-tr-md bg-purple text-white border-transparent"
              : "rounded-tl-md bg-s3 border-border/60"
          }`}
        >
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
        <span
          className={`text-[10px] text-neutral-700 mt-1 block ${isYou ? "text-right mr-1" : "ml-1"}`}
        >
          {msg.time}
        </span>
      </div>
    </div>
  );
}
