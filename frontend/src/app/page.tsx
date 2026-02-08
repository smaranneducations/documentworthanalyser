"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, FileText, ArrowRight, TrendingUp, Eye, Sparkles,
  BarChart3, Brain, Search, Users, Zap, Loader2, BookOpen,
  Play, FileText as ReadIcon, AlertTriangle, X, MessageSquare,
  ChevronDown, ChevronUp,
} from "lucide-react";
import UploadGatekeeper from "@/components/UploadGatekeeper";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import { analyzeDocument, runHeuristicPrePass, mergeGeminiResults } from "@/lib/analyzer";
import { runGeminiPipeline, isGeminiAvailable, checkDocumentFitness } from "@/lib/gemini";
import type { FitnessResult } from "@/lib/gemini";
import { pdfToImages } from "@/lib/pdf-to-images";
import { extractText } from "@/lib/extract-text";
import type { AnalysisDoc } from "@/lib/types";
import {
  saveAnalysis,
  getAllAnalyses,
  checkFileHash,
  uploadFile,
  getAllDocSummaries,
  getPlatformStats,
} from "@/lib/firebase";
import { findFuzzyMatches } from "@/lib/fuzzy-match";
import type { MatchInfo } from "@/components/UploadGatekeeper";

// ── Rejection Modal ─────────────────────────────────────────────────────
function RejectionModal({
  fitness,
  onClose,
}: {
  fitness: FitnessResult;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
      router.push("/");
    }, 60000);
    return () => clearTimeout(timer);
  }, [onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 max-w-lg w-full rounded-2xl border border-red-500/30 bg-zinc-900 p-8 shadow-2xl">
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-zinc-100 mb-4">
          Document Not Suitable
        </h3>

        {/* Our purpose */}
        <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 p-4 mb-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Our Purpose</p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            DocDetector analyzes <strong>technology vendor &amp; advisory documents</strong> — consulting proposals,
            vendor pitches, training brochures, whitepapers, and advisory decks on
            AI, Data, Cloud, Digital Transformation, and Governance.
          </p>
        </div>

        {/* What they uploaded */}
        <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 p-4 mb-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Your Document</p>
          <p className="text-sm text-zinc-300">
            <strong>{fitness.document_type}</strong>
            {fitness.document_domain !== "Unknown" && (
              <span className="text-zinc-500"> &middot; {fitness.document_domain}</span>
            )}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{fitness.reason}</p>
        </div>

        {/* Verdict */}
        <p className="text-center text-sm text-zinc-400 mb-6">
          This document falls outside the scope of our forensic analysis engine.
          No report will be generated.
        </p>

        {/* OK button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          OK
        </button>

        {/* Auto-redirect notice */}
        <p className="text-center text-xs text-zinc-600 mt-3">
          Returning to home in 60 seconds&hellip;
        </p>
      </div>
    </div>
  );
}

