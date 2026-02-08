/**
 * ReportPrintHighlights — Print-only PDF highlight reel
 *
 * Dark theme, dynamic font sizing, rich visuals.
 * Designed for LinkedIn carousel uploads and PDF sharing.
 */

import type { AnalysisDoc, PdfHighlightFinding } from "@/lib/types";
import { TOOLTIPS, tip } from "@/lib/tooltips";

type TipKey = keyof typeof TOOLTIPS;

/** Safe lookup — returns empty string if key not found */
function safeTip(key: string): string {
  if (key in TOOLTIPS) return tip(key as TipKey);
  return "";
}

// ── Color helpers ────────────────────────────────────────────────────────

function trustColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function sectionColor(section: string): string {
  const map: Record<string, string> = {
    manipulation: "#ef4444", hype: "#f97316", bias: "#a855f7",
    fallacy: "#eab308", implementation: "#22c55e", obsolescence: "#f97316",
    regulatory: "#06b6d4", finding: "#3b82f6", uniqueness: "#8b5cf6", fluff: "#ec4899",
  };
  return map[section] || "#3b82f6";
}

function sectionIcon(section: string): string {
  const map: Record<string, string> = {
    manipulation: "\u26A0\uFE0F", hype: "\uD83D\uDCC8", bias: "\u2696\uFE0F",
    fallacy: "\uD83E\uDDE0", implementation: "\u2705", obsolescence: "\u23F3",
    regulatory: "\uD83D\uDEE1\uFE0F", finding: "\uD83D\uDCA1",
    uniqueness: "\u2728", fluff: "\uD83D\uDCAD",
  };
  return map[section] || "\uD83D\uDD0D";
}

// ── Dynamic font sizing: calculates based on content length ──────────────

function dynamicFonts(title: string, insight: string, evidence: string) {
  const totalChars = title.length + insight.length + evidence.length;
  if (totalChars < 120) return { title: "38pt", insight: "20pt", evidence: "16pt" };
  if (totalChars < 250) return { title: "32pt", insight: "18pt", evidence: "14pt" };
  if (totalChars < 400) return { title: "26pt", insight: "16pt", evidence: "13pt" };
  if (totalChars < 600) return { title: "22pt", insight: "14pt", evidence: "12pt" };
  return { title: "20pt", insight: "13pt", evidence: "11pt" };
}

// ── Build section evidence from analysis data ────────────────────────────

