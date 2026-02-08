// ═══════════════════════════════════════════════════════════════════════════
// Catalogue of Key Terms, Metrics & Labels
// Each entry: term, category, what it means, why it matters, how it's calculated
// ═══════════════════════════════════════════════════════════════════════════

export interface GlossaryEntry {
  term: string;
  category: string;
  meaning: string;
  importance: string;
  calculation: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ── Overall ───────────────────────────────────────────────────────────────
  {
    term: "Overall Trust Score",
    category: "Overall",
    meaning: "A composite score from 0-100 that represents the overall trustworthiness of the document based on all analysis modules.",
    importance: "Provides a single at-a-glance number to decide whether a document deserves serious attention or should be treated with scepticism.",
    calculation: "Weighted average of: Content Forensics (30%), Implementation Readiness (15%), Obsolescence Risk (10%), Hype vs. Reality (15%), Bias Detection (15%), Regulatory Safety (15%). Each module's normalized score is multiplied by its weight.",
  },
  {
    term: "File Hash (SHA-256)",
    category: "Overall",
    meaning: "A unique cryptographic fingerprint of the uploaded file, generated using the SHA-256 algorithm.",
    importance: "Prevents duplicate analyses — if the same document is uploaded again, the system recognises it and returns the existing report instead of re-processing.",
    calculation: "The binary contents of the file are passed through the SHA-256 hash function, producing a fixed 64-character hexadecimal string.",
  },
  {
    term: "Confidence",
    category: "Overall",
    meaning: "The statistical certainty of a classification result, expressed as a percentage.",
    importance: "Helps readers understand how strong the textual signals are. A 90% confidence classification is much more reliable than a 55% one.",
    calculation: "Based on the number and strength of detected text patterns, keyword density, and consistency of signals across the document. More matching patterns = higher confidence.",
  },

  // ── Module 1: Provider vs Consumer ────────────────────────────────────────
  {
    term: "Provider vs. Consumer",
    category: "Core Decision Modules",
    meaning: "Determines whether the document primarily serves the vendor's interests (upselling, lock-in) or empowers the reader to act independently.",
    importance: "Reveals hidden commercial motives. A 'thought leadership' paper that's really a sales pitch should be evaluated differently than genuinely educational content.",
    calculation: "Composite Score = Σ(driver_rating × driver_weight) / n. Five weighted drivers: Problem Definition (25%), Vendor Lock-in (20%), Implementation Autonomy (25%), Upsell Visibility (15%), Risk Transfer (15%).",
  },
  {
    term: "Problem Definition Clarity",
    category: "Core Decision Modules",
    meaning: "Measures whether the document frames problems as needing external help (provider-favored) or as solvable by the reader's team (consumer-favored).",
    importance: "Documents that make problems seem impossibly complex without the vendor's help are a red flag for commercial bias.",
    calculation: "Pattern matching for dependency language ('you need experts', 'complex challenges require') vs. empowerment language ('your team can', 'step-by-step guide'). Score 1-10.",
  },
  {
    term: "Vendor Lock-in Potential",
    category: "Core Decision Modules",
    meaning: "Measures dependency creation on specific vendors, proprietary tools, or locked-in methodologies.",
    importance: "High lock-in means switching costs will be enormous. Open/interoperable recommendations are better for the consumer.",
    calculation: "Detection of proprietary tool mentions, single-vendor recommendations, absence of alternatives, and migration difficulty language. Score 1-10.",
  },
  {
    term: "Implementation Autonomy",
    category: "Core Decision Modules",
    meaning: "Whether the reader can execute the recommendations independently without hiring the document's author.",
    importance: "True thought leadership empowers. Documents that require 'call us for Phase 2' are sales funnels, not knowledge assets.",
    calculation: "Presence of complete instructions, code samples, configuration guides, and self-service paths vs. 'contact us' and 'engage our team' patterns. Score 1-10.",
  },
  {
    term: "Upsell Visibility",
    category: "Core Decision Modules",
    meaning: "Presence of 'Phase 2' mentions, premium tiers, 'contact us for more', or expansion opportunities that suggest revenue generation motive.",
    importance: "Frequent upsell patterns indicate the document's primary purpose is lead generation rather than knowledge sharing.",
    calculation: "Count and density of upsell patterns: 'premium', 'advanced tier', 'Phase 2/3', 'contact us', 'learn more about our services'. Score 1-10 (higher = less upselling).",
  },
  {
    term: "Risk Transfer",
    category: "Core Decision Modules",
    meaning: "Who bears the implementation risk — the vendor (with SLAs/guarantees) or the client?",
    importance: "Providers who transfer all risk to the client while retaining revenue are not aligned with consumer interests.",
    calculation: "Detection of SLA mentions, guarantees, shared risk models (consumer-favored) vs. disclaimer-heavy, no-warranty language (provider-favored). Score 1-10.",
  },

