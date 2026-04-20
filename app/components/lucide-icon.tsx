import { createElement } from "react";
import * as LucideIcons from "lucide-react";

interface LucideIconProps {
  name: string;
  className?: string;
}

export default function LucideIcon({
  name,
  className = "w-4 h-4",
}: LucideIconProps) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return null;
  return createElement(IconComponent, { className });
}
