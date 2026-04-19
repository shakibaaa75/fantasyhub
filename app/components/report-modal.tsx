"use client";

import { useState } from "react";
import { ReportReason } from "@/lib/types";

interface ReportModalProps {
  onReport: (reason: ReportReason) => void;
  onClose: () => void;
}

const reasons: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam / bot" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ onReport, onClose }: ReportModalProps) {
  const [picked, setPicked] = useState<ReportReason | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-s2 border-border rounded-2xl p-6 w-full max-w-xs anim-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-1">Report</h3>
        <p className="text-xs text-neutral-500 mb-5">What&apos;s the issue?</p>

        <div className="space-y-1.5">
          {reasons.map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-s3 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="report"
                value={r.value}
                checked={picked === r.value}
                onChange={() => setPicked(r.value)}
                className="accent-purple"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-s3 border-border text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => picked && onReport(picked)}
            className="flex-1 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium hover:bg-red-500/15 transition-colors"
          >
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
