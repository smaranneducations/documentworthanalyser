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

  return { layer1, layer2, layer3, layer4 };
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
}

export async function checkDocumentFitness(
  documentText: string,
): Promise<FitnessResult> {
  const client = getClient();

  // Only send first ~5000 chars for a quick check
  const snippet = documentText.slice(0, 5000);

  const prompt = `You are a document classifier. Your ONLY job is to determine whether the following document
is suitable for analysis by a forensic engine that specializes in **technology vendor and advisory documents**.

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

=== DOCUMENT SNIPPET (first ~5000 chars) ===
${snippet}

Respond with ONLY valid JSON:
{
  "fit": true/false,
  "document_type": "brief description of what this document is, e.g. 'AI consulting proposal', 'cloud migration whitepaper'",
  "document_domain": "the domain, e.g. 'AI & Data Analytics', 'Cloud Computing'",
  "reason": "one sentence explaining why it is or isn't suitable"
}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a document classifier. Return only valid JSON. Be strict but fair — if the document is even partially about technology vendor services, advisory, or training in the listed domains, mark it as fit.",
      temperature: 0.05,
      maxOutputTokens: 500,
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
    return { fit: true, document_type: "Unknown", document_domain: "Unknown", reason: "Fitness check inconclusive — allowing analysis." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Gemini is available (key configured)
// ═══════════════════════════════════════════════════════════════════════════

export function isGeminiAvailable(): boolean {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return !!key && key !== "PASTE_YOUR_KEY_HERE";
}
