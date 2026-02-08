// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive Tooltip Dictionary
// Every label, header, keyword, and metric in the dashboard explained.
// Updated for hybrid Gemini AI + heuristic engine architecture.
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLTIPS = {
  // ── Overall ──────────────────────────────────────────────────────────────
  overall_trust_score:
    "AI-generated composite score (0-100) synthesizing all analysis modules. Gemini evaluates forensics, readiness, obsolescence, hype, bias, and strategic positioning to produce a holistic trust rating.",
  file_hash:
    "SHA-256 fingerprint of the uploaded file. Used to detect duplicate uploads — if the same file is uploaded again, the existing report is shown.",

  // ── Classification Strip ─────────────────────────────────────────────────
  provider_consumer_label:
    "AI classification of who benefits most from this document — the service provider (vendor) or the service consumer (reader/client). Powered by Gemini analysis of intent and language patterns.",
  originator_scale_label:
    "AI detection of whether this was created by a solo consultant, boutique firm, or a Big 4 / Global System Integrator (GSI). Gemini evaluates tone, structure, and branding signals.",
  target_company_label:
    "AI identification of the intended organizational scale — startup, SME, or enterprise — based on governance, budget, and security language patterns.",
  audience_level_label:
    "AI assessment of who should read this document — developers, managers, VPs, or C-suite executives — based on language sophistication and decision scope.",
  uniqueness_label:
    "AI evaluation of content originality. Commodity = repackaged conventional wisdom. Category-Defining = genuinely novel insights. Gemini compares against general industry knowledge.",
  confidence:
    "AI confidence in the classification. Higher % means Gemini found stronger, more consistent signals across the document.",

  // ── Module 1: Provider vs Consumer ───────────────────────────────────────
  section_provider_consumer:
    "Gemini analyzes whether the document primarily serves vendor interests (upselling, lock-in) or empowers the reader to act independently. Uses deception and bias context from prior analysis layers.",
  driver_problem_definition:
    "Does the document frame the problem as needing external help (provider-favored) or as something your team can solve internally (consumer-favored)?",
  driver_vendor_lockin:
    "Measures dependency creation on specific vendors, proprietary tools, or locked-in methodologies. Open/interoperable = better for consumer.",
  driver_implementation_autonomy:
    "Can the reader execute the recommendations independently, or does it require hiring the vendor? More autonomy = consumer-favored.",
  driver_upsell_visibility:
    "Presence of 'Phase 2' mentions, premium tiers, 'contact us for more', or expansion opportunities that suggest revenue generation motive.",
  driver_risk_transfer:
    "Who bears the implementation risk — the vendor (consumer benefit with SLAs/guarantees) or the client (provider benefit)?",

  // ── Module 2: Originator Scale ───────────────────────────────────────────
  section_company_scale:
    "Gemini classifies the likely originator's company size based on framework sophistication, data depth, branding signals, service breadth, and legal language.",
  driver_framework_proprietary:
    "Generic frameworks (SWOT, Porter's) suggest smaller firms. Branded/proprietary IP suggests Big 4/GSI scale.",
  driver_data_scope:
    "Desk research and secondary citations suggest smaller firms. Primary global surveys and benchmarking data suggest GSI resources.",
  driver_design_polish:
    "Template-based content suggests solo/boutique. Studio-grade branding with ©, ®, ™ marks suggests larger firms.",
  driver_service_breadth:
    "Niche specialization suggests boutique. End-to-end transformation capability suggests larger firms.",
  driver_legal_compliance:
    "Informal language suggests smaller operations. Heavy disclaimers, NDA language, and liability terms suggest GSI legal departments.",

  // ── Module 3: Target Scale ───────────────────────────────────────────────
  section_target_scale:
    "Gemini determines the intended organizational audience — startup (agile/MVP), SME (balanced), or enterprise (governance/compliance-heavy).",
  driver_governance:
    "Mentions of teams (low complexity) vs. steering committees/board approval (high complexity) indicate target organization size.",
  driver_cross_functional:
    "Single department scope suggests startup/SME. Enterprise-wide transformation requirements suggest large organizations.",
  driver_legacy_integration:
    "Greenfield/build-new approaches suggest startups. Legacy modernization/migration strategies suggest enterprises.",
  driver_budget_resource:
    "SaaS subscriptions suggest small scale. Multi-year capital transformation programs suggest enterprise budgets.",
  driver_risk_security:
    "Basic security suggests startup. SOC2/GDPR/enterprise risk management frameworks suggest enterprise compliance requirements.",

  // ── Module 4: Audience Level ─────────────────────────────────────────────
  section_audience_level:
    "Gemini identifies the ideal reader based on strategic vs. tactical ratio, financial metrics, technical depth, and decision scope.",
  driver_strategic_tactical:
    "Implementation details and how-to content targets developers/managers. Market impact and ROI discussions target VP/C-suite.",
  driver_financial_metric:
    "Feature lists suggest developer/manager audience. EBITDA/NPV/CapEx discussions suggest C-level financial decision-makers.",
  driver_technical_jargon:
    "API/Python/Docker specifics target developers. Business transformation language targets executives.",
  driver_actionable_horizon:
    "Immediate actions ('do this today') target implementers. Multi-year roadmaps target strategic decision-makers.",
  driver_decision_scope:
    "Tool selection decisions target managers. Business model pivots and investment decisions target C-suite.",

  // ── Module 5: Rarity Index ───────────────────────────────────────────────
  section_rarity_index:
    "Gemini evaluates content uniqueness by comparing against its knowledge of common industry content. Commodity = widely available. Category-Defining = genuinely novel.",
  driver_primary_data:
    "Aggregated secondary sources (low originality) vs. proprietary experiments, surveys, or primary research (high originality).",
  driver_contrarian_factor:
    "Does it align with current hype (low uniqueness) or present defensible contrarian positions (high uniqueness)?",
  driver_framework_novelty:
    "Standard frameworks like SWOT suggest commodity thinking. Novel mental models and original methodologies are more valuable.",
  driver_predictive_specificity:
    "Vague trend mentions ('AI will grow') are commodity. Specific, falsifiable predictions with timelines are category-defining.",
  driver_case_study_transparency:
    "Anonymous examples ('a large bank') are low value. Named, verifiable implementations build credibility and uniqueness.",

  // ── Content Forensics ────────────────────────────────────────────────────
  section_forensics:
    "Hybrid analysis: heuristic engine counts manipulative patterns (weasel words, puffery, urgency), then Gemini judges the overall manipulation severity and detects logical fallacies that require understanding argument structure.",
  manipulation_index:
    "Hybrid score (0-100): heuristic counts weasel words, puffery, urgency, passive voice, and jargon. Gemini then judges overall manipulation severity considering not just quantity but context and intent. Scores >40 are flagged.",
  weasel_words:
    "Heuristic detection: accountability-destroying phrases like 'arguably', 'up to', 'may contribute' that transform claims into unfalsifiable statements.",
  percentage_puffery:
    "Heuristic detection: metrics without baselines — e.g., '300% growth' could mean going from 1 user to 4 users. Creates illusion of scale.",
  false_urgency:
    "Heuristic detection: artificial time pressure like 'window is closing' or 'act now' that triggers emotional decision-making over rational analysis.",
  jargon_masking:
    "Heuristic detection: complex phrases concealing simple ideas — e.g., 'synergistic paradigm shift' instead of 'working together differently'.",
  passive_voice:
    "Heuristic detection: responsibility obscuration — 'mistakes were made' instead of 'we failed'. Shields accountability for negative outcomes.",

  // ── Logical Fallacies ────────────────────────────────────────────────────
  section_fallacies:
    "Gemini-powered detection of logical reasoning errors. Unlike keyword matching, AI understands argument structure to identify straw man arguments, false dichotomies, and other fallacies in context.",
  fallacy_density:
    "Number of AI-detected logical fallacies per 1,000 words. Higher density indicates weaker logical foundations in the document.",
  fallacy_straw_man:
    "Attacking weakened versions of competitor arguments rather than their actual positions.",
  fallacy_false_dichotomy:
    "Binary framing like 'Adopt AI or go bankrupt' that eliminates nuanced middle-ground options.",
  fallacy_appeal_authority:
    "Using 'As Gartner says...' without contextual evidence. Substitutes reputation for actual data.",
  fallacy_post_hoc:
    "Assuming causation from correlation — 'After implementing X, revenue grew 40%' doesn't prove X caused it.",
  fallacy_sunk_cost:
    "Arguing to continue projects solely because of prior investment rather than future value.",

  // ── Fluff Index ──────────────────────────────────────────────────────────
  section_fluff:
    "Fully heuristic analysis: quantifies readability complexity relative to substantive value using mathematical formulas (Gunning Fog) and pattern counting. No AI judgment needed — pure computation.",
  fluff_score:
    "Heuristic score (0-100) from Gunning Fog Index, adjective/verb ratio, and unique data points. >60 = low information density.",
  fog_index:
    "Gunning Fog Index — mathematical formula estimating years of education needed to understand the text. >18 = academic paper level, <12 = accessible.",
  adjective_verb_ratio:
    "Heuristic ratio of descriptive words to action words. Higher ratio means more description than substance. >3 = excessive.",
  unique_data_points:
    "Heuristic count of concrete, verifiable numbers, percentages, and dates in the document. More data points = more substantive content.",
  buzzwords:
    "Heuristic detection against a curated dictionary of ~80 marketing buzzwords. Count indicates impression-over-information tendency.",
  action_verbs:
    "Heuristic detection against a curated dictionary of ~60 implementation verbs. Higher counts indicate more practical, actionable content.",

  // ── Implementation Readiness ─────────────────────────────────────────────
  section_implementation:
    "Gemini evaluates the gap between conceptual description and executable implementation. AI assesses whether artifacts, timelines, and resources are genuine or superficial.",
  readiness_score:
    "AI-generated score (1-10) from artifact presence (30%), resource clarity (25%), timeline reality (25%), and prerequisite checks (20%).",
  artifact_presence:
    "Gemini checks for code snippets, config files, checklists, architecture diagrams, templates, and API definitions — assessing quality, not just presence.",
  resource_clarity:
    "AI assessment: are specific roles defined? (e.g., 'need 1 Data Engineer with 3+ years') vs. vague references to 'resources needed'.",
  timeline_reality:
    "AI assessment: are timelines specific and realistic, or vague ('future state', 'when ready')? Gemini can judge if timelines are realistic for the scope.",
  prerequisite_check:
    "AI assessment: are starting requirements clearly stated, or does the document assume everything is ready?",

  // ── Obsolescence Risk ────────────────────────────────────────────────────
  section_obsolescence:
    "Gemini identifies outdated technology recommendations using its knowledge of the current technology landscape. More accurate than static keyword lists for fast-moving fields.",
  outdated_references:
    "AI-detected technologies that are no longer current best practice — Gemini knows what's outdated in 2026, not just what's on a static list.",
  missing_current_practices:
    "AI-detected gaps: important current technologies not mentioned. Gemini knows what should be discussed in a modern document on the topic.",

  // ── Hype vs Reality ──────────────────────────────────────────────────────
  section_hype:
    "Gemini meta-analysis using all prior findings to judge whether the document is balanced, optimistic, or sales propaganda. Considers deception, bias, and sentiment in context.",
  hype_score:
    "AI-generated optimism score (0-100). Optimal credibility range is 60-80% positive. >80 = potentially unrealistic.",
  positive_sentiment:
    "AI-measured percentage of positive/promotional language vs. balanced or cautionary language.",
  risk_mentions:
    "AI count of risk, challenge, limitation, and failure references. Credible documents acknowledge what could go wrong.",
  failure_acknowledgments:
    "AI detection of 'Why this might fail' or 'Key Risks' sections. These dramatically increase document credibility.",

  // ── Regulatory & Ethics ──────────────────────────────────────────────────
  section_regulatory:
    "Hybrid: heuristic engine finds regulatory/ethical/privacy keyword mentions, then Gemini judges the safety level and identifies contextual red flags that keyword matching alone would miss.",
  safety_score:
    "Hybrid score (0-100): heuristic counts regulatory mentions, Gemini judges whether the document's proposals have adequate compliance coverage.",
  regulatory_mentions:
    "Heuristic detection: references to GDPR, EU AI Act, CCPA, SOC2, HIPAA, ISO 27001.",
  ethical_mentions:
    "Heuristic detection: references to bias mitigation, fairness, transparency, and responsible AI practices.",
  red_flags_safety:
    "Gemini-detected: critical omissions like proposing data scraping without compliance, or AI deployment without bias assessment. Requires contextual understanding.",

  // ── Composition ──────────────────────────────────────────────────────────
  section_composition:
    "Evaluates document presentation format. Visual Intensity uses Gemini multimodal (sees actual page images). Data Intensity uses heuristic pattern counting.",
  visual_intensity:
    "Gemini multimodal score (1-10): AI examines actual PDF page images to see charts, diagrams, infographics, and formatting. Not limited to text keyword references — can see captionless visuals.",
  data_intensity:
    "Heuristic score (1-10) measuring tables, citations, and statistical density through pattern matching. Deterministic and consistent.",
  diagrams:
    "Gemini multimodal count: AI sees and counts actual visual elements in page images, including charts without captions.",
  citations:
    "Heuristic count of academic-style citations and source references using pattern matching.",
  tables:
    "Heuristic count of table references and structured data patterns.",
  statistics:
    "Heuristic count of specific numerical claims, percentages, and financial figures in the document.",

  // ── Bias Detection ───────────────────────────────────────────────────────
  section_bias:
    "Gemini-powered detection of five cognitive biases. AI understands what evidence is being selectively presented, unlike keyword matching which can only detect surface patterns.",
  overall_bias_score:
    "AI-generated bias score (0-100). Gemini evaluates evidence selectivity, narrative framing, and argument balance to assess overall bias.",
  bias_confirmation:
    "AI-detected: only presenting successful case studies without failures. Gemini understands the narrative structure, not just word counts.",
  bias_survival:
    "AI-detected: ignoring failed projects in sector analysis. Gemini recognizes when only 'winners' are discussed.",
  bias_selection:
    "AI-detected: cherry-picked data supporting predetermined conclusions. Gemini can identify when examples are strategically chosen.",
  bias_recency:
    "AI-detected: over-weighting recent events while ignoring historical patterns. Gemini provides temporal context awareness.",
  bias_authority:
    "AI-detected: over-reliance on expert opinions without independent empirical validation.",

  // ── Key Findings ─────────────────────────────────────────────────────────
  section_findings:
    "Gemini extracts genuinely surprising and noteworthy findings using comprehension, not just pattern matching. AI understands what's novel vs. obvious in the document's domain.",
  contrarian_tag:
    "AI-identified: this finding contradicts conventional wisdom, making it potentially more valuable if well-supported.",
  quantified_tag:
    "AI-identified: this finding includes specific numbers or data that can be independently verified.",

  // ── Section Headers ──────────────────────────────────────────────────────
  header_core_modules:
    "Gemini classifies the document across five strategic dimensions: who it serves, who wrote it, who it's for, and how unique it is. Informed by forensic analysis from prior layers.",
  header_forensics:
    "Hybrid analysis: heuristic engine counts patterns, Gemini judges severity and detects logical fallacies requiring argument comprehension.",
  header_advanced:
    "Gemini-powered assessment: implementation readiness, technology currency, optimism balance, and regulatory compliance — all requiring contextual AI judgment.",
  header_composition:
    "Mixed analysis: Gemini multimodal for visuals, heuristic for data density, Gemini for bias detection and key findings extraction.",

  // ── Home Page Feature Pills ──────────────────────────────────────────────
  pill_provider_consumer:
    "Gemini AI detects whether a document serves the vendor's revenue interests or empowers the reader with actionable knowledge.",
  pill_decision_modules:
    "Five AI-powered scoring modules classify the document across strategic dimensions using weighted driver analysis informed by forensic pre-analysis.",
  pill_content_forensics:
    "Hybrid engine: heuristic counts weasel words, puffery, urgency, and jargon. Gemini judges manipulation severity and detects logical fallacies.",
  pill_bias_detection:
    "Gemini AI identifies confirmation, survival, selection, recency, and authority biases by understanding argument structure and evidence selectivity.",
  pill_hype_reality:
    "Gemini meta-analysis measuring the balance between promotional optimism and honest risk acknowledgment, informed by all prior analysis layers.",
  pill_implementation:
    "Gemini evaluates whether the document provides genuine executable guidance or is purely theoretical, assessing artifact quality and timeline realism.",
  pill_weighted_scoring:
    "All modules use weighted composite scoring. Heuristic provides hard numbers; Gemini provides judgment scores. Both feed into the final weighted result.",
} as const;

/**
 * Helper to look up a tooltip by key. Returns undefined if not found.
 */
export function tip(key: keyof typeof TOOLTIPS): string {
  return TOOLTIPS[key];
}
