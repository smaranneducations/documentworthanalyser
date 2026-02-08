"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Shield, Search, Zap, FileText, Calendar, Hash,
  Users, Building2, Target, Sparkles, Brain, BookOpen,
  AlertTriangle, CheckCircle2, XCircle, Eye, BarChart3,
  Scale, Lightbulb, ShieldAlert, TrendingUp, Clock, Printer,
  MessageSquare,
} from "lucide-react";
import TrustScoreGauge from "@/components/TrustScoreGauge";
import ProgressBar from "@/components/ProgressBar";
import CommentPanel from "@/components/CommentPanel";
import SectionCard from "@/components/dashboard/SectionCard";
import WeightedDriversTable from "@/components/dashboard/WeightedDriversTable";
import ClassificationBadge from "@/components/dashboard/ClassificationBadge";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { AnalysisDoc, CommentDoc } from "@/lib/types";
import {
  getAnalysisById,
  getComments as getStoredComments,
  addComment as storeComment,
  reactToComment,
} from "@/lib/firebase";

interface SectionPanel { name: string; ref: string }

// ── Driver tooltip maps for each module ─────────────────────────────────────
const providerDriverTips: Record<string, string> = {
  "Problem Definition Clarity": tip("driver_problem_definition"),
  "Vendor Lock-in Potential": tip("driver_vendor_lockin"),
  "Implementation Autonomy": tip("driver_implementation_autonomy"),
  "Upsell Visibility": tip("driver_upsell_visibility"),
  "Risk Transfer": tip("driver_risk_transfer"),
};
const companyScaleDriverTips: Record<string, string> = {
  "Framework Proprietary Level": tip("driver_framework_proprietary"),
  "Data Scope & Depth": tip("driver_data_scope"),
  "Design Polish & Branding": tip("driver_design_polish"),
  "Service Breadth": tip("driver_service_breadth"),
  "Legal/Compliance Density": tip("driver_legal_compliance"),
};
const targetScaleDriverTips: Record<string, string> = {
  "Governance Complexity": tip("driver_governance"),
  "Cross-Functional Impact": tip("driver_cross_functional"),
  "Legacy Integration Focus": tip("driver_legacy_integration"),
  "Budget/Resource Implication": tip("driver_budget_resource"),
  "Risk & Security Standards": tip("driver_risk_security"),
};
const audienceDriverTips: Record<string, string> = {
  "Strategic vs. Tactical Ratio": tip("driver_strategic_tactical"),
  "Financial Metric Density": tip("driver_financial_metric"),
  "Technical Jargon Density": tip("driver_technical_jargon"),
  "Actionable Horizon": tip("driver_actionable_horizon"),
  "Decision Scope": tip("driver_decision_scope"),
};
const rarityDriverTips: Record<string, string> = {
  "Primary Data Source": tip("driver_primary_data"),
  "Contrarian Factor": tip("driver_contrarian_factor"),
  "Framework Novelty": tip("driver_framework_novelty"),
  "Predictive Specificity": tip("driver_predictive_specificity"),
  "Case Study Transparency": tip("driver_case_study_transparency"),
};

