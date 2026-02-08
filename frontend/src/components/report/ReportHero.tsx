import { Hash, Calendar, MessageSquare } from "lucide-react";
import TrustScoreGauge from "@/components/TrustScoreGauge";
import ClassificationBadge from "@/components/dashboard/ClassificationBadge";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { ReportSlideProps } from "./types";

export default function ReportHero({ analysis, r, openDiscuss }: ReportSlideProps) {
  return (
    <section className="report-slide min-h-screen flex items-center bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 scroll-snap-align-start">
      <div className="mx-auto max-w-7xl w-full px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col lg:flex-row items-center gap-8 print-no-break">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-widest text-blue-400 font-semibold mb-3">Document Analysis Report</p>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              {analysis.display_name || analysis.filename}
            </h1>
            {analysis.author && (
              <p className="mt-2 text-base text-zinc-400">{analysis.author}</p>
            )}
            {analysis.display_name && (
              <p className="mt-1 text-xs text-zinc-600 font-mono">{analysis.filename}</p>
            )}
            <p className="mt-4 text-lg text-zinc-400 leading-relaxed max-w-3xl">{r.summary}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600">
              <HelpTooltip text={tip("file_hash")} position="right">
                <span className="flex items-center gap-1 cursor-help">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono border-b border-dotted border-zinc-700">{analysis.file_hash.slice(0, 16)}...</span>
                </span>
              </HelpTooltip>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {analysis.uploaded_at.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
          <div className="shrink-0 print-gauge-wrap">
            <TrustScoreGauge score={r.overall_trust_score} size={220} />
          </div>
        </div>

        {/* Quick Classification Strip */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-4 print-no-break">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">At a Glance</p>
            <button
              onClick={() => openDiscuss("at_a_glance", "At a Glance")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors no-print"
              title="Contest this finding and comment"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline">Comment</span>
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            <ClassificationBadge label="Provider / Consumer" value={r.provider_consumer.classification} confidence={r.provider_consumer.confidence} tooltip={tip("provider_consumer_label")} />
            <ClassificationBadge label="Originator Scale" value={r.company_scale.classification} confidence={r.company_scale.confidence} tooltip={tip("originator_scale_label")} />
            <ClassificationBadge label="Target Company" value={r.target_scale.classification} confidence={r.target_scale.confidence} tooltip={tip("target_company_label")} />
            <ClassificationBadge label="Audience Level" value={r.audience_level.classification} confidence={r.audience_level.confidence} tooltip={tip("audience_level_label")} />
            <ClassificationBadge label="Uniqueness" value={r.rarity_index.classification} confidence={r.rarity_index.confidence} tooltip={tip("uniqueness_label")} />
            <ClassificationBadge label="Manipulation" value={r.forensics.deception.manipulation_index > 40 ? "High" : r.forensics.deception.manipulation_index > 20 ? "Medium" : "Low"} scoreLabel={`${r.forensics.deception.manipulation_index}/100`} tooltip={tip("manipulation_index")} />
            <ClassificationBadge label="Fluff Score" value={r.forensics.fluff.fluff_score > 60 ? "High" : r.forensics.fluff.fluff_score > 30 ? "Medium" : "Low"} scoreLabel={`${r.forensics.fluff.fluff_score}/100`} tooltip={tip("fluff_score")} />
            <ClassificationBadge label="Bias" value={r.bias_detection.overall_bias_score > 40 ? "High" : r.bias_detection.overall_bias_score > 15 ? "Medium" : "Low"} scoreLabel={`${r.bias_detection.overall_bias_score}/100`} tooltip={tip("overall_bias_score")} />
            <ClassificationBadge label="Obsolescence" value={r.obsolescence_risk.risk_level} scoreLabel={`${r.obsolescence_risk.risk_score}/100`} tooltip={tip("section_obsolescence")} />
            <ClassificationBadge label="Hype vs Reality" value={r.hype_reality.classification} scoreLabel={`${r.hype_reality.hype_score}/100`} tooltip={tip("section_hype")} />
            <ClassificationBadge label="Implementation" value={r.implementation_readiness.verdict} scoreLabel={`${r.implementation_readiness.readiness_score}/10`} tooltip={tip("section_implementation")} />
            <ClassificationBadge label="Regulatory" value={r.regulatory_safety.safety_level} scoreLabel={`${r.regulatory_safety.safety_score}/100`} tooltip={tip("safety_score")} />
            <ClassificationBadge label="Visual Intensity" value={`${r.visual_intensity.score}/10`} scoreLabel={r.visual_intensity.assessment} tooltip={tip("visual_intensity")} />
            <ClassificationBadge label="Data Intensity" value={`${r.data_intensity.score}/10`} scoreLabel={r.data_intensity.assessment} tooltip={tip("data_intensity")} />
            <ClassificationBadge label="Key Findings" value={`${r.amazing_facts.length} found`} scoreLabel={`${r.amazing_facts.filter(f => f.is_quantified).length} quantified`} tooltip={tip("section_findings")} />
          </div>
        </div>
      </div>
    </section>
  );
}
