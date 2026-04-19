"use client";

import { useRouter } from "next/navigation";

interface BackHeaderProps {
  label?: string;
}

export default function BackHeader({ label }: BackHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-border">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm"
      >
        <i data-lucide="chevron-left" className="w-4 h-4" />
        Back
      </button>
      {label && (
        <span className="text-xs text-neutral-500 font-medium">{label}</span>
      )}
      {!label && <div />}
      <div className="w-12" />
    </div>
  );
}