  // ── Module 2: Originator Scale ────────────────────────────────────────────
  {
    term: "Originator Scale",
    category: "Core Decision Modules",
    meaning: "Detects the likely size of the organization that created the document — Solo/Boutique, Mid-tier, or Big 4/GSI.",
    importance: "Context matters. A Big 4 paper promoting enterprise transformation is normal; a 2-person consultancy claiming the same breadth is suspect.",
    calculation: "Composite Score = Σ(driver_rating × driver_weight). Five drivers: Framework Proprietary Level (20%), Data Scope (25%), Design Polish (15%), Service Breadth (25%), Legal Density (15%).",
  },
  {
    term: "Framework Proprietary Level",
    category: "Core Decision Modules",
    meaning: "Whether the document uses generic frameworks (SWOT, Porter's) or branded proprietary IP with ©/®/™ marks.",
    importance: "Proprietary frameworks suggest larger firms with R&D investment. Generic frameworks suggest smaller firms repackaging common knowledge.",
    calculation: "Pattern matching for trademark symbols, branded methodology names, vs. standard business framework references. Score 1-10.",
  },
  {
    term: "Data Scope & Depth",
    category: "Core Decision Modules",
    meaning: "Whether data comes from desk research and secondary citations (smaller firms) or primary global surveys and benchmarking (GSI resources).",
    importance: "Primary research with large sample sizes is more credible. Secondary data compilation is lower effort and potentially cherry-picked.",
    calculation: "Detection of survey mentions, sample sizes, primary research indicators, global benchmark data vs. 'according to' secondary citations. Score 1-10.",
  },
  {
    term: "Design Polish & Branding",
    category: "Core Decision Modules",
    meaning: "Whether the document appears template-based or has studio-grade branding with professional design elements.",
    importance: "Investment in presentation quality correlates (though imperfectly) with organizational resources and professionalism.",
    calculation: "Detection of copyright notices, registered trademarks, multi-section formatting cues, and professional language patterns. Score 1-10.",
  },
  {
    term: "Service Breadth",
    category: "Core Decision Modules",
    meaning: "Whether the document covers niche specialisation or end-to-end transformation capability.",
    importance: "Claims of enterprise-wide capability from a small firm are a credibility mismatch. Niche depth from a specialist may be more valuable.",
    calculation: "Counting service area mentions: strategy, implementation, technology, change management, training, support. More areas = broader claim. Score 1-10.",
  },
  {
    term: "Legal/Compliance Density",
    category: "Core Decision Modules",
    meaning: "Amount of disclaimer, NDA, liability, and legal language in the document.",
    importance: "Heavy legal language suggests a large organization with legal departments. Informal language suggests smaller operations.",
    calculation: "Detection of disclaimer, liability, confidentiality, NDA, and terms-of-use patterns. Higher density = larger organization indicator. Score 1-10.",
  },

  // ── Module 3: Target Scale ────────────────────────────────────────────────
  {
    term: "Target Company Scale",
    category: "Core Decision Modules",
    meaning: "The intended organizational audience — Startup (agile/MVP), SME (balanced), or Enterprise (governance-heavy).",
    importance: "A startup applying enterprise-grade governance will waste resources. An enterprise ignoring compliance will face regulatory risk.",
    calculation: "Composite of five drivers: Governance Complexity (25%), Cross-Functional Impact (20%), Legacy Integration (20%), Budget Implication (20%), Security Standards (15%).",
  },
  {
    term: "Governance Complexity",
    category: "Core Decision Modules",
    meaning: "Whether the document mentions small teams (startup) or steering committees and board approvals (enterprise).",
    importance: "Governance requirements directly impact implementation speed and cost. Mismatched governance = project failure risk.",
    calculation: "Pattern matching for team sizes, approval layers, committee structures, board-level language. Score 1-10.",
  },
  {
    term: "Cross-Functional Impact",
    category: "Core Decision Modules",
    meaning: "Whether recommendations affect a single department or require enterprise-wide coordination.",
    importance: "Cross-functional projects have higher failure rates and need dedicated change management. Single-department scope is simpler.",
    calculation: "Detection of department names, 'enterprise-wide', 'organization-wide', transformation language vs. single-team focus. Score 1-10.",
  },
  {
    term: "Legacy Integration Focus",
    category: "Core Decision Modules",
    meaning: "Whether the document assumes greenfield (build new) or requires legacy system modernization/migration.",
    importance: "Legacy integration is the #1 cost overrun factor in IT projects. Greenfield assumptions are often unrealistic for established companies.",
    calculation: "Detection of 'legacy', 'migration', 'modernization', 'existing systems' vs. 'greenfield', 'from scratch', 'new build'. Score 1-10.",
  },
  {
    term: "Budget/Resource Implication",
    category: "Core Decision Modules",
    meaning: "Whether costs suggest SaaS subscriptions (small scale) or multi-year capital transformation programs (enterprise).",
    importance: "Budget mismatches are the fastest way to kill a project. Enterprise proposals for startup budgets will fail.",
    calculation: "Detection of budget language: 'subscription', 'per user' (small) vs. 'CapEx', 'multi-year', 'transformation program' (enterprise). Score 1-10.",
  },
  {
    term: "Risk & Security Standards",
    category: "Core Decision Modules",
    meaning: "Whether security mentions are basic or reference enterprise frameworks (SOC2, GDPR, ISO 27001).",
    importance: "Enterprise clients require compliance. Documents ignoring security standards for enterprise audiences signal inexperience.",
    calculation: "Detection of compliance framework names, security certification references, risk management methodology mentions. Score 1-10.",
  },

