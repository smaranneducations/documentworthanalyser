// ═══════════════════════════════════════════════════════════════════════════
// Prompt Configurations for Gemini Layered Analysis
// These are the default configs; at runtime they can be overridden from
// the Firestore `prompt_configs` collection for hot-tuning.
// ═══════════════════════════════════════════════════════════════════════════

export interface PromptConfig {
  id: string;
  name: string;
  layer: number;
  temperature: number;
  max_output_tokens: number;
  system_instruction: string;
  prompt_template: string;       // Use {{DOCUMENT_TEXT}}, {{HEURISTIC_RESULTS}}, {{PRIOR_RESULTS}}, {{PAGE_IMAGES_NOTE}}
  response_schema: string;       // JSON schema description for the model
  version: number;
}

// ─── Layer 1: Raw Forensics ────────────────────────────────────────────────

const LAYER_1_CONFIG: PromptConfig = {
  id: "layer_1",
  name: "Layer 1: Raw Forensics",
  layer: 1,
  temperature: 0.1,
  max_output_tokens: 4000,
  version: 1,
  system_instruction: `You are a forensic document analyst with expertise in detecting deception, 
logical fallacies, regulatory compliance, and visual composition in technology vendor and advisory documents. 
The documents you analyze are consulting proposals, vendor pitches, training brochures, whitepapers, 
and advisory decks in the domains of AI, Data & Analytics, Agentic AI, Cloud, Digital Transformation, 
Cybersecurity, and Governance. You are strictly evidence-based. Every finding must reference specific 
text from the document. Never fabricate or assume content that is not present.`,

  prompt_template: `Analyze the following business document. I have already run a heuristic pre-analysis 
that found specific word counts and pattern matches. Use these hard numbers as ground truth, 
then apply your judgment for the scoring and classification tasks.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS (treat as factual) ===
{{HEURISTIC_RESULTS}}

{{PAGE_IMAGES_NOTE}}

Based on the document text, heuristic data, and any page images provided, return a JSON object with these sections:

1. **deception_judgment**: Given the weasel word counts, puffery matches, false urgency phrases, 
   passive voice instances, and jargon detected by the heuristic, score the overall manipulation_index (0-100). 
   Consider not just quantity but severity — a few highly manipulative phrases may score higher than many mild ones.
   Return: { "manipulation_index": number, "rationale": string }

2. **fallacies**: Identify logical fallacies in the document arguments. Look for:
   - Straw Man: misrepresenting opposing views
   - False Dichotomy: presenting only two options when more exist
   - Appeal to Authority: citing authority without evidence
   - Post Hoc: assuming causation from correlation
   - Sunk Cost: justifying continuation based on past investment
   For each, provide the type, a quote from the document as evidence (max 120 chars), and severity (Low/Medium/High).
   Return: { "fallacies": [{ "type": string, "evidence": string, "severity": string }], "fallacy_density": number }
   (fallacy_density = fallacies per 1000 words)

3. **regulatory_judgment**: Given the regulatory, ethical, and privacy keyword matches from the heuristic, 
   assess the overall safety. Identify any red flags where the document proposes activities without 
   appropriate compliance frameworks.
   Return: { "red_flags": [string], "safety_level": "Safe"|"Caution"|"High Risk", "safety_score": number (0-100) }

4. **visual_intensity**: Assess the document's visual richness. If page images were provided, 
   describe what visual elements you see (charts, diagrams, infographics, tables, formatting). 
   If no images, base assessment on text references to visual elements.
   Return: { "score": number (1-10), "diagram_references": number, "formatting_richness": number, "assessment": string }

RESPOND WITH ONLY VALID JSON matching this structure:
{
  "deception_judgment": { "manipulation_index": 0, "rationale": "" },
  "fallacies": { "fallacies": [], "fallacy_density": 0 },
  "regulatory_judgment": { "red_flags": [], "safety_level": "Safe", "safety_score": 0 },
  "visual_intensity": { "score": 0, "diagram_references": 0, "formatting_richness": 0, "assessment": "" }
}`,

  response_schema: `{
  "deception_judgment": { "manipulation_index": number, "rationale": string },
  "fallacies": { "fallacies": [{ "type": string, "evidence": string, "severity": string }], "fallacy_density": number },
  "regulatory_judgment": { "red_flags": [string], "safety_level": string, "safety_score": number },
  "visual_intensity": { "score": number, "diagram_references": number, "formatting_richness": number, "assessment": string }
}`,
};

