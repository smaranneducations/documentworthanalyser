// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive Tooltip Dictionary
// Every label, header, keyword, and metric in the dashboard explained.
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLTIPS = {
  // ── Overall ──────────────────────────────────────────────────────────────
  overall_trust_score:
    "Composite score (0-100) combining all modules: forensics, readiness, obsolescence, hype, bias, and strategic assessment. Higher = more trustworthy.",
  file_hash:
    "SHA-256 fingerprint of the uploaded file. Used to detect duplicate uploads — if the same file is uploaded again, the existing report is shown.",

  // ── Classification Strip ─────────────────────────────────────────────────
  provider_consumer_label:
    "Determines who benefits most from this document — the service provider (vendor) or the service consumer (reader/client).",
  originator_scale_label:
    "Detects whether this was created by a solo consultant, boutique firm, or a Big 4 / Global System Integrator (GSI).",
  target_company_label:
    "Identifies the intended organizational scale — startup, SME, or enterprise — based on governance, budget, and security language.",
  audience_level_label:
    "Assesses who should read this document — developers, managers, VPs, or C-suite executives — based on language and decision scope.",
  uniqueness_label:
    "Measures how original the content is. Commodity = repackaged conventional wisdom. Category-Defining = genuinely novel insights.",
  confidence:
    "Statistical confidence in the classification. Higher % means stronger signal from the text patterns detected.",

  // ── Module 1: Provider vs Consumer ───────────────────────────────────────
  section_provider_consumer:
    "Analyzes whether the document primarily serves vendor interests (upselling, lock-in) or empowers the reader to act independently.",
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
    "Detects the likely originator's company size based on framework proprietary level, data depth, branding, service breadth, and legal language.",
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
    "Determines the intended organizational audience — startup (agile/MVP), SME (balanced), or enterprise (governance/compliance-heavy).",
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
    "Identifies the ideal reader based on strategic vs. tactical ratio, financial metrics, technical jargon, and decision scope.",
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
    "Measures content uniqueness. Commodity = widely available insights. Differentiated = some original value. Category-Defining = truly novel.",
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
    "Detects linguistic manipulation, logical fallacies, and content padding. These modules verify the credibility of the document's claims.",
  manipulation_index:
    "Combined score (0-100) measuring weasel words, percentage puffery, false urgency, passive voice distancing, and jargon masking. Scores >40 are flagged.",
  weasel_words:
    "Accountability-destroying phrases like 'arguably', 'up to', 'may contribute' that transform claims into unfalsifiable statements.",
  percentage_puffery:
    "Metrics without baselines — e.g., '300% growth' could mean going from 1 user to 4 users. Creates illusion of scale.",
  false_urgency:
    "Artificial time pressure like 'window is closing' or 'act now' that triggers emotional decision-making over rational analysis.",
  jargon_masking:
    "Complex phrases concealing simple ideas — e.g., 'synergistic paradigm shift' instead of 'working together differently'.",
  passive_voice:
    "Responsibility obscuration — 'mistakes were made' instead of 'we failed'. Shields accountability for negative outcomes.",

  // ── Logical Fallacies ────────────────────────────────────────────────────
  section_fallacies:
    "Detects common reasoning errors that undermine document credibility. Each fallacy is categorized by type and severity.",
  fallacy_density:
    "Number of logical fallacies per 1,000 words. Higher density indicates weaker logical foundations in the document.",
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
    "Quantifies readability complexity relative to substantive value. High fluff = lots of words, little information.",
  fluff_score:
    "Combined score (0-100) from Gunning Fog Index, adjective/verb ratio, and unique data points. >60 = low information density.",
  fog_index:
    "Gunning Fog Index — estimates years of education needed to understand the text. >18 = academic paper level, <12 = accessible.",
  adjective_verb_ratio:
    "Ratio of descriptive words to action words. Higher ratio means more description than substance. >3 = excessive.",
  unique_data_points:
    "Count of concrete, verifiable numbers, percentages, and dates in the document. More data points = more substantive content.",
  buzzwords:
    "Marketing-oriented words like 'synergy', 'leverage', 'cutting-edge' that add perceived sophistication without real meaning.",
  action_verbs:
    "Concrete action words like 'implement', 'deploy', 'configure' that indicate practical, actionable content.",

  // ── Implementation Readiness ─────────────────────────────────────────────
  section_implementation:
    "Measures the gap between conceptual description and executable implementation. Can you actually DO what the document describes?",
  readiness_score:
    "Combined score (1-10) from artifact presence (30%), resource clarity (25%), timeline reality (25%), and prerequisite checks (20%).",
  artifact_presence:
    "Checks for code snippets, config files, checklists, architecture diagrams, templates, and API definitions.",
  resource_clarity:
    "Are specific roles defined? (e.g., 'need 1 Data Engineer with 3+ years') vs. vague references to 'resources needed'.",
  timeline_reality:
    "Estimated timelines with specific dates/durations vs. vague references like 'future state' or 'when ready'.",
  prerequisite_check:
    "Clear statement of starting requirements (e.g., 'requires clean data lake') vs. no mention of prerequisites.",

  // ── Obsolescence Risk ────────────────────────────────────────────────────
  section_obsolescence:
    "Identifies outdated technology recommendations in the rapidly evolving AI landscape. References >12 months old as 'cutting edge' are flagged.",
  outdated_references:
    "Technologies mentioned that are no longer current best practice — e.g., recommending traditional RPA without agentic enhancements in 2026.",
  missing_current_practices:
    "Important current technologies not mentioned — e.g., absence of agentic AI, vector databases, or RAG in an AI document.",

  // ── Hype vs Reality ──────────────────────────────────────────────────────
  section_hype:
    "Detects unrealistic optimism and identifies balanced, credible analysis. 90%+ positive with zero risk mentions = 'Sales Propaganda'.",
  hype_score:
    "Optimism score (0-100). Optimal credibility range is 60-80% positive. >80 = potentially unrealistic.",
  positive_sentiment:
    "Percentage of positive/promotional language vs. balanced or cautionary language. Very high % with no risk mentions is a red flag.",
  risk_mentions:
    "Count of risk, challenge, limitation, and failure references. Credible documents acknowledge what could go wrong.",
  failure_acknowledgments:
    "Presence of 'Why this might fail' or 'Key Risks' sections. These dramatically increase document credibility.",

  // ── Regulatory & Ethics ──────────────────────────────────────────────────
  section_regulatory:
    "Identifies compliance risks and ethical concerns. AI implementations without regulatory or ethical frameworks are flagged.",
  safety_score:
    "Combined score (0-100) from regulatory mentions, ethical considerations, privacy protections, and absence of red flags.",
  regulatory_mentions:
    "References to frameworks like GDPR, EU AI Act, CCPA, SOC2 that indicate regulatory awareness.",
  ethical_mentions:
    "References to bias mitigation, fairness, transparency, and responsible AI practices.",
  red_flags_safety:
    "Critical omissions like proposing data scraping without compliance mentions, or AI without bias assessment.",

  // ── Composition ──────────────────────────────────────────────────────────
  section_composition:
    "Evaluates the document's presentation format — balance of visuals vs. text, and density of quantitative evidence.",
  visual_intensity:
    "Score (1-10) measuring diagram-to-text ratio, color coding, and infographic density. High = great for presentations, possibly shallow.",
  data_intensity:
    "Score (1-10) measuring tables, citations, and statistical density. High = strong credibility, possibly difficult for general audiences.",
  diagrams:
    "Count of diagram, chart, graph, and figure references. More diagrams suggest better visual communication.",
  citations:
    "Count of academic-style citations and source references. More citations indicate greater research rigor.",
  tables:
    "Count of table references. Tables provide structured quantitative evidence.",
  statistics:
    "Count of specific numerical claims, percentages, and financial figures in the document.",

  // ── Bias Detection ───────────────────────────────────────────────────────
  section_bias:
    "Identifies five key cognitive biases that undermine document credibility: confirmation, survival, selection, recency, and authority bias.",
  overall_bias_score:
    "Combined bias score (0-100). Higher = more biased. Based on severity-weighted detection of all bias types.",
  bias_confirmation:
    "Only presenting successful case studies without failures. Creates unrealistic success expectations.",
  bias_survival:
    "Ignoring failed projects in sector analysis. Overestimates success probability by only showing survivors.",
  bias_selection:
    "Cherry-picked data supporting predetermined conclusions. Misleads about general applicability.",
  bias_recency:
    "Over-weighting recent events/trends while ignoring cyclical patterns and historical context.",
  bias_authority:
    "Over-reliance on expert opinions (Gartner, Forrester) without independent empirical validation.",

  // ── Key Findings ─────────────────────────────────────────────────────────
  section_findings:
    "Extracts the most notable claims from the document — particularly contrarian insights and specific quantified claims that can be verified.",
  contrarian_tag:
    "This finding contradicts conventional wisdom, making it potentially more valuable if well-supported.",
  quantified_tag:
    "This finding includes specific numbers or data that can be independently verified.",

  // ── Section Headers ──────────────────────────────────────────────────────
  header_core_modules:
    "Five weighted decision modules that classify the document across strategic dimensions: who it serves, who wrote it, who it's for, and how unique it is.",
  header_forensics:
    "Linguistic and logical analysis that detects manipulation, logical fallacies, and content padding to verify credibility.",
  header_advanced:
    "Additional assessment modules: implementation readiness, technology currency, optimism balance, and regulatory compliance.",
  header_composition:
    "Document composition analysis including visual/data balance, cognitive bias detection, and extraction of key findings.",

  // ── Home Page Feature Pills ──────────────────────────────────────────────
  pill_provider_consumer:
    "Detects whether a document serves the vendor's revenue interests or empowers the reader with actionable knowledge.",
  pill_decision_modules:
    "Five weighted scoring modules analyze the document across strategic dimensions using quantitative driver matrices.",
  pill_content_forensics:
    "Detects weasel words, percentage puffery, false urgency, jargon masking, and logical fallacies in the text.",
  pill_bias_detection:
    "Identifies confirmation, survival, selection, recency, and authority biases that undermine credibility.",
  pill_hype_reality:
    "Measures the balance between promotional optimism and honest risk acknowledgment.",
  pill_implementation:
    "Scores whether the document provides executable artifacts (code, configs, checklists) or is purely theoretical.",
  pill_weighted_scoring:
    "All modules use the weighted composite formula: Score = Σ(rating × weight) / n, ensuring consistent quantifiable assessment.",
} as const;

/**
 * Helper to look up a tooltip by key. Returns undefined if not found.
 */
export function tip(key: keyof typeof TOOLTIPS): string {
  return TOOLTIPS[key];
}