function getSectionEvidence(section: string, analysis: AnalysisDoc): { evidence: string; tooltip: string } {
  const r = analysis.analysis_result;
  switch (section) {
    case "manipulation": {
      const ww = r.forensics.deception.weasel_words.slice(0, 5).map(w => `"${w.word}" (${w.count}x)`).join(", ");
      const fu = r.forensics.deception.false_urgency.slice(0, 2).map(u => `"${u}"`).join(", ");
      const parts = [];
      if (ww) parts.push(`Weasel words: ${ww}`);
      if (fu) parts.push(`False urgency: ${fu}`);
      if (r.forensics.deception.jargon_masking.length > 0) parts.push(`Jargon masking: ${r.forensics.deception.jargon_masking.slice(0, 3).join(", ")}`);
      return { evidence: parts.join(". ") || "No significant deceptive patterns found.", tooltip: safeTip("manipulation_index") };
    }
    case "hype":
      return {
        evidence: `Positive sentiment: ${r.hype_reality.positive_sentiment_pct}% | Risk mentions: ${r.hype_reality.risk_mentions} | Failure acknowledgments: ${r.hype_reality.failure_acknowledgments}`,
        tooltip: safeTip("section_hype"),
      };
    case "bias": {
      const biasDetails = r.bias_detection.biases.map(b => {
        const desc = safeTip(`bias_${b.type.toLowerCase()}`);
        return `${b.type} (${b.severity}): ${desc || b.evidence}`;
      }).join("\n");
      return { evidence: biasDetails || "No significant biases detected.", tooltip: safeTip("section_bias") };
    }
    case "fallacy": {
      const fallacyDetails = r.forensics.fallacies.fallacies.slice(0, 3).map(f => {
        const desc = safeTip(`fallacy_${f.type.toLowerCase().replace(/\s+/g, "_")}`);
        return `${f.type} (${f.severity}): ${desc || `"${f.evidence}"`}`;
      }).join("\n");
      return { evidence: fallacyDetails || "No logical fallacies detected.", tooltip: safeTip("fallacy_density") };
    }
    case "implementation": {
      const found = r.implementation_readiness.artifact_presence.filter(a => a.found).map(a => a.name);
      const missing = r.implementation_readiness.artifact_presence.filter(a => !a.found).map(a => a.name);
      const parts = [];
      if (found.length > 0) parts.push(`Found: ${found.join(", ")}`);
      if (missing.length > 0) parts.push(`Missing: ${missing.join(", ")}`);
      parts.push(`Resource clarity: ${r.implementation_readiness.resource_clarity_score}/10 | Timeline reality: ${r.implementation_readiness.timeline_reality_score}/10`);
      return { evidence: parts.join(". "), tooltip: safeTip("section_implementation") };
    }
    case "obsolescence": {
      const parts = [];
      if (r.obsolescence_risk.outdated_references.length > 0) parts.push(`Outdated tech: ${r.obsolescence_risk.outdated_references.join(", ")}`);
      if (r.obsolescence_risk.missing_current_practices.length > 0) parts.push(`Missing practices: ${r.obsolescence_risk.missing_current_practices.slice(0, 4).join(", ")}`);
      return { evidence: parts.join(". ") || "Technology references appear current.", tooltip: safeTip("section_obsolescence") };
    }
    case "fluff":
      return {
        evidence: `Gunning Fog: ${r.forensics.fluff.fog_index.toFixed(1)} (${r.forensics.fluff.fog_index > 18 ? "Academic" : r.forensics.fluff.fog_index > 12 ? "Professional" : "Accessible"}) | Buzzwords: ${r.forensics.fluff.buzzword_count} | Action verbs: ${r.forensics.fluff.action_verb_count} | Unique data points: ${r.forensics.fluff.unique_data_points}`,
        tooltip: safeTip("fluff_score"),
      };
    case "finding": {
      const fact = r.amazing_facts[0];
      return {
        evidence: fact?.why_amazing || "Notable finding extracted from document content.",
        tooltip: safeTip("section_findings"),
      };
    }
    case "regulatory": {
      const parts = [];
      if (r.regulatory_safety.red_flags.length > 0) parts.push(`Red flags: ${r.regulatory_safety.red_flags.join("; ")}`);
      if (r.regulatory_safety.regulatory_mentions.length > 0) parts.push(`Regulatory: ${r.regulatory_safety.regulatory_mentions.join(", ")}`);
      return { evidence: parts.join(". ") || "No regulatory concerns detected.", tooltip: safeTip("safety_score") };
    }
    default:
      return { evidence: "", tooltip: "" };
  }
}

// ── Fallback highlights builder ──────────────────────────────────────────

