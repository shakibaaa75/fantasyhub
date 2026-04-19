"use client";

import { useEffect, useState } from "react";

type ToastType = "info" | "warn" | "success";

interface ToastProps {
  message: string;
  type?: ToastType;
  onDone: () => void;
}

const styles: Record<ToastType, string> = {
  info: "border-neutral-700 text-neutral-300",
  warn: "border-yellow-500/20 text-yellow-400/80",
  success: "border-green-500/20 text-green-400/80",
};

export default function Toast({ message, type = "info", onDone }: ToastProps) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2000);
    const t2 = setTimeout(() => onDone(), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100]">
      <div
        className={`px-4 py-2 rounded-lg bg-s2 border text-xs font-medium ${styles[type]} ${out ? "toast-out" : "toast-in"}`}
      >
        {message}
      </div>
    </div>
  );
}
