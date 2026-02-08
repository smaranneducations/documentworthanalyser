"use client";

import { MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  sectionRef: string;
  onDiscuss: (sectionRef: string, sectionName: string) => void;
  children: React.ReactNode;
  className?: string;
  /** Help tooltip text shown on hover of the section title */
  tooltip?: string;
}

export default function SectionCard({
  title, icon: Icon, iconColor, iconBg,
  sectionRef, onDiscuss, children, className = "", tooltip,
}: SectionCardProps) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 print-no-break ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl ${iconBg} p-2.5`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {tooltip ? (
            <HelpTooltip text={tooltip} position="bottom">
              <h2 className="font-semibold text-base cursor-help border-b border-dotted border-zinc-700">{title}</h2>
            </HelpTooltip>
          ) : (
            <h2 className="font-semibold text-base">{title}</h2>
          )}
        </div>
        <button
          onClick={() => onDiscuss(sectionRef, title)}
          className="group/comment flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors no-print"
          title="Contest this finding and comment"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline">Comment</span>
        </button>
      </div>
      {children}
    </div>
  );
}
