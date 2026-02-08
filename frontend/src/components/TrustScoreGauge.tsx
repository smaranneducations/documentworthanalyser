"use client";

import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";

interface TrustScoreGaugeProps {
  score: number;
  size?: number;
}

export default function TrustScoreGauge({ score, size = 180 }: TrustScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: "#22c55e", text: "text-emerald-400", label: "Trustworthy" };
    if (s >= 40) return { stroke: "#eab308", text: "text-yellow-400", label: "Caution" };
    return { stroke: "#ef4444", text: "text-red-400", label: "Suspicious" };
  };

  const { stroke, text, label } = getColor(score);

  return (
    <HelpTooltip text={tip("overall_trust_score")} position="left" maxWidth={300}>
      <div className="flex flex-col items-center cursor-help">
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round"
          />
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none" stroke={stroke} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-1000 ease-out"
          />
          <text x={size / 2} y={size / 2 - 5} textAnchor="middle"
            className="fill-zinc-100 text-3xl font-bold" fontSize="36" fontWeight="700">
            {score}
          </text>
          <text x={size / 2} y={size / 2 + 18} textAnchor="middle"
            className="fill-zinc-500 text-xs" fontSize="12">
            / 100
          </text>
        </svg>
        <span className={`mt-1 text-sm font-semibold ${text}`}>{label}</span>
      </div>
    </HelpTooltip>
  );
}
