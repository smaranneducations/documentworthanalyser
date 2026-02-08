"use client";

import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  text: string;
  /** Inline mode wraps children and shows tooltip on hover of the whole element */
  children?: React.ReactNode;
  /** Show the small ? icon. Defaults to true when no children. */
  showIcon?: boolean;
  /** Max width of tooltip in px */
  maxWidth?: number;
  /** Position hint */
  position?: "top" | "bottom" | "left" | "right";
}

export default function HelpTooltip({
  text,
  children,
  showIcon,
  maxWidth = 280,
  position = "top",
}: HelpTooltipProps) {
  const shouldShowIcon = showIcon ?? !children;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-zinc-700",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-zinc-700",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-zinc-700",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-zinc-700",
  };

  return (
    <span className="relative inline-flex items-center group/tooltip">
      {children}
      {shouldShowIcon && (
        <HelpCircle className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-help ml-1 shrink-0" />
      )}
      {/* Tooltip bubble */}
      <span
        className={`
          pointer-events-none absolute z-50 ${positionClasses[position]}
          opacity-0 group-hover/tooltip:opacity-100
          transition-opacity duration-200
        `}
        style={{ maxWidth }}
      >
        <span className="block rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 leading-relaxed shadow-xl">
          {text}
        </span>
        <span className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
      </span>
    </span>
  );
}
