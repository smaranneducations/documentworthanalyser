// ═══════════════════════════════════════════════════════════════════════════
// AI-Powered Agentic Document Analyzer — Full Engine
// Implements all 5 Core Decision Modules, Content Forensics,
// Advanced Enhancement Modules, Bias Detection, and Amazing Facts
// ═══════════════════════════════════════════════════════════════════════════

import type {
  AnalysisResult,
  WeightedDriver,
  ProviderConsumerModule,
  CompanyScaleModule,
  TargetScaleModule,
  AudienceLevelModule,
  RarityIndexModule,
  ContentForensicsResult,
  DeceptionDetection,
  FallacyDetection,
  FluffIndex,
  LogicalFallacy,
  ImplementationReadiness,
  ObsolescenceRisk,
  HypeReality,
  RegulatoryEthicalSafety,
  VisualIntensity,
  DataIntensity,
  BiasDetection,
  BiasInstance,
  AmazingFact,
} from "./types";

// ── Fallback LinkedIn hashtags for when Gemini is unavailable ────────────
const DEFAULT_LINKEDIN_HASHTAGS: string[] = [
  "#DocumentAnalysis", "#AIForensics", "#VendorAssessment",
  "#ConsultingProposal", "#EnterpriseAI", "#AIStrategy",
  "#DigitalTransformation", "#ITStrategy", "#DataDriven",
  "#CTO", "#CIO", "#VPEngineering", "#PlatformData",
  "#AIinProduction", "#CloudStrategy", "#DevOps",
  "#AIProductivity", "#VendorLockIn", "#EnterpriseIT",
  "#BusinessIntelligence",
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function countPatterns(text: string, patterns: (string | RegExp)[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const p of patterns) {
    if (typeof p === "string") {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "gi"));
      if (matches) count += matches.length;
    } else {
      const matches = text.match(p);
      if (matches) count += matches.length;
    }
  }
  return count;
}

function findMatches(text: string, patterns: (string | RegExp)[]): string[] {
  const found: string[] = [];
  for (const p of patterns) {
    if (typeof p === "string") {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
      if (matches) found.push(p);
    } else {
      const matches = text.match(p);
      if (matches) found.push(...matches.map((m) => m.trim()));
    }
  }
  return [...new Set(found)];
}

function findMatchesWithCount(text: string, patterns: string[]): { word: string; count: number }[] {
  const lower = text.toLowerCase();
  const results: { word: string; count: number }[] = [];
  for (const p of patterns) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    if (matches && matches.length > 0) {
      results.push({ word: p, count: matches.length });
    }
  }
  return results.sort((a, b) => b.count - a.count);
}

function extractSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeComposite(drivers: WeightedDriver[]): number {
  let total = 0;
  for (const d of drivers) total += d.score * d.weight;
  return clamp(Math.round(total * 10), 0, 100); // scale 1-10 scores to 0-100
}

// ═══════════════════════════════════════════════════════════════════════════
// WORD / PATTERN DICTIONARIES
// ═══════════════════════════════════════════════════════════════════════════

const WEASEL_WORDS = [
  "arguably", "virtually", "up to", "helps to", "may contribute", "might", "could",
  "possibly", "generally", "typically", "in some cases", "it is believed",
  "it is thought", "some experts", "many believe", "often", "frequently",
  "in most cases", "tends to", "appears to", "seems to", "somewhat",
  "relatively", "fairly", "rather", "quite", "almost",
];

const BUZZWORDS = [
  "synergy", "leverage", "best-in-class", "world-class", "cutting-edge",
  "next-generation", "paradigm shift", "holistic", "scalable", "turn-key",
  "robust", "seamless", "empower", "disrupt", "game-changing", "innovative",
  "transform", "revolutionize", "optimize", "streamline", "agile",
  "ecosystem", "end-to-end", "mission-critical", "bleeding-edge",
  "future-proof", "thought leadership", "deep dive", "low-hanging fruit",
  "move the needle", "circle back", "bandwidth", "drill down",
  "synergistic", "next-gen", "state-of-the-art", "best practices",
  "actionable insights", "digital transformation", "value proposition",
];

const FALSE_URGENCY_PATTERNS: (string | RegExp)[] = [
  "window is closing", "immediate action required", "act now",
  "time is running out", "before it's too late", "urgent", "don't miss out",
  "limited time", "critical deadline", "must act immediately",
  /can['']t afford to wait/gi, /falling behind/gi,
];

const JARGON_MASKING = [
  "synergistic paradigm shift", "holistic approach", "scalable solution",
  "operationalize", "ideate", "solutioning", "productize", "platformize",
  "north star", "boil the ocean", "blue sky thinking", "net-net",
  "learnings", "value-add", "mindshare", "swim lane", "guardrails",
  "unlock value", "reimagine", "double-click on", "unpack",
];

const ACTION_VERBS = [
  "implement", "deploy", "configure", "install", "execute", "run",
  "create", "build", "test", "validate", "migrate", "patch",
  "update", "remove", "delete", "monitor", "scan", "audit",
  "develop", "integrate", "automate", "schedule", "provision",
  "launch", "compile", "debug", "refactor", "ship",
];

const VENDOR_TERMS = [
  "our solution", "our platform", "we provide", "our team", "our product",
  "we offer", "we deliver", "our approach", "our methodology", "we enable",
  "our experts", "our consultants", "our framework", "we recommend",
  "our proprietary", "our proven", "we have helped", "our clients",
  "our track record", "we bring",
];

const CLIENT_TERMS = [
  "your needs", "your team", "your business", "client requirements",
  "your infrastructure", "your organization", "your goals", "your challenges",
  "customer outcomes", "reader's", "your stakeholders", "your budget",
  "your timeline", "your existing", "internal capability",
];

const UPSELL_PATTERNS = [
  "phase 2", "phase 3", "premium tier", "enterprise edition",
  "additional modules", "upgrade", "expand", "advanced package",
  "contact us for", "schedule a demo", "speak with our",
  "full assessment", "comprehensive engagement", "extended support",
];

const PROPRIETARY_FRAMEWORK_TERMS = [
  "our framework", "proprietary methodology", "our model", "our scorecard",
  "branded", "our maturity model", "our assessment tool", "trademarked",
  /\b[A-Z][a-z]+\s+(360|Score|Index|Matrix|Meter|Engine|Suite)\b/g,
];

const GOVERNANCE_TERMS = [
  "steering committee", "board approval", "governance", "compliance framework",
  "change management", "enterprise architecture", "center of excellence",
  "cross-functional", "organizational change", "RACI",
];

const STARTUP_TERMS = [
  "MVP", "lean", "agile", "sprint", "rapid deployment", "pivot",
  "iterate", "scale-up", "bootstrap", "proof of concept", "PoC",
  "quick win", "prototype",
];

const ENTERPRISE_TERMS = [
  "enterprise-wide", "transformation program", "multi-year", "capital expenditure",
  "large-scale", "legacy modernization", "migration strategy", "SOC2",
  "GDPR", "Fortune 500", "global rollout", "change management",
];

const CSUITE_LANGUAGE = [
  "ROI", "EBITDA", "NPV", "CapEx", "OpEx", "shareholder value",
  "market impact", "competitive advantage", "strategic positioning",
  "revenue growth", "cost optimization", "business model",
  "market share", "investor", "board",
];

