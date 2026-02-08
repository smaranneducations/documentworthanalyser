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
//   ├─ visibility        (string)   — "public" | "private"
//   ├─ uploader_uid      (string|null) — Firebase Auth UID (null = anonymous)
//   ├─ uploader_email    (string|null) — uploader email for display
//   ├─ uploaded_at       (timestamp)
//   ├─ analysis_result   (map)      — full AnalysisResult object
//   └─ comments/{cid}
//        ├─ user_name           (string)   — display name or "Anonymous"
//        ├─ text                (string)
//        ├─ section_reference   (string)
//        ├─ timestamp           (timestamp)
//        ├─ likes               (number)   — like count
//        ├─ dislikes            (number)   — dislike count
//        ├─ is_starred          (boolean)  — false = anonymous, true = starred
//        ├─ commenter_email     (string|null) — only for starred comments
//        ├─ commenter_uid       (string|null) — Firebase Auth UID for starred
//        ├─ is_auto_reply       (boolean)  — true = Gemini auto-response
//        ├─ comment_category    (string|null) — classified intent
//        └─ escalation_summary  (string|null) — set when Gemini escalates to admin
//
// users/{uid}
//   ├─ email                  (string)
//   ├─ first_seen             (timestamp)
//   ├─ last_seen              (timestamp)
//   ├─ login_count            (number)
//   ├─ total_session_seconds  (number)   — cumulative session time
//   └─ current_session_start  (timestamp|null)
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
  increment,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { AnalysisResult, AnalysisDoc, CommentDoc, PdfHighlights, UserDoc } from "./types";

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
  word_count?: number;
  display_name?: string;
  author?: string;
  doc_summary?: string;
  analysis_result: AnalysisResult;
  pdf_highlights?: PdfHighlights;
  visibility?: "public" | "private";
  uploader_uid?: string | null;
  uploader_email?: string | null;
}): Promise<string> {
  console.log("[Firestore] saveAnalysis: writing document…");

  // Sanitize the analysis_result to remove any non-serializable values
  const sanitizedResult = JSON.parse(JSON.stringify(data.analysis_result));

  // Cap summary to 300 words
  const fullSummary = data.analysis_result.summary || "";
  const words = fullSummary.split(/\s+/).filter(Boolean);
  const summary = words.length > 300 ? words.slice(0, 300).join(" ") + "…" : fullSummary;

  // Sanitize pdf_highlights if present
  const sanitizedHighlights = data.pdf_highlights
    ? JSON.parse(JSON.stringify(data.pdf_highlights))
    : null;

  const payload = {
    file_hash: data.file_hash,
    filename: data.filename,
    display_name: data.display_name || "",
    author: data.author || "",
    doc_summary: data.doc_summary || "",
    file_size: data.file_size,
    file_type: data.file_type,
    word_count: data.word_count || 0,
    summary,
    analysis_result: sanitizedResult,
    ...(sanitizedHighlights ? { pdf_highlights: sanitizedHighlights } : {}),
    visibility: data.visibility || "public",
    uploader_uid: data.uploader_uid ?? null,
    uploader_email: data.uploader_email ?? null,
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

/**
 * Lightweight platform stats: total files and total words analysed.
 * Counts ALL documents regardless of visibility (global metrics).
 */
export async function getPlatformStats(): Promise<{ totalFiles: number; totalWords: number }> {
  const snap = await getDocs(collection(db, "analyses"));
  let totalWords = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    totalWords += data.word_count || Math.round((data.file_size || 0) / 6);
  });
  return { totalFiles: snap.size, totalWords };
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
    analysis_result: {
      ...data.analysis_result,
      linkedin_hashtags: data.analysis_result?.linkedin_hashtags ?? [],
    },
    ...(data.pdf_highlights ? { pdf_highlights: data.pdf_highlights } : {}),
    // Auth / visibility — backward-compatible: legacy docs default to public/anonymous
    visibility: data.visibility ?? "public",
    uploader_uid: data.uploader_uid ?? null,
    uploader_email: data.uploader_email ?? null,
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
      is_starred: data.is_starred ?? false,
      commenter_email: data.commenter_email ?? null,
      commenter_uid: data.commenter_uid ?? null,
      is_auto_reply: data.is_auto_reply ?? false,
      comment_category: data.comment_category ?? null,
      escalation_summary: data.escalation_summary ?? null,
    };
  });
}