// ─── Layer 2: Informed Analysis ────────────────────────────────────────────

const LAYER_2_CONFIG: PromptConfig = {
  id: "layer_2",
  name: "Layer 2: Informed Analysis",
  layer: 2,
  temperature: 0.2,
  max_output_tokens: 4000,
  version: 1,
  system_instruction: `You are a strategic document analyst specializing in bias detection, 
technology obsolescence assessment, and implementation readiness evaluation for technology 
vendor and advisory documents — consulting proposals, vendor pitches, training brochures, 
whitepapers, and advisory decks covering AI, Data, Cloud, Digital Transformation, and Governance. 
Use the prior forensic analysis as context to inform deeper judgments. 
Be evidence-based and cite specific patterns from the document.`,

  prompt_template: `Analyze this business document for bias, obsolescence risk, and implementation readiness. 
You have the document text plus results from a prior forensic analysis layer.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== PRIOR ANALYSIS (Layer 1 Results) ===
{{PRIOR_RESULTS}}

Return a JSON object with:

1. **bias_detection**: Identify cognitive biases present in the document:
   - Confirmation: only success stories, no failures
   - Survival: only showcasing successful cases without failed ones
   - Selection: cherry-picking best examples
   - Recency: only recent data with no historical context
   - Authority: relying on authority names without independent evidence
   For each bias found, provide type, evidence quote (max 120 chars), severity (Low/Medium/High).
   Score overall_bias_score 0-100 (higher = more biased).
   Return: { "biases": [{ "type": string, "evidence": string, "severity": string }], "overall_bias_score": number }

2. **obsolescence_risk**: Assess whether the document references outdated technologies or misses 
   current industry practices. Consider:
   - outdated_references: specific outdated tech/practices mentioned
   - missing_current_practices: important current practices NOT mentioned
   - risk_level: Low/Medium/High/Critical
   - risk_score: 0-100
   Return: { "outdated_references": [string], "missing_current_practices": [string], "risk_level": string, "risk_score": number }

3. **implementation_readiness**: Evaluate how actionable the document is:
   - artifact_presence: check for code snippets, configs, checklists, diagrams, templates, API definitions
   - resource_clarity_score (1-10): are roles and resources clearly defined?
   - timeline_reality_score (1-10): are timelines specific and realistic?
   - prerequisite_check_score (1-10): are prerequisites clearly stated?
   - readiness_score (1-10): overall composite
   - verdict: "Theoretical Only" | "Partially Actionable" | "Implementation Ready"
   Return: { "artifact_presence": [{ "name": string, "found": boolean }], "resource_clarity_score": number, "timeline_reality_score": number, "prerequisite_check_score": number, "readiness_score": number, "verdict": string }

RESPOND WITH ONLY VALID JSON matching this structure:
{
  "bias_detection": { "biases": [], "overall_bias_score": 0 },
  "obsolescence_risk": { "outdated_references": [], "missing_current_practices": [], "risk_level": "Low", "risk_score": 0 },
  "implementation_readiness": { "artifact_presence": [], "resource_clarity_score": 0, "timeline_reality_score": 0, "prerequisite_check_score": 0, "readiness_score": 0, "verdict": "" }
}`,

  response_schema: `{
  "bias_detection": { "biases": [{ "type": string, "evidence": string, "severity": string }], "overall_bias_score": number },
  "obsolescence_risk": { "outdated_references": [string], "missing_current_practices": [string], "risk_level": string, "risk_score": number },
  "implementation_readiness": { "artifact_presence": [{ "name": string, "found": boolean }], "resource_clarity_score": number, "timeline_reality_score": number, "prerequisite_check_score": number, "readiness_score": number, "verdict": string }
}`,
};

// ─── Layer 3: Strategic Classification ─────────────────────────────────────

