// ═══════════════════════════════════════════════════════════════════════════
// Gemini Client — Frontend proxy to Cloud Functions
// All Gemini API calls are made server-side via Firebase callable functions.
// The Gemini API key is NEVER exposed to the browser.
// ═══════════════════════════════════════════════════════════════════════════

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// ── Types ────────────────────────────────────────────────────────────────

export interface HeuristicPrePassResults {
  fluff: unknown;
  data_intensity: unknown;
  deception_raw: unknown;
  regulatory_raw: unknown;
  word_count: number;
  sentence_count: number;
}

export interface GeminiLayerResult {
  layer: number;
  raw: string;
  parsed: unknown;
  tokensUsed?: number;
}

export interface FitnessResult {
  fit: boolean;
  document_type: string;
  document_domain: string;
  reason: string;
  display_name: string;
  author: string;
  summary: string;
}

export interface CommentAutoReply {
  category: "appreciative" | "abusive" | "question" | "suggestion" | "contesting";
  reply: string;
  can_answer: boolean;
  escalation_summary: string | null;
}

// ── Firebase Functions instance ──────────────────────────────────────────

const functions = getFunctions(app);

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Run Full Gemini Pipeline (via Cloud Function)
// ═══════════════════════════════════════════════════════════════════════════

export async function runGeminiPipeline(
  documentText: string,
  heuristicPrePass: HeuristicPrePassResults,
  _pageImages: { mimeType: string; data: string }[] | null,
): Promise<{
  layer1: unknown;
  layer2: unknown;
  layer3: unknown;
  layer4: unknown;
  layer5: unknown;
}> {
  console.log("[Gemini] Calling Cloud Function: geminiAnalyze...");
  const callable = httpsCallable(functions, "geminiAnalyze", { timeout: 300000 });
  const result = await callable({
    documentText,
    heuristicPrePass,
  });
  console.log("[Gemini] Cloud Function geminiAnalyze complete.");
  return result.data as {
    layer1: unknown;
    layer2: unknown;
    layer3: unknown;
    layer4: unknown;
    layer5: unknown;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Document Fitness Check (via Cloud Function)
// ═══════════════════════════════════════════════════════════════════════════

export async function checkDocumentFitness(
  documentText: string,
): Promise<FitnessResult> {
  console.log("[Gemini] Calling Cloud Function: geminiCheckFitness...");
  const callable = httpsCallable(functions, "geminiCheckFitness", { timeout: 60000 });
  const result = await callable({ documentText });
  console.log("[Gemini] Cloud Function geminiCheckFitness complete.");
  return result.data as FitnessResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Gemini is available (always true now — server handles key)
// ═══════════════════════════════════════════════════════════════════════════

export function isGeminiAvailable(): boolean {
  // Gemini is always available since the API key is on the server.
  // If the Cloud Function fails, it will throw an error at call time.
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Comment Auto-Reply (via Cloud Function)
// ═══════════════════════════════════════════════════════════════════════════

export async function generateCommentReply(params: {
  fileName: string;
  docSummary: string;
  analysisResultJson: string;
  sectionRef: string;
  existingComments: { user_name: string; text: string; is_auto_reply: boolean }[];
  newCommentText: string;
  newCommentUser: string;
}): Promise<CommentAutoReply> {
  console.log("[Gemini] Calling Cloud Function: geminiCommentReply...");
  const callable = httpsCallable(functions, "geminiCommentReply", { timeout: 60000 });
  const result = await callable(params);
  console.log("[Gemini] Cloud Function geminiCommentReply complete.");
  return result.data as CommentAutoReply;
}
