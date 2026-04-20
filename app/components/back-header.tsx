"use client";

import { ChevronLeft } from "lucide-react";

interface BackHeaderProps {
  label?: string;
  onBack?: () => void;
}

export default function BackHeader({ label, onBack }: BackHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-white/10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
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
