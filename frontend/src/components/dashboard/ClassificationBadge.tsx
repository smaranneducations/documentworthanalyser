"use client";

import HelpTooltip from "@/components/HelpTooltip";

interface Props {
  label: string;
  value: string;
  confidence?: number;
  /** Override the subtitle text under the value. Default: "{confidence}% confidence" */
  scoreLabel?: string;
  tooltip?: string;
  valueTooltip?: string;
  colorMap?: Record<string, { text: string; bg: string; border: string }>;
}

const DEFAULT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "Provider-Favored": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  "Consumer-Favored": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Balanced": { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Solo/Boutique": { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  "Mid-tier": { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Big 4/GSI": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "Startup": { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30" },
  "SME": { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Enterprise": { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  "Developer": { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  "Manager": { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "VP": { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  "C-Suite": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "Commodity": { text: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
  "Differentiated": { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Category-Defining": { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "Implementation Ready": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Partially Actionable": { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "Theoretical Only": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  "Not Actionable": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  "Low": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Medium": { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "High": { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  "Critical": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  "Safe": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Caution": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "High Risk": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  "Balanced Analysis": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Optimistic": { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "Sales Propaganda": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

export default function ClassificationBadge({ label, value, confidence, scoreLabel, tooltip, valueTooltip, colorMap }: Props) {
  const colors = (colorMap ?? DEFAULT_COLORS)[value] ?? { text: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" };

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} px-3 py-2.5 text-center print-no-break`}>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
        {tooltip ? (
          <HelpTooltip text={tooltip} position="top">
            <span className="cursor-help border-b border-dotted border-zinc-600">{label}</span>
          </HelpTooltip>
        ) : (
          label
        )}
      </p>
      {valueTooltip ? (
        <HelpTooltip text={valueTooltip} position="bottom">
          <p className={`text-lg font-bold ${colors.text} cursor-help`}>{value}</p>
        </HelpTooltip>
      ) : (
        <p className={`text-lg font-bold ${colors.text}`}>{value}</p>
      )}
      {(confidence !== undefined || scoreLabel) && (
        <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
          <HelpTooltip text={scoreLabel ? "Score for this metric based on detected text patterns." : "Statistical confidence in this classification. Higher % means stronger signal from detected text patterns."} position="bottom">
            <span className="cursor-help border-b border-dotted border-zinc-600">{scoreLabel ?? `${Math.round(confidence!)}% confidence`}</span>
          </HelpTooltip>
        </p>
      )}
    </div>
  );
}
