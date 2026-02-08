// ═══════════════════════════════════════════════════════════════════════════
// Client-Side Storage Layer
// Persists uploaded files, analysis results, and comments in localStorage.
// In production, swap this with Firestore calls from firebase.ts.
// ═══════════════════════════════════════════════════════════════════════════

import type { AnalysisResult, AnalysisDoc, CommentDoc } from "./types";

const STORAGE_KEY = "docdetector_analyses";
const FILES_KEY = "docdetector_files";
const COMMENTS_KEY = "docdetector_comments";

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Stored types (dates as strings for JSON) ────────────────────────────────

interface StoredAnalysis {
  id: string;
  file_hash: string;
  filename: string;
  uploaded_at: string; // ISO string
  analysis_result: AnalysisResult;
}

interface StoredFile {
  analysis_id: string;
  filename: string;
  size: number;
  type: string;
  text_content: string;  // The extracted text content
  stored_at: string;
}

interface StoredComment {
  id: string;
  analysis_id: string;
  user_name: string;
  text: string;
  section_reference: string;
  timestamp: string;
}

// ── Convert stored → domain ─────────────────────────────────────────────────

function toDomain(stored: StoredAnalysis): AnalysisDoc {
  return {
    ...stored,
    uploaded_at: new Date(stored.uploaded_at),
  };
}

function toCommentDomain(stored: StoredComment): CommentDoc {
  return {
    id: stored.id,
    user_name: stored.user_name,
    text: stored.text,
    section_reference: stored.section_reference,
    timestamp: new Date(stored.timestamp),
    likes: 0,
    dislikes: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save a new analysis and the uploaded file's text content.
 * Returns the generated analysis ID.
 */
export function saveAnalysis(data: {
  file_hash: string;
  filename: string;
  file_size: number;
  file_type: string;
  text_content: string;
  analysis_result: AnalysisResult;
}): string {
  const id = generateId();
  const now = new Date().toISOString();

  // Save analysis
  const analyses = readJSON<StoredAnalysis[]>(STORAGE_KEY, []);
  analyses.unshift({
    id,
    file_hash: data.file_hash,
    filename: data.filename,
    uploaded_at: now,
    analysis_result: data.analysis_result,
  });
  writeJSON(STORAGE_KEY, analyses);

  // Save file content
  const files = readJSON<StoredFile[]>(FILES_KEY, []);
  files.unshift({
    analysis_id: id,
    filename: data.filename,
    size: data.file_size,
    type: data.file_type,
    text_content: data.text_content,
    stored_at: now,
  });
  writeJSON(FILES_KEY, files);

  return id;
}

/**
 * Get all analyses, newest first.
 */
export function getAllAnalyses(): AnalysisDoc[] {
  const stored = readJSON<StoredAnalysis[]>(STORAGE_KEY, []);
  return stored.map(toDomain);
}

/**
 * Get a single analysis by ID.
 */
export function getAnalysisById(id: string): AnalysisDoc | null {
  const stored = readJSON<StoredAnalysis[]>(STORAGE_KEY, []);
  const found = stored.find((a) => a.id === id);
  return found ? toDomain(found) : null;
}

/**
 * Check if a file with the given hash already exists.
 * Returns the existing analysis or null.
 */
export function checkFileHash(hash: string): AnalysisDoc | null {
  const stored = readJSON<StoredAnalysis[]>(STORAGE_KEY, []);
  const found = stored.find((a) => a.file_hash === hash);
  return found ? toDomain(found) : null;
}

/**
 * Get stored file content for an analysis.
 */
export function getFileContent(analysisId: string): StoredFile | null {
  const files = readJSON<StoredFile[]>(FILES_KEY, []);
  return files.find((f) => f.analysis_id === analysisId) ?? null;
}

/**
 * Get all stored files metadata (for a files table view).
 */
export function getAllFiles(): StoredFile[] {
  return readJSON<StoredFile[]>(FILES_KEY, []);
}

// ── Comments ────────────────────────────────────────────────────────────────

/**
 * Get comments for an analysis, optionally filtered by section.
 */
export function getComments(analysisId: string, sectionRef?: string): CommentDoc[] {
  const stored = readJSON<StoredComment[]>(COMMENTS_KEY, []);
  let filtered = stored.filter((c) => c.analysis_id === analysisId);
  if (sectionRef) {
    filtered = filtered.filter((c) => c.section_reference === sectionRef);
  }
  return filtered.map(toCommentDomain);
}

/**
 * Add a comment to an analysis.
 */
export function addComment(
  analysisId: string,
  comment: { user_name: string; text: string; section_reference: string }
): CommentDoc {
  const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const stored = readJSON<StoredComment[]>(COMMENTS_KEY, []);
  const newComment: StoredComment = {
    id,
    analysis_id: analysisId,
    ...comment,
    timestamp: now,
  };
  stored.push(newComment);
  writeJSON(COMMENTS_KEY, stored);

  return toCommentDomain(newComment);
}