  // ── Module 4: Audience Level ──────────────────────────────────────────────
  {
    term: "Target Audience Level",
    category: "Core Decision Modules",
    meaning: "Identifies who should read this — Developer, Manager, VP, or C-Suite — based on language and decision scope.",
    importance: "A C-Suite executive reading developer documentation wastes time. A developer reading strategic vision documents can't act on them.",
    calculation: "Composite of: Strategic/Tactical Ratio (25%), Financial Metrics (20%), Technical Jargon (20%), Actionable Horizon (20%), Decision Scope (15%).",
  },
  {
    term: "Strategic vs. Tactical Ratio",
    category: "Core Decision Modules",
    meaning: "Balance between high-level strategic vision and hands-on implementation details.",
    importance: "Pure strategy without tactics is useless for implementers. Pure tactics without strategy is useless for decision-makers.",
    calculation: "Counting strategic keywords (vision, roadmap, market impact) vs. tactical keywords (implement, configure, deploy, step-by-step). Ratio determines audience. Score 1-10.",
  },
  {
    term: "Financial Metric Density",
    category: "Core Decision Modules",
    meaning: "Presence of financial language like EBITDA, NPV, CapEx, ROI, TCO that targets financial decision-makers.",
    importance: "Documents with heavy financial metrics target budget holders. Their absence signals technical or operational audiences.",
    calculation: "Count of financial terms and metrics per 1,000 words. More financial language = higher-level audience indicator. Score 1-10.",
  },
  {
    term: "Technical Jargon Density",
    category: "Core Decision Modules",
    meaning: "Amount of technical terminology (APIs, Docker, Python, microservices) vs. business language.",
    importance: "High technical jargon targets developers/architects. Business-friendly language targets managers and executives.",
    calculation: "Count of technical terms per 1,000 words vs. business terms. Higher technical density = developer audience. Score 1-10.",
  },
  {
    term: "Actionable Horizon",
    category: "Core Decision Modules",
    meaning: "Whether recommended actions are immediate ('do this today') or long-term ('3-year roadmap').",
    importance: "Short horizons suit operational teams. Long horizons suit strategic planners. Mismatched horizons reduce document utility.",
    calculation: "Detection of time references: 'immediately', 'this sprint' (short) vs. 'multi-year', 'long-term vision', '2027 target' (long). Score 1-10.",
  },
  {
    term: "Decision Scope",
    category: "Core Decision Modules",
    meaning: "Whether decisions are tool-level (manager) or business-model-level (C-Suite).",
    importance: "The scope of decisions determines who needs to read the document. Tool selection ≠ business model transformation.",
    calculation: "Detection of decision language scope: 'choose a tool' (manager) vs. 'pivot the business model', 'investment decision' (C-Suite). Score 1-10.",
  },