export default function ReportClient({ id: propId }: { id: string }) {
  const router = useRouter();

  // Resolve the real ID from the browser URL — works on both dev and static export.
  // On static export, the prop/useParams may be "_" (the dummy param), but the
  // browser URL always has the real ID (e.g., /report/abc123/).
  const [id, setId] = useState<string>(propId);
  const [analysis, setAnalysis] = useState<AnalysisDoc | null>(null);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentPanel, setCommentPanel] = useState<SectionPanel | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 1: Extract the real ID from window.location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/report\/([^/]+)/);
      if (match?.[1] && match[1] !== "_") {
        setId(match[1]);
      } else if (propId && propId !== "_") {
        setId(propId);
      } else {
        setLoading(false); // No valid ID at all
      }
    }
  }, [propId]);

  // Step 2: Fetch from Firestore once we have a real ID
  useEffect(() => {
    if (!id || id === "_") return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await getAnalysisById(id);
        if (!cancelled && doc) {
          setAnalysis(doc);
          const cmts = await getStoredComments(id);
          if (!cancelled) setComments(cmts);
        }
      } catch (err) {
        console.error("Failed to load analysis:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const openDiscuss = (ref: string, name: string) => setCommentPanel({ name, ref });

  const handleAddComment = async (text: string, userName: string, sectionRef: string) => {
    try {
      const newComment = await storeComment(id, { user_name: userName, text, section_reference: sectionRef });
      setComments((prev) => [...prev, newComment]);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleReact = async (commentId: string, reaction: "like" | "dislike") => {
    try {
      await reactToComment(id, commentId, reaction);
      // Optimistically update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, [reaction === "like" ? "likes" : "dislikes"]: (reaction === "like" ? c.likes : c.dislikes) + 1 }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-zinc-500 text-sm">Running full analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-300">Analysis Not Found</h2>
          <button onClick={() => router.push("/")} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">Back to Home</button>
        </div>
      </div>
    );
  }

  const r = analysis.analysis_result;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${analysis.filename.replace(/\.[^/.]+$/, "")} - Forensic Analysis Report`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 scroll-smooth">
      {/* ── Print Styles ────────────────────────────────────────── */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #09090b !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          /* ── Page setup ─────────────────────────────────────── */
          @page { size: A4 portrait; margin: 10mm 14mm; }

          /* ── Sections start on new pages ─────────────────────── */
          .print-page-break { page-break-before: always; break-before: page; }

          /* ── Slides: reset viewport sizing, allow multi-page ── */
          .report-slide {
            min-height: auto !important;
            height: auto !important;
            display: block !important;
            scroll-snap-align: unset !important;
            padding-top: 20px !important;
            padding-bottom: 20px !important;
          }

          /* ── THE KEY RULE: atomic blocks never split ─────────── */
          /* Every card, badge, inner container = unbreakable atom */
          .print-no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* ── Section headers stick with next content ────────── */
          .report-slide h2 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* ── Compact spacing for print ──────────────────────── */
          .report-slide .py-16 { padding-top: 14px !important; padding-bottom: 14px !important; }
          .report-slide .p-8 { padding: 10px !important; }
          .report-slide .p-6 { padding: 8px !important; }
          .report-slide .mb-12, .report-slide .mb-6 { margin-bottom: 6px !important; }
          .report-slide .gap-8 { gap: 10px !important; }
          .report-slide .gap-5 { gap: 8px !important; }
          .report-slide .gap-3 { gap: 6px !important; }
          .report-slide h1 { font-size: 1.4rem !important; line-height: 1.3 !important; }
          .report-slide h2 { font-size: 1.1rem !important; }
          .report-slide .text-4xl, .report-slide .text-5xl,
          .report-slide .lg\\:text-5xl { font-size: 1.4rem !important; }
          .report-slide .text-3xl { font-size: 1rem !important; }
          .report-slide .text-2xl { font-size: 1rem !important; }

          /* ── Classification badges: compact for print ─────── */
          .print-no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .print-no-break .text-lg { font-size: 0.8rem !important; }
          .print-no-break .text-xs { font-size: 0.55rem !important; }

          /* ── Trust gauge: shrink for print ──────────────────── */
          .print-gauge-wrap { transform: scale(0.5); transform-origin: center center; margin: -35px 0 !important; }

          /* ── Print closing page ────────────────────────────── */
          .print-only p { font-size: 0.85rem !important; }
        }
      `}</style>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md no-print">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <FileText className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium text-zinc-300 leading-tight">{analysis.display_name || analysis.filename}</span>
              {analysis.display_name && (
                <span className="text-[11px] text-zinc-600 font-mono leading-tight">{analysis.filename}</span>
              )}
            </div>
            <span className="text-zinc-700">|</span>
            <Calendar className="h-4 w-4" />
            {analysis.uploaded_at.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-400" />
              Print to PDF
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 1: SUMMARY — Hero section with trust score & classifications
          ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 2: CORE DECISION MODULES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="report-slide min-h-screen flex items-start bg-zinc-900/40 scroll-snap-align-start print-page-break">
        <div className="mx-auto max-w-7xl w-full px-6 py-16">
          <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/50 p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
              <Brain className="h-6 w-6 text-blue-400" />
              <HelpTooltip text={tip("header_core_modules")} position="bottom">
                <span className="cursor-help border-b border-dotted border-zinc-600">Core Decision Modules</span>
              </HelpTooltip>
            </h2>
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <SectionCard title="Provider vs. Consumer" tooltip={tip("section_provider_consumer")} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" sectionRef="provider_consumer" onDiscuss={openDiscuss}>
            <ClassificationBadge label="Suitability" value={r.provider_consumer.classification} confidence={r.provider_consumer.confidence} tooltip={tip("provider_consumer_label")} />
            <div className="mt-4 text-center mb-3">
              <span className="text-3xl font-bold text-blue-400">{r.provider_consumer.composite_score}</span>
              <span className="text-zinc-500"> / 100</span>
            </div>
            <WeightedDriversTable drivers={r.provider_consumer.drivers} driverTooltips={providerDriverTips} />
          </SectionCard>

          <SectionCard title="Originator Scale" tooltip={tip("section_company_scale")} icon={Building2} iconColor="text-purple-400" iconBg="bg-purple-500/10" sectionRef="company_scale" onDiscuss={openDiscuss}>
            <ClassificationBadge label="Originator" value={r.company_scale.classification} confidence={r.company_scale.confidence} tooltip={tip("originator_scale_label")} />
            <div className="mt-4 text-center mb-3">
              <span className="text-3xl font-bold text-purple-400">{r.company_scale.composite_score}</span>
              <span className="text-zinc-500"> / 100</span>
            </div>
            <WeightedDriversTable drivers={r.company_scale.drivers} driverTooltips={companyScaleDriverTips} />
          </SectionCard>

          <SectionCard title="Target Company Scale" tooltip={tip("section_target_scale")} icon={Target} iconColor="text-orange-400" iconBg="bg-orange-500/10" sectionRef="target_scale" onDiscuss={openDiscuss}>
            <ClassificationBadge label="Target" value={r.target_scale.classification} confidence={r.target_scale.confidence} tooltip={tip("target_company_label")} />
            <div className="mt-4 text-center mb-3">
              <span className="text-3xl font-bold text-orange-400">{r.target_scale.composite_score}</span>
              <span className="text-zinc-500"> / 100</span>
            </div>
            <WeightedDriversTable drivers={r.target_scale.drivers} driverTooltips={targetScaleDriverTips} />
          </SectionCard>

          <SectionCard title="Target Audience" tooltip={tip("section_audience_level")} icon={Eye} iconColor="text-teal-400" iconBg="bg-teal-500/10" sectionRef="audience_level" onDiscuss={openDiscuss}>
            <ClassificationBadge label="Audience" value={r.audience_level.classification} confidence={r.audience_level.confidence} tooltip={tip("audience_level_label")} />
            <div className="mt-4 text-center mb-3">
              <span className="text-3xl font-bold text-teal-400">{r.audience_level.composite_score}</span>
              <span className="text-zinc-500"> / 100</span>
            </div>
            <WeightedDriversTable drivers={r.audience_level.drivers} driverTooltips={audienceDriverTips} />
          </SectionCard>

          <SectionCard title="Rarity Index" tooltip={tip("section_rarity_index")} icon={Sparkles} iconColor="text-yellow-400" iconBg="bg-yellow-500/10" sectionRef="rarity_index" onDiscuss={openDiscuss}>
            <ClassificationBadge label="Uniqueness" value={r.rarity_index.classification} confidence={r.rarity_index.confidence} tooltip={tip("uniqueness_label")} />
            <div className="mt-4 text-center mb-3">
              <span className="text-3xl font-bold text-yellow-400">{r.rarity_index.composite_score}</span>
              <span className="text-zinc-500"> / 100</span>
            </div>
            <WeightedDriversTable drivers={r.rarity_index.drivers} driverTooltips={rarityDriverTips} />
          </SectionCard>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 3: CONTENT FORENSICS
          ═══════════════════════════════════════════════════════════════ */}
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
              <span className={`text-4xl font-bold ${r.forensics.deception.manipulation_index > 40 ? "text-red-400" : r.forensics.deception.manipulation_index > 20 ? "text-yellow-400" : "text-emerald-400"}`}>
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
              <span className={`text-4xl font-bold ${r.forensics.fluff.fluff_score > 60 ? "text-red-400" : r.forensics.fluff.fluff_score > 30 ? "text-yellow-400" : "text-emerald-400"}`}>
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

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 4: ADVANCED ASSESSMENT
          ═══════════════════════════════════════════════════════════════ */}
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
                  <span className={`text-3xl font-bold ${r.hype_reality.hype_score > 80 ? "text-red-400" : r.hype_reality.hype_score > 50 ? "text-yellow-400" : "text-emerald-400"}`}>
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

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE 5: COMPOSITION, BIAS & INSIGHTS
          ═══════════════════════════════════════════════════════════════ */}
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

      {/* ── Visible Footer — Contest CTA + Contact ────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-10 no-print">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 p-6 text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="rounded-full bg-blue-500/15 p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Don&apos;t agree with the assessment?</h3>
          </div>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Please help us by <span className="text-blue-400 font-semibold">contesting the analysis in comments</span>.
            Every section above has a{" "}
            <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 text-blue-400 text-xs font-medium">
              <MessageSquare className="h-3 w-3" /> Comment
            </span>{" "}
            button — click it to share your perspective.
          </p>
        </div>
        <p className="text-center text-xs text-zinc-500">
          Want to build such an agentic app? Contact{" "}
          <a href="mailto:contactbhasker7483@gmail.com" className="text-blue-400 hover:text-blue-300 underline">contactbhasker7483@gmail.com</a>
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PRINT-ONLY: CLOSING PAGE — links & call to action
          ═══════════════════════════════════════════════════════════════ */}
      <section className="hidden print-only print-page-break bg-zinc-950 text-zinc-100 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <BookOpen className="mx-auto h-8 w-8 text-blue-400 mb-3" />
          <h2 className="text-xl font-bold text-zinc-200 mb-2">
            Thank you for reviewing this assessment
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-5">
            Generated by <span className="text-zinc-200 font-semibold">DocDetector</span> — an AI-powered
            document analysis engine evaluating business documents across decision modules,
            content forensics, bias detection, and more.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-left">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Assessment Rules</h3>
              <p className="text-xs text-zinc-400 mb-1">Full methodology & metric definitions:</p>
              <p className="text-xs text-blue-400 font-mono break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/glossary/` : "https://documentworthanalyser.web.app/glossary/"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-left">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">View Report Online</h3>
              <p className="text-xs text-zinc-400 mb-1">Interactive version with tooltips:</p>
              <p className="text-xs text-blue-400 font-mono break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-left">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Have questions or disagree?</h3>
            <p className="text-xs text-zinc-400">
              Open the report online and use the <span className="text-zinc-200 font-medium">comment</span> feature
              on any section to share feedback. Every section has a discussion panel.
            </p>
          </div>

          <p className="mt-4 text-xs text-zinc-600">
            DocDetector &middot; {analysis.uploaded_at.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Want to build such an agentic app? Contact{" "}
            <a href="mailto:contactbhasker7483@gmail.com" className="text-blue-400 hover:text-blue-300 underline">contactbhasker7483@gmail.com</a>
          </p>
        </div>
      </section>

      {/* ── Comment Panel ──────────────────────────────────────── */}
      <CommentPanel
        isOpen={commentPanel !== null}
        onClose={() => setCommentPanel(null)}
        sectionName={commentPanel?.name ?? ""}
        sectionRef={commentPanel?.ref ?? ""}
        comments={comments}
        onAddComment={handleAddComment}
        onReact={handleReact}
      />
    </div>
  );
}