// ── Previously Assessed — collapsed list ────────────────────────────────
function PreviouslyAssessed({
  loading,
  analyses,
  getScoreColor,
  getScoreBg,
  onView,
}: {
  loading: boolean;
  analyses: AnalysisDoc[];
  getScoreColor: (s: number) => string;
  getScoreBg: (s: number) => string;
  onView: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 mb-6">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-600 mr-2" />
        <span className="text-zinc-600 text-sm">Loading recent analyses&hellip;</span>
      </div>
    );
  }

  if (analyses.length === 0) return null;

  const latest = analyses[0];
  const latestResult = latest.analysis_result;
  const hasMore = analyses.length > 1;

  return (
    <div className="mb-6">
      {/* Latest file — always visible */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <button
          onClick={() => onView(latest.id)}
          className="group w-full p-3.5 text-left hover:bg-zinc-900 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={`shrink-0 rounded-lg ${getScoreBg(latestResult.overall_trust_score)} px-2.5 py-1.5`}>
              <span className={`text-base font-bold ${getScoreColor(latestResult.overall_trust_score)}`}>
                {latestResult.overall_trust_score}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-blue-400 transition-colors">
                {latest.display_name || latest.filename}
              </p>
              {latest.author && (
                <p className="text-xs text-zinc-400 truncate">{latest.author}</p>
              )}
              {latest.display_name && (
                <p className="text-[11px] text-zinc-600 font-mono truncate">{latest.filename}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-600">
                  {latest.uploaded_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-zinc-800">&middot;</span>
                <span className="text-xs text-zinc-500">{latestResult.provider_consumer.classification}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-blue-400 transition-colors shrink-0" />
          </div>
        </button>

        {/* Expand toggle */}
        {hasMore && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1.5 border-t border-zinc-800 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Collapse" : `View all ${analyses.length} reports`}
            </button>

            {/* Expanded list */}
            {expanded && (
              <div className="border-t border-zinc-800 max-h-[300px] overflow-y-auto scrollbar-thin">
                {analyses.slice(1).map((a) => {
                  const r = a.analysis_result;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onView(a.id)}
                      className="group w-full p-3 text-left border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-900 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 rounded-lg ${getScoreBg(r.overall_trust_score)} px-2 py-1`}>
                          <span className={`text-sm font-bold ${getScoreColor(r.overall_trust_score)}`}>
                            {r.overall_trust_score}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-blue-400 transition-colors">
                            {a.display_name || a.filename}
                          </p>
                          {a.author && (
                            <p className="text-xs text-zinc-500 truncate">{a.author}</p>
                          )}
                          <div className="flex items-center gap-2">
                            {a.display_name && (
                              <span className="text-[11px] text-zinc-600 font-mono truncate max-w-[150px]">{a.filename}</span>
                            )}
                            <span className="text-xs text-zinc-600">
                              {a.uploaded_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-blue-400 transition-colors shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState<FitnessResult | null>(null);
  const [platformStats, setPlatformStats] = useState({ totalFiles: 0, totalWords: 0 });

  // Load analyses + platform stats from Firestore on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [analyses, stats] = await Promise.all([getAllAnalyses(20), getPlatformStats()]);
        if (!cancelled) {
          setRecentAnalyses(analyses);
          setPlatformStats(stats);
        }
      } catch (err) {
        console.error("Failed to load analyses:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCheckHash = useCallback(async (hash: string): Promise<MatchInfo | null> => {
    // 1. Exact hash match
    const existing = await checkFileHash(hash);

    // 2. Pull all display names for fuzzy matching
    let allSummaries: Awaited<ReturnType<typeof getAllDocSummaries>> = [];
    try {
      allSummaries = await getAllDocSummaries();
    } catch {
      console.warn("Failed to load doc summaries for fuzzy matching.");
    }

    if (existing) {
      // Exact match — show it as top result, plus any fuzzy matches for the same title
      const displayName = existing.display_name || existing.filename;
      const fuzzy = findFuzzyMatches(displayName, allSummaries, 0.4, 5);

      // If exact match is already in fuzzy results, use as-is; otherwise prepend it
      const exactInFuzzy = fuzzy.some((m) => m.id === existing.id);
      const matches = exactInFuzzy
        ? fuzzy
        : [
            {
              id: existing.id,
              display_name: existing.display_name,
              author: existing.author,
              doc_summary: existing.doc_summary,
              filename: existing.filename,
              trust_score: existing.analysis_result.overall_trust_score,
              uploaded_at: existing.uploaded_at,
              similarity: 1,
            },
            ...fuzzy.filter((m) => m.id !== existing.id).slice(0, 4),
          ];

      return { exact: true, matches };
    }

    // No exact match — fuzzy match will happen later after Gemini extracts display_name
    // Store summaries in ref so the analysis pipeline can use them
    docSummariesRef.current = allSummaries;
    return null;
  }, []);

  // Refs to hold data across the pipeline
  const fitnessMetaRef = useCallback(() => ({ current: null as FitnessResult | null }), [])();
  const docSummariesRef = useCallback(() => ({ current: [] as Awaited<ReturnType<typeof getAllDocSummaries>> }), [])();

  const handleAnalyze = useCallback(
    async (file: File, hash: string): Promise<string> => {
      const useGemini = isGeminiAvailable();
      console.log(`[0] Analysis mode: ${useGemini ? "GEMINI + Heuristic" : "Heuristic Only"}`);

      console.log("[1/7] Extracting text from file…");
      const text = await extractText(file);
      console.log("[1/7] Done. Text length:", text.length);

      // ── Document fitness check + metadata extraction (Layer 0) ────
      let docMetadata: { display_name: string; author: string; summary: string } = {
        display_name: "", author: "", summary: "",
      };

      if (useGemini) {
        console.log("[2/7] Checking document fitness & extracting metadata…");
        try {
          const fitness = await checkDocumentFitness(text);
          console.log("[2/7] Fitness result:", fitness);

          // Capture metadata regardless of fitness
          docMetadata = {
            display_name: fitness.display_name || "",
            author: fitness.author || "",
            summary: fitness.summary || "",
          };
          fitnessMetaRef.current = fitness;

          if (!fitness.fit) {
            setRejectionModal(fitness);
            throw new Error("DOCUMENT_NOT_FIT");
          }

          console.log("[2/7] Document is suitable. Proceeding.");
        } catch (err) {
          if ((err as Error).message === "DOCUMENT_NOT_FIT") throw err;
          // If fitness check itself fails, let the document through
          console.warn("[2/7] Fitness check failed (non-blocking), allowing document:", err);
        }
      }

      let result;
      let pdfHighlightsRaw: unknown = null;
      let wordCount = 0;

      if (useGemini) {
        // ── Hybrid: Heuristic pre-pass + Gemini layers ──────────────
        console.log("[3/7] Running heuristic pre-pass…");
        const heuristic = runHeuristicPrePass(text);
        wordCount = heuristic.word_count;
        console.log("[3/7] Done. Word count:", wordCount);

        console.log("[4/7] Generating page images for multimodal…");
        let pageImages: { mimeType: string; data: string }[] | null = null;
        try {
          pageImages = await pdfToImages(file, 8, 768);
          console.log(`[4/7] Done. ${pageImages?.length ?? 0} page images.`);
        } catch (err) {
          console.warn("[4/7] Page image generation failed (non-blocking):", err);
        }

        console.log("[5/7] Running Gemini 5-layer pipeline…");
        try {
          const geminiLayers = await runGeminiPipeline(text, heuristic, pageImages);
          result = mergeGeminiResults(heuristic, geminiLayers as { layer1: Record<string, unknown>; layer2: Record<string, unknown>; layer3: Record<string, unknown>; layer4: Record<string, unknown> });
          pdfHighlightsRaw = geminiLayers.layer5;
          console.log("[5/7] Gemini analysis complete. Trust score:", result.overall_trust_score);
        } catch (err) {
          console.error("[5/7] Gemini pipeline failed, falling back to heuristic:", err);
          result = await analyzeDocument(text);
          console.log("[5/7] Heuristic fallback complete. Trust score:", result.overall_trust_score);
        }
      } else {
        // ── Heuristic only (no API key) ─────────────────────────────
        console.log("[3/7] Running heuristic analysis (Gemini not configured)…");
        result = await analyzeDocument(text);
        wordCount = text.split(/\s+/).filter(Boolean).length;
        console.log("[3/7] Done. Trust score:", result.overall_trust_score);
      }

      console.log("[6/7] Saving to Firestore…");
      const id = await saveAnalysis({
        file_hash: hash,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        word_count: wordCount,
        display_name: docMetadata.display_name,
        author: docMetadata.author,
        doc_summary: docMetadata.summary,
        analysis_result: result,
        pdf_highlights: pdfHighlightsRaw as { headline: string; hook_findings: { section: string; title: string; insight: string; hook_score: number }[] } | undefined,
      });
      console.log("[6/7] Done. Firestore doc ID:", id);

      // Upload original file to Firebase Storage (best effort)
      console.log("[6.5/7] Uploading file to Storage…");
      try {
        await uploadFile(id, file);
        console.log("[6.5/7] Done.");
      } catch (err) {
        console.warn("[6.5/7] Storage upload failed (non-blocking):", err);
      }

      // Refresh the list from Firestore
      console.log("[7/7] Refreshing recent analyses…");
      try {
        const analyses = await getAllAnalyses(20);
        setRecentAnalyses(analyses);
        console.log("[7/7] Done. Count:", analyses.length);
      } catch {
        console.warn("[7/7] Refresh failed (non-blocking)");
      }

      return id;
    },
    [fitnessMetaRef, docSummariesRef]
  );

  const handleViewReport = useCallback(
    (id: string) => {
      router.push(`/report/${id}`);
    },
    [router]
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-500/10";
    if (score >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">DocDetector</h1>
              <p className="text-xs text-zinc-500">AI-Powered Agentic Document Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/glossary"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              Assessment Rules
            </Link>
            <span className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles className="h-3.5 w-3.5" />
              5-Layer AI Pipeline
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-blue-200 to-blue-400 bg-clip-text text-transparent">
            Forensic Intelligence for
            <br />
            Technology Vendor &amp; Advisory Documents
          </h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Upload consulting proposals, vendor pitches, training brochures, whitepapers,
            and advisory decks on AI, Data, Agentic AI, Cloud, and Digital Transformation.
            Our AI forensic engine detects manipulation, bias, fluff, obsolescence, and
            hidden commercial motives — so you read what matters, not what sells.
          </p>
        </div>

        {/* ── Platform Stats Cards ──────────────────────────────── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12 max-w-4xl mx-auto">
          {[
            { value: "5", label: "Decision Modules" },
            { value: "25", label: "Weighted Drivers" },
            { value: "15+", label: "Forensic Checks" },
            { value: "5", label: "AI Layers" },
            { value: platformStats.totalFiles > 0 ? platformStats.totalFiles.toLocaleString() : "—", label: "Files Analysed" },
            { value: platformStats.totalWords > 0 ? (platformStats.totalWords > 999 ? `${Math.round(platformStats.totalWords / 1000)}K` : platformStats.totalWords.toLocaleString()) : "—", label: "Words Analysed" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black text-zinc-100">{stat.value}</span>
              <span className="block text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Feature Pills ──────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Users, label: "Provider vs. Consumer", tooltip: tip("pill_provider_consumer") },
            { icon: Brain, label: "5 Decision Modules", tooltip: tip("pill_decision_modules") },
            { icon: Search, label: "Content Forensics", tooltip: tip("pill_content_forensics") },
            { icon: Eye, label: "Bias Detection", tooltip: tip("pill_bias_detection") },
            { icon: TrendingUp, label: "Hype vs. Reality", tooltip: tip("pill_hype_reality") },
            { icon: Zap, label: "Implementation Readiness", tooltip: tip("pill_implementation") },
            { icon: BarChart3, label: "Weighted Scoring", tooltip: tip("pill_weighted_scoring") },
          ].map(({ icon: Icon, label, tooltip }) => (
            <HelpTooltip key={label} text={tooltip} position="bottom" maxWidth={300}>
              <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 cursor-help">
                <Icon className="h-4 w-4 text-zinc-500" />
                {label}
              </div>
            </HelpTooltip>
          ))}
        </div>

        {/* ── Upload ────────────────────────────────────────────── */}
        <div className="max-w-xl mx-auto mb-10">
          <UploadGatekeeper
            onCheckHash={handleCheckHash}
            onAnalyze={handleAnalyze}
            onViewReport={handleViewReport}
          />
        </div>

        {/* ── P1: Contest CTA ─────────────────────────────────── */}
        <div className="mb-10 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="rounded-full bg-blue-500/15 p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Don&apos;t agree with the assessment?</h3>
          </div>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Please help us by <span className="text-blue-400 font-semibold">contesting the analysis in comments</span>.
            Every section in the report has a{" "}
            <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 text-blue-400 text-xs font-medium">
              <MessageSquare className="h-3 w-3" /> Comment
            </span>{" "}
            button — click it to share your perspective. Your feedback makes the analysis better for everyone.
          </p>
        </div>

        {/* ── P2: Why This Agent ───────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 mb-10 rounded-xl bg-zinc-900/70 border border-zinc-800/60 px-8 py-4">
          <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Why This Agent</span>
          <a
            href="https://www.youtube.com/watch?v=_-i7Zo1NiR0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-blue-400 hover:bg-zinc-800 hover:text-blue-300 transition-colors"
          >
            <Play className="h-4 w-4" />
            Video <span className="text-zinc-500">6 min</span>
          </a>
          <a
            href="https://no-small-talk-with-bhask-bey9fum.gamma.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-blue-400 hover:bg-zinc-800 hover:text-blue-300 transition-colors"
          >
            <ReadIcon className="h-4 w-4" />
            Read <span className="text-zinc-500">4 min</span>
          </a>
        </div>

        {/* ── Previously Assessed (collapsed) ─────────────────── */}
        <PreviouslyAssessed
          loading={loading}
          analyses={recentAnalyses}
          getScoreColor={getScoreColor}
          getScoreBg={getScoreBg}
          onView={(id) => router.push(`/report/${id}`)}
        />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-zinc-500">
          <p>DocDetector &mdash; AI-Powered Agentic Document Analyzer &bull; 5 Decision Modules &bull; Content Forensics &bull; Bias Detection</p>
          <p className="mt-1.5">
            Want to build such an agentic app? Contact{" "}
            <a href="mailto:contactbhasker7483@gmail.com" className="text-blue-400 hover:text-blue-300 underline">contactbhasker7483@gmail.com</a>
          </p>
        </div>
      </footer>

      {/* ── Rejection Modal ─────────────────────────────────────── */}
      {rejectionModal && (
        <RejectionModal
          fitness={rejectionModal}
          onClose={() => setRejectionModal(null)}
        />
      )}
    </div>
  );
}