function buildFallbackHighlights(analysis: AnalysisDoc): PdfHighlightFinding[] {
  const r = analysis.analysis_result;
  const findings: PdfHighlightFinding[] = [];

  findings.push({
    section: "manipulation",
    title: `Manipulation Index: ${r.forensics.deception.manipulation_index}/100`,
    insight: r.forensics.deception.manipulation_rationale || `${r.forensics.deception.weasel_words.length} weasel word types and ${r.forensics.deception.false_urgency.length} false urgency phrases detected.`,
    hook_score: r.forensics.deception.manipulation_index > 40 ? 9 : r.forensics.deception.manipulation_index > 20 ? 6 : 3,
  });

  findings.push({
    section: "hype",
    title: `Hype: ${r.hype_reality.hype_score}/100 — ${r.hype_reality.classification}`,
    insight: r.hype_reality.balance_assessment,
    hook_score: r.hype_reality.hype_score > 70 ? 8 : r.hype_reality.hype_score > 40 ? 5 : 3,
  });

  if (r.bias_detection.biases.length > 0) {
    findings.push({
      section: "bias",
      title: `Bias Score: ${r.bias_detection.overall_bias_score}/100`,
      insight: `${r.bias_detection.biases.length} bias type(s): ${r.bias_detection.biases.map(b => b.type).join(", ")}.`,
      hook_score: r.bias_detection.overall_bias_score > 30 ? 7 : 4,
    });
  }

  if (r.forensics.fallacies.fallacies.length > 0) {
    findings.push({
      section: "fallacy",
      title: `${r.forensics.fallacies.fallacies.length} Logical Fallacies Found`,
      insight: `Fallacy density: ${r.forensics.fallacies.fallacy_density.toFixed(2)} per 1k words. Types: ${r.forensics.fallacies.fallacies.map(f => f.type).join(", ")}.`,
      hook_score: r.forensics.fallacies.fallacies.length > 2 ? 8 : 5,
    });
  }

  findings.push({
    section: "implementation",
    title: `Implementation: ${r.implementation_readiness.verdict}`,
    insight: `Readiness ${r.implementation_readiness.readiness_score}/10. ${r.implementation_readiness.artifact_presence.filter(a => a.found).length}/${r.implementation_readiness.artifact_presence.length} artifacts present.`,
    hook_score: r.implementation_readiness.readiness_score <= 3 ? 7 : r.implementation_readiness.readiness_score >= 8 ? 6 : 4,
  });

  if (r.obsolescence_risk.risk_score > 25) {
    findings.push({
      section: "obsolescence",
      title: `Obsolescence: ${r.obsolescence_risk.risk_level} (${r.obsolescence_risk.risk_score}/100)`,
      insight: r.obsolescence_risk.outdated_references.length > 0 ? `Outdated: ${r.obsolescence_risk.outdated_references.slice(0, 3).join(", ")}` : `Missing ${r.obsolescence_risk.missing_current_practices.length} current practices.`,
      hook_score: r.obsolescence_risk.risk_score > 50 ? 7 : 4,
    });
  }

  findings.push({
    section: "fluff",
    title: `Fluff Score: ${r.forensics.fluff.fluff_score}/100`,
    insight: `Fog Index ${r.forensics.fluff.fog_index.toFixed(1)}, ${r.forensics.fluff.buzzword_count} buzzwords vs ${r.forensics.fluff.action_verb_count} action verbs.`,
    hook_score: r.forensics.fluff.fluff_score > 50 ? 6 : 3,
  });

  if (r.amazing_facts.length > 0) {
    const best = r.amazing_facts.find(f => f.is_contrarian && f.is_quantified) || r.amazing_facts[0];
    findings.push({
      section: "finding",
      title: "Key Finding",
      insight: best.fact,
      hook_score: best.is_contrarian ? 8 : best.is_quantified ? 6 : 4,
    });
  }

  return findings.sort((a, b) => b.hook_score - a.hook_score);
}

// ── Main Component ───────────────────────────────────────────────────────

