import { Tag } from "@/lib/types";
import { motion } from "framer-motion";
import LucideIcon from "./lucide-icon";

interface TagChipProps {
  tag: Tag;
  selected: boolean;
  onClick: () => void;
}

export default function TagChip({ tag, selected, onClick }: TagChipProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm transition-all duration-200 cursor-pointer select-none ${
        selected
          ? "bg-white/[0.08] border-lavender/30 text-white shadow-[0_0_15px_rgba(171,157,217,0.15)]"
          : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:bg-white/[0.04] hover:border-white/[0.1] hover:text-neutral-300"
      }`}
    >
      <LucideIcon
        name={tag.icon
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")}
        className={`w-3.5 h-3.5 ${selected ? "text-lavender opacity-80" : "opacity-50"}`}
      />
      <span className="font-medium">{tag.name}</span>
    </motion.button>
  );
}