  // ── Module 5: Rarity Index ────────────────────────────────────────────────
  {
    term: "Rarity Index",
    category: "Core Decision Modules",
    meaning: "Measures content uniqueness: Commodity (conventional wisdom), Differentiated (some original value), or Category-Defining (truly novel).",
    importance: "Commodity content can be found for free anywhere. Category-Defining content is worth paying for and acting on immediately.",
    calculation: "Composite of: Primary Data (25%), Contrarian Factor (20%), Framework Novelty (20%), Predictive Specificity (20%), Case Study Transparency (15%).",
  },
  {
    term: "Primary Data Source",
    category: "Core Decision Modules",
    meaning: "Whether data comes from original research (surveys, experiments) or aggregated secondary sources.",
    importance: "Primary data is proprietary and harder to replicate, making the document more valuable and unique.",
    calculation: "Detection of 'our survey', 'we conducted', 'primary research', sample size mentions vs. 'according to [source]' citations. Score 1-10.",
  },
  {
    term: "Contrarian Factor",
    category: "Core Decision Modules",
    meaning: "Whether the document challenges conventional wisdom or simply aligns with current hype.",
    importance: "Contrarian insights that are well-supported are the most valuable type of content — they give the reader an edge.",
    calculation: "Detection of counter-narrative language: 'contrary to popular belief', 'however', 'the real story' vs. pure trend-following language. Score 1-10.",
  },
  {
    term: "Framework Novelty",
    category: "Core Decision Modules",
    meaning: "Whether the document uses standard frameworks (SWOT, Porter's Five Forces) or introduces original models.",
    importance: "Novel frameworks represent genuine intellectual contribution. Rehashing standard tools is commodity thinking.",
    calculation: "Detection of standard framework names (low novelty) vs. new terminology introductions, unique model descriptions (high novelty). Score 1-10.",
  },
  {
    term: "Predictive Specificity",
    category: "Core Decision Modules",
    meaning: "Whether predictions are vague ('AI will grow') or specific and falsifiable ('GPU costs will drop 40% by Q3 2026').",
    importance: "Specific predictions demonstrate deep domain expertise and conviction. Vague predictions are risk-free filler.",
    calculation: "Detection of specific dates, percentages, named technologies in predictions vs. vague trend statements. Score 1-10.",
  },
  {
    term: "Case Study Transparency",
    category: "Core Decision Modules",
    meaning: "Whether examples use named, verifiable companies or anonymous placeholders ('a large bank').",
    importance: "Named case studies can be verified and build credibility. Anonymous examples may be fabricated or embellished.",
    calculation: "Detection of company names, specific results with dates vs. anonymous 'a leading company' references. Score 1-10.",
  },

  // ── Content Forensics: Deception ──────────────────────────────────────────
  {
    term: "Manipulation Index",
    category: "Content Forensics",
    meaning: "Combined score (0-100) measuring the density of manipulative language techniques in the document.",
    importance: "High manipulation scores indicate the document is designed to persuade emotionally rather than inform rationally.",
    calculation: "Weighted sum of: Weasel Words (25%), Percentage Puffery (20%), False Urgency (20%), Jargon Masking (20%), Passive Voice Distancing (15%). Normalized to 0-100.",
  },
  {
    term: "Weasel Words",
    category: "Content Forensics",
    meaning: "Accountability-destroying phrases like 'arguably', 'up to', 'may contribute', 'potentially' that make claims unfalsifiable.",
    importance: "Weasel words let authors claim credit for successes while avoiding blame for failures. They're the linguistic equivalent of fine print.",
    calculation: "Pattern matching against a dictionary of ~50 weasel phrases. Each occurrence is counted and weighted by evasiveness severity.",
  },
  {
    term: "Percentage Puffery",
    category: "Content Forensics",
    meaning: "Impressive-sounding metrics without baselines — e.g., '300% growth' without mentioning it went from 1 to 4.",
    importance: "Unanchored percentages create an illusion of scale. '500% ROI' is meaningless without knowing the investment amount and timeframe.",
    calculation: "Detection of percentage claims that lack baseline figures, comparison groups, or source citations. Each unanchored claim is flagged.",
  },
  {
    term: "False Urgency",
    category: "Content Forensics",
    meaning: "Artificial time pressure like 'window is closing', 'act now before competitors', 'critical window of opportunity'.",
    importance: "False urgency triggers emotional decision-making, bypassing rational cost-benefit analysis. It's a classic sales manipulation technique.",
    calculation: "Pattern matching for urgency phrases: 'act now', 'window closing', 'falling behind', 'critical moment'. Count and density measured.",
  },
  {
    term: "Jargon Masking",
    category: "Content Forensics",
    meaning: "Complex buzzword phrases that conceal simple ideas — e.g., 'synergistic paradigm shift' instead of 'working together differently'.",
    importance: "Jargon masking creates the impression of sophistication while obscuring lack of substance. It inflates perceived value.",
    calculation: "Detection of multi-word buzzword combinations and unnecessarily complex terminology where simpler alternatives exist.",
  },