export default function ReportPrintHighlights({ analysis }: { analysis: AnalysisDoc }) {
  const r = analysis.analysis_result;
  const highlights = analysis.pdf_highlights;
  const headline = highlights?.headline || `Trust Score ${r.overall_trust_score}/100 — ${analysis.display_name || analysis.filename}`;
  const findings: PdfHighlightFinding[] = highlights?.hook_findings?.length ? highlights.hook_findings : buildFallbackHighlights(analysis);
  const topFindings = findings.slice(0, 6);
  const reportUrl = typeof window !== "undefined" ? window.location.href : "";
  const glossaryUrl = typeof window !== "undefined" ? `${window.location.origin}/glossary/` : "";

  return (
    <div className="hidden print-only" id="print-highlights">

      {/* ═══ PAGE 1: COVER ══════════════════════════════════════════════════ */}
      <div className="ph-page ph-cover">
        <div className="ph-cover-top">
          <div className="ph-cover-badge">FORENSIC ANALYSIS REPORT</div>
          <h1 className="ph-cover-title">{analysis.display_name || analysis.filename}</h1>
          {analysis.author && <p className="ph-cover-author">by {analysis.author}</p>}
        </div>
        <div className="ph-cover-center">
          <div className="ph-trust-ring" style={{ borderColor: trustColor(r.overall_trust_score) }}>
            <span className="ph-trust-num" style={{ color: trustColor(r.overall_trust_score) }}>{r.overall_trust_score}</span>
            <span className="ph-trust-lbl">TRUST</span>
          </div>
          <p className="ph-cover-headline">{headline}</p>
        </div>
        <div className="ph-cover-bottom">
          <div className="ph-cover-mini-stats">
            <span className="ph-mini-stat"><em style={{ color: "#ef4444" }}>{r.forensics.deception.manipulation_index}</em> Manipulation</span>
            <span className="ph-mini-stat"><em style={{ color: "#f97316" }}>{r.hype_reality.hype_score}</em> Hype</span>
            <span className="ph-mini-stat"><em style={{ color: "#a855f7" }}>{r.bias_detection.overall_bias_score}</em> Bias</span>
            <span className="ph-mini-stat"><em style={{ color: "#22c55e" }}>{r.implementation_readiness.readiness_score}/10</em> Readiness</span>
          </div>
          <p className="ph-cover-date">{analysis.uploaded_at.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} &middot; DocDetector</p>
        </div>
      </div>

      {/* ═══ PAGE 2: AT A GLANCE ════════════════════════════════════════════ */}
      <div className="ph-page ph-glance">
        <div className="ph-section-hdr">At a Glance</div>
        <p className="ph-glance-summary">{r.summary}</p>
        <div className="ph-glance-grid">
          {[
            { l: "Provider/Consumer", v: r.provider_consumer.classification, s: r.provider_consumer.composite_score },
            { l: "Originator", v: r.company_scale.classification, s: r.company_scale.composite_score },
            { l: "Target", v: r.target_scale.classification, s: r.target_scale.composite_score },
            { l: "Audience", v: r.audience_level.classification, s: r.audience_level.composite_score },
            { l: "Uniqueness", v: r.rarity_index.classification, s: r.rarity_index.composite_score },
            { l: "Manipulation", v: `${r.forensics.deception.manipulation_index}/100`, s: r.forensics.deception.manipulation_index },
            { l: "Hype", v: r.hype_reality.classification, s: r.hype_reality.hype_score },
            { l: "Readiness", v: r.implementation_readiness.verdict, s: r.implementation_readiness.readiness_score * 10 },
            { l: "Bias", v: `${r.bias_detection.overall_bias_score}/100`, s: r.bias_detection.overall_bias_score },
            { l: "Regulatory", v: r.regulatory_safety.safety_level, s: r.regulatory_safety.safety_score },
          ].map((b, i) => (
            <div key={i} className="ph-glance-card">
              <div className="ph-glance-bar" style={{ width: `${Math.max(5, b.s)}%`, background: b.s > 60 ? "#22c55e" : b.s > 30 ? "#eab308" : "#ef4444" }} />
              <span className="ph-glance-label">{b.l}</span>
              <span className="ph-glance-value">{b.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ PAGES 3-8: FINDING SLIDES ══════════════════════════════════════ */}
      {topFindings.map((f, i) => {
        const { evidence, tooltip } = getSectionEvidence(f.section, analysis);
        const fonts = dynamicFonts(f.title, f.insight, evidence + tooltip);
        const accent = sectionColor(f.section);
        return (
          <div key={i} className="ph-page ph-finding">
            <div className="ph-section-hdr" style={{ borderColor: accent, color: accent }}>
              <span className="ph-finding-icon">{sectionIcon(f.section)}</span>
              {f.section.charAt(0).toUpperCase() + f.section.slice(1)}
            </div>
            <h2 className="ph-finding-title" style={{ fontSize: fonts.title }}>{f.title}</h2>
            <p className="ph-finding-insight" style={{ fontSize: fonts.insight }}>{f.insight}</p>

            {/* Visual: score bar with accent color */}
            <div className="ph-score-visual">
              <div className="ph-score-track">
                <div className="ph-score-fill" style={{ width: `${f.hook_score * 10}%`, background: accent }} />
              </div>
              <span className="ph-score-num" style={{ color: accent }}>{f.hook_score}/10 impact</span>
            </div>

            {/* Evidence box */}
            {evidence && (
              <div className="ph-evidence-box" style={{ borderColor: accent }}>
                <div className="ph-evidence-hdr" style={{ color: accent }}>Evidence from this document</div>
                <p className="ph-evidence-text" style={{ fontSize: fonts.evidence }}>{evidence}</p>
              </div>
            )}

            {/* Tooltip explanation */}
            {tooltip && (
              <div className="ph-tooltip-box">
                <div className="ph-tooltip-hdr">Why this matters</div>
                <p className="ph-tooltip-text" style={{ fontSize: fonts.evidence }}>{tooltip}</p>
              </div>
            )}

            <p className="ph-page-footer">DocDetector &middot; {analysis.display_name || analysis.filename}</p>
          </div>
        );
      })}

      {/* ═══ PAGE 9: CTA ════════════════════════════════════════════════════ */}
      <div className="ph-page ph-cta">
        <div className="ph-section-hdr">Full Interactive Report</div>
        <h2 className="ph-cta-title">This was just the highlights.</h2>
        <p className="ph-cta-text">
          The full report includes 5 decision modules with 25 weighted drivers,
          detailed forensic evidence, fallacy analysis, implementation checklists — 
          and you can <strong>contest every single finding</strong>.
        </p>
        <div className="ph-cta-contest">
          <span className="ph-cta-contest-icon">{"\uD83D\uDCAC"}</span>
          <div>
            <strong>Don&apos;t agree with the assessment?</strong>
            <p>Every section has a comment panel. Contest findings, share your perspective, and help improve the analysis.</p>
          </div>
        </div>
        <div className="ph-cta-links">
          <a href={reportUrl} className="ph-cta-link ph-cta-link-primary" target="_blank" rel="noopener noreferrer">
            <span className="ph-cta-link-label-primary">View Full Report &amp; Comment</span>
            <span className="ph-cta-link-url">{reportUrl}</span>
          </a>
          <a href={glossaryUrl} className="ph-cta-link" target="_blank" rel="noopener noreferrer">
            <span className="ph-cta-link-label">Assessment Methodology</span>
            <span className="ph-cta-link-url">{glossaryUrl}</span>
          </a>
        </div>
      </div>

      {/* ═══ PAGE 10: ABOUT ═════════════════════════════════════════════════ */}
      <div className="ph-page ph-about">
        <div className="ph-section-hdr">About This Analysis</div>
        <h2 className="ph-about-title">DocDetector</h2>
        <p className="ph-about-text">
          AI-powered forensic intelligence for technology vendor and advisory documents.
          5 decision modules, 25 weighted drivers, content forensics, bias detection,
          and implementation readiness — powered by a 5-layer Gemini AI pipeline.
        </p>
        <div className="ph-about-grid">
          {[
            { n: "5", l: "Decision Modules" }, { n: "25", l: "Weighted Drivers" },
            { n: "15+", l: "Forensic Checks" }, { n: "5", l: "AI Layers" },
          ].map((s, i) => (
            <div key={i} className="ph-about-stat">
              <span className="ph-about-stat-num">{s.n}</span>
              <span className="ph-about-stat-lbl">{s.l}</span>
            </div>
          ))}
        </div>
        <p className="ph-about-meta">
          {analysis.filename} &middot; {analysis.file_hash.slice(0, 16)}&hellip; &middot; {analysis.uploaded_at.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
