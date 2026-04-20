"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Users, Sparkles } from "lucide-react";

interface SearchingProps {
  selectedTags: string[];
  onMatch: () => void;
  onCancel: () => void;
}

const steps = [
  {
    icon: Loader2,
    title: "Scanning...",
    subtitle: "Looking for people with similar interests",
    spin: true,
  },
  {
    icon: Users,
    title: "Found potential matches",
    subtitle: "Checking who's online right now",
    spin: false,
  },
  {
    icon: Sparkles,
    title: "Almost there",
    subtitle: "Setting up your anonymous chat room",
    spin: false,
  },
];

// CSS animations — compositor thread, zero JS overhead
const ANIM_STYLES = `
  @keyframes sr-blob {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.1); opacity: 0.9; }
  }
  .sr-blob { animation: sr-blob 8s ease-in-out infinite; will-change: transform, opacity; }
  .sr-paused * { animation-play-state: paused !important; }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />;
}

export default function Searching({
  selectedTags,
  onMatch,
  onCancel,
}: SearchingProps) {
  const [step, setStep] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const si = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1800);
    const t = setTimeout(() => {
      clearInterval(si);
      onMatch();
    }, 5500);
    return () => {
      clearInterval(si);
      clearTimeout(t);
    };
  }, [onMatch]);

  // Pause CSS animations when tab hidden
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handler = () => {
      if (document.hidden) el.classList.add("sr-paused");
      else el.classList.remove("sr-paused");
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const CurrentIcon = steps[step].icon;

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col min-h-[100dvh] overflow-hidden"
    >
      <StyleTag />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-[#0a0515] to-[#08020e]" />

      {/* Ambient light — pure CSS, no Framer Motion loop */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none sr-blob"
        style={{
          left: "15%",
          top: "5%",
          background:
            "radial-gradient(circle, rgba(94,61,140,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated icon */}
        <motion.div
          key={step}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-plum/20 to-blush/20 border border-lavender/20 flex items-center justify-center">
            {steps[step].spin ? (
              <CurrentIcon className="w-10 h-10 text-lavender animate-spin" />
            ) : (
              <CurrentIcon className="w-10 h-10 text-lavender" />
            )}
          </div>
        </motion.div>

        {/* Text content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              {steps[step].title}
            </h2>
            <p className="text-sm text-neutral-500 mb-12">
              {steps[step].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Selected tags */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-16 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {selectedTags.map((t, i) => (
            <motion.span
              key={t}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-xs text-lavender bg-lavender/10 border border-lavender/20 px-3 py-1.5 rounded-full"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-lavender"
                  : i < step
                    ? "w-4 bg-lavender/40"
                    : "w-4 bg-white/10"
              }`}
              animate={{ width: i === step ? 32 : 16 }}
            />
          ))}
        </div>

        {/* Cancel button */}
        <motion.button
          onClick={onCancel}
          className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cancel
        </motion.button>
      </div>
    </div>
  );
}
