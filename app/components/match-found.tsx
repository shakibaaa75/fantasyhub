"use client";

import { motion } from "framer-motion";
import { MessageCircle, Video, SkipForward } from "lucide-react";

interface MatchFoundProps {
  strangerName: string;
  sharedTags: string[];
  matchMode: "chat" | "video";
  onChat: () => void;
  onVideo: () => void;
  onSkip: () => void;
}

export default function MatchFound({
  strangerName,
  sharedTags,
  matchMode,
  onChat,
  onVideo,
  onSkip,
}: MatchFoundProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            left: "50%",
            top: "40%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(94,61,140,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 text-center max-w-sm mx-auto px-6"
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-plum/30 to-blush/30 border border-lavender/20 flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-3xl">👻</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Match found!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-neutral-400 mb-2"
        >
          You and <span className="text-white font-medium">{strangerName}</span>{" "}
          share
        </motion.p>

        {/* Shared tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-1.5 justify-center mb-8"
        >
          {sharedTags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-lavender bg-lavender/10 border border-lavender/20 px-3 py-1.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* Mode indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mb-8"
        >
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              matchMode === "video"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-green-500/10 text-green-400 border border-green-500/20"
            }`}
          >
            {matchMode === "video" ? "🔴 Video Call" : "💬 Text Chat"}
          </span>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          {matchMode === "video" ? (
            <motion.button
              onClick={onVideo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-plum to-blush text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(94,61,140,0.4)] transition-shadow"
            >
              <Video className="w-5 h-5" />
              Start Video Call
            </motion.button>
          ) : (
            <motion.button
              onClick={onChat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-plum to-blush text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(94,61,140,0.4)] transition-shadow"
            >
              <MessageCircle className="w-5 h-5" />
              Start Chatting
            </motion.button>
          )}

          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-neutral-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
          >
            <SkipForward className="w-4 h-4" />
            Find Someone Else
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
