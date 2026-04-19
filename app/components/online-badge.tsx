"use client";

import { useOnlineCount } from "@/hooks/use-online-count";

export default function OnlineBadge() {
  const count = useOnlineCount();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-s3 border-brd">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 pulse" />
      <span className="text-xs text-neutral-500 tabular-nums">
        <span className="text-green-400 font-medium">{count}</span> online
      </span>
    </div>
  );
}