  // ── Content Forensics: Logical Fallacies ──────────────────────────────────
  {
    term: "Fallacy Density",
    category: "Content Forensics",
    meaning: "Number of logical fallacies detected per 1,000 words of text.",
    importance: "Higher density indicates weaker logical foundations. Documents with many fallacies should not be used for decision-making without independent verification.",
    calculation: "Total fallacies detected ÷ (total word count ÷ 1,000). Each fallacy is categorized by type and severity (Low/Medium/High).",
  },
  {
    term: "Straw Man Fallacy",
    category: "Content Forensics",
    meaning: "Attacking a weakened version of an opponent's argument rather than the actual position.",
    importance: "Straw man arguments indicate intellectual dishonesty and undermine comparative analysis credibility.",
    calculation: "Detection of competitive comparisons that misrepresent alternatives: 'unlike outdated approaches', 'traditional methods fail because...' without fair representation.",
  },
  {
    term: "False Dichotomy",
    category: "Content Forensics",
    meaning: "Binary framing like 'Adopt AI or go bankrupt' that eliminates nuanced middle-ground options.",
    importance: "False dichotomies pressure readers into predetermined conclusions by removing valid alternative paths.",
    calculation: "Detection of 'either/or', 'only two options', 'the choice is clear' patterns that eliminate nuanced alternatives.",
  },
  {
    term: "Appeal to Authority",
    category: "Content Forensics",
    meaning: "Using 'As Gartner says...' or similar authority references without independent evidence.",
    importance: "Authority references are useful context but shouldn't substitute for actual data. Over-reliance signals weak independent analysis.",
    calculation: "Detection of analyst firm names (Gartner, Forrester, McKinsey) used as sole justification without accompanying data or methodology.",
  },
  {
    term: "Post Hoc Fallacy",
    category: "Content Forensics",
    meaning: "Assuming causation from correlation — 'After implementing X, revenue grew 40%' doesn't prove X caused the growth.",
    importance: "Post hoc reasoning is the most common way case studies mislead. Correlation ≠ causation, especially in complex business environments.",
    calculation: "Detection of 'after implementing', 'since adopting', 'following deployment' patterns paired with positive outcome claims without controls.",
  },
  {
    term: "Sunk Cost Fallacy",
    category: "Content Forensics",
    meaning: "Arguments to continue projects solely because of prior investment rather than future value.",
    importance: "Sunk cost reasoning leads to throwing good money after bad. Decisions should be based on future value, not past expenditure.",
    calculation: "Detection of 'already invested', 'too far to stop', 'building on previous investment' language that justifies continuation without value analysis.",
  },

  // ── Content Forensics: Fluff ──────────────────────────────────────────────
  {
    term: "Fluff Score",
    category: "Content Forensics",
    meaning: "Combined score (0-100) measuring the ratio of filler content to substantive information.",
    importance: "High fluff scores mean you're reading more words for less information. Low-fluff documents respect the reader's time.",
    calculation: "Weighted combination of: Gunning Fog Index (30%), Adjective/Verb Ratio (25%), Buzzword Density (25%), inverse of Unique Data Points (20%).",
  },
  {
    term: "Gunning Fog Index",
    category: "Content Forensics",
    meaning: "Estimates the years of formal education needed to understand the text on first reading.",
    importance: "Unnecessarily complex writing often masks shallow thinking. The best ideas can be explained simply.",
    calculation: "0.4 × [(words/sentences) + 100 × (complex_words/words)]. Complex words = words with 3+ syllables. Score <12 = accessible, 12-18 = professional, >18 = academic.",
  },
  {
    term: "Adjective/Verb Ratio",
    category: "Content Forensics",
    meaning: "The ratio of descriptive words (adjectives/adverbs) to action words (verbs) in the document.",
    importance: "More adjectives than verbs means more description than substance. Action-oriented writing is more useful for decision-makers.",
    calculation: "Count of adjective/adverb patterns ÷ count of action verb patterns. Ratio > 3.0 = excessive description. Optimal range: 0.5-2.0.",
  },
  {
    term: "Buzzwords",
    category: "Content Forensics",
    meaning: "Marketing-oriented words like 'synergy', 'leverage', 'cutting-edge', 'revolutionary' that add perceived sophistication without meaning.",
    importance: "High buzzword density suggests the document prioritizes impression over information. Substance-rich documents use precise language.",
    calculation: "Pattern matching against a curated list of ~80 business buzzwords. Count per 1,000 words determines density.",
  },
  {
    term: "Action Verbs",
    category: "Content Forensics",
    meaning: "Concrete action words like 'implement', 'deploy', 'configure', 'measure', 'test' that indicate practical content.",
    importance: "Documents rich in action verbs are more likely to contain actionable guidance you can execute immediately.",
    calculation: "Pattern matching against a curated list of ~60 implementation-oriented action verbs. Higher counts indicate more practical content.",
  },
  {
    term: "Unique Data Points",
    category: "Content Forensics",
    meaning: "Count of concrete, verifiable numbers, percentages, dates, and statistics in the document.",
    importance: "More unique data points = higher information density. Opinions are free; data costs effort to gather.",
    calculation: "Regex extraction of numerical values, percentages (e.g., '47%'), dollar amounts, dates, and specific quantities. Duplicates removed.",
  },

