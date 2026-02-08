"use client";

import type { WeightedDriver } from "@/lib/types";
import HelpTooltip from "@/components/HelpTooltip";

interface Props {
  drivers: WeightedDriver[];
  /** Map of driver name → static tooltip text (generic description) */
  driverTooltips?: Record<string, string>;
}

export default function WeightedDriversTable({ drivers, driverTooltips }: Props) {
  return (
    <div className="space-y-3">
      {drivers.map((d, i) => (
        <div key={i} className="rounded-lg bg-zinc-800/40 px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-zinc-300 flex items-center gap-1">
              {driverTooltips?.[d.name] ? (
                <HelpTooltip
                  text={driverTooltips[d.name]}
                  insight={d.rationale || undefined}
                  position="right"
                  maxWidth={360}
                >
                  <span className="cursor-help border-b border-dotted border-zinc-600">{d.name}</span>
                </HelpTooltip>
              ) : (
                d.name
              )}
            </span>
            <div className="flex items-center gap-2">
              <HelpTooltip text={`Weight: ${Math.round(d.weight * 100)}% — This driver contributes ${Math.round(d.weight * 100)}% to the composite score.`} position="left">
                <span className="text-xs text-zinc-500 cursor-help">{Math.round(d.weight * 100)}%</span>
              </HelpTooltip>
              <span className={`text-sm font-bold ${d.score >= 7 ? "text-emerald-400" : d.score >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                {d.score}/10
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${d.score >= 7 ? "bg-emerald-500" : d.score >= 4 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${d.score * 10}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{d.rationale}</p>
        </div>
      ))}
    </div>
  );
}
