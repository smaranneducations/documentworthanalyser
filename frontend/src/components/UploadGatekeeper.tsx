"use client";

import { useState, useCallback, useRef } from "react";
import SHA256 from "crypto-js/sha256";
import WordArray from "crypto-js/lib-typedarrays";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import type { FuzzyMatch } from "@/lib/fuzzy-match";

export interface MatchInfo {
  exact: boolean; // true = same file hash, false = fuzzy name match
  matches: FuzzyMatch[];
}

interface UploadGatekeeperProps {
  /** Called after hashing. Returns exact + fuzzy matches (non-blocking info). */
  onCheckHash: (hash: string) => Promise<MatchInfo | null>;
  /** Called to analyze the file. Returns the report ID. */
  onAnalyze: (file: File, hash: string) => Promise<string>;
  /** Called when user wants to view an existing report. */
  onViewReport: (id: string) => void;
}

type Stage = "idle" | "hashing" | "checking" | "matched" | "uploading" | "done" | "error";

export default function UploadGatekeeper({
  onCheckHash,
  onAnalyze,
  onViewReport,
}: UploadGatekeeperProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("idle");
    setFile(null);
    setFileHash("");
    setMatchInfo(null);
    setErrorMsg("");
    setReportId(null);
  };

  const hashFile = useCallback(async (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const wordArray = WordArray.create(arrayBuffer);
          const hash = SHA256(wordArray).toString();
          resolve(hash);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(f);
    });
  }, []);

  /** Run the analysis pipeline */
  const runAnalysis = useCallback(
    async (f: File, hash: string) => {
      setStage("uploading");
      try {
        const id = await onAnalyze(f, hash);
        setReportId(id);
        setStage("done");
        setTimeout(() => onViewReport(id), 300);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "DOCUMENT_NOT_FIT") {
          setStage("idle");
          return;
        }
        setStage("error");
        console.error("Analysis pipeline error:", err);
        setErrorMsg(`Analysis failed: ${msg}`);
      }
    },
    [onAnalyze, onViewReport]
  );

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setErrorMsg("");
      setReportId(null);
      setMatchInfo(null);

      // Validate file type
      const validTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(f.type) && !f.name.endsWith(".md") && !f.name.endsWith(".txt")) {
        setStage("error");
        setErrorMsg("Unsupported file type. Please upload PDF, TXT, MD, or DOCX files.");
        return;
      }

      // Step 1: Hash
      setStage("hashing");
      let hash: string;
      try {
        hash = await hashFile(f);
        setFileHash(hash);
      } catch {
        setStage("error");
        setErrorMsg("Failed to compute file hash.");
        return;
      }

      // Step 2: Check for matches
      setStage("checking");
      try {
        const info = await onCheckHash(hash);
        if (info && info.matches.length > 0) {
          setMatchInfo(info);
          // Pause here — let user decide
          setStage("matched");
          return;
        }
      } catch {
        console.warn("Match check failed. Proceeding with analysis.");
      }

      // Step 3: No matches — proceed directly
      await runAnalysis(f, hash);
    },
    [hashFile, onCheckHash, runAnalysis]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-400";
    if (s >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (s: number) => {
    if (s >= 70) return "bg-emerald-500/10";
    if (s >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className="w-full">
      {/* ── Idle / Drop Zone ─────────────────────────────────────────── */}
      {(stage === "idle" || stage === "error") && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed px-8 py-7
            transition-all duration-200 text-center
            ${
              dragOver
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
            onChange={handleChange}
            aria-label="Upload document"
          />
          <Upload className="mx-auto mb-2.5 h-8 w-8 text-zinc-500" />
          <p className="text-sm font-semibold text-zinc-300">
            Drop your document here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Supports PDF, TXT, MD, DOCX &mdash; Max 10 MB
          </p>
          {stage === "error" && (
            <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* ── Hashing / Checking spinner ────────────────────────────────── */}
      {(stage === "hashing" || stage === "checking") && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
          <p className="text-zinc-300 font-medium">
            {stage === "hashing" && "Computing file fingerprint..."}
            {stage === "checking" && "Checking for similar analyses..."}
          </p>
          {file && (
            <p className="mt-2 text-sm text-zinc-500 flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> {file.name}
            </p>
          )}
        </div>
      )}

      {/* ── Matches Found — user decides ──────────────────────────────── */}
      {stage === "matched" && matchInfo && matchInfo.matches.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/90 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-300">
              {matchInfo.exact ? "This exact file was previously analyzed" : "Similar documents found"}
            </p>
          </div>

          {/* Scrollable match list */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 scrollbar-thin mb-4">
            {matchInfo.matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onViewReport(m.id)}
                className="group w-full rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-left hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`shrink-0 rounded ${getScoreBg(m.trust_score)} px-1.5 py-0.5`}>
                    <span className={`text-xs font-bold ${getScoreColor(m.trust_score)}`}>{m.trust_score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-blue-400 transition-colors">
                      {m.display_name || m.filename}
                    </p>
                    {m.author && <p className="text-[11px] text-zinc-400 truncate">{m.author}</p>}
                    {m.doc_summary && <p className="text-[11px] text-zinc-500 truncate">{m.doc_summary}</p>}
                    <p className="text-[10px] text-zinc-600 font-mono truncate">{m.filename}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (file && fileHash) runAnalysis(file, fileHash);
              }}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Continue to Analyze
            </button>
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Abort &amp; Load New File
            </button>
          </div>
        </div>
      )}

      {/* ── Analyzing spinner ─────────────────────────────────────────── */}
      {stage === "uploading" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
          <p className="text-zinc-300 font-medium">Analyzing document...</p>
          {file && (
            <p className="mt-2 text-sm text-zinc-500 flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> {file.name}
            </p>
          )}
        </div>
      )}

      {/* ── Success ──────────────────────────────────────────────────── */}
      {stage === "done" && (
        <div className="rounded-2xl border border-emerald-800/50 bg-zinc-900/90 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Analysis Complete</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Taking you to your report...
          </p>
          {reportId && (
            <button
              onClick={() => onViewReport(reportId)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              View Report <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
