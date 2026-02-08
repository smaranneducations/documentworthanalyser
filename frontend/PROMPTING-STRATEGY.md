# Gemini Prompting Strategy — DocDetector

This document describes the full architecture for integrating Google Gemini 1.5 Flash into DocDetector's document analysis pipeline, replacing and augmenting the current heuristic engine.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Hybrid Approach: Heuristic + Gemini](#hybrid-approach-heuristic--gemini)
3. [Execution Layers & Dependency Graph](#execution-layers--dependency-graph)
4. [Prompt Config Store (Firestore)](#prompt-config-store-firestore)
5. [Prompt Assembly at Runtime](#prompt-assembly-at-runtime)
6. [Temperature Strategy](#temperature-strategy)
7. [KPI-by-KPI Breakdown](#kpi-by-kpi-breakdown)
8. [Call Grouping Strategy](#call-grouping-strategy)
9. [Visual & Multimodal Analysis](#visual--multimodal-analysis)
10. [Error Handling & Fallback](#error-handling--fallback)
11. [Cost Estimation](#cost-estimation)
12. [Future: Migration to Vertex AI](#future-migration-to-vertex-ai)

---

## Architecture Overview

```
Document uploaded by user
         │
         ▼
   Extract text (pdfjs-dist)
   Convert pages to images (for multimodal)
         │
         ▼
   ┌─────────────────────────────────────┐
   │  HEURISTIC ENGINE (instant, free)   │
   │  Runs locally in browser            │
   │  Handles counting & pattern-match   │
   └─────────────────────────────────────┘
         │ Hard numbers ready (~100ms)
         ▼
   ┌─────────────────────────────────────┐
   │  GEMINI API (4 layered calls)       │
   │  Handles judgment & classification  │
   │  Each layer feeds the next          │
   └─────────────────────────────────────┘
         │ Full analysis ready (~6-8s)
         ▼
   Merge results → AnalysisResult JSON
   Save to Firestore
```

The heuristic engine does NOT go away. It becomes the foundation layer that feeds hard numbers (word counts, ratios, keyword matches) into Gemini so Gemini can focus on what it's good at: judgment, classification, and narrative.

---

## Hybrid Approach: Heuristic + Gemini

### Fully Heuristic (No Gemini Needed)

These KPIs are pure counting/pattern-matching. Gemini adds no value — just cost and latency.

| KPI | Why Heuristic Wins |
|-----|-------------------|
| **Fluff Index** | Fog index is a math formula (syllables, sentence length). Adjective/verb ratio is counting. Buzzword count is dictionary lookup. |
| **Data Intensity** | Counting tables, citations, statistics, numbers. Regex is more accurate than asking Gemini "how many statistics are there?" |

### Hybrid (Heuristic Counts + Gemini Judgment)

The heuristic provides raw counts; Gemini interprets them.

| KPI | Heuristic Provides | Gemini Provides |
|-----|-------------------|-----------------|
| **Deception Detection** | Weasel word counts, passive voice instances, false urgency phrases, puffery matches | `manipulation_index` score (0-100) with judgment rationale |
| **Regulatory & Ethics** | Keyword matches for GDPR, SOC 2, HIPAA, ISO, privacy terms | `safety_level` classification, `red_flags` identification |

### Fully Gemini (Heuristic Can't Do This)

| KPI | Why Gemini is Essential |
|-----|------------------------|
| **Logical Fallacies** | Requires understanding argument logic, not keyword matching |
| **Bias Detection** | Requires understanding what evidence is being selectively presented |
| **Provider vs Consumer** | Requires understanding vendor favoritism intent |
| **Company Scale** | Requires recognizing tone, structure, branding patterns |
| **Target Company Scale** | Requires understanding governance complexity signals |
| **Audience Level** | Requires understanding conceptual level beyond jargon density |
| **Rarity Index** | Requires comparison against general industry knowledge |
| **Hype vs Reality** | Requires understanding nuance and what realistic analysis looks like |
| **Key Findings** | Requires comprehension of what's genuinely surprising |
| **Obsolescence Risk** | Requires knowledge of current industry practices |
| **Implementation Readiness** | Requires understanding whether artifacts are real guides or vague hand-waving |
| **Overall Summary** | Narrative generation — only an LLM can write coherent summaries |
| **Visual Intensity** | Multimodal — Gemini can see charts/diagrams in page images that text extraction misses |

---

## Execution Layers & Dependency Graph

KPIs are NOT independent. Some answers feed into others. The execution is organized in 4 layers where each layer's results are injected into the next layer's prompts.

### Layer 0 — Heuristic Pre-Pass (No Gemini, instant)

```
  Fluff Index           → fully heuristic (fog index, buzzwords, ratios)
  Data Intensity        → fully heuristic (tables, citations, statistics count)
  Deception (raw)       → word lists + regex (weasel words, passive voice, puffery)
  Regulatory (raw)      → keyword matching (GDPR, SOC2, HIPAA mentions)
```

### Layer 1 — Raw Forensics (Gemini Call 1)

**Depends on:** Layer 0 heuristic results
**Temperature:** 0.1

```
  Input: document text + heuristic counts from Layer 0 + page images
  Returns:
    • Deception: manipulation_index (judgment score based on heuristic counts)
    • Logical Fallacies (full detection — type, evidence, severity)
    • Regulatory: safety_level + red_flags (judgment on top of keyword matches)
    • Visual Intensity (multimodal — Gemini sees the actual page images)
```

### Layer 2 — Informed Analysis (Gemini Call 2)

**Depends on:** Layer 0 + Layer 1
**Temperature:** 0.2

```
  Input: document text + ALL prior results
  Returns:
    • Bias Detection (informed by fallacies + deception)
    • Obsolescence Risk (informed by data intensity + references found)
    • Implementation Readiness (informed by data intensity + visual artifacts)
```

### Layer 3 — Strategic Classification (Gemini Call 3)

**Depends on:** Layer 0 + Layer 1 + Layer 2
**Temperature:** 0.25

```
  Input: document text + ALL prior results
  Returns:
    • Provider vs Consumer (informed by deception, bias, fluff)
    • Company Scale (informed by fluff, data intensity, regulatory)
    • Target Company Scale (informed by data intensity, regulatory)
    • Audience Level (informed by fluff, data intensity, deception)
```

### Layer 4 — Synthesis (Gemini Call 4)

**Depends on:** Everything
**Temperature:** 0.3

```
  Input: document text + ALL prior results
  Returns:
    • Hype vs Reality (meta-judgment across all findings)
    • Rarity Index (uniqueness given all context)
    • Key Findings / Amazing Facts (genuinely surprising discoveries)
    • Overall Trust Score (weighted synthesis)
    • Summary (300-word narrative)
```

### Dependency Visualization

```
Layer 0 (Heuristic)     Layer 1 (Gemini)      Layer 2 (Gemini)       Layer 3 (Gemini)       Layer 4 (Gemini)
─────────────────       ────────────────      ────────────────       ────────────────       ────────────────
Fluff Index ──────────► Fallacies ──────────► Bias Detection ──────► Provider/Consumer ───► Hype vs Reality
Data Intensity ───────► Deception Index ────► Obsolescence ────────► Company Scale ────────► Rarity Index
Deception (counts) ───► Regulatory Safety ──► Implementation ──────► Target Scale ─────────► Key Findings
Regulatory (mentions)─► Visual Intensity                             Audience Level ────────► Trust Score
                                                                                             Summary
```

---

## Prompt Config Store (Firestore)

Each KPI group gets a document in the `prompt_configs` collection in Firestore. This allows prompt tuning without redeploying.

### Schema: `prompt_configs/{layer_id}`

```
prompt_configs/layer_1
  ├─ name                 (string)     "Layer 1: Raw Forensics"
  ├─ layer                (number)     1
  ├─ depends_on           (string[])   ["heuristic"]
  ├─ system_instruction   (string)     "You are a forensic document analyst specializing in..."
  ├─ factuality           (string)     "Be strictly evidence-based. Every claim must cite a specific phrase from the document."
  ├─ prompt_template      (string)     "Given the document text and the heuristic pre-analysis below, perform the following analyses..."
  ├─ keywords             (map)        { fallacies: [...], deception: [...], regulatory: [...] }
  ├─ temperature          (number)     0.1
  ├─ max_output_tokens    (number)     4000
  ├─ response_schema      (string)     "{ deception: { manipulation_index: number, ... }, fallacies: { ... }, ... }"
  ├─ scoring_rubrics      (map)        { manipulation_index: "0=no deception, 100=extremely manipulative...", ... }
  ├─ inject_prior_results (string[])   ["heuristic"]
  └─ version              (number)     1
```

### Why Firestore (Not Hardcoded)

1. **Tweak prompts without redeploying** — Change temperature, add keywords, refine rubrics. Next analysis uses updated config instantly.
2. **Prompt versioning** — `version` field tracks which prompt generated which result. Critical for debugging score changes.
3. **A/B testing** — Store two versions, randomly pick one, compare results.
4. **RAG-ready** — When migrating to Vertex AI, prompt configs become the retrieval-augmented context source.

---

## Prompt Assembly at Runtime

When it's time to query Gemini for a layer, the prompt is assembled from the Firestore config:

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM: {system_instruction from Firestore}             │
│ "You are a forensic document analyst specializing       │
│  in business document analysis..."                      │
├─────────────────────────────────────────────────────────┤
│ INSTRUCTIONS:                                           │
│ {factuality from Firestore}                             │
│ "Be strictly evidence-based. Cite specific phrases."    │
├─────────────────────────────────────────────────────────┤
│ DOCUMENT TEXT:                                          │
│ {extracted text from PDF — truncated to fit context}    │
├─────────────────────────────────────────────────────────┤
│ PAGE IMAGES: (for multimodal layers)                    │
│ {PDF pages as images — for visual analysis}             │
├─────────────────────────────────────────────────────────┤
│ PRIOR ANALYSIS CONTEXT:                                 │
│ {JSON results from prior layers as specified by         │
│  inject_prior_results}                                  │
├─────────────────────────────────────────────────────────┤
│ KEYWORDS TO CONSIDER:                                   │
│ {keywords map from Firestore}                           │
├─────────────────────────────────────────────────────────┤
│ SCORING RUBRICS:                                        │
│ {scoring_rubrics map from Firestore}                    │
├─────────────────────────────────────────────────────────┤
│ RESPOND IN THIS EXACT JSON FORMAT:                      │
│ {response_schema from Firestore}                        │
└─────────────────────────────────────────────────────────┘
```

The `inject_prior_results` field tells the assembler which completed layer results to include in the prompt context.

---

## Temperature Strategy

| Layer | Temperature | KPIs | Rationale |
|-------|-------------|------|-----------|
| 0 | N/A | Fluff, Data Intensity, raw counts | Heuristic — deterministic, no LLM |
| 1 | 0.1 | Fallacies, Deception Index, Regulatory, Visual | Factual extraction, want high consistency |
| 2 | 0.2 | Bias, Obsolescence, Implementation | Some interpretation needed but should be stable |
| 3 | 0.25 | Provider/Consumer, Company Scale, Target Scale, Audience | Classification judgments — slight creativity helps |
| 4 | 0.3 | Hype/Reality, Rarity, Key Findings, Trust Score, Summary | Creative synthesis, want interesting insights |

Lower temperature = more deterministic, same document always gets similar scores.
Higher temperature = more creative, better for narrative and insight generation.

---

## KPI-by-KPI Breakdown

### Fully Heuristic KPIs

#### Fluff Index
- **Engine:** Heuristic only
- **Metrics:** Gunning Fog index (math formula), adjective/verb ratio (POS counting), buzzword count (dictionary), action verb count (dictionary), unique data points (regex)
- **Dictionary maintenance:** Run `utility/update-dictionaries.mjs` periodically to refresh buzzword and action verb lists via Gemini

#### Data Intensity
- **Engine:** Heuristic only
- **Metrics:** Tables detected (regex for tabular patterns), citations (regex for reference patterns), statistics (number + % patterns)
- **Dictionary maintenance:** Minimal — patterns are structural, not vocabulary-dependent

### Hybrid KPIs

#### Deception Detection
- **Heuristic provides:** `weasel_words` (array with counts), `percentage_puffery` (matched phrases), `false_urgency` (matched phrases), `passive_voice_instances` (matched), `jargon_masking` (matched)
- **Gemini provides:** `manipulation_index` (0-100 judgment score). Gemini sees the raw counts AND the actual matched phrases, then makes a holistic judgment about how manipulative the document is overall.

#### Regulatory & Ethical Safety
- **Heuristic provides:** `regulatory_mentions` (GDPR, SOC2, etc.), `ethical_mentions`, `privacy_mentions`
- **Gemini provides:** `red_flags` (contextual — is the mention positive compliance or concerning avoidance?), `safety_level` (Safe/Caution/High Risk), `safety_score` (0-100)

### Fully Gemini KPIs

#### Logical Fallacies
- **Why Gemini:** "Is this a straw man argument?" requires understanding argument structure, not keyword matching
- **Output:** Array of `{ type, evidence, severity }` + `fallacy_density` per 1000 words

#### Bias Detection
- **Why Gemini:** Identifying confirmation bias vs survival bias requires understanding what evidence is being selectively presented
- **Injected context:** Deception results + Fallacy results (biases often correlate with fallacies)
- **Output:** Array of `{ type, evidence, severity }` + `overall_bias_score` (0-100)

#### Visual Intensity (Multimodal)
- **Why Gemini:** Text extraction misses captionless charts, infographics, diagrams. Gemini 1.5 Flash can see page images.
- **Input:** PDF pages converted to images
- **Output:** `score` (1-10), `diagram_references`, `formatting_richness`, `assessment`

#### Provider vs Consumer
- **Why Gemini:** Understanding vendor favoritism requires reading between the lines
- **Injected context:** Deception + Bias + Fluff results
- **Output:** `classification` (Provider-Favored/Consumer-Favored/Balanced), drivers with scores, composite score, confidence

#### Company Scale / Target Scale / Audience Level
- **Why Gemini:** Classification based on tone, structure, and conceptual sophistication
- **Injected context:** Fluff + Data Intensity + Regulatory results
- **Output:** Classification + drivers + composite score + confidence for each

#### Hype vs Reality
- **Why Gemini:** Meta-judgment requiring all prior context
- **Injected context:** ALL prior layer results
- **Output:** `classification` (Balanced/Optimistic/Sales Propaganda), `hype_score`, `balance_assessment`

#### Rarity Index
- **Why Gemini:** Requires comparison against general industry knowledge
- **Injected context:** ALL prior results
- **Output:** `classification` (Commodity/Differentiated/Category-Defining), drivers, composite score

#### Key Findings / Amazing Facts
- **Why Gemini:** Current heuristic just picks sentences with numbers — flags garbled PDF data as "findings". Gemini actually understands what's surprising.
- **Injected context:** ALL prior results
- **Output:** Array of `{ fact, why_amazing, is_contrarian, is_quantified }`

#### Overall Trust Score & Summary
- **Why Gemini:** Weighted synthesis of all KPIs into a single score + coherent narrative
- **Injected context:** ALL results
- **Output:** `overall_trust_score` (0-100), `summary` (max 300 words)

---

## Call Grouping Strategy

To stay within Gemini free tier (15 RPM) while maintaining quality:

| Call | Layer | KPIs | Temperature | Rationale for Grouping |
|------|-------|------|-------------|----------------------|
| 1 | 1 | Deception Index + Fallacies + Regulatory Safety + Visual Intensity | 0.1 | All are "find patterns in this document" — factual extraction |
| 2 | 2 | Bias Detection + Obsolescence Risk + Implementation Readiness | 0.2 | All are "what's wrong/missing" — informed analysis |
| 3 | 3 | Provider/Consumer + Company Scale + Target Scale + Audience Level | 0.25 | All are "classify this document" — strategic judgment |
| 4 | 4 | Hype/Reality + Rarity + Key Findings + Trust Score + Summary | 0.3 | All are "synthesize everything" — creative output |

**Total: 4 Gemini calls per document** — well within free tier limits.

---

## Visual & Multimodal Analysis

### The Problem
`pdfjs-dist` extracts text only. A PDF with 15 infographics but no captions gets Visual Intensity: 1/10.

### The Solution
Gemini 1.5 Flash is multimodal. We send PDF pages as images alongside the text.

### Implementation
1. Convert PDF pages to images (canvas rendering via pdfjs-dist)
2. Send first N pages as image parts in the Gemini call (Layer 1)
3. Gemini visually inspects for charts, diagrams, infographics, formatting richness
4. Returns visual intensity score based on what it actually sees

### Token Cost
Images are ~260 tokens per 256x256 tile. A typical PDF page at reasonable resolution is ~4-8 tiles = ~1000-2000 tokens per page. For a 20-page document, that's ~20K-40K additional input tokens — significant but manageable.

### Optimization
- Only send first 10 pages for visual assessment (diminishing returns beyond that)
- Use lower resolution (768px width) to reduce tile count
- Only include images in Layer 1 call (visual intensity), not in subsequent layers

---

## Error Handling & Fallback

| Scenario | Strategy |
|----------|----------|
| Gemini API returns malformed JSON | Retry once with stricter format instructions. If still fails, fall back to heuristic results for that layer. |
| Gemini API rate limit (429) | Exponential backoff with 3 retries. If exhausted, fall back to full heuristic analysis. |
| Gemini API timeout | 30-second timeout per call. On timeout, fall back to heuristic for that layer. |
| Gemini API key invalid/expired | Detect on first call, show user-friendly error, use full heuristic as fallback. |
| Partial layer failure | If one KPI in a grouped call fails to parse, use heuristic for that specific KPI, keep the rest from Gemini. |

**Critical principle:** The app must NEVER show a blank report. Heuristic analysis is always the safety net. Gemini enhances; heuristic is the floor.

---

## Cost Estimation

### Per Document (Gemini 1.5 Flash)

| Component | Input Tokens | Output Tokens | Cost |
|-----------|-------------|---------------|------|
| Layer 1 (text + images + heuristic context) | ~15,000 | ~2,000 | ~$0.002 |
| Layer 2 (text + prior results) | ~12,000 | ~2,000 | ~$0.001 |
| Layer 3 (text + prior results) | ~14,000 | ~2,000 | ~$0.002 |
| Layer 4 (text + all results) | ~16,000 | ~3,000 | ~$0.002 |
| **Total per document** | **~57,000** | **~9,000** | **~$0.007** |

At $0.007 per document:
- 100 documents/month = ~$0.70
- 1,000 documents/month = ~$7.00
- 10,000 documents/month = ~$70.00

### Free Tier
- 15 requests per minute, 1 million tokens per minute
- At 4 calls per document, you can analyze ~3-4 documents per minute on free tier
- Sufficient for development and early production

---

## Future: Migration to Vertex AI

When document volume or RAG requirements justify the move:

### What Stays the Same
- All prompts (portable between Gemini API and Vertex AI Gemini)
- Response parsing logic
- Firestore prompt config store
- Frontend code (dashboard, comments, everything)
- Heuristic engine

### What Changes
- **SDK:** `@google/generativeai` → `@google-cloud/vertexai` (~half day)
- **Auth:** API key → Service account + IAM roles (~half day to 2 days)
- **Backend:** Client-side calls → Cloud Functions middleware (~1-2 days)
- **RAG:** New build using Vertex AI Search (~1-2 weeks)

### Total Migration Effort: ~3-4 days (excluding RAG)

The prompt configs in Firestore make this easier — the prompts, temperatures, rubrics, and schemas all transfer directly. Only the transport layer changes.
