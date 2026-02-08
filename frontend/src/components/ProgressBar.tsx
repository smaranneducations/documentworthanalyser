"use client";

import HelpTooltip from "@/components/HelpTooltip";

interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
  /** Help tooltip on hover of the label */
  tooltip?: string;
}

export default function ProgressBar({
  value,
  color = "bg-blue-500",
  label,
  showPercent = true,
  tooltip,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && (
            tooltip ? (
              <HelpTooltip text={tooltip} position="top">
                <span className="text-zinc-400 cursor-help border-b border-dotted border-zinc-600">{label}</span>
              </HelpTooltip>
            ) : (
              <span className="text-zinc-400">{label}</span>
            )
          )}
          {showPercent && <span className="font-mono text-zinc-300">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
