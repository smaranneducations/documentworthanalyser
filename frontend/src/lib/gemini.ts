// ═══════════════════════════════════════════════════════════════════════════
// Gemini Client — Layered Analysis Pipeline
// Orchestrates heuristic pre-pass + 4 Gemini calls with chaining
// ═══════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";
import type { PromptConfig } from "./prompt-configs";
import { getConfigByLayer } from "./prompt-configs";

// ── Initialization ───────────────────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") {
    throw new Error("Gemini API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

// ── Types ────────────────────────────────────────────────────────────────

export interface GeminiLayerResult {
  layer: number;
  raw: string;          // raw Gemini response text
  parsed: unknown;      // parsed JSON
  tokensUsed?: number;
}

export interface HeuristicPrePassResults {
  fluff: unknown;
  data_intensity: unknown;
  deception_raw: unknown;    // weasel words, puffery, urgency, etc. (counts)
  regulatory_raw: unknown;   // keyword matches
  word_count: number;
  sentence_count: number;
}

// ── Core Gemini Call ─────────────────────────────────────────────────────

async function callGemini(
  config: PromptConfig,
  documentText: string,
  heuristicResults: string,
  priorResults: string,
  pageImages: { mimeType: string; data: string }[] | null,
): Promise<GeminiLayerResult> {
  const client = getClient();

  // Truncate document text to ~100k chars to stay within context limits
  const maxChars = 100000;
  const truncatedText = documentText.length > maxChars
    ? documentText.slice(0, maxChars) + "\n\n[... document truncated for context limit ...]"
    : documentText;

  // Assemble prompt from template
  let prompt = config.prompt_template
    .replace("{{DOCUMENT_TEXT}}", truncatedText)
    .replace("{{HEURISTIC_RESULTS}}", heuristicResults)
    .replace("{{PRIOR_RESULTS}}", priorResults || "N/A — this is the first analysis layer.");

  // Handle page images note
  if (pageImages && pageImages.length > 0) {
    prompt = prompt.replace(
      "{{PAGE_IMAGES_NOTE}}",
      `PAGE IMAGES: ${pageImages.length} page images are attached for visual analysis. Examine them for charts, diagrams, infographics, tables, and overall formatting richness.`
    );
  } else {
    prompt = prompt.replace(
      "{{PAGE_IMAGES_NOTE}}",
      "NOTE: No page images available. Base visual assessment on text references only."
    );
  }

  // Build parts array — text + optional images
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  // Add images if provided (for Layer 1 visual analysis)
  if (pageImages && pageImages.length > 0) {
    for (const img of pageImages) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  console.log(`[Gemini] Calling Layer ${config.layer}: ${config.name} (temp: ${config.temperature})...`);

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: config.system_instruction,
      temperature: config.temperature,
      maxOutputTokens: config.max_output_tokens,
    },
  });

  const text = response.text ?? "";
  console.log(`[Gemini] Layer ${config.layer} response: ${text.length} chars`);

  // Parse JSON from response — handle markdown code fences
  let parsed: unknown;
  try {
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[Gemini] Layer ${config.layer} JSON parse error:`, err);
    console.error("[Gemini] Raw response:", text.slice(0, 500));
    throw new Error(`Layer ${config.layer} returned invalid JSON: ${(err as Error).message}`);
  }

  return { layer: config.layer, raw: text, parsed };
}

// ── Retry wrapper ────────────────────────────────────────────────────────

async function callGeminiWithRetry(
  config: PromptConfig,
  documentText: string,
  heuristicResults: string,
  priorResults: string,
  pageImages: { mimeType: string; data: string }[] | null,
  maxRetries = 2,
): Promise<GeminiLayerResult> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(config, documentText, heuristicResults, priorResults, pageImages);
    } catch (err) {
      lastError = err as Error;
      const msg = lastError.message || "";
      console.warn(`[Gemini] Layer ${config.layer} attempt ${attempt + 1} failed:`, msg);

      // Rate limit — wait before retrying
      if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        console.log(`[Gemini] Rate limited. Waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
      } else if (attempt < maxRetries) {
        // Brief pause for other errors
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError ?? new Error("Gemini call failed after retries");
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Run Full Gemini Pipeline
// ═══════════════════════════════════════════════════════════════════════════

export async function runGeminiPipeline(
  documentText: string,
  heuristicPrePass: HeuristicPrePassResults,
  pageImages: { mimeType: string; data: string }[] | null,
): Promise<{
  layer1: unknown;
  layer2: unknown;
  layer3: unknown;
  layer4: unknown;
  layer5: unknown;
}> {
  const heuristicStr = JSON.stringify(heuristicPrePass, null, 2);

  // ── Layer 1: Raw Forensics ──────────────────────────────────────────
  const config1 = getConfigByLayer(1)!;
  const result1 = await callGeminiWithRetry(config1, documentText, heuristicStr, "", pageImages);
  const layer1 = result1.parsed;
  console.log("[Gemini] Layer 1 complete.");

  // ── Layer 2: Informed Analysis ──────────────────────────────────────
  const config2 = getConfigByLayer(2)!;
  const prior2 = JSON.stringify({ layer_1: layer1 }, null, 2);
  const result2 = await callGeminiWithRetry(config2, documentText, heuristicStr, prior2, null);
  const layer2 = result2.parsed;
  console.log("[Gemini] Layer 2 complete.");

  // ── Layer 3: Strategic Classification ───────────────────────────────
  const config3 = getConfigByLayer(3)!;
  const prior3 = JSON.stringify({ layer_1: layer1, layer_2: layer2 }, null, 2);
  const result3 = await callGeminiWithRetry(config3, documentText, heuristicStr, prior3, null);
  const layer3 = result3.parsed;
  console.log("[Gemini] Layer 3 complete.");

  // ── Layer 4: Synthesis ──────────────────────────────────────────────
  const config4 = getConfigByLayer(4)!;
  const prior4 = JSON.stringify({ layer_1: layer1, layer_2: layer2, layer_3: layer3 }, null, 2);
  const result4 = await callGeminiWithRetry(config4, documentText, heuristicStr, prior4, null);
  const layer4 = result4.parsed;
  console.log("[Gemini] Layer 4 complete.");

  // ── Layer 5: PDF Highlight Curation ─────────────────────────────────
  let layer5: unknown = null;
  try {
    const config5 = getConfigByLayer(5)!;
    // Layer 5 only needs the analysis results — no document text needed.
    // We pass all prior layers as "prior results" and a minimal doc text placeholder.
    const allResults = JSON.stringify({ layer_1: layer1, layer_2: layer2, layer_3: layer3, layer_4: layer4 }, null, 2);
    const result5 = await callGeminiWithRetry(config5, "See prior results.", heuristicStr, allResults, null);
    layer5 = result5.parsed;
    console.log("[Gemini] Layer 5 (PDF highlights) complete.");
  } catch (err) {
    console.warn("[Gemini] Layer 5 (PDF highlights) failed — non-blocking:", err);
    // Layer 5 is non-critical; PDF will still work with fallback
  }

  return { layer1, layer2, layer3, layer4, layer5 };
}

// ═══════════════════════════════════════════════════════════════════════════
// Document Fitness Check (Layer 0)
// Quick Gemini call to determine if the document is suitable for this tool
// ═══════════════════════════════════════════════════════════════════════════

export interface FitnessResult {
  fit: boolean;
  document_type: string;
  document_domain: string;
  reason: string;
  display_name: string;
  author: string;
  summary: string;
}

export async function checkDocumentFitness(
  documentText: string,
): Promise<FitnessResult> {
  const client = getClient();

  // Only send first ~5000 chars for a quick check
  const snippet = documentText.slice(0, 5000);

  const prompt = `You are a document classifier and metadata extractor. You have TWO jobs:

JOB 1 — CLASSIFICATION: Determine whether the following document is suitable for analysis by a forensic engine that specializes in **technology vendor and advisory documents**.

SUITABLE document types:
- Consulting proposals and sales pitches
- Vendor whitepapers and thought leadership papers
- Training brochures and course catalogs
- Advisory and strategy decks
- RFP responses from technology vendors
- Product/platform marketing documents

SUITABLE subject domains:
- Artificial Intelligence, Machine Learning, Generative AI, Agentic AI
- Data & Analytics, Big Data, Data Engineering
- Cloud Computing, DevOps, Infrastructure
- Digital Transformation, Automation, RPA
- Cybersecurity, Governance, Risk & Compliance
- Enterprise Software, SaaS, Platform Engineering

NOT SUITABLE (examples):
- Legal contracts, NDAs, terms of service
- Financial reports, balance sheets, tax documents
- HR policies, employee handbooks
- Academic research papers, peer-reviewed journals
- Personal letters, resumes, CVs
- News articles, blog posts, social media content
- Medical records, clinical documents
- Government legislation, court filings
- Fiction, creative writing

JOB 2 — METADATA EXTRACTION: Regardless of fitness, extract the following:
- **display_name**: The actual title of the document as it would appear on a cover page or header. NOT the filename. Look for headings, title pages, cover text. If no clear title, create a concise descriptive title from the content (e.g. "AI Transformation Strategy for Enterprise Retail").
- **author**: The organization or person who authored/published the document. Look for company logos mentioned, "prepared by", copyright notices, letterheads. If unclear, use "Unknown".
- **summary**: A 1-2 sentence summary of what the document is about and its purpose.

=== DOCUMENT SNIPPET (first ~5000 chars) ===
${snippet}

Respond with ONLY valid JSON:
{
  "fit": true/false,
  "document_type": "brief description, e.g. 'AI consulting proposal'",
  "document_domain": "the domain, e.g. 'AI & Data Analytics'",
  "reason": "one sentence explaining why it is or isn't suitable",
  "display_name": "The actual document title extracted from content",
  "author": "Organization or person who authored it",
  "summary": "1-2 sentence summary of the document"
}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a document classifier and metadata extractor. Return only valid JSON. Be strict but fair on fitness — if the document is even partially about technology vendor services, advisory, or training in the listed domains, mark it as fit. Always extract display_name, author, and summary regardless of fitness.",
      temperature: 0.05,
      maxOutputTokens: 800,
    },
  });

  const text = response.text ?? "";
  try {
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(jsonStr) as FitnessResult;
  } catch {
    console.warn("[Gemini] Fitness check JSON parse failed, allowing document:", text.slice(0, 300));
    // If parsing fails, let the document through rather than blocking
    return { fit: true, document_type: "Unknown", document_domain: "Unknown", reason: "Fitness check inconclusive — allowing analysis.", display_name: "", author: "", summary: "" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Gemini is available (key configured)
// ═══════════════════════════════════════════════════════════════════════════

export function isGeminiAvailable(): boolean {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return !!key && key !== "PASTE_YOUR_KEY_HERE";
}

// ═══════════════════════════════════════════════════════════════════════════
// Gemini Comment Auto-Reply
// Classifies comment intent & generates a concise response
// ═══════════════════════════════════════════════════════════════════════════

export interface CommentAutoReply {
  category: "appreciative" | "abusive" | "question" | "suggestion" | "contesting";
  reply: string;           // ~40 words max
  can_answer: boolean;     // false → escalate to admin
  escalation_summary: string | null; // max ~300 words explaining why it can't answer + context
}

export async function generateCommentReply(params: {
  fileName: string;
  docSummary: string;
  analysisResultJson: string;   // stringified analysis result
  sectionRef: string;           // which section the comment is on
  existingComments: { user_name: string; text: string; is_auto_reply: boolean }[];
  newCommentText: string;
  newCommentUser: string;
}): Promise<CommentAutoReply> {
  const client = getClient();

  // Truncate analysis to stay within context limits
  const analysisSnippet = params.analysisResultJson.slice(0, 30000);

  const prompt = `You are DocDetector's AI assistant responding to a user comment on a forensic document analysis report.

=== DOCUMENT ===
File: ${params.fileName}
Summary: ${params.docSummary}

=== ANALYSIS RESULT (JSON excerpt) ===
${analysisSnippet}

=== SECTION BEING DISCUSSED ===
${params.sectionRef}

=== EXISTING COMMENTS IN THIS THREAD ===
${params.existingComments.map(c => `[${c.is_auto_reply ? "DocDetector" : c.user_name}]: ${c.text}`).join("\n") || "(no prior comments)"}

=== NEW COMMENT ===
[${params.newCommentUser}]: ${params.newCommentText}

=== YOUR TASK ===

1. Classify the comment into exactly ONE category:
   - "appreciative" — the user is thanking, praising, or expressing satisfaction
   - "abusive" — the user is rude, offensive, or using inappropriate language
   - "question" — the user is asking for clarification or more detail
   - "suggestion" — the user is proposing an improvement or alternative perspective
   - "contesting" — the user is disagreeing with or challenging the analysis finding

2. Generate a reply (max 40 words):
   - Be polite but authoritative
   - Reference the actual analysis data when possible
   - For "abusive": politely decline to engage but stay professional
   - For "appreciative": brief warm acknowledgment
   - For "question"/"suggestion"/"contesting": address it using the analysis data

3. If you genuinely cannot provide a proper, helpful answer based on the analysis data:
   - Set can_answer to false
   - Write "I appreciate your input. I'm unable to fully address this and will pass your comment to the admin for review." as the reply
   - Provide an escalation_summary (max 300 words) explaining: what the user asked, why you can't answer, relevant context from the analysis, and what the admin should look at

Respond with ONLY valid JSON:
{
  "category": "appreciative|abusive|question|suggestion|contesting",
  "reply": "your 40-word-max response",
  "can_answer": true/false,
  "escalation_summary": null or "max 300 word summary for admin"
}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are DocDetector, an AI forensic document analysis assistant. You respond to user comments on analysis reports. Be concise, polite, and authoritative. Always return valid JSON.",
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const text = response.text ?? "";
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(jsonStr) as CommentAutoReply;

    // Ensure the reply isn't too long
    const words = parsed.reply.split(/\s+/);
    if (words.length > 50) {
      parsed.reply = words.slice(0, 45).join(" ") + "…";
    }

    return parsed;
  } catch (err) {
    console.error("[Gemini] Comment auto-reply failed:", err);
    // Fallback — don't block the user experience
    return {
      category: "question",
      reply: "Thank you for your comment. I'll pass this along to the admin for a detailed review.",
      can_answer: false,
      escalation_summary: `Auto-reply generation failed. User comment: "${params.newCommentText}" on section "${params.sectionRef}" of file "${params.fileName}". Please review manually.`,
    };
  }
}