  // ── Advanced: Implementation Readiness ────────────────────────────────────
  {
    term: "Implementation Readiness Score",
    category: "Advanced Assessment",
    meaning: "Score (1-10) measuring the gap between conceptual description and executable implementation.",
    importance: "A beautiful strategy deck that can't be implemented is worthless. This score tells you if you can actually DO what the document describes.",
    calculation: "Weighted composite: Artifact Presence (30%) + Resource Clarity (25%) + Timeline Reality (25%) + Prerequisite Check (20%). Each sub-score is 1-10.",
  },
  {
    term: "Artifact Presence",
    category: "Advanced Assessment",
    meaning: "Checks for executable artifacts: code snippets, configuration files, checklists, architecture diagrams, templates, API definitions.",
    importance: "Documents with artifacts can be acted on immediately. Documents without them require additional work to become actionable.",
    calculation: "Binary check for each artifact type (found/not found). More artifacts = higher implementation readiness.",
  },
  {
    term: "Resource Clarity",
    category: "Advanced Assessment",
    meaning: "Whether specific roles and skills are defined (e.g., 'need 1 Data Engineer with 3+ years') vs. vague references.",
    importance: "Without clear resource requirements, you can't plan staffing or budget. Vague 'resources needed' delays project start.",
    calculation: "Detection of specific role names, skill requirements, team size mentions, experience levels vs. generic resource language. Score 1-10.",
  },
  {
    term: "Timeline Reality",
    category: "Advanced Assessment",
    meaning: "Whether timelines include specific dates and durations or use vague references like 'future state'.",
    importance: "Realistic timelines enable planning. Vague timelines indicate the author hasn't thought through execution complexity.",
    calculation: "Detection of specific dates, sprint numbers, week/month durations vs. 'eventually', 'future state', 'when ready'. Score 1-10.",
  },
  {
    term: "Prerequisite Check",
    category: "Advanced Assessment",
    meaning: "Clear statement of starting requirements (e.g., 'requires clean data lake and API gateway') vs. no mention.",
    importance: "Missing prerequisites are the #1 cause of project delays. Clear prerequisites enable realistic planning.",
    calculation: "Detection of 'requires', 'prerequisites', 'before starting', 'assumes' patterns with specific technical/organizational conditions. Score 1-10.",
  },

  // ── Advanced: Obsolescence Risk ───────────────────────────────────────────
  {
    term: "Obsolescence Risk Score",
    category: "Advanced Assessment",
    meaning: "Score (0-100) indicating how likely the document's recommendations will become outdated in the near term.",
    importance: "In fast-moving fields like AI, recommendations older than 12 months may already be outdated. This score flags stale advice.",
    calculation: "Based on detection of outdated technology references, missing mentions of current best practices, and technology lifecycle analysis.",
  },
  {
    term: "Outdated References",
    category: "Advanced Assessment",
    meaning: "Technologies mentioned that are no longer current best practice.",
    importance: "Recommendations based on outdated tech will lead to suboptimal implementations and higher migration costs later.",
    calculation: "Cross-referencing mentioned technologies against a current-tech database. Flagged items include deprecated frameworks, superseded practices, and old version references.",
  },
  {
    term: "Missing Current Practices",
    category: "Advanced Assessment",
    meaning: "Important current technologies and practices that the document doesn't mention.",
    importance: "Omitting current best practices suggests the author isn't current with the field, reducing recommendation credibility.",
    calculation: "Check for absence of expected modern practices: agentic AI, vector databases, RAG, LLM orchestration, etc., when the document covers related topics.",
  },

  // ── Advanced: Hype vs Reality ─────────────────────────────────────────────
  {
    term: "Hype Score",
    category: "Advanced Assessment",
    meaning: "Optimism score (0-100) measuring the balance between promotional language and honest risk acknowledgment.",
    importance: "Credible documents acknowledge what could go wrong. Pure optimism without risk discussion is sales material, not analysis.",
    calculation: "Ratio of positive/promotional language to cautionary/risk language. 60-80% positive = credible. >80% = potentially unrealistic. >90% with zero risk = 'Sales Propaganda'.",
  },
  {
    term: "Positive Sentiment %",
    category: "Advanced Assessment",
    meaning: "Percentage of the document's language that is positive, promotional, or optimistic.",
    importance: "Extreme positivity (>85%) with no counterbalance indicates bias toward presenting an unrealistically positive picture.",
    calculation: "Sentiment analysis counting positive adjectives, success language, and promotional patterns vs. total evaluative language.",
  },
  {
    term: "Risk Mentions",
    category: "Advanced Assessment",
    meaning: "Count of references to risks, challenges, limitations, and potential failure modes.",
    importance: "Credible documents discuss what could go wrong. Zero risk mentions in a business document is itself a red flag.",
    calculation: "Pattern matching for: 'risk', 'challenge', 'limitation', 'caveat', 'downside', 'failure', 'caution'. Each unique mention counted.",
  },
  {
    term: "Failure Acknowledgments",
    category: "Advanced Assessment",
    meaning: "Presence of sections or statements acknowledging where approaches might fail or have failed.",
    importance: "Willingness to discuss failure dramatically increases credibility and helps readers prepare contingency plans.",
    calculation: "Detection of 'why this might fail', 'key risks', 'lessons learned from failures', 'when this doesn't work' patterns.",
  },

