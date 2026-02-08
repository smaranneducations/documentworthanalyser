import { CheckCircle2, XCircle, Clock, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import ClassificationBadge from "@/components/dashboard/ClassificationBadge";
import ProgressBar from "@/components/ProgressBar";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { ReportSlideProps } from "./types";

export default function ReportAdvanced({ r, openDiscuss }: ReportSlideProps) {
  return (
    <section className="report-slide min-h-screen flex items-start bg-zinc-900/40 scroll-snap-align-start print-page-break">
      <div className="mx-auto max-w-7xl w-full px-6 py-16">
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/50 p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
            <Zap className="h-6 w-6 text-amber-400" />
            <HelpTooltip text={tip("header_advanced")} position="bottom">
              <span className="cursor-help border-b border-dotted border-zinc-600">Advanced Assessment</span>
            </HelpTooltip>
          </h2>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {/* Implementation Readiness */}
            <SectionCard title="Implementation Readiness" tooltip={tip("section_implementation")} icon={CheckCircle2} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" sectionRef="implementation" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Verdict" value={r.implementation_readiness.verdict} tooltip={tip("section_implementation")} />
              <div className="mt-4 text-center mb-3">
                <HelpTooltip text={tip("readiness_score")} insight={`Verdict: ${r.implementation_readiness.verdict}. ${r.implementation_readiness.artifact_presence.filter(a => a.found).length}/${r.implementation_readiness.artifact_presence.length} artifact types found.`} position="top" maxWidth={360}>
                  <span className="cursor-help">
                    <span className="text-3xl font-bold text-emerald-400">{r.implementation_readiness.readiness_score}</span>
                    <span className="text-zinc-500"> / 10</span>
                  </span>
                </HelpTooltip>
              </div>
              <div className="space-y-2 mb-3">
                {r.implementation_readiness.artifact_presence.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {a.found ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <XCircle className="h-4 w-4 text-zinc-600 shrink-0" />}
                    <span className={a.found ? "text-zinc-300" : "text-zinc-500"}>{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <ProgressBar value={r.implementation_readiness.resource_clarity_score * 10} label="Resource Clarity" tooltip={tip("resource_clarity")} color="bg-blue-500" />
                <ProgressBar value={r.implementation_readiness.timeline_reality_score * 10} label="Timeline Reality" tooltip={tip("timeline_reality")} color="bg-purple-500" />
                <ProgressBar value={r.implementation_readiness.prerequisite_check_score * 10} label="Prerequisite Check" tooltip={tip("prerequisite_check")} color="bg-teal-500" />
              </div>
            </SectionCard>

            {/* Obsolescence Risk */}
            <SectionCard title="Obsolescence Risk" tooltip={tip("section_obsolescence")} icon={Clock} iconColor="text-orange-400" iconBg="bg-orange-500/10" sectionRef="obsolescence" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Risk Level" value={r.obsolescence_risk.risk_level} tooltip={tip("section_obsolescence")} />
              <div className="mt-4 text-center mb-3">
                <span className={`text-3xl font-bold ${r.obsolescence_risk.risk_score > 50 ? "text-red-400" : r.obsolescence_risk.risk_score > 25 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {r.obsolescence_risk.risk_score}
                </span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              {r.obsolescence_risk.outdated_references.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    <HelpTooltip text={tip("outdated_references")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">Outdated References</span>
                    </HelpTooltip>
                  </p>
                  {r.obsolescence_risk.outdated_references.map((o, i) => (
                    <p key={i} className="text-xs text-red-300 bg-red-500/10 rounded px-2 py-1 mb-1">{o}</p>
                  ))}
                </div>
              )}
              {r.obsolescence_risk.missing_current_practices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                    <HelpTooltip text={tip("missing_current_practices")} position="top">
                      <span className="cursor-help border-b border-dotted border-zinc-600">Missing Current Practices</span>
                    </HelpTooltip>
                  </p>
                  {r.obsolescence_risk.missing_current_practices.map((m, i) => (
                    <p key={i} className="text-xs text-amber-300 bg-amber-500/10 rounded px-2 py-1 mb-1">{m}</p>
                  ))}
                </div>
              )}
              {r.obsolescence_risk.outdated_references.length === 0 && r.obsolescence_risk.missing_current_practices.length === 0 && (
                <div className="text-center py-3">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm text-zinc-400">Technology references are current</p>
                </div>
              )}
            </SectionCard>

            {/* Hype vs Reality */}
            <SectionCard title="Hype vs. Reality" tooltip={tip("section_hype")} icon={TrendingUp} iconColor="text-pink-400" iconBg="bg-pink-500/10" sectionRef="hype" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Assessment" value={r.hype_reality.classification} tooltip={tip("section_hype")} />
              <div className="mt-4 text-center mb-3">
                <HelpTooltip text={tip("hype_score")} insight={r.hype_reality.balance_assessment || undefined} position="top" maxWidth={360}>
                  <span className="cursor-help">
                    <span className={`text-3xl font-bold ${r.hype_reality.hype_score > 70 ? "text-red-400" : r.hype_reality.hype_score > 45 ? "text-yellow-400" : "text-emerald-400"}`}>
                      {r.hype_reality.hype_score}
                    </span>
                    <span className="text-zinc-500"> / 100</span>
                  </span>
                </HelpTooltip>
              </div>
              <div className="space-y-2 mb-3">
                <ProgressBar value={r.hype_reality.positive_sentiment_pct} label="Positive Sentiment" tooltip={tip("positive_sentiment")} color={r.hype_reality.positive_sentiment_pct > 85 ? "bg-red-500" : r.hype_reality.positive_sentiment_pct > 75 ? "bg-yellow-500" : "bg-emerald-500"} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <HelpTooltip text={tip("risk_mentions")} position="top">
                  <div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help">
                    <p className="text-lg font-bold text-blue-400">{r.hype_reality.risk_mentions}</p>
                    <p className="text-xs text-zinc-500 border-b border-dotted border-zinc-600 inline">Risk Mentions</p>
                  </div>
                </HelpTooltip>
                <HelpTooltip text={tip("failure_acknowledgments")} position="top">
                  <div className="rounded-lg bg-zinc-800/60 p-2 text-center cursor-help">
                    <p className="text-lg font-bold text-purple-400">{r.hype_reality.failure_acknowledgments}</p>
                    <p className="text-xs text-zinc-500 border-b border-dotted border-zinc-600 inline">Failure Acks</p>
                  </div>
                </HelpTooltip>
              </div>
              <p className="mt-3 text-xs text-zinc-500">{r.hype_reality.balance_assessment}</p>
            </SectionCard>

            {/* Regulatory Safety */}
            <SectionCard title="Regulatory & Ethics" tooltip={tip("section_regulatory")} icon={ShieldAlert} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" sectionRef="regulatory" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Safety Level" value={r.regulatory_safety.safety_level} tooltip={tip("safety_score")} />
              <div className="mt-4 text-center mb-3">
                <HelpTooltip text={tip("safety_score")} insight={r.regulatory_safety.red_flags.length > 0 ? `Red flags: ${r.regulatory_safety.red_flags.join("; ")}` : "No red flags detected."} position="top" maxWidth={380}>
                  <span className="cursor-help">
                    <span className={`text-3xl font-bold ${r.regulatory_safety.safety_score >= 70 ? "text-emerald-400" : r.regulatory_safety.safety_score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                      {r.regulatory_safety.safety_score}
                    </span>
                    <span className="text-zinc-500"> / 100</span>
                  </span>
                </HelpTooltip>
              </div>
              <div className="space-y-2">
                {r.regulatory_safety.regulatory_mentions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                      <HelpTooltip text={tip("regulatory_mentions")} position="top">
                        <span className="cursor-help border-b border-dotted border-zinc-600">Regulatory</span>
                      </HelpTooltip>
                    </p>
                    <div className="flex flex-wrap gap-1">{r.regulatory_safety.regulatory_mentions.map((m, i) => (<span key={i} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">{m}</span>))}</div>
                  </div>
                )}
                {r.regulatory_safety.ethical_mentions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1 flex items-center">
                      <HelpTooltip text={tip("ethical_mentions")} position="top">
                        <span className="cursor-help border-b border-dotted border-zinc-600">Ethical</span>
                      </HelpTooltip>
                    </p>
                    <div className="flex flex-wrap gap-1">{r.regulatory_safety.ethical_mentions.map((m, i) => (<span key={i} className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-300">{m}</span>))}</div>
                  </div>
                )}
                {r.regulatory_safety.red_flags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-1 flex items-center">
                      <HelpTooltip text={tip("red_flags_safety")} position="top">
                        <span className="cursor-help border-b border-dotted border-red-500/40">Red Flags</span>
                      </HelpTooltip>
                    </p>
                    {r.regulatory_safety.red_flags.map((f, i) => (<p key={i} className="text-xs text-red-300 bg-red-500/10 rounded px-2 py-1 mb-1">{f}</p>))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
