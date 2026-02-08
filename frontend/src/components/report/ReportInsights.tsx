import { BarChart3, Shield, Lightbulb, CheckCircle2 } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import ProgressBar from "@/components/ProgressBar";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { ReportSlideProps } from "./types";

export default function ReportInsights({ r, openDiscuss }: ReportSlideProps) {
  return (
    <section className="report-slide min-h-screen flex items-start bg-gradient-to-b from-zinc-950 to-zinc-900/60 scroll-snap-align-start print-page-break">
      <div className="mx-auto max-w-7xl w-full px-6 py-16">
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
            <BarChart3 className="h-6 w-6 text-green-400" />
            <HelpTooltip text={tip("header_composition")} position="bottom">
              <span className="cursor-help border-b border-dotted border-zinc-600">Composition, Bias & Insights</span>
            </HelpTooltip>
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Composition */}
            <SectionCard title="Composition Scoring" tooltip={tip("section_composition")} icon={BarChart3} iconColor="text-green-400" iconBg="bg-green-500/10" sectionRef="composition" onDiscuss={openDiscuss}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <HelpTooltip text={tip("visual_intensity")} insight={r.visual_intensity.assessment || undefined} position="top" maxWidth={360}>
                  <div className="text-center cursor-help">
                    <p className="text-xs text-zinc-500 uppercase mb-1 border-b border-dotted border-zinc-600 inline">Visual</p>
                    <div><span className="text-3xl font-bold text-green-400">{r.visual_intensity.score}</span><span className="text-zinc-500"> /10</span></div>
                  </div>
                </HelpTooltip>
                <HelpTooltip text={tip("data_intensity")} insight={r.data_intensity.assessment || undefined} position="top" maxWidth={360}>
                  <div className="text-center cursor-help">
                    <p className="text-xs text-zinc-500 uppercase mb-1 border-b border-dotted border-zinc-600 inline">Data</p>
                    <div><span className="text-3xl font-bold text-blue-400">{r.data_intensity.score}</span><span className="text-zinc-500"> /10</span></div>
                  </div>
                </HelpTooltip>
              </div>
              <div className="space-y-2">
                <ProgressBar value={r.visual_intensity.score * 10} label="Visual Intensity" tooltip={tip("visual_intensity")} color="bg-green-500" />
                <p className="text-xs text-zinc-500 mb-2">{r.visual_intensity.assessment}</p>
                <ProgressBar value={r.data_intensity.score * 10} label="Data Intensity" tooltip={tip("data_intensity")} color="bg-blue-500" />
                <p className="text-xs text-zinc-500">{r.data_intensity.assessment}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <HelpTooltip text={tip("diagrams")} position="top"><div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help"><p className="text-sm font-bold text-zinc-300">{r.visual_intensity.diagram_references}</p><p className="text-xs text-zinc-600 border-b border-dotted border-zinc-700 inline">Diagrams</p></div></HelpTooltip>
                <HelpTooltip text={tip("citations")} position="top"><div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help"><p className="text-sm font-bold text-zinc-300">{r.data_intensity.citations_detected}</p><p className="text-xs text-zinc-600 border-b border-dotted border-zinc-700 inline">Citations</p></div></HelpTooltip>
                <HelpTooltip text={tip("tables")} position="top"><div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help"><p className="text-sm font-bold text-zinc-300">{r.data_intensity.tables_detected}</p><p className="text-xs text-zinc-600 border-b border-dotted border-zinc-700 inline">Tables</p></div></HelpTooltip>
                <HelpTooltip text={tip("statistics")} position="top"><div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help"><p className="text-sm font-bold text-zinc-300">{r.data_intensity.statistics_detected}</p><p className="text-xs text-zinc-600 border-b border-dotted border-zinc-700 inline">Statistics</p></div></HelpTooltip>
              </div>
            </SectionCard>

            {/* Bias Detection */}
            <SectionCard title="Bias Detection" tooltip={tip("section_bias")} icon={Shield} iconColor="text-red-400" iconBg="bg-red-500/10" sectionRef="bias" onDiscuss={openDiscuss}>
              <div className="text-center mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                  <HelpTooltip text={tip("overall_bias_score")} insight={r.bias_detection.biases.length > 0 ? `${r.bias_detection.biases.length} bias type(s) detected: ${r.bias_detection.biases.map(b => b.type).join(", ")}.` : "No significant biases detected."} position="top" maxWidth={360}>
                    <span className="cursor-help border-b border-dotted border-zinc-600">Overall Bias Score</span>
                  </HelpTooltip>
                </p>
                <span className={`text-4xl font-bold ${r.bias_detection.overall_bias_score > 40 ? "text-red-400" : r.bias_detection.overall_bias_score > 15 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {r.bias_detection.overall_bias_score}
                </span>
                <span className="text-zinc-500 text-lg"> / 100</span>
              </div>
              {r.bias_detection.biases.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm text-zinc-400">No significant biases detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {r.bias_detection.biases.map((b, i) => {
                    const biasTipKey = `bias_${b.type.toLowerCase()}` as keyof typeof import("@/lib/tooltips").TOOLTIPS;
                    const biasTip = tip(biasTipKey as never);
                    return (
                      <div key={i} className={`rounded-lg px-3 py-2 border ${b.severity === "High" ? "bg-red-500/5 border-red-500/20" : b.severity === "Medium" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-zinc-800/40 border-zinc-700/30"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-200 flex items-center">
                            {biasTip ? (
                              <HelpTooltip text={biasTip} insight={b.evidence ? `${b.evidence} (${b.severity} severity)` : undefined} position="right" maxWidth={380}>
                                <span className="cursor-help border-b border-dotted border-zinc-600">{b.type} Bias</span>
                              </HelpTooltip>
                            ) : <>{b.type} Bias</>}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${b.severity === "High" ? "bg-red-500/20 text-red-400" : b.severity === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-700 text-zinc-400"}`}>
                            {b.severity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{b.evidence}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Key Findings */}
            <SectionCard title="Key Findings" tooltip={tip("section_findings")} icon={Lightbulb} iconColor="text-yellow-400" iconBg="bg-yellow-500/10" sectionRef="findings" onDiscuss={openDiscuss}>
              {r.amazing_facts.length === 0 ? (
                <div className="text-center py-4"><p className="text-sm text-zinc-400">No standout findings extracted</p></div>
              ) : (
                <div className="space-y-3">
                  {r.amazing_facts.map((f, i) => (
                    <div key={i} className="rounded-lg bg-zinc-800/40 px-3 py-3 border border-zinc-700/30">
                      <p className="text-sm text-zinc-200 mb-2">{f.fact}</p>
                      <div className="flex items-center gap-2">
                        {f.is_contrarian && (
                          <HelpTooltip text={tip("contrarian_tag")} position="top">
                            <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-xs text-purple-300 cursor-help">Contrarian</span>
                          </HelpTooltip>
                        )}
                        {f.is_quantified && (
                          <HelpTooltip text={tip("quantified_tag")} position="top">
                            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-300 cursor-help">Quantified</span>
                          </HelpTooltip>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{f.why_amazing}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