  // ── Advanced: Regulatory & Ethics ─────────────────────────────────────────
  {
    term: "Safety Score",
    category: "Advanced Assessment",
    meaning: "Combined score (0-100) assessing regulatory compliance awareness and ethical consideration in the document.",
    importance: "AI implementations without regulatory or ethical frameworks face legal liability, reputational damage, and potential fines.",
    calculation: "Weighted sum of: Regulatory Mentions (35%), Ethical Considerations (30%), Privacy Protections (20%), absence of Red Flags (15%).",
  },
  {
    term: "Regulatory Mentions",
    category: "Advanced Assessment",
    meaning: "References to compliance frameworks like GDPR, EU AI Act, CCPA, SOC2, HIPAA, ISO 27001.",
    importance: "Regulatory awareness indicates the author understands real-world deployment requirements, not just technical feasibility.",
    calculation: "Pattern matching for regulation names, compliance framework references, and legal requirement mentions. More mentions = higher awareness.",
  },
  {
    term: "Ethical Mentions",
    category: "Advanced Assessment",
    meaning: "References to bias mitigation, fairness, transparency, explainability, and responsible AI practices.",
    importance: "Ethical AI is increasingly a regulatory requirement (EU AI Act). Documents ignoring ethics will produce non-compliant implementations.",
    calculation: "Detection of ethics-related keywords: 'bias', 'fairness', 'transparency', 'explainability', 'responsible AI', 'human oversight'.",
  },
  {
    term: "Red Flags (Safety)",
    category: "Advanced Assessment",
    meaning: "Critical omissions like proposing data scraping without compliance or AI deployment without bias assessment.",
    importance: "Red flags indicate potential legal or ethical violations that could result in fines, lawsuits, or reputational damage.",
    calculation: "Checking for risky proposals (data scraping, automated decisions on people) without corresponding compliance/ethics mentions.",
  },

  // ── Composition & Visual/Data Intensity ───────────────────────────────────
  {
    term: "Visual Intensity",
    category: "Composition",
    meaning: "Score (1-10) measuring the document's use of diagrams, charts, graphs, and visual elements.",
    importance: "Well-visualized documents communicate complex ideas more effectively. But visuals without data can mask shallow analysis.",
    calculation: "Detection of diagram/chart/figure/graph references, numbered figures, and visual formatting cues. More visual references = higher score.",
  },
  {
    term: "Data Intensity",
    category: "Composition",
    meaning: "Score (1-10) measuring the density of quantitative evidence: tables, citations, statistics.",
    importance: "Data-rich documents provide stronger evidence for claims. Opinion without data is just... opinion.",
    calculation: "Count of tables, academic citations, statistical claims, and numerical data points. Normalized to 1-10 scale.",
  },
  {
    term: "Diagrams",
    category: "Composition",
    meaning: "Count of diagram, chart, graph, and figure references in the document.",
    importance: "Diagrams aid comprehension of complex systems, architectures, and processes. Their presence indicates presentation effort.",
    calculation: "Regex matching for 'Figure X', 'Diagram', 'Chart', 'Graph', and visual reference patterns in the text.",
  },
  {
    term: "Citations",
    category: "Composition",
    meaning: "Count of academic-style citations and source references.",
    importance: "More citations indicate greater research rigor and the ability to verify claims independently.",
    calculation: "Detection of [Author, Year] patterns, numbered references, bibliography-style citations, and URL source links.",
  },
  {
    term: "Tables",
    category: "Composition",
    meaning: "Count of tabular data references in the document.",
    importance: "Tables provide structured quantitative evidence that is easy to compare and verify.",
    calculation: "Detection of 'Table X', structured data patterns, and comparison matrix references.",
  },
  {
    term: "Statistics",
    category: "Composition",
    meaning: "Count of specific numerical claims, percentages, and financial figures.",
    importance: "Statistical claims add precision and credibility. More statistics = higher evidence density.",
    calculation: "Regex extraction of percentages, dollar amounts, specific quantities, growth rates, and numerical comparisons.",
  },

