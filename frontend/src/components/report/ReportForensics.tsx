import { AlertTriangle, CheckCircle2, Scale, Search } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import ProgressBar from "@/components/ProgressBar";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { ReportSlideProps } from "./types";

export default function ReportForensics({ r, openDiscuss }: ReportSlideProps) {
  return (
    <section className="report-slide min-h-screen flex items-start bg-gradient-to-b from-zinc-950 to-zinc-900/60 scroll-snap-align-start print-page-break">
      <div className="mx-auto max-w-7xl w-full px-6 py-16">
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
            <Search className="h-6 w-6 text-purple-400" />
            <HelpTooltip text={tip("header_forensics")} position="bottom">
              <span className="cursor-help border-b border-dotted border-zinc-600">Content Forensics</span>
            </HelpTooltip>
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Deception Detection */}
            <SectionCard title="Deception Detector" tooltip={tip("section_forensics")} icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/10" sectionRef="forensics" onDiscuss={openDiscuss}>
              <div className="text-center mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                  <HelpTooltip text={tip("manipulation_index")} insight={r.forensics.deception.manipulation_rationale} position="top" maxWidth={360}>
                    <span className="cursor-help border-b border-dotted border-zinc-600">Manipulation Index</span>
                  </HelpTooltip>
                </p>
                <span className={`text-4xl font-bold ${r.forensics.deception.manipulation_index > 55 ? "text-red-400" : r.forensics.deception.manipulation_index > 35 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {r.forensics.deception.manipulation_index}
                </span>
                <span className="text-zinc-500 text-lg"> / 100</span>
              </div>

              {r.forensics.deception.weasel_words.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center">
                    <HelpTooltip text={tip("weasel_words")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">Weasel Words</span>
                    </HelpTooltip>
                    <span className="ml-1 text-zinc-500">({r.forensics.deception.weasel_words.reduce((s, w) => s + w.count, 0)} total)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.forensics.deception.weasel_words.slice(0, 10).map((w, i) => (
                      <span key={i} className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs text-red-300">
                        {w.word} <span className="text-red-500">({w.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {r.forensics.deception.percentage_puffery.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    <HelpTooltip text={tip("percentage_puffery")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">Percentage Puffery</span>
                    </HelpTooltip>
                  </p>
                  {r.forensics.deception.percentage_puffery.map((p, i) => (
                    <p key={i} className="text-xs text-amber-300 bg-amber-500/10 rounded px-2 py-1 mb-1">&ldquo;{p}&rdquo;</p>
                  ))}
                </div>
              )}

              {r.forensics.deception.false_urgency.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    <HelpTooltip text={tip("false_urgency")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">False Urgency</span>
                    </HelpTooltip>
                  </p>
                  {r.forensics.deception.false_urgency.map((u, i) => (
                    <p key={i} className="text-xs text-orange-300 bg-orange-500/10 rounded px-2 py-1 mb-1">&ldquo;{u}&rdquo;</p>
                  ))}
                </div>
              )}

              {r.forensics.deception.jargon_masking.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    <HelpTooltip text={tip("jargon_masking")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">Jargon Masking</span>
                    </HelpTooltip>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.forensics.deception.jargon_masking.map((j, i) => (
                      <span key={i} className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-xs text-purple-300">{j}</span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Logical Fallacies */}
            <SectionCard title="Logical Fallacy Hunter" tooltip={tip("section_fallacies")} icon={Scale} iconColor="text-amber-400" iconBg="bg-amber-500/10" sectionRef="fallacies" onDiscuss={openDiscuss}>
              <div className="text-center mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                  <HelpTooltip text={tip("fallacy_density")} insight={r.forensics.fallacies.fallacies.length > 0 ? `${r.forensics.fallacies.fallacies.length} fallacy(ies) found: ${r.forensics.fallacies.fallacies.map(f => f.type).join(", ")}.` : "No logical fallacies detected."} position="top" maxWidth={360}>
                    <span className="cursor-help border-b border-dotted border-zinc-600">Fallacy Density</span>
                  </HelpTooltip>
                </p>
                <span className={`text-4xl font-bold ${r.forensics.fallacies.fallacy_density > 1 ? "text-red-400" : r.forensics.fallacies.fallacy_density > 0.5 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {Number(r.forensics.fallacies.fallacy_density.toFixed(2))}
                </span>
                <span className="text-zinc-500 text-sm"> per 1k words</span>
              </div>
              {r.forensics.fallacies.fallacies.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm text-zinc-400">No logical fallacies detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {r.forensics.fallacies.fallacies.map((f, i) => {
                    const fallacyTipKey = `fallacy_${f.type.toLowerCase().replace(/\s+/g, "_")}` as keyof typeof import("@/lib/tooltips").TOOLTIPS;
                    const fallacyTip = tip(fallacyTipKey as never);
                    return (
                      <div key={i} className={`rounded-lg px-3 py-2 border ${f.severity === "High" ? "bg-red-500/5 border-red-500/20" : f.severity === "Medium" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-zinc-800/40 border-zinc-700/30"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-200 flex items-center">
                            {fallacyTip ? (
                              <HelpTooltip text={fallacyTip} insight={f.evidence ? `"${f.evidence}" (${f.severity} severity)` : undefined} position="right" maxWidth={380}>
                                <span className="cursor-help border-b border-dotted border-zinc-600">{f.type}</span>
                              </HelpTooltip>
                            ) : f.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${f.severity === "High" ? "bg-red-500/20 text-red-400" : f.severity === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-700 text-zinc-400"}`}>
                            {f.severity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">&ldquo;{f.evidence}&rdquo;</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Fluff Index */}
            <SectionCard title="Bulk Fluff Index" tooltip={tip("section_fluff")} icon={Search} iconColor="text-pink-400" iconBg="bg-pink-500/10" sectionRef="fluff" onDiscuss={openDiscuss}>
              <div className="text-center mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                  <HelpTooltip text={tip("fluff_score")} position="top">
                    <span className="cursor-help border-b border-dotted border-zinc-600">Fluff Score</span>
                  </HelpTooltip>
                </p>
                <span className={`text-4xl font-bold ${r.forensics.fluff.fluff_score > 70 ? "text-red-400" : r.forensics.fluff.fluff_score > 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {r.forensics.fluff.fluff_score}
                </span>
                <span className="text-zinc-500 text-lg"> / 100</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <HelpTooltip text={tip("buzzwords")} position="top">
                  <div className="rounded-xl bg-zinc-800/60 p-3 text-center cursor-help">
                    <p className="text-xl font-bold text-amber-400">{r.forensics.fluff.buzzword_count}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 border-b border-dotted border-zinc-600 inline">Buzzwords</p>
                  </div>
                </HelpTooltip>
                <HelpTooltip text={tip("action_verbs")} position="top">
                  <div className="rounded-xl bg-zinc-800/60 p-3 text-center cursor-help">
                    <p className="text-xl font-bold text-emerald-400">{r.forensics.fluff.action_verb_count}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 border-b border-dotted border-zinc-600 inline">Action Verbs</p>
                  </div>
                </HelpTooltip>
              </div>
              <div className="space-y-3">
                <div>
                  <ProgressBar value={Math.round(Math.min(100, (r.forensics.fluff.fog_index / 25) * 100))} label="Gunning Fog Index" tooltip={tip("fog_index")} color={r.forensics.fluff.fog_index > 18 ? "bg-red-500" : r.forensics.fluff.fog_index > 12 ? "bg-yellow-500" : "bg-emerald-500"} />
                  <p className="text-xs text-zinc-600 mt-0.5">{Number(r.forensics.fluff.fog_index.toFixed(1))} ({r.forensics.fluff.fog_index > 18 ? "Academic" : r.forensics.fluff.fog_index > 12 ? "Professional" : "Accessible"})</p>
                </div>
                <div>
                  <ProgressBar value={Math.round(Math.min(100, (r.forensics.fluff.adjective_verb_ratio / 5) * 100))} label="Adjective/Verb Ratio" tooltip={tip("adjective_verb_ratio")} color={r.forensics.fluff.adjective_verb_ratio > 3 ? "bg-red-500" : "bg-blue-500"} />
                  <p className="text-xs text-zinc-600 mt-0.5">{Number(r.forensics.fluff.adjective_verb_ratio.toFixed(2))} ({r.forensics.fluff.adjective_verb_ratio > 3 ? "Excessive description" : "Balanced"})</p>
                </div>
                <HelpTooltip text={tip("unique_data_points")} position="top">
                  <div className="rounded-xl bg-zinc-800/60 p-3 text-center cursor-help">
                    <p className="text-xl font-bold text-blue-400">{r.forensics.fluff.unique_data_points}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 border-b border-dotted border-zinc-600 inline">Unique Data Points</p>
                  </div>
                </HelpTooltip>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
