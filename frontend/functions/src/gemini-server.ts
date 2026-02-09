// ═══════════════════════════════════════════════════════════════════════════
// Server-side Gemini client — runs ONLY in Cloud Functions.
// The API key is read from process.env.GEMINI_API_KEY (set in functions/.env)
// and NEVER exposed to the browser.
// ═══════════════════════════════════════════════════════════════════════════

// ── Initialization (lazy load to avoid deployment timeout) ──────────────

let _clientPromise: Promise<any> | null = null;

async function getClient(): Promise<any> {
  if (!_clientPromise) {
    _clientPromise = (async () => {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set in Cloud Functions environment.");
      }
      return new GoogleGenAI({ apiKey });
    })();
  }
  return _clientPromise;
}

// ── Types ───────────────────────────────────────────────────────────────

interface PromptConfig {
  layer: number;
  name: string;
  temperature: number;
  max_output_tokens: number;
  system_instruction: string;
  prompt_template: string;
}

interface GeminiLayerResult {
  layer: number;
  raw: string;
  parsed: unknown;
}

// ── Prompt configs (imported inline to avoid cross-project module issues) ──
// These are kept in sync with frontend/src/lib/prompt-configs.ts.
// If you change prompts, update BOTH files.

function getConfigByLayer(layer: number): PromptConfig | null {
  const configs: Record<number, PromptConfig> = {
    1: {
      layer: 1,
      name: "Layer 1: Raw Forensics",
      temperature: 0.1,
      max_output_tokens: 4000,
      system_instruction: `You are a forensic document analyst with expertise in detecting deception, logical fallacies, regulatory compliance, and visual composition in technology vendor and advisory documents. The documents you analyze are consulting proposals, vendor pitches, training brochures, whitepapers, and advisory decks in the domains of AI, Data & Analytics, Agentic AI, Cloud, Digital Transformation, Cybersecurity, and Governance. You are strictly evidence-based. Every finding must reference specific text from the document. Never fabricate or assume content that is not present.

IMPORTANT CALIBRATION: These are business documents. A degree of persuasive language, optimism, and vendor positioning is NORMAL and EXPECTED. Do not penalize standard business communication practices. Only flag manipulation when it is genuinely excessive or deceptive beyond what is typical for the document type. A well-written vendor pitch with confident language should not be scored as manipulative — reserve high manipulation scores for documents that are genuinely misleading or use dark patterns.`,
      prompt_template: `Analyze the following business document. I have already run a heuristic pre-analysis that found specific word counts and pattern matches. Use these hard numbers as ground truth, then apply your judgment for the scoring and classification tasks.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS (treat as factual) ===
{{HEURISTIC_RESULTS}}

{{PAGE_IMAGES_NOTE}}

Based on the document text, heuristic data, and any page images provided, return a JSON object with these sections:

1. **deception_judgment**: Given the weasel word counts, puffery matches, false urgency phrases, passive voice instances, and jargon detected by the heuristic, score the overall manipulation_index (0-100). Consider not just quantity but severity — a few highly manipulative phrases may score higher than many mild ones. SCORING GUIDE: 0-20 = minimal (typical well-written business doc), 20-40 = moderate (noticeable persuasion tactics but within norms), 40-60 = elevated (clearly pushing beyond standard business communication), 60-80 = high (systematic manipulation patterns), 80-100 = extreme (deliberate deception). A typical consulting proposal should score 15-30. Only genuinely deceptive documents should exceed 50. Return: { "manipulation_index": number, "rationale": string }

2. **fallacies**: Identify logical fallacies in the document arguments. Look for: Straw Man, False Dichotomy, Appeal to Authority, Post Hoc, Sunk Cost. For each, provide the type, a quote from the document as evidence (max 120 chars), and severity (Low/Medium/High). Return: { "fallacies": [{ "type": string, "evidence": string, "severity": string }], "fallacy_density": number } (fallacy_density = fallacies per 1000 words)

3. **regulatory_judgment**: Given the regulatory, ethical, and privacy keyword matches from the heuristic, assess the overall safety. Identify any red flags where the document proposes activities without appropriate compliance frameworks. Return: { "red_flags": [string], "safety_level": "Safe"|"Caution"|"High Risk", "safety_score": number (0-100) }

4. **visual_intensity**: Assess the document's visual richness. If page images were provided, describe what visual elements you see (charts, diagrams, infographics, tables, formatting). If no images, base assessment on text references to visual elements. Return: { "score": number (1-10), "diagram_references": number, "formatting_richness": number, "assessment": string }

RESPOND WITH ONLY VALID JSON matching this structure:
{
  "deception_judgment": { "manipulation_index": 0, "rationale": "" },
  "fallacies": { "fallacies": [], "fallacy_density": 0 },
  "regulatory_judgment": { "red_flags": [], "safety_level": "Safe", "safety_score": 0 },
  "visual_intensity": { "score": 0, "diagram_references": 0, "formatting_richness": 0, "assessment": "" }
}`,
    },
    2: {
      layer: 2,
      name: "Layer 2: Informed Analysis",
      temperature: 0.2,
      max_output_tokens: 4000,
      system_instruction: `You are a strategic document analyst specializing in bias detection, technology obsolescence assessment, and implementation readiness evaluation for technology vendor and advisory documents — consulting proposals, vendor pitches, training brochures, whitepapers, and advisory decks covering AI, Data, Cloud, Digital Transformation, and Governance. Use the prior forensic analysis as context to inform deeper judgments. Be evidence-based and cite specific patterns from the document.

IMPORTANT CALIBRATION: Business documents naturally frame information favorably. Some degree of selection bias (showcasing strengths) and authority bias (citing respected sources) is standard practice, not a flaw. Only score biases as Medium or High when they are genuinely misleading or when the document systematically suppresses contradictory evidence. A typical well-crafted proposal should score 10-25 on bias. Reserve scores above 40 for documents with clear, systematic bias patterns.`,
      prompt_template: `Analyze this business document for bias, obsolescence risk, and implementation readiness. You have the document text plus results from a prior forensic analysis layer.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== PRIOR ANALYSIS (Layer 1 Results) ===
{{PRIOR_RESULTS}}

Return a JSON object with:

1. **bias_detection**: Identify cognitive biases present in the document: Confirmation, Survival, Selection, Recency, Authority. For each bias found, provide type, evidence quote (max 120 chars), severity (Low/Medium/High). Score overall_bias_score 0-100 (higher = more biased). Return: { "biases": [{ "type": string, "evidence": string, "severity": string }], "overall_bias_score": number }

2. **obsolescence_risk**: Assess whether the document references outdated technologies or misses current industry practices. Return: { "outdated_references": [string], "missing_current_practices": [string], "risk_level": string, "risk_score": number }

3. **implementation_readiness**: Evaluate how actionable the document is. Return: { "artifact_presence": [{ "name": string, "found": boolean }], "resource_clarity_score": number, "timeline_reality_score": number, "prerequisite_check_score": number, "readiness_score": number, "verdict": string }

RESPOND WITH ONLY VALID JSON:
{
  "bias_detection": { "biases": [], "overall_bias_score": 0 },
  "obsolescence_risk": { "outdated_references": [], "missing_current_practices": [], "risk_level": "Low", "risk_score": 0 },
  "implementation_readiness": { "artifact_presence": [], "resource_clarity_score": 0, "timeline_reality_score": 0, "prerequisite_check_score": 0, "readiness_score": 0, "verdict": "" }
}`,
    },
    3: {
      layer: 3,
      name: "Layer 3: Strategic Classification",
      temperature: 0.25,
      max_output_tokens: 5000,
      system_instruction: `You are a management consulting analyst who classifies technology vendor and advisory documents along strategic dimensions. These documents include consulting proposals, vendor pitches, training brochures, whitepapers, and advisory decks in AI, Data, Cloud, Digital Transformation, and Governance. Provide weighted driver scores (1-10) with clear rationale for each.`,
      prompt_template: `Classify this business document along four strategic dimensions.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== PRIOR ANALYSIS (Layer 1 + 2 Results) ===
{{PRIOR_RESULTS}}

Return JSON with four classification modules. Each module must have: drivers array of { name, weight (0-1, sum to 1.0), score (1-10), rationale }, composite_score (0-100), confidence (0-100%), classification label.

1. **provider_consumer**: "Provider-Favored" | "Consumer-Favored" | "Balanced"
2. **company_scale**: "Solo/Boutique" | "Mid-tier" | "Big 4/GSI"
3. **target_scale**: "Startup" | "SME" | "Enterprise"
4. **audience_level**: "Developer" | "Manager" | "VP" | "C-Suite"

RESPOND WITH ONLY VALID JSON:
{
  "provider_consumer": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "company_scale": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "target_scale": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "audience_level": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" }
}`,
    },
    4: {
      layer: 4,
      name: "Layer 4: Synthesis",
      temperature: 0.3,
      max_output_tokens: 5000,
      system_instruction: `You are a senior analyst synthesizing the complete forensic analysis of a technology vendor or advisory document. Be insightful but factual. Cite evidence for every claim.

IMPORTANT CALIBRATION: Be firm but fair. These are business documents and a degree of optimism and marketing language is expected. Your trust score should reflect genuine document quality: 70-100 Excellent, 55-70 Good, 40-55 Average, 25-40 Below average, 0-25 Poor. A typical well-written consulting proposal should score 50-65. Only genuinely problematic documents should score below 35. For the summary: lead with the document's strengths before discussing weaknesses. Be constructive.`,
      prompt_template: `Provide the final synthesis for this document analysis.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== ALL PRIOR ANALYSIS (Layer 1 + 2 + 3) ===
{{PRIOR_RESULTS}}

Return JSON with:

1. **hype_reality**: classification "Balanced Analysis" | "Optimistic" | "Marketing-Heavy", hype_score 0-100, positive_sentiment_pct, risk_mentions, failure_acknowledgments, balance_assessment
2. **rarity_index**: drivers, composite_score, confidence, classification "Commodity" | "Differentiated" | "Category-Defining"
3. **amazing_facts**: 3-5 findings, each { fact, why_amazing, is_contrarian, is_quantified }
4. **overall_trust_score**: 0-100
5. **summary**: 200-300 word executive summary
6. **linkedin_hashtags**: 8-12 relevant hashtags

RESPOND WITH ONLY VALID JSON:
{
  "hype_reality": { "positive_sentiment_pct": 0, "risk_mentions": 0, "failure_acknowledgments": 0, "balance_assessment": "", "hype_score": 0, "classification": "" },
  "rarity_index": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "amazing_facts": [],
  "overall_trust_score": 0,
  "summary": "",
  "linkedin_hashtags": ["#Example"]
}`,
    },
    5: {
      layer: 5,
      name: "Layer 5: PDF Highlight Curation",
      temperature: 0.4,
      max_output_tokens: 2000,
      system_instruction: `You are a content strategist who creates punchy, share-worthy executive summaries from forensic document analysis reports. Be insightful and direct, but fair. Highlight both strengths and concerns. Avoid sensationalist or accusatory language.`,
      prompt_template: `You have the COMPLETE analysis results for a document. Pick the most attention-grabbing findings and write them up as a highlight reel.

=== ANALYSIS RESULTS (all layers) ===
{{PRIOR_RESULTS}}

Create a JSON object with:
1. **headline**: A catchy one-liner for the PDF cover page. Include the trust score. Max 120 chars.
2. **hook_findings**: Array of 6-8 findings ranked by attention-grabbing potential. Each: { section, title (max 60 chars), insight (max 200 chars), hook_score (1-10) }

RESPOND WITH ONLY VALID JSON:
{
  "headline": "",
  "hook_findings": [{ "section": "", "title": "", "insight": "", "hook_score": 0 }]
}`,
    },
  };
  return configs[layer] || null;
}

