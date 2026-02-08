// ═══════════════════════════════════════════════════════════════════════════
// Firebase Cloud Layer — ALL data lives in Firestore + Storage
// No localStorage. Structured for future RAG / scalability.
// ═══════════════════════════════════════════════════════════════════════════
//
// Firestore Schema:
// ─────────────────
// analyses/{id}
//   ├─ file_hash        (string)   — SHA-256 of original file
//   ├─ filename          (string)   — original filename
//   ├─ file_size         (number)   — bytes
//   ├─ file_type         (string)   — MIME type
//   ├─ summary           (string)   — max 300-word analysis summary
//   ├─ uploaded_at       (timestamp)
//   ├─ analysis_result   (map)      — full AnalysisResult object
//   └─ comments/{cid}
//        ├─ user_name           (string)   — email address
//        ├─ text                (string)
//        ├─ section_reference   (string)
//        ├─ timestamp           (timestamp)
//        ├─ likes               (number)   — like count
//        └─ dislikes            (number)   — dislike count
//
// glossary/{id}
//   ├─ term        (string)
//   ├─ category    (string)
//   ├─ meaning     (string)
//   ├─ importance  (string)
//   ├─ calculation (string)
//   └─ order       (number)   — for stable sort
//
// Storage Structure:
// ──────────────────
// uploads/{analysisId}/{filename}  — original uploaded file
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  orderBy,
  Timestamp,
  limit,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { AnalysisResult, AnalysisDoc, CommentDoc } from "./types";

export type { AnalysisResult, AnalysisDoc, CommentDoc } from "./types";

// ── Firebase Config (hardcoded for DocumentWorthAnalyser project) ────────
const firebaseConfig = {
  apiKey: "AIzaSyDOiDbcWPbKmVQJ5m7brYm0LYPRvOkb_uY",
  authDomain: "documentworthanalyser.firebaseapp.com",
  projectId: "documentworthanalyser",
  storageBucket: "documentworthanalyser.firebasestorage.app",
  messagingSenderId: "831032268912",
  appId: "1:831032268912:web:00f9914b3c6680762cfcb5",
  measurementId: "G-683GNFEH09",
};

// ── Init ────────────────────────────────────────────────────────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);

const storage = getStorage(app);

export { app, db, storage };

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSES CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save a new analysis with full metadata + extracted text.
 * Returns the Firestore document ID.
 */
/**
 * Save analysis to Firestore.
 * Only metadata + analysis_result + a short summary are stored.
 * The original file (PDF etc.) is stored separately in Firebase Storage.
 */
export async function saveAnalysis(data: {
  file_hash: string;
  filename: string;
  file_size: number;
  file_type: string;
  display_name?: string;
  author?: string;
  doc_summary?: string;
  analysis_result: AnalysisResult;
}): Promise<string> {
  console.log("[Firestore] saveAnalysis: writing document…");

  // Sanitize the analysis_result to remove any non-serializable values
  const sanitizedResult = JSON.parse(JSON.stringify(data.analysis_result));

  // Cap summary to 300 words
  const fullSummary = data.analysis_result.summary || "";
  const words = fullSummary.split(/\s+/).filter(Boolean);
  const summary = words.length > 300 ? words.slice(0, 300).join(" ") + "…" : fullSummary;

  const payload = {
    file_hash: data.file_hash,
    filename: data.filename,
    display_name: data.display_name || "",
    author: data.author || "",
    doc_summary: data.doc_summary || "",
    file_size: data.file_size,
    file_type: data.file_type,
    summary,
    analysis_result: sanitizedResult,
    uploaded_at: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, "analyses"), payload);
    console.log("[Firestore] saveAnalysis: document created with ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("[Firestore] saveAnalysis FAILED:", err);
    throw err;
  }
}

/**
 * Check if a file with the given SHA-256 hash already exists.
 */
