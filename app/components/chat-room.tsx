"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMsg } from "@/lib/types";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import { useChatTimer } from "@/hooks/use-chat-timer";

interface ChatRoomProps {
  sharedTags: string[];
  onReport: () => void;
  onSkip: () => void;
}

const strangerReplies = [
  "nah that boss is brutal, took me like 30 tries",
  "have you tried the DLC weapons? some are broken",
  "nice, what build are you running?",
  "haha same, i just beat it last week",
  "the lore in that fight is insane tho",
  "honestly just summon for it, life's too short",
  "wait have you found the secret area yet?",
  "that whole region is gorgeous, the music hits different",
];

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatRoom({
  sharedTags,
  onReport,
  onSkip,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "1",
      text: "hey, what games you playing right now?",
      sender: "stranger",
      time: now(),
    },
    {
      id: "2",
      text: "elden ring dlc, been stuck on messmer for days lol",
      sender: "you",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { formatted: timer, start, stop } = useChatTimer();

  useEffect(() => {
    start();
    const t = setTimeout(() => {
      setTyping(true);
      replyTimeout.current = setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "so what brought you to vibematch? just looking for people to talk games with?",
            sender: "stranger",
            time: now(),
          },
        ]);
      }, 2200);
    }, 3000);
    return () => {
      clearTimeout(t);
      clearTimeout(replyTimeout.current);
      stop();
    };
  }, [start, stop]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const handleSend = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, sender: "you", time: now() },
    ]);
    setTyping(false);
    clearTimeout(replyTimeout.current);

    replyTimeout.current = setTimeout(() => {
      setTyping(true);
      replyTimeout.current = setTimeout(
        () => {
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: strangerReplies[
                Math.floor(Math.random() * strangerReplies.length)
              ],
              sender: "stranger",
              time: now(),
            },
          ]);
        },
        1800 + Math.random() * 1200,
      );
    }, 700);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-s3 border-border flex items-center justify-center">
              <i data-lucide="user" className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-void pulse" />
          </div>
          <div>
            <div className="text-sm font-medium leading-tight">anon#7291</div>
            <div className="text-[11px] text-green-500/80">online</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReport}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-400 hover:bg-s3 transition-all"
            title="Report"
          >
            <i data-lucide="flag" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSkip}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-400 hover:bg-s3 transition-all"
            title="Next"
          >
            <i data-lucide="arrow-right" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        <div className="text-center mb-6">
          <span className="text-[11px] text-neutral-600 bg-s2 px-3 py-1 rounded-md">
            matched on {sharedTags.join(", ")}
          </span>
        </div>

        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {typing && (
          <div className="flex gap-2.5 max-w-[85%] mb-4 msg-in">
            <div className="w-7 h-7 rounded-md bg-s3 border-border flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="user" className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-s3 border-border/60">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 dot-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 dot-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 dot-3" />
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} timer={timer} />
    </div>
  );
}