const LAYER_3_CONFIG: PromptConfig = {
  id: "layer_3",
  name: "Layer 3: Strategic Classification",
  layer: 3,
  temperature: 0.25,
  max_output_tokens: 5000,
  version: 1,
  system_instruction: `You are a management consulting analyst who classifies technology vendor 
and advisory documents along strategic dimensions. These documents include consulting proposals, 
vendor pitches, training brochures, whitepapers, and advisory decks in AI, Data, Cloud, 
Digital Transformation, and Governance. You determine who wrote the document, who it targets, 
and how it positions itself in the market. Use all prior analysis as context. 
Provide weighted driver scores (1-10) with clear rationale for each.`,

  prompt_template: `Classify this business document along four strategic dimensions. 
You have the full text, heuristic data, and results from prior analysis layers.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== PRIOR ANALYSIS (Layer 1 + 2 Results) ===
{{PRIOR_RESULTS}}

Return JSON with four classification modules. Each module must have:
- drivers: array of { name, weight (0-1, must sum to 1.0), score (1-10), rationale }
- composite_score: weighted sum of driver scores scaled to 0-100
- confidence: your confidence in the classification (0-100%)
- classification: the label

1. **provider_consumer**: Is this document vendor-favored or consumer-favored?
   Drivers: Problem Definition Clarity, Vendor Lock-in Potential, Implementation Autonomy, Upsell Visibility, Risk Transfer
   Classifications: "Provider-Favored" | "Consumer-Favored" | "Balanced"

2. **company_scale**: What scale of consulting company likely authored this?
   Drivers: Framework Proprietary Level, Data Scope & Depth, Design Polish & Branding, Service Breadth, Legal/Compliance Density
   Classifications: "Solo/Boutique" | "Mid-tier" | "Big 4/GSI"

3. **target_scale**: What scale of company is the target audience?
   Drivers: Governance Complexity, Cross-Functional Impact, Legacy Integration Focus, Budget/Resource Implication, Risk & Security Standards
   Classifications: "Startup" | "SME" | "Enterprise"

4. **audience_level**: What seniority level is the intended audience?
   Drivers: Strategic vs. Tactical Ratio, Financial Metric Density, Technical Jargon Density, Actionable Horizon, Decision Scope
   Classifications: "Developer" | "Manager" | "VP" | "C-Suite"

RESPOND WITH ONLY VALID JSON:
{
  "provider_consumer": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "company_scale": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "target_scale": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "audience_level": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" }
}`,

  response_schema: `Each module: { drivers: [{ name: string, weight: number, score: number, rationale: string }], composite_score: number, confidence: number, classification: string }`,
};

// ─── Layer 4: Synthesis ────────────────────────────────────────────────────

const LAYER_4_CONFIG: PromptConfig = {
  id: "layer_4",
  name: "Layer 4: Synthesis",
  layer: 4,
  temperature: 0.3,
  max_output_tokens: 5000,
  version: 1,
  system_instruction: `You are a senior analyst synthesizing the complete forensic analysis 
of a technology vendor or advisory document — such as a consulting proposal, vendor pitch, 
training brochure, whitepaper, or advisory deck in the domains of AI, Data, Cloud, 
Digital Transformation, or Governance. You have access to all prior layers of analysis. 
Your job is to provide the final meta-judgments: hype assessment, uniqueness scoring, 
key findings extraction, overall trust score, and an executive summary.
Be insightful but factual. Cite evidence for every claim.`,

  prompt_template: `Provide the final synthesis for this document analysis. 
You have everything: the document text, heuristic metrics, and all prior layer results.

=== DOCUMENT TEXT ===
{{DOCUMENT_TEXT}}

=== HEURISTIC PRE-ANALYSIS ===
{{HEURISTIC_RESULTS}}

=== ALL PRIOR ANALYSIS (Layer 1 + 2 + 3) ===
{{PRIOR_RESULTS}}

Return JSON with:

1. **hype_reality**: Is this document balanced, optimistic, or sales propaganda?
   - positive_sentiment_pct: percentage of positive vs negative sentiment (0-100)
   - risk_mentions: count of risk/challenge/limitation mentions
   - failure_acknowledgments: count of failure/what-could-go-wrong mentions
   - balance_assessment: one-sentence assessment
   - hype_score: 0-100 (higher = more hype)
   - classification: "Balanced Analysis" | "Optimistic" | "Sales Propaganda"

2. **rarity_index**: How unique is this document's content?
   Drivers (each with name, weight summing to 1.0, score 1-10, rationale):
   - Primary Data Source, Contrarian Factor, Framework Novelty, Predictive Specificity, Case Study Transparency
   - composite_score: 0-100
   - confidence: 0-100
   - classification: "Commodity" | "Differentiated" | "Category-Defining"

3. **amazing_facts**: Extract 3-5 genuinely surprising or noteworthy findings. 
   These should be things a reader would want to highlight or discuss.
   Each: { "fact": string (max 200 chars), "why_amazing": string, "is_contrarian": boolean, "is_quantified": boolean }

4. **overall_trust_score**: A single score 0-100 representing how trustworthy and 
   valuable this document is, considering all analysis dimensions.

5. **summary**: An executive summary of the analysis in 200-300 words. 
   Cover: who wrote it, who it targets, key strengths, key red flags, 
   overall verdict. Be concise and actionable.

RESPOND WITH ONLY VALID JSON:
{
  "hype_reality": { "positive_sentiment_pct": 0, "risk_mentions": 0, "failure_acknowledgments": 0, "balance_assessment": "", "hype_score": 0, "classification": "" },
  "rarity_index": { "drivers": [...], "composite_score": 0, "confidence": 0, "classification": "" },
  "amazing_facts": [],
  "overall_trust_score": 0,
  "summary": ""
}`,

  response_schema: `{
  "hype_reality": { "positive_sentiment_pct": number, "risk_mentions": number, "failure_acknowledgments": number, "balance_assessment": string, "hype_score": number, "classification": string },
  "rarity_index": { "drivers": [{ "name": string, "weight": number, "score": number, "rationale": string }], "composite_score": number, "confidence": number, "classification": string },
  "amazing_facts": [{ "fact": string, "why_amazing": string, "is_contrarian": boolean, "is_quantified": boolean }],
  "overall_trust_score": number,
  "summary": string
}`,
};

