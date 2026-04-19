"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import OnlineBadge from "./online-badge";

interface WelcomeHeroProps {
  onStart: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

interface ParticleData {
  x: string;
  y: string;
  size: number;
  opacity: number;
  duration: number;
}

function Particle({ delay, data }: { delay: number; data: ParticleData }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: data.x,
        top: data.y,
        width: data.size,
        height: data.size,
        background: `radial-gradient(circle, rgba(171,157,217,${data.opacity}) 0%, transparent 70%)`,
      }}
      animate={{ y: [0, -25, 0], opacity: [0.2, 0.5, 0.2] }}
      transition={{
        duration: data.duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

function GhostChar({
  icon,
  x,
  y,
  label,
  value,
  delay,
}: {
  icon: string;
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

/* ========== MOBILE CHARACTER ========== */
function MobileCharacter() {
  return (
    <div className="flex justify-center  relative w-full">
      <motion.div
        className="relative flex items-end justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease }}
      >
        <motion.div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[250px] h-[300px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,61,140,0.25) 0%, rgba(171,157,217,0.08) 30%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/e06e9923-f461-4631-bbd4-d4d0a32cd898.png"
            alt="Character"
            className="relative z-10 h-[240px] sm:h-[300px] w-auto max-w-full drop-shadow-[0_0_40px_rgba(94,61,140,0.25)]"
            draggable={false}
          />
        </motion.div>
        <motion.div
          className="absolute top-[18%] left-1/2 -translate-x-1/2 z-0 w-24 h-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(171,157,217,0.35) 0%, rgba(94,61,140,0.15) 35%, transparent 65%)",
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-3 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(94,61,140,0.2) 0%, transparent 70%)",
          }}
          animate={{ scaleX: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

/* ========== DESKTOP CHARACTER ========== */
function DesktopCharacter() {
  return (
    <div className="hidden xl:flex absolute right-0 top-0 bottom-0 w-[45%] items-center justify-center pointer-events-none">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease }}
      >
        <motion.div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,61,140,0.3) 0%, rgba(171,157,217,0.1) 30%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[55%] top-[55%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(239,148,202,0.15) 0%, transparent 55%)",
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
        <motion.div
          className="relative"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/41c547d1-9636-43ff-b9fa-d36ed1ae09c6.png"
            alt="Character"
            className="relative h-[800px] w-auto max-w-full drop-shadow-[0_0_60px_rgba(94,61,140,0.3)]"
            draggable={false}
          />
        </motion.div>
        <motion.div
          className="absolute top-[18%] left-1/2 -translate-x-1/2 z-0 w-36 h-36 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(171,157,217,0.4) 0%, rgba(94,61,140,0.15) 35%, transparent 65%)",
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[50%] left-[48%] -translate-x-1/2 z-0 w-28 h-28 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(239,148,202,0.25) 0%, transparent 60%)",
            filter: "blur(10px)",
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <div
          className="absolute top-[5%] left-[30%] z-0 w-[260px] h-[440px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(171,157,217,0.08) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <motion.div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-5 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(94,61,140,0.25) 0%, rgba(171,157,217,0.08) 40%, transparent 70%)",
          }}
          animate={{ scaleX: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <GhostChar
        icon="level"
        x="10%"
        y="10%"
        label="LEVEL"
        value="--"
        delay={1.2}
      />
      <GhostChar
        icon="status"
        x="70%"
        y="18%"
        label="STATUS"
        value="Waiting"
        delay={1.4}
      />
      <GhostChar
        icon="match"
        x="5%"
        y="58%"
        label="MATCHES"
        value="∞"
        delay={1.6}
      />

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

/* ========== MAIN ========== */
export default function WelcomeHero({ onStart }: WelcomeHeroProps) {
  const [particles, setParticles] = useState<ParticleData[]>([]);

  useEffect(() => {
    // Generate random values only on client to avoid hydration mismatch
    setParticles(
      Array.from({ length: 15 }, () => ({
        x: `${8 + Math.random() * 84}%`,
        y: `${8 + Math.random() * 84}%`,
        size: 3 + Math.random() * 5,
        opacity: 0.25 + Math.random() * 0.3,
        duration: 4 + Math.random() * 3,
      })),
    );
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-[#0a0515] to-[#08020e]" />

      {/* Ambient lights */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
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
        className="absolute w-[400px] h-[400px] rounded-full"
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

      {/* Particles - client-side only */}
      {particles.map((p, i) => (
        <Particle key={i} delay={i * 0.5} data={p} />
      ))}

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-lavender/15 to-transparent"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {/* Desktop character — absolute right side */}
      <DesktopCharacter />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Nav */}
        <motion.div
          className="flex items-center justify-between px-6 md:px-12 py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-plum to-blush flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
              </svg>
            </motion.div>
            <span className="text-sm font-display font-semibold tracking-tight text-white/90">
              vibematch
            </span>
          </div>
          <div className="flex items-center gap-4">
            <OnlineBadge />
            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.05]"
              whileHover={{ borderColor: "rgba(171,157,217,0.15)" }}
            >
              <span className="text-[10px] font-display text-lavender/50 tracking-[0.15em]">
                v0.1
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto">
          {/* Text content section */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 xl:py-26 xl:px-24">
            <div className="max-w-2xl w-full mx-auto xl:mx-0 text-center xl:text-left">
              {/* Tag */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease }}
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.025] border border-white/[0.05]">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-blush"
                    animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
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
                <span
                  className="bg-gradient-to-r from-lavender via-blush to-lavender bg-clip-text text-transparent bg-[length:200%_auto]"
                  style={{ animation: "shimmer 4s linear infinite" }}
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

              {/* Mobile character - appears above button on mobile */}
              <div className="xl:hidden ">
                <MobileCharacter />
              </div>

              {/* CTA - Full width on mobile */}
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
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <motion.div
          className="mx-3 md:mx-6 mb-3 md:mb-4 mt-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease }}
        >
          <div className="relative flex items-center justify-around px-2 py-2.5 rounded-xl bg-[#0e0a14] border border-white/[0.08]">
            {[
              {
                label: "Home",
                active: true,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ),
              },
              {
                label: "Find",
                active: false,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                ),
              },
              {
                label: "Chat",
                active: false,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                label: "Settings",
                active: false,
                icon: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
              },
            ].map((item) => (
              <motion.button
                key={item.label}
                className={`relative flex flex-col items-center gap-1.5 px-5 py-2 rounded-lg transition-all duration-200 ${item.active ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                whileTap={{ scale: 0.93 }}
              >
                {item.active && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-plum/20 border border-plum/30"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span
                  className={`relative z-10 text-[10px] font-body tracking-[0.08em] ${item.active ? "text-lavender" : ""}`}
                >
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Vignette */}
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