const DEVELOPER_LANGUAGE = [
  "API", "SDK", "endpoint", "repository", "CLI", "docker",
  "kubernetes", "terraform", "CI/CD", "pipeline", "microservice",
  "REST", "GraphQL", "npm", "pip", "git", "yaml", "json",
];

const FINANCIAL_METRICS = [
  "ROI", "EBITDA", "NPV", "IRR", "TCO", "CapEx", "OpEx",
  "payback period", "break-even", "revenue", "margin", "profit",
  "cost savings", "cost reduction", "budget",
];

const REGULATORY_TERMS = [
  "GDPR", "EU AI Act", "CCPA", "SOC2", "SOC 2", "HIPAA",
  "ISO 27001", "PCI DSS", "NIST", "FedRAMP", "data residency",
  "regulatory compliance", "regulatory framework",
];

const ETHICAL_TERMS = [
  "bias mitigation", "fairness", "transparency", "explainability",
  "responsible AI", "ethical AI", "accountability", "algorithmic bias",
  "model interpretability", "human oversight",
];

const PRIVACY_TERMS = [
  "PII", "data residency", "consent management", "data protection",
  "anonymization", "pseudonymization", "encryption", "access control",
  "data minimization", "right to be forgotten", "data subject",
];

const OUTDATED_TECH = [
  "GPT-3", "GPT-3.5", "BERT", "traditional RPA", "rule-based automation",
  "batch processing only", "monolithic architecture", "waterfall methodology",
  "on-premise only", "manual ETL",
];

const CURRENT_PRACTICES = [
  "agentic AI", "agentic workflow", "vector database", "RAG",
  "retrieval augmented", "multi-modal", "LLM", "large language model",
  "fine-tuning", "prompt engineering", "embedding", "transformer",
  "generative AI", "foundation model",
];

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 1: Provider vs. Consumer Suitability
// ═══════════════════════════════════════════════════════════════════════════