// ─── Layer 5: PDF Highlight Curation ─────────────────────────────────────

const LAYER_5_CONFIG: PromptConfig = {
  id: "layer_5",
  name: "Layer 5: PDF Highlight Curation",
  layer: 5,
  temperature: 0.4,
  max_output_tokens: 2000,
  version: 1,
  system_instruction: `You are a content strategist who creates punchy, share-worthy executive summaries 
from forensic document analysis reports. Your output will be used to generate a PDF highlight reel 
that people upload to LinkedIn as a carousel post. Every slide needs to stop the scroll — 
use strong, specific language with numbers. Avoid generic statements. 
Write like a senior analyst briefing a busy executive, not like a textbook.`,

  prompt_template: `You have the COMPLETE analysis results for a document. Your job is to pick the 
most attention-grabbing, share-worthy findings and write them up as a highlight reel.

=== ANALYSIS RESULTS (all layers) ===
{{PRIOR_RESULTS}}

Create a JSON object with:

1. **headline**: A catchy one-liner for the PDF cover page. Include the trust score number. 
   Make it specific to THIS document — not generic. Max 120 characters.
   Examples of good headlines:
   - "Trust Score 34/100 — Heavy manipulation detected in this AI consulting pitch"
   - "This whitepaper scores 78/100 but hides 3 critical biases"
   - "Category-Defining content buried under Sales Propaganda tactics"

2. **hook_findings**: An array of 6-8 findings, ranked by how attention-grabbing they are. 
   Each finding becomes one slide in the PDF carousel. For each:
   - **section**: which analysis area (e.g. "manipulation", "hype", "bias", "fallacy", 
     "implementation", "obsolescence", "regulatory", "finding", "uniqueness", "fluff")
   - **title**: Bold headline for the slide (max 60 chars). Include the score/number.
   - **insight**: 1-2 sentence explanation that makes the reader want to see more. 
     Be specific — quote evidence, name the exact bias type, cite the exact number.
     Max 200 characters.
   - **hook_score**: 1-10 rating of how share-worthy this finding is. 
     Score higher: surprising numbers, red flags, contradictions, extreme scores.
     Score lower: neutral findings, expected results, generic observations.

IMPORTANT RULES:
- Prioritize findings with extreme scores (very high or very low)
- Prioritize contradictions (e.g. high trust but high manipulation)
- Include at least one finding from forensics (deception/fallacies/fluff)
- Include at least one finding from the strategic modules
- Include the most striking amazing_fact if one exists
- DO NOT include generic observations — every insight must reference a specific number or evidence
- Sort hook_findings by hook_score descending (most catchy first)

RESPOND WITH ONLY VALID JSON:
{
  "headline": "",
  "hook_findings": [
    { "section": "", "title": "", "insight": "", "hook_score": 0 }
  ]
}`,

  response_schema: `{
  "headline": string,
  "hook_findings": [{ "section": string, "title": string, "insight": string, "hook_score": number }]
}`,
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_PROMPT_CONFIGS: PromptConfig[] = [
  LAYER_1_CONFIG,
  LAYER_2_CONFIG,
  LAYER_3_CONFIG,
  LAYER_4_CONFIG,
  LAYER_5_CONFIG,
];

export function getConfigByLayer(layer: number): PromptConfig | undefined {
  return DEFAULT_PROMPT_CONFIGS.find((c) => c.layer === layer);
}