// ── Core Gemini Call ─────────────────────────────────────────────────────

async function callGemini(
  config: PromptConfig,
  documentText: string,
  heuristicResults: string,
  priorResults: string,
): Promise<GeminiLayerResult> {
  const client = await getClient();

  const maxChars = 100000;
  const truncatedText = documentText.length > maxChars
    ? documentText.slice(0, maxChars) + "\n\n[... document truncated for context limit ...]"
    : documentText;

  let prompt = config.prompt_template
    .replace("{{DOCUMENT_TEXT}}", truncatedText)
    .replace("{{HEURISTIC_RESULTS}}", heuristicResults)
    .replace("{{PRIOR_RESULTS}}", priorResults || "N/A — this is the first analysis layer.")
    .replace("{{PAGE_IMAGES_NOTE}}", "NOTE: No page images available. Base visual assessment on text references only.");

  console.log(`[Gemini] Calling ${config.name} (temp: ${config.temperature})...`);

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: config.system_instruction,
      temperature: config.temperature,
      maxOutputTokens: config.max_output_tokens,
    },
  });

  const text = response.text ?? "";
  console.log(`[Gemini] ${config.name} response: ${text.length} chars`);

  let parsed: unknown;
  try {
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[Gemini] ${config.name} JSON parse error:`, err);
    throw new Error(`${config.name} returned invalid JSON: ${(err as Error).message}`);
  }

  return { layer: config.layer, raw: text, parsed };
}

// ── Retry wrapper ────────────────────────────────────────────────────────

async function callWithRetry(
  config: PromptConfig,
  documentText: string,
  heuristicResults: string,
  priorResults: string,
  maxRetries = 2,
): Promise<GeminiLayerResult> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(config, documentText, heuristicResults, priorResults);
    } catch (err) {
      lastError = err as Error;
      const msg = lastError.message || "";
      console.warn(`[Gemini] ${config.name} attempt ${attempt + 1} failed:`, msg);
      if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
      } else if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError ?? new Error("Gemini call failed after retries");
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Run Full Gemini Pipeline (5 layers)
// ═══════════════════════════════════════════════════════════════════════════

export async function runGeminiPipeline(
  documentText: string,
  heuristicPrePass: unknown,
): Promise<{
  layer1: unknown;
  layer2: unknown;
  layer3: unknown;
  layer4: unknown;
  layer5: unknown;
}> {
  const heuristicStr = JSON.stringify(heuristicPrePass, null, 2);

  const config1 = getConfigByLayer(1)!;
  const result1 = await callWithRetry(config1, documentText, heuristicStr, "");
  const layer1 = result1.parsed;

  const config2 = getConfigByLayer(2)!;
  const result2 = await callWithRetry(config2, documentText, heuristicStr, JSON.stringify({ layer_1: layer1 }, null, 2));
  const layer2 = result2.parsed;

  const config3 = getConfigByLayer(3)!;
  const result3 = await callWithRetry(config3, documentText, heuristicStr, JSON.stringify({ layer_1: layer1, layer_2: layer2 }, null, 2));
  const layer3 = result3.parsed;

  const config4 = getConfigByLayer(4)!;
  const result4 = await callWithRetry(config4, documentText, heuristicStr, JSON.stringify({ layer_1: layer1, layer_2: layer2, layer_3: layer3 }, null, 2));
  const layer4 = result4.parsed;

  let layer5: unknown = null;
  try {
    const config5 = getConfigByLayer(5)!;
    const allResults = JSON.stringify({ layer_1: layer1, layer_2: layer2, layer_3: layer3, layer_4: layer4 }, null, 2);
    const result5 = await callWithRetry(config5, "See prior results.", heuristicStr, allResults);
    layer5 = result5.parsed;
  } catch (err) {
    console.warn("[Gemini] Layer 5 failed (non-blocking):", err);
  }

  return { layer1, layer2, layer3, layer4, layer5 };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Document Fitness Check
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

export async function checkDocumentFitness(documentText: string): Promise<FitnessResult> {
  const client = await getClient();
  const snippet = documentText.slice(0, 5000);

  const prompt = `You are a document classifier and metadata extractor. You have TWO jobs:

JOB 1 — CLASSIFICATION: Determine whether the following document is suitable for analysis by a forensic engine that specializes in **technology vendor and advisory documents**.

SUITABLE document types: Consulting proposals, vendor whitepapers, training brochures, advisory decks, RFP responses, product marketing documents.

SUITABLE domains: AI/ML, Data & Analytics, Cloud, DevOps, Digital Transformation, Cybersecurity, Governance, Enterprise Software.

NOT SUITABLE: Legal contracts, financial reports, HR policies, academic papers, personal letters, news articles, medical records, fiction, etc.

JOB 2 — METADATA EXTRACTION: Extract display_name (document title), author (organization), and summary (1-2 sentences).

=== DOCUMENT SNIPPET (first ~5000 chars) ===
${snippet}

Respond with ONLY valid JSON:
{
  "fit": true/false,
  "document_type": "brief description",
  "document_domain": "the domain",
  "reason": "one sentence explaining why",
  "display_name": "The actual document title",
  "author": "Organization or person",
  "summary": "1-2 sentence summary"
}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a document classifier. Return only valid JSON. Be strict but fair on fitness.",
      temperature: 0.05,
      maxOutputTokens: 800,
    },
  });

  const text = response.text ?? "";
  try {
    const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(jsonStr) as FitnessResult;
  } catch {
    console.warn("[Gemini] Fitness check parse failed, allowing:", text.slice(0, 300));
    return { fit: true, document_type: "Unknown", document_domain: "Unknown", reason: "Fitness check inconclusive.", display_name: "", author: "", summary: "" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC: Comment Auto-Reply
// ═══════════════════════════════════════════════════════════════════════════

export interface CommentAutoReply {
  category: "appreciative" | "abusive" | "question" | "suggestion" | "contesting";
  reply: string;
  can_answer: boolean;
  escalation_summary: string | null;
}

export async function generateCommentReply(params: {
  fileName: string;
  docSummary: string;
  analysisResultJson: string;
  sectionRef: string;
  existingComments: { user_name: string; text: string; is_auto_reply: boolean }[];
  newCommentText: string;
  newCommentUser: string;
}): Promise<CommentAutoReply> {
  const client = await getClient();
  const analysisSnippet = params.analysisResultJson.slice(0, 30000);

  const prompt = `You are DocDetector's AI assistant responding to a user comment on a forensic document analysis report.

=== DOCUMENT ===
File: ${params.fileName}
Summary: ${params.docSummary}

=== ANALYSIS RESULT (JSON excerpt) ===
${analysisSnippet}

=== SECTION BEING DISCUSSED ===
${params.sectionRef}

=== EXISTING COMMENTS ===
${params.existingComments.map(c => `[${c.is_auto_reply ? "DocDetector" : c.user_name}]: ${c.text}`).join("\n") || "(no prior comments)"}

=== NEW COMMENT ===
[${params.newCommentUser}]: ${params.newCommentText}

Classify the comment into ONE category: "appreciative", "abusive", "question", "suggestion", "contesting". Generate a reply (max 40 words). If you genuinely cannot answer, set can_answer to false and provide an escalation_summary (max 300 words).

Respond with ONLY valid JSON:
{
  "category": "appreciative|abusive|question|suggestion|contesting",
  "reply": "your 40-word-max response",
  "can_answer": true/false,
  "escalation_summary": null or "summary for admin"
}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are DocDetector, an AI forensic document analysis assistant. Be concise, polite, and authoritative. Always return valid JSON.",
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const text = response.text ?? "";
    const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as CommentAutoReply;

    const words = parsed.reply.split(/\s+/);
    if (words.length > 50) {
      parsed.reply = words.slice(0, 45).join(" ") + "…";
    }
    return parsed;
  } catch (err) {
    console.error("[Gemini] Comment auto-reply failed:", err);
    return {
      category: "question",
      reply: "Thank you for your comment. I'll pass this along to the admin for a detailed review.",
      can_answer: false,
      escalation_summary: `Auto-reply generation failed. User comment: "${params.newCommentText}" on section "${params.sectionRef}" of file "${params.fileName}".`,
    };
  }
}