/**
 * Add a comment to an analysis. Returns the full CommentDoc.
 */
export async function addComment(
  analysisId: string,
  comment: {
    user_name: string;
    text: string;
    section_reference: string;
    is_starred?: boolean;
    commenter_email?: string | null;
    commenter_uid?: string | null;
    is_auto_reply?: boolean;
    comment_category?: string | null;
    escalation_summary?: string | null;
  }
): Promise<CommentDoc> {
  const commentsRef = collection(db, "analyses", analysisId, "comments");
  const ts = Timestamp.now();
  const payload = {
    user_name: comment.user_name,
    text: comment.text,
    section_reference: comment.section_reference,
    is_starred: comment.is_starred ?? false,
    commenter_email: comment.commenter_email ?? null,
    commenter_uid: comment.commenter_uid ?? null,
    is_auto_reply: comment.is_auto_reply ?? false,
    comment_category: comment.comment_category ?? null,
    escalation_summary: comment.escalation_summary ?? null,
    likes: 0,
    dislikes: 0,
    timestamp: ts,
  };
  const docRef = await addDoc(commentsRef, payload);
  return {
    id: docRef.id,
    user_name: comment.user_name,
    text: comment.text,
    section_reference: comment.section_reference,
    timestamp: ts.toDate(),
    likes: 0,
    dislikes: 0,
    is_starred: payload.is_starred,
    commenter_email: payload.commenter_email,
    commenter_uid: payload.commenter_uid,
    is_auto_reply: payload.is_auto_reply,
    comment_category: payload.comment_category,
    escalation_summary: payload.escalation_summary,
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

// ═══════════════════════════════════════════════════════════════════════════
// USER ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a user sign-in event.
 * Creates the user doc if first visit, otherwise increments login_count.
 */
export async function recordSignIn(uid: string, email: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const now = Timestamp.now();

  if (!snap.exists()) {
    // First-time user
    await setDoc(userRef, {
      email,
      first_seen: now,
      last_seen: now,
      login_count: 1,
      total_session_seconds: 0,
      current_session_start: now,
    });
  } else {
    // Returning user
    await updateDoc(userRef, {
      email,               // update in case they changed Google accounts
      last_seen: now,
      login_count: increment(1),
      current_session_start: now,
    });
  }
}

/**
 * Record a user sign-out event.
 * Calculates session duration and adds it to the cumulative total.
 */
export async function recordSignOut(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();
  const sessionStart = data.current_session_start;

  if (sessionStart) {
    const startMs = sessionStart.toMillis();
    const nowMs = Date.now();
    const durationSeconds = Math.round((nowMs - startMs) / 1000);

    await updateDoc(userRef, {
      total_session_seconds: increment(durationSeconds),
      current_session_start: null,
      last_seen: Timestamp.now(),
    });
  } else {
    await updateDoc(userRef, {
      current_session_start: null,
      last_seen: Timestamp.now(),
    });
  }
}

/**
 * Update last_seen for an already-authenticated session (e.g. page reload).
 * Also ensures current_session_start is set if missing (tab was closed without logout).
 */
export async function recordSessionHeartbeat(uid: string, email: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const now = Timestamp.now();

  if (!snap.exists()) {
    // User exists in Auth but not in our users collection — create doc
    await setDoc(userRef, {
      email,
      first_seen: now,
      last_seen: now,
      login_count: 1,
      total_session_seconds: 0,
      current_session_start: now,
    });
  } else {
    const data = snap.data();
    // If there was an orphaned session (closed tab without logout), settle it
    if (data.current_session_start) {
      const startMs = data.current_session_start.toMillis();
      const nowMs = Date.now();
      const durationSeconds = Math.round((nowMs - startMs) / 1000);
      // Cap orphaned sessions at 2 hours to avoid inflated numbers
      const cappedDuration = Math.min(durationSeconds, 7200);

      await updateDoc(userRef, {
        total_session_seconds: increment(cappedDuration),
        current_session_start: now,
        last_seen: now,
        email,
      });
    } else {
      await updateDoc(userRef, {
        current_session_start: now,
        last_seen: now,
        email,
      });
    }
  }
}
