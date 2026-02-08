import type { AnalysisDoc, AnalysisResult, CommentDoc } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// MOCK ANALYSIS 1 — Vendor-biased proposal (low trust)
// ═══════════════════════════════════════════════════════════════════════════

export const sampleResult1: AnalysisResult = {
  overall_trust_score: 34,
  summary:
    "This document appears vendor-centric (Provider-Favored, 78% confidence), suggesting it primarily serves the service provider's interests. Content forensics detected a high manipulation index of 52/100 with 12 types of weasel words. Implementation readiness: Theoretical Only (score: 3/10). Content uniqueness: Commodity (28/100). Targeted at VP-level audience within Enterprise-scale organizations.",

  provider_consumer: {
    drivers: [
      { name: "Problem Definition Clarity", weight: 0.20, score: 3, rationale: "Frames external help requirement — 7 vendor-dependency vs 1 internal capability mentions" },
      { name: "Vendor Lock-in Potential", weight: 0.20, score: 2, rationale: "5 lock-in vs 0 open terms detected" },
      { name: "Implementation Autonomy", weight: 0.20, score: 3, rationale: "3 client-focus vs 14 vendor-focus references" },
      { name: "Upsell Visibility", weight: 0.20, score: 2, rationale: "8 upsell patterns detected (density: 24.1/10k words)" },
      { name: "Risk Transfer", weight: 0.20, score: 4, rationale: "Risk transferred to client" },
    ],
    composite_score: 28,
    confidence: 78,
    classification: "Provider-Favored",
  },

  company_scale: {
    drivers: [
      { name: "Framework Proprietary Level", weight: 0.30, score: 6, rationale: "2 proprietary vs 1 generic frameworks" },
      { name: "Data Scope & Depth", weight: 0.20, score: 4, rationale: "0 primary research, 5 secondary citations" },
      { name: "Design Polish & Branding", weight: 0.15, score: 6, rationale: "2 branding/legal markers detected" },
      { name: "Service Breadth", weight: 0.15, score: 8, rationale: "6 breadth vs 1 niche indicators" },
      { name: "Legal/Compliance Density", weight: 0.20, score: 6, rationale: "2 legal/compliance terms found" },
    ],
    composite_score: 59,
    confidence: 68,
    classification: "Mid-tier",
  },

  target_scale: {
    drivers: [
      { name: "Governance Complexity", weight: 0.25, score: 9, rationale: "7 governance terms detected" },
      { name: "Cross-Functional Impact", weight: 0.20, score: 8, rationale: "6 cross-functional vs 2 single-dept references" },
      { name: "Legacy Integration Focus", weight: 0.20, score: 9, rationale: "8 legacy vs 0 greenfield terms" },
      { name: "Budget/Resource Implication", weight: 0.15, score: 8, rationale: "4 enterprise-budget vs 0 small-budget indicators" },
      { name: "Risk & Security Standards", weight: 0.20, score: 6, rationale: "3 security/compliance terms found" },
    ],
    composite_score: 81,
    confidence: 82,
    classification: "Enterprise",
  },

  audience_level: {
    drivers: [
      { name: "Strategic vs. Tactical Ratio", weight: 0.30, score: 7, rationale: "12 strategic vs 3 tactical terms (80%)" },
      { name: "Financial Metric Density", weight: 0.20, score: 7, rationale: "9 financial metrics (density: 27.1/10k words)" },
      { name: "Technical Jargon Density", weight: 0.20, score: 6, rationale: "5 technical terms (density: 15.1/10k words)" },
      { name: "Actionable Horizon", weight: 0.15, score: 9, rationale: "1 immediate vs 6 long-term references" },
      { name: "Decision Scope", weight: 0.15, score: 7, rationale: "3 business-level vs 1 tool-level decisions" },
    ],
    composite_score: 71,
    confidence: 72,
    classification: "VP",
  },

  rarity_index: {
    drivers: [
      { name: "Primary Data Source", weight: 0.25, score: 2, rationale: "0 primary vs 8 secondary data references" },
      { name: "Contrarian Factor", weight: 0.25, score: 3, rationale: "1 contrarian vs 5 hype-aligned statements" },
      { name: "Framework Novelty", weight: 0.20, score: 3, rationale: "0 novel vs 3 standard frameworks" },
      { name: "Predictive Specificity", weight: 0.15, score: 2, rationale: "1 specific vs 4 vague predictions" },
      { name: "Case Study Transparency", weight: 0.15, score: 3, rationale: "0 named vs 3 anonymous case studies" },
    ],
    composite_score: 26,
    confidence: 65,
    classification: "Commodity",
  },

  forensics: {
    deception: {
      weasel_words: [
        { word: "arguably", count: 3 }, { word: "virtually", count: 5 },
        { word: "up to", count: 4 }, { word: "may contribute", count: 2 },
        { word: "in some cases", count: 3 }, { word: "generally", count: 6 },
        { word: "typically", count: 4 }, { word: "tends to", count: 2 },
        { word: "appears to", count: 3 }, { word: "somewhat", count: 2 },
        { word: "relatively", count: 3 }, { word: "quite", count: 2 },
      ],
      percentage_puffery: ["300% growth improvement", "500% faster deployment", "200% increase in efficiency"],
      false_urgency: ["window is closing", "immediate action required", "can't afford to wait"],
      passive_voice_instances: ["mistakes were made", "results were achieved", "goals were met"],
      jargon_masking: ["synergistic paradigm shift", "holistic approach", "scalable solution", "operationalize", "solutioning"],
      manipulation_index: 52,
    },
    fallacies: {
      fallacies: [
        { type: "False Dichotomy", evidence: "Either adopt our AI platform or watch competitors leave you behind", severity: "High" },
        { type: "Appeal to Authority", evidence: "As Gartner says, this is the only path to digital maturity", severity: "Medium" },
        { type: "Post Hoc", evidence: "After implementing our solution, revenue increased by 40%", severity: "High" },
        { type: "Straw Man", evidence: "Some critics say AI is just a fad, but they ignore the evidence", severity: "Medium" },
      ],
      fallacy_density: 1.2,
    },
    fluff: {
      fog_index: 19.2,
      adjective_verb_ratio: 2.8,
      unique_data_points: 4,
      fluff_score: 71,
      buzzword_count: 47,
      action_verb_count: 8,
    },
  },

  implementation_readiness: {
    artifact_presence: [
      { name: "Code Snippets", found: false },
      { name: "Configuration Files", found: false },
      { name: "Checklists", found: true },
      { name: "Architecture Diagrams", found: false },
      { name: "Templates", found: false },
      { name: "API Definitions", found: false },
    ],
    resource_clarity_score: 3,
    timeline_reality_score: 3,
    prerequisite_check_score: 2,
    readiness_score: 3,
    verdict: "Theoretical Only",
  },

  obsolescence_risk: {
    outdated_references: ["traditional RPA", "batch processing only"],
    missing_current_practices: ["agentic AI", "vector database", "RAG"],
    risk_level: "High",
    risk_score: 65,
  },

  hype_reality: {
    positive_sentiment_pct: 91,
    risk_mentions: 2,
    failure_acknowledgments: 0,
    balance_assessment: "Excessively positive (91%) with 0 risk acknowledgments",
    hype_score: 88,
    classification: "Sales Propaganda",
  },

  regulatory_safety: {
    regulatory_mentions: ["GDPR"],
    ethical_mentions: [],
    privacy_mentions: [],
    red_flags: [
      "AI/ML implementation proposed without ethical or regulatory framework",
      "Data collection mentioned without sufficient regulatory compliance references",
    ],
    safety_level: "Caution",
    safety_score: 45,
  },

  visual_intensity: { score: 3, diagram_references: 2, formatting_richness: 5, assessment: "Text-heavy — limited visual support" },
  data_intensity: { score: 3, tables_detected: 1, citations_detected: 3, statistics_detected: 4, assessment: "Data-sparse — assertions may lack empirical support" },

  bias_detection: {
    biases: [
      { type: "Confirmation", evidence: "12 success references with zero failure acknowledgments", severity: "High" },
      { type: "Survival", evidence: "4 case studies presented without any failed project examples", severity: "Medium" },
      { type: "Authority", evidence: "5 authority appeals without independent empirical validation", severity: "Medium" },
    ],
    overall_bias_score: 60,
  },

  amazing_facts: [
    { fact: "The document claims 300% growth but provides no baseline metrics or absolute numbers", why_amazing: "Contradicts conventional wisdom with specific evidence", is_contrarian: true, is_quantified: true },
    { fact: "Zero code samples or configuration examples in a 'technical implementation' proposal", why_amazing: "Contradicts conventional wisdom with specific evidence", is_contrarian: true, is_quantified: false },
    { fact: "Recommends traditional RPA in 2026 without mentioning agentic enhancements", why_amazing: "Provides specific quantified claim for verification", is_contrarian: true, is_quantified: false },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK ANALYSIS 2 — Solid audit report (high trust)
// ═══════════════════════════════════════════════════════════════════════════

export const sampleResult2: AnalysisResult = {
  overall_trust_score: 79,
  summary:
    "This document is consumer-oriented (82% confidence), designed to empower the reader. Moderate linguistic manipulation detected (index: 18/100). Implementation readiness: Implementation Ready (score: 8/10). Content uniqueness: Differentiated (58/100). Targeted at Manager-level audience within SME-scale organizations.",

  provider_consumer: {
    drivers: [
      { name: "Problem Definition Clarity", weight: 0.20, score: 8, rationale: "Frames internal capability building — 6 internal vs 1 external references" },
      { name: "Vendor Lock-in Potential", weight: 0.20, score: 8, rationale: "1 lock-in vs 4 open terms detected" },
      { name: "Implementation Autonomy", weight: 0.20, score: 7, rationale: "8 client-focus vs 3 vendor-focus references" },
      { name: "Upsell Visibility", weight: 0.20, score: 8, rationale: "1 upsell pattern detected (density: 2.1/10k words)" },
      { name: "Risk Transfer", weight: 0.20, score: 7, rationale: "Vendor assumes appropriate risk" },
    ],
    composite_score: 76,
    confidence: 82,
    classification: "Consumer-Favored",
  },

  company_scale: {
    drivers: [
      { name: "Framework Proprietary Level", weight: 0.30, score: 3, rationale: "0 proprietary vs 2 generic frameworks" },
      { name: "Data Scope & Depth", weight: 0.20, score: 7, rationale: "3 primary research, 2 secondary citations" },
      { name: "Design Polish & Branding", weight: 0.15, score: 3, rationale: "0 branding/legal markers detected" },
      { name: "Service Breadth", weight: 0.15, score: 3, rationale: "1 breadth vs 3 niche indicators" },
      { name: "Legal/Compliance Density", weight: 0.20, score: 3, rationale: "0 legal/compliance terms found" },
    ],
    composite_score: 37,
    confidence: 62,
    classification: "Solo/Boutique",
  },

  target_scale: {
    drivers: [
      { name: "Governance Complexity", weight: 0.25, score: 5, rationale: "2 governance terms detected" },
      { name: "Cross-Functional Impact", weight: 0.20, score: 5, rationale: "2 cross-functional vs 3 single-dept references" },
      { name: "Legacy Integration Focus", weight: 0.20, score: 5, rationale: "2 legacy vs 2 greenfield terms" },
      { name: "Budget/Resource Implication", weight: 0.15, score: 5, rationale: "1 enterprise-budget vs 2 small-budget indicators" },
      { name: "Risk & Security Standards", weight: 0.20, score: 6, rationale: "3 security/compliance terms found" },
    ],
    composite_score: 52,
    confidence: 55,
    classification: "SME",
  },

  audience_level: {
    drivers: [
      { name: "Strategic vs. Tactical Ratio", weight: 0.30, score: 4, rationale: "5 strategic vs 9 tactical terms (36%)" },
      { name: "Financial Metric Density", weight: 0.20, score: 4, rationale: "4 financial metrics (density: 8.5/10k words)" },
      { name: "Technical Jargon Density", weight: 0.20, score: 4, rationale: "12 technical terms (density: 25.5/10k words)" },
      { name: "Actionable Horizon", weight: 0.15, score: 2, rationale: "5 immediate vs 1 long-term references" },
      { name: "Decision Scope", weight: 0.15, score: 3, rationale: "0 business-level vs 2 tool-level decisions" },
    ],
    composite_score: 36,
    confidence: 58,
    classification: "Manager",
  },

  rarity_index: {
    drivers: [
      { name: "Primary Data Source", weight: 0.25, score: 7, rationale: "3 primary vs 2 secondary data references" },
      { name: "Contrarian Factor", weight: 0.25, score: 6, rationale: "4 contrarian vs 2 hype-aligned statements" },
      { name: "Framework Novelty", weight: 0.20, score: 6, rationale: "2 novel vs 1 standard frameworks" },
      { name: "Predictive Specificity", weight: 0.15, score: 5, rationale: "2 specific vs 1 vague predictions" },
      { name: "Case Study Transparency", weight: 0.15, score: 5, rationale: "2 named vs 1 anonymous case studies" },
    ],
    composite_score: 60,
    confidence: 60,
    classification: "Differentiated",
  },

  forensics: {
    deception: {
      weasel_words: [{ word: "generally", count: 2 }, { word: "typically", count: 1 }, { word: "relatively", count: 1 }],
      percentage_puffery: [],
      false_urgency: [],
      passive_voice_instances: ["was identified", "was remediated"],
      jargon_masking: [],
      manipulation_index: 18,
    },
    fallacies: { fallacies: [], fallacy_density: 0 },
    fluff: { fog_index: 14.1, adjective_verb_ratio: 1.2, unique_data_points: 22, fluff_score: 28, buzzword_count: 6, action_verb_count: 31 },
  },

  implementation_readiness: {
    artifact_presence: [
      { name: "Code Snippets", found: true },
      { name: "Configuration Files", found: true },
      { name: "Checklists", found: true },
      { name: "Architecture Diagrams", found: true },
      { name: "Templates", found: true },
      { name: "API Definitions", found: false },
    ],
    resource_clarity_score: 7,
    timeline_reality_score: 8,
    prerequisite_check_score: 7,
    readiness_score: 8,
    verdict: "Implementation Ready",
  },

  obsolescence_risk: {
    outdated_references: [],
    missing_current_practices: [],
    risk_level: "Low",
    risk_score: 10,
  },

  hype_reality: {
    positive_sentiment_pct: 65,
    risk_mentions: 8,
    failure_acknowledgments: 3,
    balance_assessment: "Within optimal credibility range (60-80% positive)",
    hype_score: 35,
    classification: "Balanced Analysis",
  },

  regulatory_safety: {
    regulatory_mentions: ["GDPR", "SOC2", "ISO 27001"],
    ethical_mentions: ["bias mitigation", "transparency"],
    privacy_mentions: ["PII", "data residency", "encryption"],
    red_flags: [],
    safety_level: "Safe",
    safety_score: 92,
  },

  visual_intensity: { score: 6, diagram_references: 5, formatting_richness: 12, assessment: "Moderate visual elements — balanced" },
  data_intensity: { score: 7, tables_detected: 4, citations_detected: 8, statistics_detected: 15, assessment: "Moderate data density — reasonably supported" },

  bias_detection: { biases: [{ type: "Recency", evidence: "All 8 date references are recent with no historical context", severity: "Low" }], overall_bias_score: 5 },

  amazing_facts: [
    { fact: "Provides specific firewall rule configurations with before/after comparison", why_amazing: "Provides specific quantified claim for verification", is_contrarian: false, is_quantified: true },
    { fact: "Includes step-by-step patching guide with estimated downtime per system", why_amazing: "Provides specific quantified claim for verification", is_contrarian: false, is_quantified: true },
    { fact: "Identifies 3 critical vulnerabilities missed by previous automated scans", why_amazing: "Contradicts conventional wisdom with specific evidence", is_contrarian: true, is_quantified: true },
  ],
};

// ── Mock Documents ──────────────────────────────────────────────────────────

export const mockAnalysis: AnalysisDoc = {
  id: "mock-analysis-001",
  file_hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  filename: "Q4_Cloud_Migration_Proposal.pdf",
  display_name: "Q4 Enterprise Cloud Migration Strategy",
  author: "Accenture Cloud First",
  doc_summary: "A consulting proposal outlining a phased cloud migration strategy for enterprise workloads across AWS and Azure.",
  uploaded_at: new Date("2026-02-06T14:30:00Z"),
  analysis_result: sampleResult1,
};

export const mockAnalysis2: AnalysisDoc = {
  id: "mock-analysis-002",
  file_hash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
  filename: "Annual_Security_Audit_Report.pdf",
  display_name: "Annual Security Audit & Compliance Report",
  author: "Deloitte Cyber",
  doc_summary: "A comprehensive security audit covering infrastructure vulnerabilities, compliance gaps, and remediation recommendations.",
  uploaded_at: new Date("2026-02-05T09:15:00Z"),
  analysis_result: sampleResult2,
};

export const allMockAnalyses: AnalysisDoc[] = [mockAnalysis, mockAnalysis2];

// ── Mock Comments ───────────────────────────────────────────────────────────
export const mockComments: CommentDoc[] = [
  { id: "c-001", user_name: "sarah.chen@example.com", text: "The vendor focus percentage is alarming. We should request a revised version with client-specific ROI projections.", section_reference: "provider_consumer", timestamp: new Date("2026-02-06T15:00:00Z"), likes: 3, dislikes: 0 },
  { id: "c-002", user_name: "marcus.j@example.com", text: "The manipulation index at 52 is way too high. Count of weasel words alone should disqualify this from procurement consideration.", section_reference: "forensics", timestamp: new Date("2026-02-06T15:30:00Z"), likes: 5, dislikes: 1 },
  { id: "c-003", user_name: "priya.patel@example.com", text: "Without code samples or config, this is essentially a glorified brochure. Hard pass.", section_reference: "implementation", timestamp: new Date("2026-02-06T16:00:00Z"), likes: 2, dislikes: 0 },
  { id: "c-004", user_name: "david.kim@example.com", text: "The false dichotomy fallacy is a huge red flag — 'adopt or die' framing is pure sales tactics.", section_reference: "fallacies", timestamp: new Date("2026-02-06T16:15:00Z"), likes: 4, dislikes: 0 },
  { id: "c-005", user_name: "elena.t@example.com", text: "Recommending traditional RPA in 2026? This needs a complete technology refresh before we consider it.", section_reference: "obsolescence", timestamp: new Date("2026-02-06T16:30:00Z"), likes: 1, dislikes: 0 },
  { id: "c-006", user_name: "james.wright@example.com", text: "Three confirmed biases and zero failure acknowledgments. This is a marketing document, not a strategic assessment.", section_reference: "bias", timestamp: new Date("2026-02-06T17:00:00Z"), likes: 6, dislikes: 2 },
];
