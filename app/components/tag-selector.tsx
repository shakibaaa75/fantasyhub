"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { tags, categories } from "@/lib/tags-data";
import TagChip from "./tag-chip";
import BackHeader from "./back-header";

interface TagSelectorProps {
  onContinue: (selected: string[]) => void;
  onBack: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function TagSelector({ onContinue, onBack }: TagSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [cat, setCat] = useState("all");

  const toggle = useCallback((name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 5) return prev;
      return [...prev, name];
    });
  }, []);

  const filtered =
    cat === "all" ? tags : tags.filter((t) => t.category === cat);
  const canContinue = selected.length >= 3;

  return (
    <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
      {/* Background - matching Welcome page style */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-[#0a0515] to-[#08020e]" />

      {/* Ambient lights - same as Welcome page */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          left: "15%",
          top: "5%",
          background:
            "radial-gradient(circle, rgba(94,61,140,0.12) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          right: "5%",
          bottom: "5%",
          background:
            "radial-gradient(circle, rgba(239,148,202,0.07) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Background image - bottom left */}
      <div className="absolute bottom-0 left-0 w-[300px] h-[400px] pointer-events-none z-0 opacity-40">
        <img
          src="/e06e9923-f461-4631-bbd4-d4d0a32cd898.png"
          alt=""
          className="w-full h-full object-contain object-bottom-left"
          style={{
            filter: "drop-shadow(0 0 30px rgba(94,61,140,0.3))",
            maskImage: "linear-gradient(to top, black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 60%, transparent 100%)",
          }}
        />
        {/* Glow effect behind image */}
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(94,61,140,0.3) 0%, transparent 70%)",
            transform: "scale(1.5)",
          }}
        />
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(7,7,7,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <BackHeader label="1 / 2" onBack={onBack} />

        <div className="flex-1 flex flex-col max-w-lg w-full mx-auto px-6 py-10">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">
              Pick your vibes.
            </h2>
            <p className="text-sm text-neutral-500">
              Choose 3–5. We&apos;ll match on these.
            </p>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-plum to-blush"
                initial={{ width: 0 }}
                animate={{ width: `${(selected.length / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-neutral-500 tabular-nums w-8 text-right font-display">
              {selected.length}/5
            </span>
          </motion.div>

          <motion.div
            className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  cat === c.key
                    ? "bg-white/[0.08] text-white border border-white/[0.1]"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-2 mb-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
          >
            {filtered.map((tag, i) => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
              >
                <TagChip
                  tag={tag}
                  selected={selected.includes(tag.name)}
                  onClick={() => toggle(tag.name)}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
          >
            <motion.button
              disabled={!canContinue}
              onClick={() => canContinue && onContinue(selected)}
              className={`w-full h-[52px] rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-200 overflow-hidden relative ${
                canContinue
                  ? "text-white cursor-pointer"
                  : "bg-white/[0.03] text-neutral-600 cursor-not-allowed border border-white/[0.05]"
              }`}
              whileHover={canContinue ? { scale: 1.02 } : {}}
              whileTap={canContinue ? { scale: 0.98 } : {}}
            >
              {canContinue && (
                <div className="absolute inset-0 bg-gradient-to-r from-plum via-[#7b52a8] to-blush" />
              )}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={canContinue ? { x: "100%" } : {}}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10">
                {canContinue ? "Find someone" : "Pick at least 3 to continue"}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