export async function checkFileHash(hash: string): Promise<AnalysisDoc | null> {
  const q = query(
    collection(db, "analyses"),
    where("file_hash", "==", hash),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return toAnalysisDoc(d.id, d.data());
}

/**
 * Get a single analysis by Firestore document ID.
 */
export async function getAnalysisById(id: string): Promise<AnalysisDoc | null> {
  const snap = await getDoc(doc(db, "analyses", id));
  if (!snap.exists()) return null;
  return toAnalysisDoc(snap.id, snap.data());
}

/**
 * Get all analyses, newest first. Optional limit.
 */
export async function getAllAnalyses(maxResults = 50): Promise<AnalysisDoc[]> {
  const q = query(
    collection(db, "analyses"),
    orderBy("uploaded_at", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toAnalysisDoc(d.id, d.data()));
}

// ── Helper: Firestore data → AnalysisDoc ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAnalysisDoc(id: string, data: any): AnalysisDoc {
  return {
    id,
    file_hash: data.file_hash ?? "",
    filename: data.filename ?? "",
    display_name: data.display_name ?? "",
    author: data.author ?? "",
    doc_summary: data.doc_summary ?? "",
    uploaded_at: data.uploaded_at?.toDate?.() ?? new Date(),
    analysis_result: data.analysis_result,
  };
}

/**
 * Lightweight query: fetch just id, display_name, author, doc_summary, filename, trust_score, uploaded_at
 * for ALL analyses. Used for client-side fuzzy matching.
 * At ~2000 docs this is very fast — only reads summary fields.
 */
export async function getAllDocSummaries(): Promise<{
  id: string;
  display_name: string;
  author: string;
  doc_summary: string;
  filename: string;
  trust_score: number;
  uploaded_at: Date;
}[]> {
  const q = query(
    collection(db, "analyses"),
    orderBy("uploaded_at", "desc"),
    limit(2000)
  );
  const snap = await getDocs(q);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      display_name: data.display_name ?? "",
      author: data.author ?? "",
      doc_summary: data.doc_summary ?? "",
      filename: data.filename ?? "",
      trust_score: data.analysis_result?.overall_trust_score ?? 0,
      uploaded_at: data.uploaded_at?.toDate?.() ?? new Date(),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD (Firebase Storage)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload the original file to Firebase Storage.
 * Returns the download URL.
 */
export async function uploadFile(
  analysisId: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, `uploads/${analysisId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get comments for an analysis, optionally filtered by section.
 */
export async function getComments(
  analysisId: string,
  sectionRef?: string
): Promise<CommentDoc[]> {
  const commentsRef = collection(db, "analyses", analysisId, "comments");
  const q = sectionRef
    ? query(
        commentsRef,
        where("section_reference", "==", sectionRef),
        orderBy("timestamp", "asc")
      )
    : query(commentsRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      user_name: data.user_name ?? "",
      text: data.text ?? "",
      section_reference: data.section_reference ?? "",
      timestamp: data.timestamp?.toDate?.() ?? new Date(),
      likes: data.likes ?? 0,
      dislikes: data.dislikes ?? 0,
    };
  });
}

/**
 * Add a comment to an analysis. Returns the full CommentDoc.
 */
export async function addComment(
  analysisId: string,
  comment: { user_name: string; text: string; section_reference: string }
): Promise<CommentDoc> {
  const commentsRef = collection(db, "analyses", analysisId, "comments");
  const ts = Timestamp.now();
  const docRef = await addDoc(commentsRef, {
    ...comment,
    likes: 0,
    dislikes: 0,
    timestamp: ts,
  });
  return {
    id: docRef.id,
    user_name: comment.user_name,
    text: comment.text,
    section_reference: comment.section_reference,
    timestamp: ts.toDate(),
    likes: 0,
    dislikes: 0,
  };
}

/**
 * Increment like or dislike count on a comment.
 */
export async function reactToComment(
  analysisId: string,
  commentId: string,
  reaction: "like" | "dislike"
): Promise<void> {
  const commentRef = doc(db, "analyses", analysisId, "comments", commentId);
  const snap = await getDoc(commentRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const field = reaction === "like" ? "likes" : "dislikes";
  await setDoc(commentRef, { [field]: (data[field] ?? 0) + 1 }, { merge: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOSSARY — Seed & Read
// ═══════════════════════════════════════════════════════════════════════════

export interface GlossaryDoc {
  id: string;
  term: string;
  category: string;
  meaning: string;
  importance: string;
  calculation: string;
  order: number;
}

/**
 * Fetch all glossary entries from Firestore, sorted by order.
 */
export async function getGlossary(): Promise<GlossaryDoc[]> {
  const q = query(collection(db, "glossary"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      term: data.term ?? "",
      category: data.category ?? "",
      meaning: data.meaning ?? "",
      importance: data.importance ?? "",
      calculation: data.calculation ?? "",
      order: data.order ?? 0,
    };
  });
}

/**
 * Seed the glossary collection from the static data.
 * Uses batch writes. Idempotent — uses term as doc ID.
 */
export async function seedGlossary(
  entries: {
    term: string;
    category: string;
    meaning: string;
    importance: string;
    calculation: string;
  }[]
): Promise<void> {
  // Firestore batch limit is 500 — we have ~65 entries, well within
  const batch = writeBatch(db);
  entries.forEach((entry, i) => {
    // Use a slug of the term as the doc ID for idempotency
    const slug = entry.term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const ref = doc(db, "glossary", slug);
    batch.set(ref, { ...entry, order: i });
  });
  await batch.commit();
}

/**
 * Check if glossary has been seeded (quick check — just see if collection has docs).
 */
export async function isGlossarySeeded(): Promise<boolean> {
  const q = query(collection(db, "glossary"), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}
