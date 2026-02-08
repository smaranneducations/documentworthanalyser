// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive Type Definitions for AI-Powered Agentic Document Analyzer
// ═══════════════════════════════════════════════════════════════════════════

// ── Weighted Driver (shared across all modules) ─────────────────────────
export interface WeightedDriver {
  name: string;
  weight: number;       // 0-1 (percentage as decimal)
  score: number;        // 1-10
  rationale: string;    // Explanation for the score
}

export interface ModuleResult {
  drivers: WeightedDriver[];
  composite_score: number;  // Weighted composite 0-100
  confidence: number;       // 0-100%
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 1: Service Provider vs. Consumer Suitability
// ═══════════════════════════════════════════════════════════════════════════
export interface ProviderConsumerModule extends ModuleResult {
  classification: "Provider-Favored" | "Consumer-Favored" | "Balanced";
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 2: Consulting Company Scale Detection
// ═══════════════════════════════════════════════════════════════════════════
export interface CompanyScaleModule extends ModuleResult {
  classification: "Solo/Boutique" | "Mid-tier" | "Big 4/GSI";
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 3: Target Company Scale Analysis
// ═══════════════════════════════════════════════════════════════════════════
export interface TargetScaleModule extends ModuleResult {
  classification: "Startup" | "SME" | "Enterprise";
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 4: Target Audience Level Assessment
// ═══════════════════════════════════════════════════════════════════════════
export interface AudienceLevelModule extends ModuleResult {
  classification: "Developer" | "Manager" | "VP" | "C-Suite";
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5: Rarity Index (Uniqueness Scoring)
// ═══════════════════════════════════════════════════════════════════════════
export interface RarityIndexModule extends ModuleResult {
  classification: "Commodity" | "Differentiated" | "Category-Defining";
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT FORENSICS
// ═══════════════════════════════════════════════════════════════════════════

export interface DeceptionDetection {
  weasel_words: { word: string; count: number }[];
  percentage_puffery: string[];       // "300% growth" etc
  false_urgency: string[];            // "window is closing" etc
  passive_voice_instances: string[];
  jargon_masking: string[];
  manipulation_index: number;         // 0-100
  manipulation_rationale?: string;    // Gemini's explanation of manipulation severity
}

export interface LogicalFallacy {
  type: "Straw Man" | "False Dichotomy" | "Appeal to Authority" | "Post Hoc" | "Sunk Cost" | "Other";
  evidence: string;
  severity: "Low" | "Medium" | "High";
}

export interface FallacyDetection {
  fallacies: LogicalFallacy[];
  fallacy_density: number;   // per 1000 words
}

export interface FluffIndex {
  fog_index: number;              // Gunning Fog
  adjective_verb_ratio: number;
  unique_data_points: number;
  fluff_score: number;            // 0-100
  buzzword_count: number;
  action_verb_count: number;
}

export interface ContentForensicsResult {
  deception: DeceptionDetection;
  fallacies: FallacyDetection;
  fluff: FluffIndex;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED ENHANCEMENT MODULES
// ═══════════════════════════════════════════════════════════════════════════

export interface ImplementationReadiness {
  artifact_presence: { name: string; found: boolean }[];
  resource_clarity_score: number;    // 1-10
  timeline_reality_score: number;    // 1-10
  prerequisite_check_score: number;  // 1-10
  readiness_score: number;           // 1-10 composite
  verdict: "Theoretical Only" | "Partially Actionable" | "Implementation Ready";
}

export interface ObsolescenceRisk {
  outdated_references: string[];
  missing_current_practices: string[];
  risk_level: "Low" | "Medium" | "High" | "Critical";
  risk_score: number;  // 0-100
}

export interface HypeReality {
  positive_sentiment_pct: number;
  risk_mentions: number;
  failure_acknowledgments: number;
  balance_assessment: string;
  hype_score: number;    // 0-100
  classification: "Balanced Analysis" | "Optimistic" | "Sales Propaganda";
}

export interface RegulatoryEthicalSafety {
  regulatory_mentions: string[];
  ethical_mentions: string[];
  privacy_mentions: string[];
  red_flags: string[];
  safety_level: "Safe" | "Caution" | "High Risk";
  safety_score: number;  // 0-100
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL & DATA INTENSITY
// ═══════════════════════════════════════════════════════════════════════════

export interface VisualIntensity {
  score: number;          // 1-10
  diagram_references: number;
  formatting_richness: number;
  assessment: string;
}

export interface DataIntensity {
  score: number;          // 1-10
  tables_detected: number;
  citations_detected: number;
  statistics_detected: number;
  assessment: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// BIAS DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export interface BiasInstance {
  type: "Confirmation" | "Survival" | "Selection" | "Recency" | "Authority";
  evidence: string;
  severity: "Low" | "Medium" | "High";
}

export interface BiasDetection {
  biases: BiasInstance[];
  overall_bias_score: number;  // 0-100 (higher = more biased)
}

// ═══════════════════════════════════════════════════════════════════════════
// AMAZING FACTS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export interface AmazingFact {
  fact: string;
  why_amazing: string;
  is_contrarian: boolean;
  is_quantified: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE ANALYSIS RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalysisResult {
  // Overall
  overall_trust_score: number;   // 0-100
  summary: string;

  // 5 Core Decision Modules
  provider_consumer: ProviderConsumerModule;
  company_scale: CompanyScaleModule;
  target_scale: TargetScaleModule;
  audience_level: AudienceLevelModule;
  rarity_index: RarityIndexModule;

  // Content Forensics
  forensics: ContentForensicsResult;

  // Advanced Enhancement
  implementation_readiness: ImplementationReadiness;
  obsolescence_risk: ObsolescenceRisk;
  hype_reality: HypeReality;
  regulatory_safety: RegulatoryEthicalSafety;

  // Composition
  visual_intensity: VisualIntensity;
  data_intensity: DataIntensity;

  // Bias & Insights
  bias_detection: BiasDetection;
  amazing_facts: AmazingFact[];
}

export interface AnalysisDoc {
  id: string;
  file_hash: string;
  filename: string;
  uploaded_at: Date;
  analysis_result: AnalysisResult;
}

export interface CommentDoc {
  id: string;
  user_name: string;
  text: string;
  section_reference: string;
  timestamp: Date;
  likes: number;
  dislikes: number;
}
