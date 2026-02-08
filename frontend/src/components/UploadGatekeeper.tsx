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
  X,
  ArrowRight,
} from "lucide-react";

interface DuplicateInfo {
  id: string;
  filename: string;
  uploaded_at: Date;
}

interface UploadGatekeeperProps {
  /** Called after hashing to check for duplicates. Return null if new, or info if exists. */
  onCheckHash: (hash: string) => Promise<DuplicateInfo | null>;
  /** Called when the file is new and should be analyzed. Returns the report ID. */
  onAnalyze: (file: File, hash: string) => Promise<string>;
  /** Called when user wants to view an existing report. */
  onViewReport: (id: string) => void;
}

type Stage = "idle" | "hashing" | "checking" | "duplicate" | "uploading" | "done" | "error";

export default function UploadGatekeeper({
  onCheckHash,
  onAnalyze,
  onViewReport,
}: UploadGatekeeperProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("idle");
    setFile(null);
    setDuplicate(null);
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

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setErrorMsg("");
      setReportId(null);

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
      } catch {
        setStage("error");
        setErrorMsg("Failed to compute file hash.");
        return;
      }

      // Step 2: Check for duplicates
      setStage("checking");
      try {
        const existing = await onCheckHash(hash);
        if (existing) {
          setDuplicate(existing);
          setStage("duplicate");
          return;
        }
      } catch {
        console.warn("Hash check failed. Proceeding with analysis.");
      }

      // Step 3: Analyze
      setStage("uploading");
      try {
        const id = await onAnalyze(f, hash);
        // Store the ID for the fallback button
        setReportId(id);
        setStage("done");
        // Navigate using the parent's handler — same code path as clicking recent analyses
        // Small delay to let React commit the "done" state so user sees the success message
        setTimeout(() => onViewReport(id), 300);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If document was rejected by fitness check, silently reset (modal handles UX)
        if (msg === "DOCUMENT_NOT_FIT") {
          setStage("idle");
          return;
        }
        setStage("error");
        console.error("Analysis pipeline error:", err);
        setErrorMsg(`Analysis failed: ${msg}`);
      }
    },
    [hashFile, onCheckHash, onAnalyze, onViewReport]
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

      {/* ── Processing States ────────────────────────────────────────── */}
      {(stage === "hashing" || stage === "checking" || stage === "uploading") && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
          <p className="text-zinc-300 font-medium">
            {stage === "hashing" && "Computing file fingerprint..."}
            {stage === "checking" && "Checking for duplicate analyses..."}
            {stage === "uploading" && "Analyzing document..."}
          </p>
          {file && (
            <p className="mt-2 text-sm text-zinc-500 flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> {file.name}
            </p>
          )}
        </div>
      )}

      {/* ── Duplicate Found Modal ────────────────────────────────────── */}
      {stage === "duplicate" && duplicate && (
        <div className="rounded-2xl border border-amber-800/50 bg-zinc-900/90 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-500/20 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                Document Already Analyzed
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                This file was previously analyzed on{" "}
                <span className="text-zinc-200 font-medium">
                  {duplicate.uploaded_at.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>{" "}
                as <span className="text-zinc-200 font-medium">{duplicate.filename}</span>.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => onViewReport(duplicate.id)}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                >
                  View Existing Report
                </button>
                <button
                  onClick={reset}
                  className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Upload Different File
                </button>
              </div>
            </div>
            <button onClick={reset} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-5 w-5" />
            </button>
          </div>
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
          {/* Prominent button — always visible as fallback */}
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
