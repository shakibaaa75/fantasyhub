"use client";

import { motion } from "framer-motion";
import { Home, Search, MessageCircle, Settings, Sparkles } from "lucide-react";

interface NavigationBarProps {
  currentView: string;
  onNavigate: (
    view: "welcome" | "tags" | "searching" | "match" | "chat",
  ) => void;
  hasActiveChat?: boolean;
}

export default function NavigationBar({
  currentView,
  onNavigate,
  hasActiveChat = false,
}: NavigationBarProps) {
  const navItems = [
    {
      id: "welcome",
      label: "Home",
      icon: Home,
      disabled: false,
    },
    {
      id: "tags",
      label: "Find",
      icon: Search,
      disabled:
        currentView === "searching" ||
        currentView === "match" ||
        currentView === "chat",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      disabled: !hasActiveChat && currentView !== "chat",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      disabled: false,
    },
  ];

  const handleNav = (id: string) => {
    const item = navItems.find((i) => i.id === id);
    if (item?.disabled) return;

    if (id === "welcome") {
      onNavigate("welcome");
    } else if (id === "tags") {
      onNavigate("tags");
    } else if (id === "chat" && hasActiveChat) {
      onNavigate("chat");
    }
    // Settings would open a settings modal in a real app
  };

  return (
    <div className="mx-3 md:mx-6 mb-3 md:mb-4 mt-auto">
      <div className="relative flex items-center justify-around px-2 py-2.5 rounded-xl bg-[#0e0a14] border border-white/[0.08] backdrop-blur-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = item.disabled;

          return (
            <motion.button
              key={item.label}
              onClick={() => handleNav(item.id)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center gap-1.5 px-5 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : isDisabled
                    ? "text-neutral-700 cursor-not-allowed"
                    : "text-neutral-500 hover:text-neutral-300"
              }`}
              whileHover={
                !isDisabled ? { backgroundColor: "rgba(255,255,255,0.04)" } : {}
              }
              whileTap={!isDisabled ? { scale: 0.93 } : {}}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-plum/20 border border-plum/30"
                  layoutId="activeNav"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`relative z-10 text-[10px] font-body tracking-[0.08em] ${
                  isActive ? "text-lavender" : ""
                }`}
              >
                {item.label}
              </span>
              {item.id === "chat" && hasActiveChat && !isActive && (
                <motion.div
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
