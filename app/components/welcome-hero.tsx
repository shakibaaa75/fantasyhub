"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { View } from "@/lib/types";

interface WelcomeHeroProps {
  onStart: () => void;
  onNavigate: (view: View | "login" | "register") => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

// All repeat:Infinity framer-motion loops replaced with CSS keyframes.
// CSS animations run on the compositor thread — zero JS overhead per frame.
const ANIM_STYLES = `
  @keyframes wh-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes wh-float-sm {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes wh-scan {
    from { top: -1px; }
    to   { top: 100%; }
  }
  @keyframes wh-blink {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }
  @keyframes wh-glow-pulse {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 0.9; }
  }

  .wh-float    { animation: wh-float    5s ease-in-out infinite; will-change: transform; }
  .wh-float-sm { animation: wh-float-sm 5s ease-in-out infinite; will-change: transform; }
  .wh-scan     { animation: wh-scan    22s linear        infinite; }
  .wh-blink    { animation: wh-blink    2.5s ease        infinite; }
  .wh-glow     { animation: wh-glow-pulse 7s ease-in-out infinite; }

  /* Pause everything when tab is hidden — saves battery and heat */
  .wh-paused * { animation-play-state: paused !important; }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />;
}

function GhostChar({
  x,
  y,
  label,
  value,
  delay,
}: {
  x: string;
  y: string;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute px-3 py-2 rounded-lg bg-white/[0.025] border border-white/[0.05] backdrop-blur-sm"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease }}
    >
      <div className="text-[9px] text-lavender/50 font-display tracking-[0.2em] uppercase">
        {label}
      </div>
      <div className="text-sm font-display font-bold text-white/70 mt-0.5">
        {value}
      </div>
    </motion.div>
  );
}

/* ── Mobile character ───────────────────────────────────────────────────────── */
function MobileCharacter() {
  return (
    <div className="flex justify-center relative w-full">
      <motion.div
        className="relative flex items-end justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease }}
      >
        {/* Static ambient glow */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[250px] h-[300px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,61,140,0.18) 0%, rgba(171,157,217,0.06) 30%, transparent 60%)",
          }}
        />

        {/* Float — pure CSS, no JS loop */}
        <div className="relative wh-float-sm">
          <img
            src="/e06e9923-f461-4631-bbd4-d4d0a32cd898.png"
            alt="Character"
            className="relative z-10 h-[240px] sm:h-[300px] w-auto max-w-full drop-shadow-[0_0_40px_rgba(94,61,140,0.22)]"
            draggable={false}
          />
        </div>

        {/* Head glow — slow CSS pulse */}
        <div
          className="wh-glow absolute top-[18%] left-1/2 -translate-x-1/2 z-0 w-24 h-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(171,157,217,0.26) 0%, rgba(94,61,140,0.09) 35%, transparent 65%)",
            filter: "blur(8px)",
          }}
        />

        {/* Shadow — static */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-3 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(94,61,140,0.14) 0%, transparent 70%)",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ── Desktop character ──────────────────────────────────────────────────────── */
function DesktopCharacter() {
  return (
    <div className="hidden xl:flex absolute right-0 top-0 bottom-0 w-[45%] items-center justify-center pointer-events-none">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease }}
      >
        {/* All glows are static — no animation */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,61,140,0.2) 0%, rgba(171,157,217,0.06) 30%, transparent 60%)",
          }}
        />
        <div
          className="absolute left-[55%] top-[55%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(239,148,202,0.09) 0%, transparent 55%)",
          }}
        />

        {/* Float — pure CSS */}
        <div className="relative wh-float">
          <img
            src="/41c547d1-9636-43ff-b9fa-d36ed1ae09c6.png"
            alt="Character"
            className="relative h-[800px] w-auto max-w-full drop-shadow-[0_0_60px_rgba(94,61,140,0.26)]"
            draggable={false}
          />
        </div>

        {/* Head glow — slow CSS pulse */}
        <div
          className="wh-glow absolute top-[18%] left-1/2 -translate-x-1/2 z-0 w-36 h-36 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(171,157,217,0.3) 0%, rgba(94,61,140,0.1) 35%, transparent 65%)",
            filter: "blur(8px)",
          }}
        />

        {/* Remaining glows — all static */}
        <div
          className="absolute top-[50%] left-[48%] -translate-x-1/2 z-0 w-28 h-28 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(239,148,202,0.16) 0%, transparent 60%)",
            filter: "blur(10px)",
          }}
        />
        <div
          className="absolute top-[5%] left-[30%] z-0 w-[260px] h-[440px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(171,157,217,0.04) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-5 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(94,61,140,0.16) 0%, rgba(171,157,217,0.05) 40%, transparent 70%)",
          }}
        />
      </motion.div>

      <GhostChar x="10%" y="10%" label="LEVEL" value="--" delay={1.2} />
      <GhostChar x="70%" y="18%" label="STATUS" value="Waiting" delay={1.4} />
      <GhostChar x="5%" y="58%" label="MATCHES" value="∞" delay={1.6} />

      {/* Connector lines — enter-once, no loop */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.06 }}
      >
        <motion.line
          x1="20%"
          y1="16%"
          x2="38%"
          y2="28%"
          stroke="#AB9DD9"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
        />
        <motion.line
          x1="76%"
          y1="24%"
          x2="60%"
          y2="35%"
          stroke="#EF94CA"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.7 }}
        />
        <motion.line
          x1="14%"
          y1="64%"
          x2="35%"
          y2="58%"
          stroke="#AB9DD9"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.9 }}
        />
      </svg>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
export default function WelcomeHero({ onStart }: WelcomeHeroProps) {
  const [isLoading, setIsLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@aejkatappaja/phantom-ui");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Pause ALL CSS animations when tab is hidden — significant battery/heat saving
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handler = () => {
      if (document.hidden) el.classList.add("wh-paused");
      else el.classList.remove("wh-paused");
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col h-full overflow-hidden"
    >
      <StyleTag />

      {/* Static background */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-[#0a0515] to-[#08020e]" />

      {/* Two static ambient blobs — zero animation cost */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          left: "15%",
          top: "5%",
          background:
            "radial-gradient(circle, rgba(94,61,140,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          right: "5%",
          bottom: "5%",
          background:
            "radial-gradient(circle, rgba(239,148,202,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Scan line — CSS only, very slow */}
      <div
        className="wh-scan absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(171,157,217,0.07), transparent)",
        }}
      />

      <DesktopCharacter />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full flex-1">
        <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 pt-16 xl:py-26 xl:px-24">
            <div className="max-w-2xl w-full mx-auto xl:mx-0 text-center xl:text-left">
              {/* Badge */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease }}
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.025] border border-white/[0.05]">
                  {/* Blink dot — CSS only, no framer-motion */}
                  <div className="wh-blink w-1.5 h-1.5 rounded-full bg-blush" />
                  <span className="text-xs text-neutral-500 tracking-wide">
                    Anonymous · No account · Free
                  </span>
                </div>
              </motion.div>

              <motion.h1
                className="text-[clamp(2.4rem,8vw,5rem)] font-display font-extrabold tracking-[-0.03em] leading-[1.08] text-white mb-2"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease }}
              >
                Someone is
              </motion.h1>

              <motion.h1
                className="text-[clamp(2.4rem,8vw,5rem)] font-display font-extrabold tracking-[-0.03em] leading-[1.08] mb-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease }}
              >
                {/* Shimmer — already a CSS keyframe in globals.css, slowed to 5s */}
                <span
                  className="bg-gradient-to-r from-lavender via-blush to-lavender bg-clip-text text-transparent bg-[length:200%_auto]"
                  style={{ animation: "shimmer 5s linear infinite" }}
                >
                  waiting for you.
                </span>
              </motion.h1>

              <motion.p
                className="text-neutral-500 text-base md:text-lg leading-relaxed mb-10 md:mb-12 max-w-md mx-auto xl:mx-0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55, ease }}
              >
                Pick your vibes. Find your people. No accounts, no bios, no
                cringe.
              </motion.p>

              {/* Mobile character */}
              <div className="xl:hidden">
                <MobileCharacter />
              </div>

              {/* CTA */}
              <motion.div
                className="flex flex-col sm:flex-row items-center gap-4 mb-10 md:mb-14 justify-center xl:justify-start"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease }}
              >
                <motion.button
                  onClick={onStart}
                  className="group relative h-[52px] w-full sm:w-auto sm:px-8 rounded-xl overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-plum via-[#7b52a8] to-blush" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2.5 text-white font-display font-semibold text-sm tracking-wide">
                    Start Matching
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-hover:translate-x-0.5 transition-transform"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </motion.button>
                <span className="text-[11px] text-neutral-700 font-display tracking-[0.15em] hidden sm:block">
                  PRESS TO START
                </span>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex items-center justify-center xl:justify-start gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <phantom-ui
                  loading={isLoading}
                  count={3}
                  count-gap="12"
                  reveal="0.3"
                >
                  {[
                    { value: "~4s", label: "MATCH TIME" },
                    { value: "0", label: "ACCOUNTS" },
                    { value: "24/7", label: "ONLINE" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className="flex flex-col items-center xl:items-start"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 + i * 0.1, ease }}
                    >
                      <span className="text-lg font-display font-bold text-white/80 tabular-nums">
                        {s.value}
                      </span>
                      <span className="text-[10px] text-neutral-600 font-display tracking-[0.15em] mt-0.5">
                        {s.label}
                      </span>
                    </motion.div>
                  ))}
                </phantom-ui>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette — static */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(7,7,7,0.6) 100%)",
        }}
      />
    </div>
  );
}