function analyzeProviderConsumer(text: string, sentences: string[]): ProviderConsumerModule {
  const vendorCount = countPatterns(text, VENDOR_TERMS);
  const clientCount = countPatterns(text, CLIENT_TERMS);
  const upsellCount = countPatterns(text, UPSELL_PATTERNS);
  const wordCount = text.split(/\s+/).length;

  // Problem Definition Clarity: does it frame external help vs internal capability?
  const externalHelp = countPatterns(text, ["need external", "hire consultant", "engage vendor", "outsource", "partner with"]);
  const internalBuild = countPatterns(text, ["build internally", "internal team", "in-house", "self-service", "upskill", "train your"]);
  const problemClarity = internalBuild > externalHelp ? 8 : externalHelp > internalBuild ? 3 : 5;

  // Vendor Lock-in Potential
  const lockInTerms = countPatterns(text, ["proprietary", "only works with", "exclusive", "our platform only", "locked", "vendor-specific"]);
  const openTerms = countPatterns(text, ["open source", "open-source", "interoperable", "vendor-neutral", "portable", "standard"]);
  const lockInScore = openTerms > lockInTerms ? 8 : lockInTerms > openTerms * 2 ? 2 : 5;

  // Implementation Autonomy
  const totalFocus = vendorCount + clientCount || 1;
  const autonomyScore = clamp(Math.round((clientCount / totalFocus) * 10), 1, 10);

  // Upsell Visibility
  const upsellDensity = (upsellCount / wordCount) * 10000;
  const upsellScore = upsellDensity > 20 ? 2 : upsellDensity > 10 ? 4 : upsellDensity > 3 ? 6 : 8;

  // Risk Transfer
  const clientRisk = countPatterns(text, ["client assumes", "customer responsibility", "at your own risk", "client-side"]);
  const vendorRisk = countPatterns(text, ["we guarantee", "our responsibility", "SLA", "we ensure", "vendor liability"]);
  const riskScore = vendorRisk >= clientRisk ? 7 : 4;

  const drivers: WeightedDriver[] = [
    { name: "Problem Definition Clarity", weight: 0.20, score: problemClarity, rationale: internalBuild > externalHelp ? "Frames internal capability building" : "Frames external help requirement" },
    { name: "Vendor Lock-in Potential", weight: 0.20, score: lockInScore, rationale: `${lockInTerms} lock-in vs ${openTerms} open terms detected` },
    { name: "Implementation Autonomy", weight: 0.20, score: autonomyScore, rationale: `${clientCount} client-focus vs ${vendorCount} vendor-focus references` },
    { name: "Upsell Visibility", weight: 0.20, score: upsellScore, rationale: `${upsellCount} upsell patterns detected (density: ${upsellDensity.toFixed(1)}/10k words)` },
    { name: "Risk Transfer", weight: 0.20, score: riskScore, rationale: clientRisk > vendorRisk ? "Risk transferred to client" : "Vendor assumes appropriate risk" },
  ];

  const composite = computeComposite(drivers);
  const classification = composite >= 60 ? "Consumer-Favored" : composite <= 40 ? "Provider-Favored" : "Balanced";

  return {
    drivers,
    composite_score: composite,
    confidence: clamp(Math.abs(composite - 50) * 2, 30, 95),
    classification,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 2: Consulting Company Scale Detection
// ═══════════════════════════════════════════════════════════════════════════

function analyzeCompanyScale(text: string): CompanyScaleModule {
  const proprietaryCount = countPatterns(text, PROPRIETARY_FRAMEWORK_TERMS);
  const wordCount = text.split(/\s+/).length;

  // Framework Proprietary Level
  const genericFrameworks = countPatterns(text, ["SWOT", "Porter's Five Forces", "PESTEL", "BCG Matrix", "Ansoff"]);
  const propScore = proprietaryCount > 3 ? 9 : proprietaryCount > 1 ? 6 : genericFrameworks > 2 ? 3 : 5;

  // Data Scope & Depth
  const primaryData = countPatterns(text, ["our survey", "our research", "primary research", "we surveyed", "our data shows", "benchmark data"]);
  const secondaryData = countPatterns(text, ["according to", "research shows", "studies indicate", "Gartner", "Forrester", "McKinsey"]);
  const dataScore = primaryData > 3 ? 9 : primaryData > 0 ? 6 : secondaryData > 3 ? 4 : 3;

  // Design Polish (text-based heuristic)
  const brandingTerms = countPatterns(text, ["©", "®", "™", "all rights reserved", "confidential"]);
  const designScore = brandingTerms > 3 ? 8 : brandingTerms > 1 ? 6 : 3;

  // Service Breadth
  const breadthTerms = countPatterns(text, ["end-to-end", "full lifecycle", "comprehensive", "360", "complete solution", "transformation"]);
  const nicheTerms = countPatterns(text, ["specialized", "niche", "focused on", "expertise in", "boutique"]);
  const breadthScore = breadthTerms > nicheTerms * 2 ? 8 : nicheTerms > breadthTerms ? 3 : 5;

  // Legal/Compliance Density
  const legalTerms = countPatterns(text, ["disclaimer", "limitation of liability", "indemnification", "confidential", "NDA", "terms and conditions"]);
  const legalScore = legalTerms > 3 ? 9 : legalTerms > 1 ? 6 : 3;

  const drivers: WeightedDriver[] = [
    { name: "Framework Proprietary Level", weight: 0.30, score: propScore, rationale: `${proprietaryCount} proprietary vs ${genericFrameworks} generic frameworks` },
    { name: "Data Scope & Depth", weight: 0.20, score: dataScore, rationale: `${primaryData} primary research, ${secondaryData} secondary citations` },
    { name: "Design Polish & Branding", weight: 0.15, score: designScore, rationale: `${brandingTerms} branding/legal markers detected` },
    { name: "Service Breadth", weight: 0.15, score: breadthScore, rationale: `${breadthTerms} breadth vs ${nicheTerms} niche indicators` },
    { name: "Legal/Compliance Density", weight: 0.20, score: legalScore, rationale: `${legalTerms} legal/compliance terms found` },
  ];

  const composite = computeComposite(drivers);
  const classification = composite >= 65 ? "Big 4/GSI" : composite >= 40 ? "Mid-tier" : "Solo/Boutique";

  return { drivers, composite_score: composite, confidence: clamp(50 + Math.abs(composite - 50), 40, 90), classification };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 3: Target Company Scale
// ═══════════════════════════════════════════════════════════════════════════

function analyzeTargetScale(text: string): TargetScaleModule {
  const govCount = countPatterns(text, GOVERNANCE_TERMS);
  const startupCount = countPatterns(text, STARTUP_TERMS);
  const enterpriseCount = countPatterns(text, ENTERPRISE_TERMS);

  // Governance Complexity
  const govScore = govCount > 5 ? 9 : govCount > 2 ? 6 : 3;

  // Cross-Functional Impact
  const crossFunc = countPatterns(text, ["cross-functional", "enterprise-wide", "organization-wide", "multiple departments", "stakeholders"]);
  const singleDept = countPatterns(text, ["team", "department", "small group", "individual"]);
  const crossScore = crossFunc > singleDept ? 8 : singleDept > crossFunc * 2 ? 3 : 5;

  // Legacy Integration
  const legacyTerms = countPatterns(text, ["legacy", "modernization", "migration", "existing systems", "integration", "backward compatible"]);
  const greenfieldTerms = countPatterns(text, ["greenfield", "build new", "from scratch", "startup", "ground up"]);
  const legacyScore = legacyTerms > greenfieldTerms * 2 ? 9 : greenfieldTerms > legacyTerms ? 3 : 5;

  // Budget/Resource Implication
  const bigBudget = countPatterns(text, ["multi-year", "capital", "million", "enterprise license", "transformation budget"]);
  const smallBudget = countPatterns(text, ["SaaS subscription", "free tier", "pay-as-you-go", "affordable", "cost-effective"]);
  const budgetScore = bigBudget > smallBudget ? 8 : smallBudget > bigBudget ? 3 : 5;

  // Risk & Security Standards
  const securityTerms = countPatterns(text, [...REGULATORY_TERMS, "penetration testing", "security audit", "zero trust"]);
  const secScore = securityTerms > 5 ? 9 : securityTerms > 2 ? 6 : 3;

  const drivers: WeightedDriver[] = [
    { name: "Governance Complexity", weight: 0.25, score: govScore, rationale: `${govCount} governance terms detected` },
    { name: "Cross-Functional Impact", weight: 0.20, score: crossScore, rationale: `${crossFunc} cross-functional vs ${singleDept} single-dept references` },
    { name: "Legacy Integration Focus", weight: 0.20, score: legacyScore, rationale: `${legacyTerms} legacy vs ${greenfieldTerms} greenfield terms` },
    { name: "Budget/Resource Implication", weight: 0.15, score: budgetScore, rationale: `${bigBudget} enterprise-budget vs ${smallBudget} small-budget indicators` },
    { name: "Risk & Security Standards", weight: 0.20, score: secScore, rationale: `${securityTerms} security/compliance terms found` },
  ];

  const composite = computeComposite(drivers);
  const classification = composite >= 65 ? "Enterprise" : composite >= 35 ? "SME" : "Startup";

  return { drivers, composite_score: composite, confidence: clamp(50 + Math.abs(composite - 50), 40, 90), classification };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 4: Target Audience Level
// ═══════════════════════════════════════════════════════════════════════════

function analyzeAudienceLevel(text: string): AudienceLevelModule {
  const csuiteCount = countPatterns(text, CSUITE_LANGUAGE);
  const devCount = countPatterns(text, DEVELOPER_LANGUAGE);
  const financialCount = countPatterns(text, FINANCIAL_METRICS);
  const wordCount = text.split(/\s+/).length;

  // Strategic vs Tactical Ratio
  const strategic = countPatterns(text, ["strategy", "strategic", "vision", "roadmap", "market impact", "competitive", "transformation"]);
  const tactical = countPatterns(text, ["step-by-step", "how to", "tutorial", "configure", "install", "code", "implementation details"]);
  const stratTactRatio = strategic + tactical > 0 ? strategic / (strategic + tactical) : 0.5;
  const stratScore = stratTactRatio > 0.7 ? 9 : stratTactRatio > 0.5 ? 7 : stratTactRatio > 0.3 ? 4 : 2;

  // Financial Metric Density
  const finDensity = (financialCount / wordCount) * 10000;
  const finScore = finDensity > 30 ? 9 : finDensity > 15 ? 7 : finDensity > 5 ? 4 : 2;

  // Technical Jargon Density
  const techDensity = (devCount / wordCount) * 10000;
  const jargonScore = techDensity > 40 ? 2 : techDensity > 20 ? 4 : techDensity > 8 ? 6 : 8;

  // Actionable Horizon
  const immediate = countPatterns(text, ["today", "this week", "immediately", "quick start", "get started"]);
  const longTerm = countPatterns(text, ["multi-year", "roadmap", "3-5 years", "long-term", "strategic plan"]);
  const horizonScore = longTerm > immediate * 2 ? 9 : immediate > longTerm * 2 ? 2 : 5;

  // Decision Scope
  const toolDecision = countPatterns(text, ["tool selection", "product comparison", "feature comparison", "which tool"]);
  const bizDecision = countPatterns(text, ["business model", "market entry", "acquisition", "investment", "portfolio"]);
  const scopeScore = bizDecision > toolDecision ? 9 : toolDecision > bizDecision ? 3 : 5;

  const drivers: WeightedDriver[] = [
    { name: "Strategic vs. Tactical Ratio", weight: 0.30, score: stratScore, rationale: `${strategic} strategic vs ${tactical} tactical terms (ratio: ${(stratTactRatio * 100).toFixed(0)}%)` },
    { name: "Financial Metric Density", weight: 0.20, score: finScore, rationale: `${financialCount} financial metrics (density: ${finDensity.toFixed(1)}/10k words)` },
    { name: "Technical Jargon Density", weight: 0.20, score: jargonScore, rationale: `${devCount} technical terms (density: ${techDensity.toFixed(1)}/10k words)` },
    { name: "Actionable Horizon", weight: 0.15, score: horizonScore, rationale: `${immediate} immediate vs ${longTerm} long-term references` },
    { name: "Decision Scope", weight: 0.15, score: scopeScore, rationale: `${bizDecision} business-level vs ${toolDecision} tool-level decisions` },
  ];

  const composite = computeComposite(drivers);
  let classification: "Developer" | "Manager" | "VP" | "C-Suite";
  if (composite >= 75) classification = "C-Suite";
  else if (composite >= 55) classification = "VP";
  else if (composite >= 35) classification = "Manager";
  else classification = "Developer";

  return { drivers, composite_score: composite, confidence: clamp(50 + Math.abs(composite - 50), 35, 90), classification };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5: Rarity Index
// ═══════════════════════════════════════════════════════════════════════════

function analyzeRarityIndex(text: string, sentences: string[]): RarityIndexModule {
  const wordCount = text.split(/\s+/).length;

  // Primary Data Source
  const primaryData = countPatterns(text, ["our survey", "our research", "we conducted", "our experiment", "primary data", "we measured", "our findings"]);
  const secondaryData = countPatterns(text, ["according to", "research shows", "studies suggest", "analysts predict", "reports indicate"]);
  const dataScore = primaryData > 5 ? 9 : primaryData > 2 ? 7 : secondaryData > primaryData * 3 ? 2 : 4;

  // Contrarian Factor
  const contrarianTerms = countPatterns(text, ["however", "contrary to", "despite common belief", "counterintuitively", "surprisingly", "unlike popular", "challenges the assumption"]);
  const hypeAlignment = countPatterns(text, ["as everyone knows", "it's well known", "the consensus is", "experts agree", "industry standard"]);
  const contrarianScore = contrarianTerms > hypeAlignment * 2 ? 9 : contrarianTerms > hypeAlignment ? 6 : 3;

  // Framework Novelty
  const standardFrameworks = countPatterns(text, ["SWOT", "Porter", "PESTEL", "BCG", "Ansoff", "Kotter", "ADKAR"]);
  const novelFramework = countPatterns(text, ["new model", "novel approach", "our framework", "we propose", "new methodology", "original"]);
  const noveltyScore = novelFramework > standardFrameworks * 2 ? 9 : novelFramework > standardFrameworks ? 6 : 3;

  // Predictive Specificity
  const specificPredictions = countPatterns(text, [/by 20\d{2}/gi, /within \d+ (months|years)/gi, /\d+%\s+(increase|decrease|growth|reduction)/gi]);
  const vaguePredictions = countPatterns(text, ["in the future", "someday", "eventually", "over time", "going forward"]);
  const predictScore = specificPredictions > vaguePredictions ? 8 : vaguePredictions > specificPredictions * 2 ? 2 : 5;

  // Case Study Transparency
  const namedCases = countPatterns(text, [/\b(Google|Amazon|Microsoft|Meta|Apple|Netflix|Tesla|Uber|Airbnb|Spotify)\b/gi]);
  const anonCases = countPatterns(text, ["a large bank", "a major retailer", "a leading company", "a Fortune 500", "a global firm", "an enterprise client"]);
  const caseScore = namedCases > anonCases * 2 ? 8 : anonCases > namedCases ? 3 : 5;

  const drivers: WeightedDriver[] = [
    { name: "Primary Data Source", weight: 0.25, score: dataScore, rationale: `${primaryData} primary vs ${secondaryData} secondary data references` },
    { name: "Contrarian Factor", weight: 0.25, score: contrarianScore, rationale: `${contrarianTerms} contrarian vs ${hypeAlignment} hype-aligned statements` },
    { name: "Framework Novelty", weight: 0.20, score: noveltyScore, rationale: `${novelFramework} novel vs ${standardFrameworks} standard frameworks` },
    { name: "Predictive Specificity", weight: 0.15, score: predictScore, rationale: `${specificPredictions} specific vs ${vaguePredictions} vague predictions` },
    { name: "Case Study Transparency", weight: 0.15, score: caseScore, rationale: `${namedCases} named vs ${anonCases} anonymous case studies` },
  ];

  const composite = computeComposite(drivers);
  const classification = composite >= 70 ? "Category-Defining" : composite >= 40 ? "Differentiated" : "Commodity";

  return { drivers, composite_score: composite, confidence: clamp(40 + Math.abs(composite - 50), 35, 90), classification };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT FORENSICS
// ═══════════════════════════════════════════════════════════════════════════

function analyzeDeception(text: string, sentences: string[]): DeceptionDetection {
  const wordCount = text.split(/\s+/).length;

  const weaselResults = findMatchesWithCount(text, WEASEL_WORDS);
  const pufferyMatches = findMatches(text, [/\d{2,}%\s*(growth|increase|improvement|reduction|faster|better)/gi]);
  const urgencyMatches = findMatches(text, FALSE_URGENCY_PATTERNS);
  const jargonMatches = findMatches(text, JARGON_MASKING);

  // Passive voice detection
  const passivePatterns = [/\b(was|were|been|being|is|are)\s+(being\s+)?\w+ed\b/gi];
  const passiveMatches = findMatches(text, passivePatterns).slice(0, 10);

  const totalDeceptions = weaselResults.reduce((s, w) => s + w.count, 0) +
    pufferyMatches.length + urgencyMatches.length + passiveMatches.length + jargonMatches.length;
  const manipulationIndex = clamp(Math.round((totalDeceptions / wordCount) * 2000), 0, 100);

  return {
    weasel_words: weaselResults,
    percentage_puffery: pufferyMatches,
    false_urgency: urgencyMatches,
    passive_voice_instances: passiveMatches,
    jargon_masking: jargonMatches,
    manipulation_index: manipulationIndex,
  };
}

function analyzeLogicalFallacies(text: string, sentences: string[]): FallacyDetection {
  const wordCount = text.split(/\s+/).length;
  const fallacies: LogicalFallacy[] = [];

  // False Dichotomy
  const falseDichotomy = sentences.filter((s) => /\b(either|or)\b.*\b(or|otherwise)\b/i.test(s) || /\bif you don['']t.*you will\b/i.test(s));
  falseDichotomy.slice(0, 3).forEach((s) => fallacies.push({ type: "False Dichotomy", evidence: s.slice(0, 120), severity: "Medium" }));

  // Appeal to Authority
  const authorityAppeal = sentences.filter((s) => /\b(as (Gartner|Forrester|McKinsey|Deloitte|BCG|Accenture) (says|reports|predicts|states))\b/i.test(s) || /\baccording to (leading|top|major) (analysts?|experts?|firms?)\b/i.test(s));
  authorityAppeal.slice(0, 3).forEach((s) => fallacies.push({ type: "Appeal to Authority", evidence: s.slice(0, 120), severity: "Low" }));

  // Straw Man
  const strawMan = sentences.filter((s) => /\b(some (people|critics|skeptics) (say|believe|think|argue))\b/i.test(s) || /\bthe old way\b/i.test(s));
  strawMan.slice(0, 2).forEach((s) => fallacies.push({ type: "Straw Man", evidence: s.slice(0, 120), severity: "Medium" }));

  // Post Hoc
  const postHoc = sentences.filter((s) => /\bafter (implementing|adopting|deploying).*\b(increased|improved|grew|reduced)\b/i.test(s));
  postHoc.slice(0, 2).forEach((s) => fallacies.push({ type: "Post Hoc", evidence: s.slice(0, 120), severity: "High" }));

  // Sunk Cost
  const sunkCost = sentences.filter((s) => /\b(already invested|too far to stop|continue (because|since) we['']ve)\b/i.test(s));
  sunkCost.slice(0, 2).forEach((s) => fallacies.push({ type: "Sunk Cost", evidence: s.slice(0, 120), severity: "High" }));

  const density = wordCount > 0 ? (fallacies.length / wordCount) * 1000 : 0;

  return { fallacies, fallacy_density: Math.round(density * 100) / 100 };
}

function analyzeFluffIndex(text: string): FluffIndex {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const sentenceCount = sentences.length || 1;

  // Gunning Fog Index approximation
  const avgSentenceLength = wordCount / sentenceCount;
  const complexWords = words.filter((w) => w.length > 6).length;
  const complexPct = (complexWords / wordCount) * 100;
  const fogIndex = 0.4 * (avgSentenceLength + complexPct);

  // Adjective/Verb ratio (approximation: words ending in -ly, -ive, -ous, -ful, -al as adjectives)
  const adjectives = words.filter((w) => /(?:ly|ive|ous|ful|al|ent|ant|ible|able)$/i.test(w)).length;
  const verbs = words.filter((w) => /(?:ing|ed|ize|ise|ate|ify)$/i.test(w)).length || 1;
  const adjVerbRatio = adjectives / verbs;

  // Unique data points (numbers, percentages, dates)
  const dataPoints = text.match(/\b\d+[\d,.]*%?\b/g) || [];
  const uniqueDataPoints = new Set(dataPoints).size;

  const buzzwordCount = countPatterns(text, BUZZWORDS);
  const actionVerbCount = countPatterns(text, ACTION_VERBS);

  // Fluff formula: high fog + high adj ratio + low data points = high fluff
  const fluffScore = clamp(
    Math.round(
      (clamp(fogIndex, 0, 25) / 25) * 40 +
      (clamp(adjVerbRatio, 0, 5) / 5) * 30 +
      (1 - clamp(uniqueDataPoints, 0, 30) / 30) * 30
    ),
    0,
    100
  );

  return {
    fog_index: Math.round(fogIndex * 10) / 10,
    adjective_verb_ratio: Math.round(adjVerbRatio * 100) / 100,
    unique_data_points: uniqueDataPoints,
    fluff_score: fluffScore,
    buzzword_count: buzzwordCount,
    action_verb_count: actionVerbCount,
  };
}

function analyzeForensics(text: string, sentences: string[]): ContentForensicsResult {
  return {
    deception: analyzeDeception(text, sentences),
    fallacies: analyzeLogicalFallacies(text, sentences),
    fluff: analyzeFluffIndex(text),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED ENHANCEMENT MODULES
// ═══════════════════════════════════════════════════════════════════════════

function analyzeImplementationReadiness(text: string): ImplementationReadiness {
  const artifacts = [
    { name: "Code Snippets", found: /```[\s\S]*?```|<code>|function\s+\w+|import\s+\w+/.test(text) },
    { name: "Configuration Files", found: /\b(yaml|json|toml|\.env|config|settings)\b/i.test(text) },
    { name: "Checklists", found: /\b(checklist|step \d|step-by-step|\[[ x]\]|☐|☑|✓)\b/i.test(text) },
    { name: "Architecture Diagrams", found: /\b(diagram|architecture|flowchart|data flow|sequence diagram)\b/i.test(text) },
    { name: "Templates", found: /\b(template|boilerplate|starter|scaffold)\b/i.test(text) },
    { name: "API Definitions", found: /\b(endpoint|API|REST|GraphQL|swagger|OpenAPI)\b/i.test(text) },
  ];

  const resourceClarity = countPatterns(text, ["data engineer", "developer", "architect", "analyst", "team of", "FTE", "headcount", "role", "years experience"]);
  const resourceScore = clamp(Math.min(10, resourceClarity * 2 + 1), 1, 10);

  const timelineSpecific = countPatterns(text, [/\d+\s*(weeks?|months?|days?|sprints?)/gi, "Q1", "Q2", "Q3", "Q4", "phase 1", "milestone"]);
  const timelineVague = countPatterns(text, ["future state", "in due time", "when ready", "eventually", "TBD"]);
  const timelineScore = clamp(timelineSpecific > timelineVague * 2 ? 8 : timelineVague > timelineSpecific ? 3 : 5, 1, 10);

  const prereqs = countPatterns(text, ["prerequisite", "requires", "must have", "dependency", "before starting", "prior to", "assumes"]);
  const prereqScore = clamp(prereqs > 3 ? 8 : prereqs > 0 ? 5 : 2, 1, 10);

  const artifactScore = Math.round((artifacts.filter((a) => a.found).length / artifacts.length) * 10);
  const readinessScore = Math.round(artifactScore * 0.3 + resourceScore * 0.25 + timelineScore * 0.25 + prereqScore * 0.2);

  let verdict: "Theoretical Only" | "Partially Actionable" | "Implementation Ready";
  if (readinessScore >= 7) verdict = "Implementation Ready";
  else if (readinessScore >= 4) verdict = "Partially Actionable";
  else verdict = "Theoretical Only";

  return { artifact_presence: artifacts, resource_clarity_score: resourceScore, timeline_reality_score: timelineScore, prerequisite_check_score: prereqScore, readiness_score: readinessScore, verdict };
}

function analyzeObsolescenceRisk(text: string): ObsolescenceRisk {
  const outdatedRefs = findMatches(text, OUTDATED_TECH);
  const currentRefs = findMatches(text, CURRENT_PRACTICES);

  const missingPractices: string[] = [];
  const criticalCurrentPractices = ["agentic AI", "vector database", "RAG", "LLM", "generative AI"];
  for (const p of criticalCurrentPractices) {
    if (!text.toLowerCase().includes(p.toLowerCase())) {
      missingPractices.push(p);
    }
  }

  const outdatedScore = outdatedRefs.length * 15;
  const currentBonus = currentRefs.length * 5;
  const missingPenalty = missingPractices.length * 10;
  const riskScore = clamp(outdatedScore - currentBonus + missingPenalty, 0, 100);

  let riskLevel: "Low" | "Medium" | "High" | "Critical";
  if (riskScore >= 75) riskLevel = "Critical";
  else if (riskScore >= 50) riskLevel = "High";
  else if (riskScore >= 25) riskLevel = "Medium";
  else riskLevel = "Low";

  return { outdated_references: outdatedRefs, missing_current_practices: missingPractices, risk_level: riskLevel, risk_score: riskScore };
}

function analyzeHypeReality(text: string, sentences: string[]): HypeReality {
  const positive = countPatterns(text, [
    "revolutionary", "breakthrough", "game-changing", "incredible", "amazing",
    "unprecedented", "exceptional", "extraordinary", "outstanding", "remarkable",
    "massive opportunity", "enormous potential", "significant advantage",
    "will transform", "will revolutionize",
  ]);
  const negative = countPatterns(text, [
    "risk", "challenge", "limitation", "failure", "drawback", "concern",
    "caveat", "downside", "might fail", "key risks", "potential issues",
    "difficult", "complex", "costly",
  ]);

  const total = positive + negative || 1;
  const positivePct = Math.round((positive / total) * 100);

  const failureAck = sentences.filter((s) =>
    /\b(fail|failure|why this might|what could go wrong|risk|challenge)\b/i.test(s)
  ).length;

  let classification: "Balanced Analysis" | "Optimistic" | "Sales Propaganda";
  if (positivePct > 90 && failureAck === 0) classification = "Sales Propaganda";
  else if (positivePct > 75) classification = "Optimistic";
  else classification = "Balanced Analysis";

  const hypeScore = clamp(positivePct - (failureAck * 5), 0, 100);
  const balanceAssessment = positivePct >= 60 && positivePct <= 80
    ? "Within optimal credibility range (60-80% positive)"
    : positivePct > 80
      ? `Excessively positive (${positivePct}%) with ${failureAck} risk acknowledgments`
      : `Cautious tone (${positivePct}% positive)`;

  return { positive_sentiment_pct: positivePct, risk_mentions: negative, failure_acknowledgments: failureAck, balance_assessment: balanceAssessment, hype_score: hypeScore, classification };
}

function analyzeRegulatorySafety(text: string): RegulatoryEthicalSafety {
  const regMentions = findMatches(text, REGULATORY_TERMS);
  const ethMentions = findMatches(text, ETHICAL_TERMS);
  const privMentions = findMatches(text, PRIVACY_TERMS);

  const redFlags: string[] = [];
  // Check for data scraping without compliance
  if (/\b(scraping|crawling|data collection)\b/i.test(text) && regMentions.length === 0) {
    redFlags.push("Data collection mentioned without regulatory compliance references");
  }
  if (/\b(automated decision|auto-decision|machine decision)\b/i.test(text) && ethMentions.length === 0) {
    redFlags.push("Automated decision-making without bias assessment mentions");
  }
  if (/\b(cross-border|international data|global deployment)\b/i.test(text) && !text.toLowerCase().includes("data residency")) {
    redFlags.push("Cross-border operations without data residency consideration");
  }
  if (/\b(AI|machine learning|ML)\b/i.test(text) && ethMentions.length === 0 && regMentions.length === 0) {
    redFlags.push("AI/ML implementation proposed without ethical or regulatory framework");
  }

  const safetyScore = clamp(100 - (redFlags.length * 20) + (regMentions.length + ethMentions.length + privMentions.length) * 5, 0, 100);
  let safetyLevel: "Safe" | "Caution" | "High Risk";
  if (safetyScore >= 70) safetyLevel = "Safe";
  else if (safetyScore >= 40) safetyLevel = "Caution";
  else safetyLevel = "High Risk";

  return { regulatory_mentions: regMentions, ethical_mentions: ethMentions, privacy_mentions: privMentions, red_flags: redFlags, safety_level: safetyLevel, safety_score: safetyScore };
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL & DATA INTENSITY
// ═══════════════════════════════════════════════════════════════════════════

function analyzeVisualIntensity(text: string): VisualIntensity {
  const diagramRefs = countPatterns(text, ["diagram", "figure", "chart", "graph", "illustration", "infographic", "visual", "screenshot", "image"]);
  const formattingRefs = countPatterns(text, ["table", "bullet", "numbered list", "heading", "sidebar", "callout", "highlight"]);
  const markdownFormatting = (text.match(/^#{1,6}\s/gm) || []).length + (text.match(/^\s*[-*]\s/gm) || []).length;

  const score = clamp(Math.round((diagramRefs * 1.5 + formattingRefs + markdownFormatting * 0.3) / 3), 1, 10);
  const assessment = score >= 8 ? "High visual density — excellent for presentations" : score >= 5 ? "Moderate visual elements — balanced" : "Text-heavy — limited visual support";

  return { score, diagram_references: diagramRefs, formatting_richness: formattingRefs + markdownFormatting, assessment };
}

function analyzeDataIntensity(text: string): DataIntensity {
  const tables = countPatterns(text, ["table", /\|.*\|.*\|/g]);
  const citations = countPatterns(text, [/\[\d+\]/g, /\(\d{4}\)/g, /et al\./gi, "ibid", "op. cit."]);
  const statistics = (text.match(/\b\d+[\d,.]*%/g) || []).length + countPatterns(text, [/\$[\d,.]+[BMKk]?/g, /\d+x\b/g]);

  const score = clamp(Math.round((tables * 2 + citations * 0.5 + statistics) / 5), 1, 10);
  const assessment = score >= 8 ? "Data-rich — strong evidentiary foundation" : score >= 5 ? "Moderate data density — reasonably supported" : "Data-sparse — assertions may lack empirical support";

  return { score, tables_detected: tables, citations_detected: citations, statistics_detected: statistics, assessment };
}

// ═══════════════════════════════════════════════════════════════════════════
// BIAS DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function analyzeBias(text: string, sentences: string[]): BiasDetection {
  const biases: BiasInstance[] = [];

  // Confirmation Bias: only success stories
  const successStories = countPatterns(text, ["success", "achieved", "improved", "increased", "growth"]);
  const failureStories = countPatterns(text, ["failed", "failure", "decreased", "lost", "unsuccessful"]);
  if (successStories > 5 && failureStories === 0) {
    biases.push({ type: "Confirmation", evidence: `${successStories} success references with zero failure acknowledgments`, severity: "High" });
  } else if (successStories > failureStories * 5) {
    biases.push({ type: "Confirmation", evidence: `${successStories}:${failureStories} success-to-failure ratio is heavily skewed`, severity: "Medium" });
  }

  // Survival Bias
  const caseStudies = countPatterns(text, ["case study", "example", "client story", "use case"]);
  if (caseStudies > 2 && failureStories === 0) {
    biases.push({ type: "Survival", evidence: `${caseStudies} case studies presented without any failed project examples`, severity: "Medium" });
  }

  // Selection Bias
  const cherryPick = sentences.filter((s) => /\b(for example|such as|one client|a notable)\b/i.test(s) && /\b(best|top|leading|successful)\b/i.test(s));
  if (cherryPick.length > 2) {
    biases.push({ type: "Selection", evidence: "Multiple examples appear cherry-picked from best-case scenarios", severity: "Medium" });
  }

  // Recency Bias
  const recentYears = countPatterns(text, [/\b202[4-6]\b/g]);
  const olderYears = countPatterns(text, [/\b20[0-1]\d\b/g, /\b202[0-3]\b/g]);
  if (recentYears > 5 && olderYears === 0) {
    biases.push({ type: "Recency", evidence: `All ${recentYears} date references are recent with no historical context`, severity: "Low" });
  }

  // Authority Bias
  const authorityAppeals = countPatterns(text, ["Gartner says", "according to Gartner", "Forrester predicts", "McKinsey reports", "experts agree"]);
  const empiricalEvidence = countPatterns(text, ["our data shows", "we measured", "experiment results", "statistically significant", "our findings"]);
  if (authorityAppeals > 3 && empiricalEvidence === 0) {
    biases.push({ type: "Authority", evidence: `${authorityAppeals} authority appeals without independent empirical validation`, severity: "Medium" });
  }

  const overallScore = clamp(biases.reduce((sum, b) => sum + (b.severity === "High" ? 30 : b.severity === "Medium" ? 15 : 5), 0), 0, 100);

  return { biases, overall_bias_score: overallScore };
}

// ═══════════════════════════════════════════════════════════════════════════
// AMAZING FACTS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractAmazingFacts(text: string, sentences: string[]): AmazingFact[] {
  const facts: AmazingFact[] = [];

  // Look for specific quantified claims
  const quantifiedSentences = sentences.filter((s) => /\b\d+[\d,.]*%?\b/.test(s) && s.length > 30 && s.length < 200);

  // Look for contrarian statements
  const contrarianSentences = sentences.filter((s) =>
    /\b(however|contrary|surprisingly|counterintuitively|despite|unlike|dropped|decreased|failed)\b/i.test(s)
  );

  // Score and pick the best
  const candidates = [
    ...quantifiedSentences.map((s) => ({ sentence: s, contrarian: false, quantified: true })),
    ...contrarianSentences.map((s) => ({ sentence: s, contrarian: true, quantified: /\d/.test(s) })),
  ];

  // Deduplicate and take top 5
  const seen = new Set<string>();
  for (const c of candidates) {
    const key = c.sentence.slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);

    const isAmazing = c.contrarian || (c.quantified && /\b(first|only|unique|never|record|breakthrough)\b/i.test(c.sentence));
    facts.push({
      fact: c.sentence.slice(0, 200),
      why_amazing: c.contrarian
        ? "Contradicts conventional wisdom with specific evidence"
        : c.quantified
          ? "Provides specific quantified claim for verification"
          : "Contains notable assertion",
      is_contrarian: c.contrarian,
      is_quantified: c.quantified,
    });
    if (facts.length >= 5) break;
  }

  // If we don't have enough, add generic notable sentences
  if (facts.length < 3) {
    const notable = sentences.filter((s) => s.length > 50 && s.length < 200 && /\b(key|critical|essential|important|significant)\b/i.test(s));
    for (const s of notable.slice(0, 5 - facts.length)) {
      facts.push({ fact: s.slice(0, 200), why_amazing: "Identified as a key claim in the document", is_contrarian: false, is_quantified: /\d/.test(s) });
    }
  }

  return facts;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERALL TRUST SCORE COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

function computeOverallTrust(result: Omit<AnalysisResult, "overall_trust_score" | "summary">): number {
  const scores = [
    { weight: 0.15, score: result.provider_consumer.composite_score },
    { weight: 0.10, score: result.rarity_index.composite_score },
    { weight: 0.15, score: 100 - result.forensics.deception.manipulation_index },
    { weight: 0.10, score: 100 - result.forensics.fluff.fluff_score },
    { weight: 0.15, score: result.implementation_readiness.readiness_score * 10 },
    { weight: 0.10, score: 100 - result.obsolescence_risk.risk_score },
    { weight: 0.10, score: 100 - result.hype_reality.hype_score },
    { weight: 0.10, score: result.regulatory_safety.safety_score },
    { weight: 0.05, score: 100 - result.bias_detection.overall_bias_score },
  ];

  return clamp(Math.round(scores.reduce((sum, s) => sum + s.weight * s.score, 0)), 0, 100);
}

function generateSummary(result: AnalysisResult): string {
  const parts: string[] = [];

  // Provider/Consumer
  if (result.provider_consumer.classification === "Provider-Favored") {
    parts.push(`This document appears vendor-centric (${result.provider_consumer.classification}, ${result.provider_consumer.confidence}% confidence), suggesting it primarily serves the service provider's interests.`);
  } else if (result.provider_consumer.classification === "Consumer-Favored") {
    parts.push(`This document is consumer-oriented (${result.provider_consumer.confidence}% confidence), designed to empower the reader.`);
  } else {
    parts.push(`The document shows balanced provider/consumer orientation.`);
  }

  // Forensics
  const mi = result.forensics.deception.manipulation_index;
  if (mi > 40) {
    parts.push(`Content forensics detected a high manipulation index of ${mi}/100 with ${result.forensics.deception.weasel_words.length} types of weasel words.`);
  } else if (mi > 20) {
    parts.push(`Moderate linguistic manipulation detected (index: ${mi}/100).`);
  }

  // Actionability
  parts.push(`Implementation readiness: ${result.implementation_readiness.verdict} (score: ${result.implementation_readiness.readiness_score}/10).`);

  // Rarity
  parts.push(`Content uniqueness: ${result.rarity_index.classification} (${result.rarity_index.composite_score}/100).`);

  // Target
  parts.push(`Targeted at ${result.audience_level.classification}-level audience within ${result.target_scale.classification}-scale organizations.`);

  return parts.join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// HEURISTIC PRE-PASS (exported for Gemini pipeline)
// ═══════════════════════════════════════════════════════════════════════════

export interface HeuristicPrePass {
  fluff: FluffIndex;
  data_intensity: DataIntensity;
  deception_raw: DeceptionDetection;
  regulatory_raw: {
    regulatory_mentions: string[];
    ethical_mentions: string[];
    privacy_mentions: string[];
  };
  word_count: number;
  sentence_count: number;
}

export function runHeuristicPrePass(text: string): HeuristicPrePass {
  const sentences = extractSentences(text);
  const wordCount = text.split(/\s+/).length;

  return {
    fluff: analyzeFluffIndex(text),
    data_intensity: analyzeDataIntensity(text),
    deception_raw: analyzeDeception(text, sentences),
    regulatory_raw: {
      regulatory_mentions: findMatches(text, REGULATORY_TERMS),
      ethical_mentions: findMatches(text, ETHICAL_TERMS),
      privacy_mentions: findMatches(text, PRIVACY_TERMS),
    },
    word_count: wordCount,
    sentence_count: sentences.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT — Heuristic Only (fallback)
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeDocument(text: string): Promise<AnalysisResult> {
  // Simulate slight processing delay for UX
  await new Promise((r) => setTimeout(r, 1200));

  const sentences = extractSentences(text);

  // Run all modules
  const provider_consumer = analyzeProviderConsumer(text, sentences);
  const company_scale = analyzeCompanyScale(text);
  const target_scale = analyzeTargetScale(text);
  const audience_level = analyzeAudienceLevel(text);
  const rarity_index = analyzeRarityIndex(text, sentences);
  const forensics = analyzeForensics(text, sentences);
  const implementation_readiness = analyzeImplementationReadiness(text);
  const obsolescence_risk = analyzeObsolescenceRisk(text);
  const hype_reality = analyzeHypeReality(text, sentences);
  const regulatory_safety = analyzeRegulatorySafety(text);
  const visual_intensity = analyzeVisualIntensity(text);
  const data_intensity = analyzeDataIntensity(text);
  const bias_detection = analyzeBias(text, sentences);
  const amazing_facts = extractAmazingFacts(text, sentences);

  const partial = {
    provider_consumer, company_scale, target_scale, audience_level,
    rarity_index, forensics, implementation_readiness, obsolescence_risk,
    hype_reality, regulatory_safety, visual_intensity, data_intensity,
    bias_detection, amazing_facts, linkedin_hashtags: DEFAULT_LINKEDIN_HASHTAGS,
  };

  const overall_trust_score = computeOverallTrust(partial);
  const result: AnalysisResult = { ...partial, overall_trust_score, summary: "" };
  result.summary = generateSummary(result);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI-ENHANCED ENTRY POINT
// Merges heuristic pre-pass with Gemini layered results
// ═══════════════════════════════════════════════════════════════════════════

export function mergeGeminiResults(
  heuristic: HeuristicPrePass,
  geminiLayers: { layer1: Record<string, unknown>; layer2: Record<string, unknown>; layer3: Record<string, unknown>; layer4: Record<string, unknown> },
): AnalysisResult {
  const L1 = geminiLayers.layer1 as Record<string, unknown>;
  const L2 = geminiLayers.layer2 as Record<string, unknown>;
  const L3 = geminiLayers.layer3 as Record<string, unknown>;
  const L4 = geminiLayers.layer4 as Record<string, unknown>;

  // ── Helper to safely extract with defaults ────────────────────────────
  const safe = <T>(val: unknown, fallback: T): T => {
    if (val === undefined || val === null) return fallback;
    return val as T;
  };

  // ── Forensics: heuristic counts + Gemini judgment ─────────────────────
  const deceptionJudgment = safe(L1.deception_judgment, { manipulation_index: heuristic.deception_raw.manipulation_index, rationale: "" }) as { manipulation_index: number; rationale: string };

  const forensics: ContentForensicsResult = {
    deception: {
      ...heuristic.deception_raw,
      manipulation_index: clamp(Math.round(deceptionJudgment.manipulation_index), 0, 100),
      manipulation_rationale: deceptionJudgment.rationale || undefined,
    },
    fallacies: safe(L1.fallacies, { fallacies: [], fallacy_density: 0 }) as FallacyDetection,
    fluff: heuristic.fluff,
  };

  // ── Visual Intensity: from Gemini multimodal ──────────────────────────
  const visual_intensity = safe(L1.visual_intensity, { score: 1, diagram_references: 0, formatting_richness: 0, assessment: "Unable to assess" }) as VisualIntensity;
  visual_intensity.score = clamp(Math.round(visual_intensity.score), 1, 10);

  // ── Regulatory: heuristic mentions + Gemini judgment ──────────────────
  const regJudgment = safe(L1.regulatory_judgment, { red_flags: [], safety_level: "Caution", safety_score: 50 }) as { red_flags: string[]; safety_level: string; safety_score: number };
  const regulatory_safety: RegulatoryEthicalSafety = {
    regulatory_mentions: heuristic.regulatory_raw.regulatory_mentions,
    ethical_mentions: heuristic.regulatory_raw.ethical_mentions,
    privacy_mentions: heuristic.regulatory_raw.privacy_mentions,
    red_flags: regJudgment.red_flags,
    safety_level: (["Safe", "Caution", "High Risk"].includes(regJudgment.safety_level) ? regJudgment.safety_level : "Caution") as "Safe" | "Caution" | "High Risk",
    safety_score: clamp(Math.round(regJudgment.safety_score), 0, 100),
  };

  // ── Layer 2: Bias, Obsolescence, Implementation ───────────────────────
  const biasRaw = safe(L2.bias_detection, { biases: [], overall_bias_score: 0 }) as { biases: BiasInstance[]; overall_bias_score: number };
  const bias_detection: BiasDetection = {
    biases: biasRaw.biases,
    overall_bias_score: clamp(Math.round(biasRaw.overall_bias_score), 0, 100),
  };

  const obsRaw = safe(L2.obsolescence_risk, { outdated_references: [], missing_current_practices: [], risk_level: "Medium", risk_score: 50 }) as ObsolescenceRisk;
  const obsolescence_risk: ObsolescenceRisk = {
    ...obsRaw,
    risk_level: (["Low", "Medium", "High", "Critical"].includes(obsRaw.risk_level) ? obsRaw.risk_level : "Medium") as "Low" | "Medium" | "High" | "Critical",
    risk_score: clamp(Math.round(obsRaw.risk_score), 0, 100),
  };

  const implRaw = safe(L2.implementation_readiness, { artifact_presence: [], resource_clarity_score: 5, timeline_reality_score: 5, prerequisite_check_score: 5, readiness_score: 5, verdict: "Partially Actionable" }) as ImplementationReadiness;
  const implementation_readiness: ImplementationReadiness = {
    ...implRaw,
    readiness_score: clamp(Math.round(implRaw.readiness_score), 1, 10),
    resource_clarity_score: clamp(Math.round(implRaw.resource_clarity_score), 1, 10),
    timeline_reality_score: clamp(Math.round(implRaw.timeline_reality_score), 1, 10),
    prerequisite_check_score: clamp(Math.round(implRaw.prerequisite_check_score), 1, 10),
    verdict: (["Theoretical Only", "Partially Actionable", "Implementation Ready"].includes(implRaw.verdict) ? implRaw.verdict : "Partially Actionable") as "Theoretical Only" | "Partially Actionable" | "Implementation Ready",
  };

  // ── Layer 3: Strategic Classifications ─────────────────────────────────
  const safeModule = (raw: unknown, fallbackClass: string) => {
    const m = safe(raw, { drivers: [], composite_score: 50, confidence: 50, classification: fallbackClass }) as { drivers: WeightedDriver[]; composite_score: number; confidence: number; classification: string };
    return {
      drivers: m.drivers,
      composite_score: clamp(Math.round(m.composite_score), 0, 100),
      confidence: clamp(Math.round(m.confidence), 0, 100),
      classification: m.classification,
    };
  };

  const provider_consumer = safeModule(L3.provider_consumer, "Balanced") as ProviderConsumerModule;
  const company_scale = safeModule(L3.company_scale, "Mid-tier") as CompanyScaleModule;
  const target_scale = safeModule(L3.target_scale, "SME") as TargetScaleModule;
  const audience_level = safeModule(L3.audience_level, "Manager") as AudienceLevelModule;

  // ── Layer 4: Synthesis ────────────────────────────────────────────────
  const hypeRaw = safe(L4.hype_reality, { positive_sentiment_pct: 50, risk_mentions: 0, failure_acknowledgments: 0, balance_assessment: "", hype_score: 50, classification: "Balanced Analysis" }) as HypeReality;
  const hype_reality: HypeReality = {
    ...hypeRaw,
    positive_sentiment_pct: clamp(Math.round(hypeRaw.positive_sentiment_pct), 0, 100),
    hype_score: clamp(Math.round(hypeRaw.hype_score), 0, 100),
    classification: (["Balanced Analysis", "Optimistic", "Sales Propaganda"].includes(hypeRaw.classification) ? hypeRaw.classification : "Balanced Analysis") as "Balanced Analysis" | "Optimistic" | "Sales Propaganda",
  };

  const rarityRaw = safe(L4.rarity_index, { drivers: [], composite_score: 50, confidence: 50, classification: "Differentiated" }) as RarityIndexModule;
  const rarity_index: RarityIndexModule = {
    drivers: rarityRaw.drivers,
    composite_score: clamp(Math.round(rarityRaw.composite_score), 0, 100),
    confidence: clamp(Math.round(rarityRaw.confidence), 0, 100),
    classification: (["Commodity", "Differentiated", "Category-Defining"].includes(rarityRaw.classification) ? rarityRaw.classification : "Differentiated") as "Commodity" | "Differentiated" | "Category-Defining",
  };

  const amazing_facts = safe(L4.amazing_facts, []) as AmazingFact[];
  const overall_trust_score = clamp(Math.round(safe(L4.overall_trust_score, 50) as number), 0, 100);
  const summary = safe(L4.summary, "Analysis complete.") as string;
  const rawHashtags = safe(L4.linkedin_hashtags, []) as string[];
  const linkedin_hashtags = rawHashtags.length > 0 ? rawHashtags : DEFAULT_LINKEDIN_HASHTAGS;

  return {
    overall_trust_score,
    summary,
    provider_consumer,
    company_scale,
    target_scale,
    audience_level,
    rarity_index,
    forensics,
    implementation_readiness,
    obsolescence_risk,
    hype_reality,
    regulatory_safety,
    visual_intensity,
    data_intensity: heuristic.data_intensity,
    bias_detection,
    amazing_facts,
    linkedin_hashtags,
  };
}
