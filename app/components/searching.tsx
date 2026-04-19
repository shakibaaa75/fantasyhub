"use client";

import { useEffect, useState } from "react";

interface SearchingProps {
  selectedTags: string[];
  onMatch: () => void;
  onCancel: () => void;
}

const steps = [
  ["Scanning...", "Checking for shared interests"],
  ["Found a potential match", "Verifying they're online"],
  ["Almost there", "Setting up the room"],
];

export default function Searching({
  selectedTags,
  onMatch,
  onCancel,
}: SearchingProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const si = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1400);
    const t = setTimeout(() => {
      clearInterval(si);
      onMatch();
    }, 5000);
    return () => {
      clearInterval(si);
      clearTimeout(t);
    };
  }, [onMatch]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-10 h-10 rounded-full border-2 border-purple/40 border-t-transparent spin mb-10" />

      <p className="text-lg font-medium mb-2">{steps[step][0]}</p>
      <p className="text-sm text-neutral-500 mb-12">{steps[step][1]}</p>

      <div className="flex flex-wrap gap-1.5 justify-center mb-16 max-w-xs">
        {selectedTags.map((t) => (
          <span
            key={t}
            className="text-[11px] text-neutral-500 bg-s3 px-2.5 py-1 rounded-md"
          >
            {t}
          </span>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors"
      >
        cancel
      </button>
    </div>
  );
}