  // ── Bias Detection ────────────────────────────────────────────────────────
  {
    term: "Overall Bias Score",
    category: "Bias Detection",
    meaning: "Combined score (0-100) measuring the presence of cognitive biases that undermine document credibility.",
    importance: "Even well-intentioned authors have blind spots. Understanding which biases are present helps readers compensate.",
    calculation: "Severity-weighted sum of all detected biases. High-severity biases contribute more to the total score.",
  },
  {
    term: "Confirmation Bias",
    category: "Bias Detection",
    meaning: "Only presenting evidence that confirms a predetermined conclusion while ignoring contradicting data.",
    importance: "Creates unrealistic expectations by showing only successes. Readers may commit resources based on incomplete evidence.",
    calculation: "Detection of one-sided case studies, absence of failure examples, and cherry-picked statistics that only support the thesis.",
  },
  {
    term: "Survival Bias",
    category: "Bias Detection",
    meaning: "Only analyzing successful companies/projects while ignoring the many that failed using similar approaches.",
    importance: "Survival bias dramatically overestimates success probability. For every success story, there may be 100 invisible failures.",
    calculation: "Detection of success-only narratives, 'industry leaders' focus, and absence of failure analysis in sector discussions.",
  },
  {
    term: "Selection Bias",
    category: "Bias Detection",
    meaning: "Cherry-picking data, time periods, or examples that support a predetermined conclusion.",
    importance: "Selected data misleads about general applicability. What works in the selected sample may not work elsewhere.",
    calculation: "Detection of narrow time ranges, specific industry focus without justification, and limited geographic scope presented as universal.",
  },
  {
    term: "Recency Bias",
    category: "Bias Detection",
    meaning: "Over-weighting recent events and trends while ignoring historical patterns and cyclical behavior.",
    importance: "Technology hype cycles repeat. Ignoring history leads to over-investment at peaks and missed opportunities at troughs.",
    calculation: "Detection of 'unprecedented', 'never before', 'new era' language without historical context or cyclical pattern acknowledgment.",
  },
  {
    term: "Authority Bias",
    category: "Bias Detection",
    meaning: "Over-reliance on expert opinions (Gartner, Forrester, Harvard) without independent empirical validation.",
    importance: "Even respected authorities can be wrong. Independent data should corroborate authority claims, not replace evidence.",
    calculation: "Count of authority citations used as primary evidence without accompanying independent data or methodology discussion.",
  },

  // ── Key Findings ──────────────────────────────────────────────────────────
  {
    term: "Key Findings",
    category: "Key Findings",
    meaning: "The most notable claims extracted from the document — particularly those that are contrarian or specifically quantified.",
    importance: "Highlights the information most worth your attention, saving time on lengthy documents.",
    calculation: "Extraction of sentences containing specific data, unusual claims, or contrarian perspectives. Ranked by novelty and specificity.",
  },
  {
    term: "Contrarian Tag",
    category: "Key Findings",
    meaning: "This finding contradicts conventional wisdom or current market consensus.",
    importance: "Contrarian insights, when well-supported, are the most valuable type of information — they provide competitive advantage.",
    calculation: "Detection of counter-narrative language paired with supporting evidence. Must contradict a clearly identifiable mainstream position.",
  },
  {
    term: "Quantified Tag",
    category: "Key Findings",
    meaning: "This finding includes specific numbers, percentages, or data that can be independently verified.",
    importance: "Quantified claims are falsifiable — you can check them. Unquantified claims are opinions that can't be disproven.",
    calculation: "Detection of specific numerical values, dates, named entities, and measurable outcomes in the claim.",
  },

  // ── Composite Scoring Method ──────────────────────────────────────────────
  {
    term: "Weighted Composite Score",
    category: "Methodology",
    meaning: "The standard scoring formula used across all modules: Score = Σ(rating × weight) / n, where each driver has a predefined weight.",
    importance: "Ensures consistent, quantifiable assessment across all modules. Weights reflect the relative importance of each factor.",
    calculation: "Each driver is scored 1-10 by pattern analysis. The score is multiplied by the driver's weight (which sums to 1.0 per module). The result is normalized to 0-100.",
  },
  {
    term: "Driver",
    category: "Methodology",
    meaning: "An individual analytical dimension within a module. Each module has 5 weighted drivers that contribute to its composite score.",
    importance: "Drivers break down complex assessments into specific, measurable dimensions that can be individually examined.",
    calculation: "Each driver is scored 1-10 based on text pattern analysis. The weight (expressed as %) determines how much it contributes to the module's total.",
  },
];

/** All unique categories in the glossary, in display order */
export const GLOSSARY_CATEGORIES = [
  "Overall",
  "Core Decision Modules",
  "Content Forensics",
  "Advanced Assessment",
  "Composition",
  "Bias Detection",
  "Key Findings",
  "Methodology",
] as const;
