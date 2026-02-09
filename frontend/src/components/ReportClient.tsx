"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, FileText, Calendar, Printer, XCircle,
} from "lucide-react";
import CommentPanel from "@/components/CommentPanel";
import type { AnalysisDoc, CommentDoc } from "@/lib/types";
import {
  getAnalysisById,
  getComments as getStoredComments,
  addComment as storeComment,
  reactToComment,
} from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { generateCommentReply, isGeminiAvailable } from "@/lib/gemini";

// ── Slide sub-components ────────────────────────────────────────────
import ReportHero from "@/components/report/ReportHero";
import ReportDecisionModules from "@/components/report/ReportDecisionModules";
import ReportForensics from "@/components/report/ReportForensics";
import ReportAdvanced from "@/components/report/ReportAdvanced";
import ReportInsights from "@/components/report/ReportInsights";
import ReportPrintPage from "@/components/report/ReportPrintPage";
import ReportPrintHighlights from "@/components/report/ReportPrintHighlights";
import UserMenu from "@/components/UserMenu";

interface SectionPanel { name: string; ref: string }

export default function ReportClient({ id: propId }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid, loading: authLoading } = useAuth();

  const [id, setId] = useState<string>(propId);
  const [analysis, setAnalysis] = useState<AnalysisDoc | null>(null);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentPanel, setCommentPanel] = useState<SectionPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const discussAutoOpened = useRef(false);

  // Step 1: Extract the real ID from window.location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/report\/([^/]+)/);
      if (match?.[1] && match[1] !== "_") {
        setId(match[1]);
      } else if (propId && propId !== "_") {
        setId(propId);
      } else {
        setLoading(false);
      }
    }
  }, [propId]);

  // Step 2: Fetch from Firestore once we have a real ID (wait for auth to settle)
  useEffect(() => {
    if (!id || id === "_") return;
    if (authLoading) return; // wait for auth to resolve before checking ownership
    let cancelled = false;
    (async () => {
      try {
        const doc = await getAnalysisById(id);
        if (!cancelled && doc) {
          // Block access to private reports unless current user is the owner
          if (doc.visibility === "private" && doc.uploader_uid !== uid) {
            setAccessDenied(true);
            setLoading(false);
            return;
          }
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
  }, [id, uid, authLoading]);

  // Auto-open discussion panel if ?discuss=section_ref is in the URL
  useEffect(() => {
    if (analysis && !discussAutoOpened.current) {
      const discussSection = searchParams.get("discuss");
      if (discussSection) {
        discussAutoOpened.current = true;
        setCommentPanel({ name: discussSection, ref: discussSection });
      }
    }
  }, [analysis, searchParams]);

  // ── Handlers ───────────────────────────────────────────────────────
  const openDiscuss = (ref: string, name: string) => setCommentPanel({ name, ref });

  // ── Rate limiting: max 1 comment per 10 seconds ─────────────────
  const lastCommentTimeRef = useRef<number>(0);

  const handleAddComment = async (
    text: string,
    userName: string,
    sectionRef: string,
    isStarred: boolean,
    commenterEmail: string | null,
    commenterUid: string | null,
  ) => {
    // Rate limit: prevent spam (1 comment per 10 seconds)
    const now = Date.now();
    if (now - lastCommentTimeRef.current < 10000) {
      alert("Please wait a few seconds before posting another comment.");
      return;
    }
    lastCommentTimeRef.current = now;

    try {
      // 1. Post the user's comment
      const newComment = await storeComment(id, {
        user_name: userName,
        text,
        section_reference: sectionRef,
        is_starred: isStarred,
        commenter_email: commenterEmail,
        commenter_uid: commenterUid,
      });
      setComments((prev) => [...prev, newComment]);

      // 2. Generate Gemini auto-reply (non-blocking — don't fail the comment)
      if (analysis && isGeminiAvailable()) {
        try {
          const sectionComments = [...comments, newComment].filter(
            (c) => c.section_reference === sectionRef
          );

          const reply = await generateCommentReply({
            fileName: analysis.display_name || analysis.filename,
            docSummary: analysis.doc_summary || "",
            analysisResultJson: JSON.stringify(analysis.analysis_result),
            sectionRef,
            existingComments: sectionComments.map((c) => ({
              user_name: c.user_name,
              text: c.text,
              is_auto_reply: c.is_auto_reply,
            })),
            newCommentText: text,
            newCommentUser: userName,
          });

          // 3. Post the auto-reply as a system comment
          const autoReply = await storeComment(id, {
            user_name: "DocDetector",
            text: reply.reply,
            section_reference: sectionRef,
            is_auto_reply: true,
            comment_category: reply.category,
            escalation_summary: reply.can_answer ? null : reply.escalation_summary,
          });
          setComments((prev) => [...prev, autoReply]);
        } catch (err) {
          console.warn("[AutoReply] Gemini auto-reply failed (non-blocking):", err);
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleReact = async (commentId: string, reaction: "like" | "dislike") => {
    try {
      await reactToComment(id, commentId, reaction);
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

  // ── Loading / not-found states ─────────────────────────────────────
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

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 rounded-full bg-amber-500/10 p-4 w-fit">
            <XCircle className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-200">Private Report</h2>
          <p className="mt-2 text-sm text-zinc-400">
            This report is private and can only be viewed by its owner.
          </p>
          <button onClick={() => router.push("/")} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors cursor-pointer">Back to Home</button>
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
    const name = (analysis.display_name || analysis.filename.replace(/\.[^/.]+$/, "")).trim();
    document.title = `${name} - Assessment Report`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 scroll-smooth">
      {/* ── Print Styles: Dark-theme Highlight Reel PDF ──────────── */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print, .report-slide, header, .min-h-screen > section, .min-h-screen > div:not(#print-highlights) { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A4 portrait; margin: 0; }

          /* ── Base page ──────────────────────────────────── */
          .ph-page {
            page-break-before: always; break-before: page;
            width: 210mm; min-height: 297mm; box-sizing: border-box;
            padding: 16mm 18mm; display: flex; flex-direction: column;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #09090b !important; color: #e4e4e7;
          }
          .ph-page:first-child { page-break-before: auto; }

          /* ── Section header ─────────────────────────────── */
          .ph-section-hdr {
            font-size: 10pt; font-weight: 700; color: #3b82f6;
            text-transform: uppercase; letter-spacing: 3px;
            border-bottom: 2pt solid #3b82f6; padding-bottom: 2.5mm; margin-bottom: 6mm;
          }

          /* ═══ COVER ═════════════════════════════════════════ */
          .ph-cover {
            background: linear-gradient(170deg, #0f172a 0%, #09090b 50%, #1e1b4b 100%) !important;
            justify-content: space-between; text-align: center;
          }
          .ph-cover-top { padding-top: 8mm; }
          .ph-cover-badge {
            font-size: 10pt; font-weight: 700; letter-spacing: 5px;
            color: #60a5fa; text-transform: uppercase; margin-bottom: 8mm;
          }
          .ph-cover-title {
            font-size: 30pt !important; font-weight: 900; line-height: 1.12;
            color: #f1f5f9; margin: 0 auto 4mm; max-width: 155mm;
          }
          .ph-cover-author { font-size: 13pt !important; color: #94a3b8; margin: 0 0 4mm; }
          .ph-cover-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .ph-trust-ring {
            width: 42mm; height: 42mm; border-radius: 50%;
            border: 4.5mm solid; display: flex; flex-direction: column;
            align-items: center; justify-content: center; margin: 0 auto 8mm;
            background: #18181b !important;
          }
          .ph-trust-num { font-size: 40pt !important; font-weight: 900; line-height: 1; }
          .ph-trust-lbl { font-size: 9pt !important; color: #a1a1aa; font-weight: 700; letter-spacing: 2px; }
          .ph-cover-headline {
            font-size: 14pt !important; color: #cbd5e1; max-width: 145mm;
            line-height: 1.45; margin: 0 auto; font-style: italic;
          }
          .ph-cover-bottom { padding-bottom: 4mm; }
          .ph-cover-mini-stats {
            display: flex; justify-content: center; gap: 8mm; margin-bottom: 5mm;
          }
          .ph-mini-stat {
            font-size: 9pt !important; color: #a1a1aa;
          }
          .ph-mini-stat em {
            font-style: normal; font-weight: 900; font-size: 14pt !important;
            display: block; line-height: 1.2;
          }
          .ph-cover-date { font-size: 9pt !important; color: #52525b; }

          /* ═══ AT A GLANCE ═══════════════════════════════════ */
          .ph-glance-summary {
            font-size: 12pt !important; line-height: 1.55; color: #d4d4d8; margin-bottom: 6mm;
          }
          .ph-glance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm; }
          .ph-glance-card {
            background: #18181b !important; border-radius: 2mm; padding: 3mm 4mm;
            display: flex; align-items: center; gap: 3mm; position: relative; overflow: hidden;
          }
          .ph-glance-bar {
            position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.15; border-radius: 2mm;
          }
          .ph-glance-label { font-size: 8.5pt !important; color: #a1a1aa; flex: 1; position: relative; z-index: 1; }
          .ph-glance-value { font-size: 10pt !important; color: #f4f4f5; font-weight: 800; position: relative; z-index: 1; }

          /* ═══ FINDING PAGES ═════════════════════════════════ */
          .ph-finding { background: #0c0a09 !important; }
          .ph-finding-icon { font-size: 13pt; margin-right: 2mm; }
          .ph-finding-title {
            font-weight: 900; color: #fafafa; line-height: 1.18;
            margin: 6mm 0 5mm;
          }
          .ph-finding-insight {
            color: #d4d4d8; line-height: 1.55; margin-bottom: 5mm;
          }

          /* Score bar visual */
          .ph-score-visual {
            display: flex; align-items: center; gap: 3mm; margin-bottom: 5mm;
          }
          .ph-score-track {
            flex: 1; height: 5mm; background: #27272a; border-radius: 3mm; overflow: hidden;
          }
          .ph-score-fill { height: 100%; border-radius: 3mm; }
          .ph-score-num { font-size: 9pt !important; font-weight: 800; white-space: nowrap; }

          /* Evidence box */
          .ph-evidence-box {
            background: #18181b !important; border-left: 3pt solid; border-radius: 0 2mm 2mm 0;
            padding: 4mm 5mm; margin-bottom: 4mm;
          }
          .ph-evidence-hdr {
            font-size: 8pt !important; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1.5px; margin-bottom: 2mm;
          }
          .ph-evidence-text { color: #d4d4d8; line-height: 1.5; margin: 0; white-space: pre-line; }

          /* Tooltip / why-this-matters box */
          .ph-tooltip-box {
            background: #1c1917 !important; border-radius: 2mm;
            padding: 4mm 5mm; margin-bottom: 4mm; border: 0.5pt solid #3f3f46;
          }
          .ph-tooltip-hdr {
            font-size: 8pt !important; font-weight: 700; color: #60a5fa;
            text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2mm;
          }
          .ph-tooltip-text { color: #a1a1aa; line-height: 1.5; margin: 0; }

          /* Page footer */
          .ph-page-footer {
            font-size: 7.5pt !important; color: #52525b; margin-top: auto; padding-top: 3mm;
            border-top: 0.5pt solid #27272a;
          }

          /* ═══ CTA PAGE ═════════════════════════════════════ */
          .ph-cta {
            justify-content: center; align-items: center; text-align: center;
            background: linear-gradient(170deg, #0f172a 0%, #09090b 100%) !important;
          }
          .ph-cta-title { font-size: 28pt !important; font-weight: 900; color: #fafafa; margin: 8mm 0 5mm; }
          .ph-cta-text { font-size: 13pt !important; color: #a1a1aa; line-height: 1.55; max-width: 145mm; margin-bottom: 8mm; }
          .ph-cta-text strong { color: #60a5fa; }
          .ph-cta-contest {
            display: flex; align-items: flex-start; gap: 4mm;
            background: #1e293b !important; border: 1pt solid #3b82f6; border-radius: 3mm;
            padding: 5mm 6mm; margin-bottom: 8mm; text-align: left; max-width: 145mm;
          }
          .ph-cta-contest-icon { font-size: 22pt; line-height: 1; }
          .ph-cta-contest strong { color: #e2e8f0; font-size: 11pt !important; display: block; margin-bottom: 1.5mm; }
          .ph-cta-contest p { color: #94a3b8; font-size: 10pt !important; margin: 0; line-height: 1.4; }
          .ph-cta-links { display: flex; gap: 4mm; margin-bottom: 6mm; }
          .ph-cta-link {
            border: 1pt solid #3b82f6; border-radius: 3mm; padding: 4mm 5mm;
            flex: 1; text-align: left; text-decoration: none; color: inherit;
          }
          .ph-cta-link-label { display: block; font-size: 10pt !important; font-weight: 700; color: #60a5fa; margin-bottom: 1.5mm; }
          .ph-cta-link-primary {
            background: #2563eb !important; border-color: #3b82f6 !important;
          }
          .ph-cta-link-label-primary {
            display: block; font-size: 13pt !important; font-weight: 900; color: #fff !important;
            margin-bottom: 1.5mm; letter-spacing: 0.5px;
          }
          .ph-cta-link-url { display: block; font-size: 7.5pt !important; color: #71717a; word-break: break-all; font-family: monospace; }
          .ph-cta-link-primary .ph-cta-link-url { color: #bfdbfe !important; }

          /* ═══ ABOUT PAGE ═══════════════════════════════════ */
          .ph-about {
            justify-content: center; align-items: center; text-align: center;
            background: linear-gradient(170deg, #09090b 0%, #1e1b4b 100%) !important;
          }
          .ph-about-title { font-size: 32pt !important; font-weight: 900; color: #60a5fa; margin: 6mm 0; }
          .ph-about-text { font-size: 12pt !important; color: #a1a1aa; line-height: 1.6; max-width: 145mm; margin-bottom: 10mm; }
          .ph-about-grid { display: flex; gap: 10mm; margin-bottom: 10mm; }
          .ph-about-stat {
            background: #18181b !important; border-radius: 3mm; padding: 5mm 7mm;
            border: 0.5pt solid #27272a;
          }
          .ph-about-stat-num { display: block; font-size: 30pt !important; font-weight: 900; color: #fafafa; }
          .ph-about-stat-lbl { display: block; font-size: 8pt !important; color: #71717a; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 1mm; }
          .ph-about-meta { font-size: 7.5pt !important; color: #52525b; font-family: monospace; }
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
              Print Summary Report
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── Report Slides ──────────────────────────────────────── */}
      <ReportHero analysis={analysis} r={r} openDiscuss={openDiscuss} />
      <ReportDecisionModules analysis={analysis} r={r} openDiscuss={openDiscuss} />
      <ReportForensics analysis={analysis} r={r} openDiscuss={openDiscuss} />
      <ReportAdvanced analysis={analysis} r={r} openDiscuss={openDiscuss} />
      <ReportInsights analysis={analysis} r={r} openDiscuss={openDiscuss} />

      {/* ── Footer & Print Page ────────────────────────────────── */}
      <ReportPrintPage analysis={analysis} />

      {/* ── Print-Only Highlight Reel (PDF export) ─────────────── */}
      <ReportPrintHighlights analysis={analysis} />

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
