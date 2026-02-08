"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, FileText, ArrowRight, TrendingUp, Eye, Sparkles,
  BarChart3, Brain, Search, Users, Zap, Loader2, BookOpen,
  Play, FileText as ReadIcon, AlertTriangle, X,
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
} from "@/lib/firebase";

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

export default function HomePage() {
  const router = useRouter();
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState<FitnessResult | null>(null);

  // Load analyses from Firestore on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const analyses = await getAllAnalyses(20);
        if (!cancelled) setRecentAnalyses(analyses);
      } catch (err) {
        console.error("Failed to load analyses:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCheckHash = useCallback(async (hash: string) => {
    const existing = await checkFileHash(hash);
    if (existing) {
      return {
        id: existing.id,
        filename: existing.filename,
        uploaded_at: existing.uploaded_at,
      };
    }
    return null;
  }, []);

  const handleAnalyze = useCallback(
    async (file: File, hash: string): Promise<string> => {
      const useGemini = isGeminiAvailable();
      console.log(`[0] Analysis mode: ${useGemini ? "GEMINI + Heuristic" : "Heuristic Only"}`);

      console.log("[1/7] Extracting text from file…");
      const text = await extractText(file);
      console.log("[1/7] Done. Text length:", text.length);

      // ── Document fitness check (Layer 0) ──────────────────────────
      if (useGemini) {
        console.log("[2/7] Checking document fitness…");
        try {
          const fitness = await checkDocumentFitness(text);
          console.log("[2/7] Fitness result:", fitness);
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

      if (useGemini) {
        // ── Hybrid: Heuristic pre-pass + Gemini layers ──────────────
        console.log("[3/7] Running heuristic pre-pass…");
        const heuristic = runHeuristicPrePass(text);
        console.log("[3/7] Done. Word count:", heuristic.word_count);

        console.log("[4/7] Generating page images for multimodal…");
        let pageImages: { mimeType: string; data: string }[] | null = null;
        try {
          pageImages = await pdfToImages(file, 8, 768);
          console.log(`[4/7] Done. ${pageImages?.length ?? 0} page images.`);
        } catch (err) {
          console.warn("[4/7] Page image generation failed (non-blocking):", err);
        }

        console.log("[5/7] Running Gemini 4-layer pipeline…");
        try {
          const geminiLayers = await runGeminiPipeline(text, heuristic, pageImages);
          result = mergeGeminiResults(heuristic, geminiLayers as { layer1: Record<string, unknown>; layer2: Record<string, unknown>; layer3: Record<string, unknown>; layer4: Record<string, unknown> });
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
        console.log("[3/7] Done. Trust score:", result.overall_trust_score);
      }

      console.log("[6/7] Saving to Firestore…");
      const id = await saveAnalysis({
        file_hash: hash,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        analysis_result: result,
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
    []
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
            <span className="flex items-center gap-2 text-xs text-zinc-600">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-Dimensional Analysis Engine
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

        {/* ── Why This Agent ──────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 mb-12 rounded-xl bg-zinc-900/70 border border-zinc-800/60 px-8 py-4">
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

        {/* ── Upload + Recently Assessed — side by side ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Left: Upload */}
          <div className="flex flex-col">
            <UploadGatekeeper
              onCheckHash={handleCheckHash}
              onAnalyze={handleAnalyze}
              onViewReport={handleViewReport}
            />
          </div>

          {/* Right: Previously Assessed */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-400 uppercase tracking-wider mb-3">
              <FileText className="h-4 w-4 text-zinc-500" />
              Previously Assessed
              {!loading && recentAnalyses.length > 0 && (
                <span className="text-xs font-normal text-zinc-600 normal-case tracking-normal">
                  ({recentAnalyses.length})
                </span>
              )}
            </h3>

            {loading && (
              <div className="flex-1 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-8">
                <div className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-600 mb-2" />
                  <p className="text-zinc-600 text-sm">Loading...</p>
                </div>
              </div>
            )}

            {!loading && recentAnalyses.length === 0 && (
              <div className="flex-1 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-8">
                <div className="text-center">
                  <FileText className="mx-auto h-10 w-10 text-zinc-800 mb-2" />
                  <p className="text-zinc-600 text-sm">No documents analyzed yet.</p>
                </div>
              </div>
            )}

            {!loading && recentAnalyses.length > 0 && (
              <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1 scrollbar-thin">
                {recentAnalyses.map((a) => {
                  const r = a.analysis_result;
                  return (
                    <button
                      key={a.id}
                      onClick={() => router.push(`/report/${a.id}`)}
                      className="group w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-left hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 rounded-lg ${getScoreBg(r.overall_trust_score)} px-2.5 py-1.5`}>
                          <span className={`text-base font-bold ${getScoreColor(r.overall_trust_score)}`}>
                            {r.overall_trust_score}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-blue-400 transition-colors">
                            {a.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-600">
                              {a.uploaded_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span className="text-zinc-800">&middot;</span>
                            <span className="text-xs text-zinc-500">{r.provider_consumer.classification}</span>
                            <span className="text-zinc-800">&middot;</span>
                            <span className="text-xs text-zinc-500">{r.audience_level.classification}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-blue-400 transition-colors shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-zinc-600">
          <p>DocDetector &mdash; AI-Powered Agentic Document Analyzer</p>
          <p>5 Decision Modules &bull; Content Forensics &bull; Bias Detection</p>
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
