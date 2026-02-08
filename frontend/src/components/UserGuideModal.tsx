"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, Upload, ShieldCheck, Brain, Sparkles, Search, ToggleRight, Printer, BookOpen, Lock, Unlock, MessageSquare, Star, Bot, Copy } from "lucide-react";

/* ── Section data ─────────────────────────────────────────────── */

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  details: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: "upload",
    icon: <Upload className="h-4 w-4 text-blue-400" />,
    title: "Upload & Analyze",
    summary: "Drop a PDF, DOCX, or TXT file. Get a full forensic report in under 30 seconds.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Supported formats: PDF, DOCX, TXT</li>
        <li>Text is extracted automatically — no manual copy-paste needed</li>
        <li>PDF pages are also converted to images for visual analysis by the AI</li>
        <li>Analysis runs a 5-layer AI pipeline producing 25+ scored metrics</li>
      </ul>
    ),
  },
  {
    id: "fitness",
    icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
    title: "Document Fitness Check",
    summary: "Only business/technology documents are accepted. Unrelated files are rejected with an explanation.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Accepted: consulting proposals, vendor pitches, whitepapers, advisory decks, strategy documents</li>
        <li>Rejected: recipes, novels, personal letters, homework, resumes, etc.</li>
        <li>The AI explains why a document doesn&apos;t qualify if rejected</li>
        <li>This check happens before the full analysis to save time</li>
      </ul>
    ),
  },
  {
    id: "trust",
    icon: <Brain className="h-4 w-4 text-purple-400" />,
    title: "Trust Score & 5-Layer AI Analysis",
    summary: "Every document gets a 0–100 trust score based on 25+ weighted drivers across 5 analysis layers.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li><strong className="text-zinc-300">Layer 1:</strong> Raw forensics — deception detection, logical fallacies, regulatory safety</li>
        <li><strong className="text-zinc-300">Layer 2:</strong> Informed analysis — bias detection, obsolescence risk, implementation readiness</li>
        <li><strong className="text-zinc-300">Layer 3:</strong> Strategic classification — provider vs consumer stance, company scale, audience level</li>
        <li><strong className="text-zinc-300">Layer 4:</strong> Synthesis — hype vs reality, rarity index, key findings, overall trust score</li>
        <li><strong className="text-zinc-300">Layer 5:</strong> Highlight reel curation for the print summary</li>
      </ul>
    ),
  },
  {
    id: "findings",
    icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
    title: "Key Findings",
    summary: "AI highlights the most surprising or concerning facts from the document.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Genuinely interesting discoveries, not just keyword matches</li>
        <li>Each finding explains why it&apos;s notable</li>
        <li>Flags contrarian claims and quantified statements</li>
      </ul>
    ),
  },
  {
    id: "duplicate",
    icon: <Search className="h-4 w-4 text-cyan-400" />,
    title: "Duplicate Detection",
    summary: "If you upload a file that's already been analyzed, you're taken straight to the existing report.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Uses SHA-256 hash to detect exact duplicates instantly</li>
        <li>Also performs fuzzy matching to flag similar (but not identical) documents</li>
        <li>Saves time and avoids redundant analysis</li>
      </ul>
    ),
  },
  {
    id: "private",
    icon: <Lock className="h-4 w-4 text-rose-400" />,
    title: "Private & Public Uploads",
    summary: "Upload files as Private (only you can see) or Public (visible to everyone). Default is Private when logged in.",
    details: (
      <div className="space-y-3 text-sm text-zinc-400">
        <div>
          <p className="flex items-center gap-2 text-zinc-300 font-medium mb-1"><Unlock className="h-3.5 w-3.5" /> Public</p>
          <ul className="space-y-1 ml-5">
            <li>Visible to everyone in the file list</li>
            <li>Anyone with the link can view the report</li>
          </ul>
        </div>
        <div>
          <p className="flex items-center gap-2 text-zinc-300 font-medium mb-1"><Lock className="h-3.5 w-3.5" /> Private</p>
          <ul className="space-y-1 ml-5">
            <li>Visible only to you in the file list</li>
            <li>Others cannot access the report even with a direct URL</li>
            <li>Default when logged in</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "myfiles",
    icon: <ToggleRight className="h-4 w-4 text-blue-400" />,
    title: '"Show Only My Files" Toggle',
    summary: "When logged in, filter the home page file list to show only the documents you uploaded.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Toggle appears above the &quot;Previously Assessed&quot; file list</li>
        <li>Only visible when you are logged in</li>
        <li>Platform stats (total files/words) are unaffected — they always show global counts</li>
      </ul>
    ),
  },
  {
    id: "comments",
    icon: <MessageSquare className="h-4 w-4 text-green-400" />,
    title: "Section-Level Discussion",
    summary: "Every section of the report has a discussion panel for comments and questions.",
    details: (
      <div className="space-y-3 text-sm text-zinc-400">
        <div>
          <p className="flex items-center gap-2 text-zinc-300 font-medium mb-1"><MessageSquare className="h-3.5 w-3.5" /> Anonymous Comments</p>
          <ul className="space-y-1 ml-5">
            <li>No login required</li>
            <li>No identity shown</li>
            <li>Gets an instant AI auto-reply</li>
          </ul>
        </div>
        <div>
          <p className="flex items-center gap-2 text-zinc-300 font-medium mb-1"><Star className="h-3.5 w-3.5 text-yellow-400" /> Starred Comments</p>
          <ul className="space-y-1 ml-5">
            <li>Requires Google sign-in (popup appears if not logged in)</li>
            <li>Your email and timestamp are displayed</li>
            <li>Triggers an email alert to the admin</li>
            <li>Guarantees an admin response within 7 working days</li>
            <li>You get email notifications when anyone replies in that thread</li>
            <li>Also gets an instant AI auto-reply</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-500 italic">Both types are visible to everyone — starred is not private, just identified.</p>
      </div>
    ),
  },
  {
    id: "autoreply",
    icon: <Bot className="h-4 w-4 text-indigo-400" />,
    title: "AI Auto-Reply",
    summary: "Every comment gets an instant AI response based on the full document, analysis, and prior comments.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>The AI reads the entire document, analysis results, and all comments in that section</li>
        <li>Classifies your comment (question, suggestion, appreciation, etc.) and responds accordingly</li>
        <li>If it cannot answer adequately, it escalates to the admin with a detailed summary</li>
      </ul>
    ),
  },
  {
    id: "print",
    icon: <Printer className="h-4 w-4 text-orange-400" />,
    title: "Print Summary",
    summary: "Generate a styled PDF highlight reel of key scores and findings to share with your team.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Uses browser &quot;Print to PDF&quot; with a custom dark-theme layout</li>
        <li>Includes trust score, top findings, key metrics, and overall summary</li>
        <li>Designed for quick sharing — no login required to generate</li>
      </ul>
    ),
  },
  {
    id: "glossary",
    icon: <BookOpen className="h-4 w-4 text-teal-400" />,
    title: "Assessment Rules Glossary",
    summary: "Every metric is explained — what it means, why it matters, and how it's calculated.",
    details: (
      <ul className="space-y-1.5 text-sm text-zinc-400">
        <li>Accessible from the header on every page via &quot;Assessment Rules&quot;</li>
        <li>Covers all 25+ drivers used in the analysis</li>
        <li>Grouped by category with expand/collapse for each term</li>
      </ul>
    ),
  },
  {
    id: "auth",
    icon: <ShieldCheck className="h-4 w-4 text-blue-400" />,
    title: "Logged Out vs Logged In",
    summary: "Sign in with Google to unlock private uploads, starred comments, and the file filter.",
    details: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="pb-2 pr-4 font-medium">Feature</th>
              <th className="pb-2 pr-4 font-medium">Logged Out</th>
              <th className="pb-2 font-medium">Logged In</th>
            </tr>
          </thead>
          <tbody className="text-zinc-400">
            <tr className="border-b border-zinc-800/50"><td className="py-1.5 pr-4">Upload files</td><td className="py-1.5 pr-4">Public only</td><td className="py-1.5">Public or Private</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-1.5 pr-4">View public reports</td><td className="py-1.5 pr-4">Yes</td><td className="py-1.5">Yes</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-1.5 pr-4">View private reports</td><td className="py-1.5 pr-4">No</td><td className="py-1.5">Only your own</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-1.5 pr-4">Anonymous comments</td><td className="py-1.5 pr-4">Yes</td><td className="py-1.5">Yes</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-1.5 pr-4">Starred comments</td><td className="py-1.5 pr-4">Prompts login</td><td className="py-1.5">Yes</td></tr>
            <tr><td className="py-1.5 pr-4">&quot;Show only my files&quot;</td><td className="py-1.5 pr-4">Hidden</td><td className="py-1.5">Available</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
];

/* ── Collapsible row ──────────────────────────────────────────── */

function GuideRow({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border transition-colors ${open ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
      >
        <div className="flex-shrink-0">{section.icon}</div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200">{section.title}</span>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{section.summary}</p>
        </div>
        <div className="flex-shrink-0 text-zinc-600">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 ml-7 border-t border-zinc-800/50 mt-0 pt-3">
          {section.details}
        </div>
      )}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────── */

export default function UserGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">User Guide</h2>
            <p className="text-xs text-zinc-500 mt-0.5">What can DocDetector do? Click any item to expand.</p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {sections.map((s) => (
            <GuideRow key={s.id} section={s} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex-shrink-0">
          <p className="text-xs text-zinc-600 text-center">
            Upload a business document to get started. No sign-in required for basic analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
