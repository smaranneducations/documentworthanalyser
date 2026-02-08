#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// update-dictionaries.mjs
//
// Calls Google Gemini to generate fresh terms for every word-list dictionary
// in analyzer.ts, merges them with existing entries, removes duplicates,
// and writes the updated arrays back to the file.
//
// Usage:
//   GEMINI_API_KEY=your-key node utility/update-dictionaries.mjs
//
// Get your API key from: https://aistudio.google.com/apikey
// ═══════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Config ───────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANALYZER_PATH = resolve(__dirname, "../src/lib/analyzer.ts");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY environment variable.");
  console.error("   Get one at: https://aistudio.google.com/apikey");
  console.error("   Then run:  GEMINI_API_KEY=your-key node utility/update-dictionaries.mjs");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-2.0-flash";

// ── App Context (sent to Gemini so it understands the purpose) ───────────

const APP_CONTEXT = `
You are helping maintain a document analysis application called "DocDetector".
It performs forensic analysis on business documents — proposals, whitepapers,
consulting deliverables, strategic reports, pitch decks, and vendor proposals.

The app scans document text for specific words and phrases to score documents
across multiple dimensions:
- Is the document vendor-biased or consumer-friendly?
- What audience level is it targeting (developer, manager, VP, C-Suite)?
- How much "fluff" vs actionable content does it contain?
- Does it use manipulative language (false urgency, weasel words)?
- Is the technology current or outdated?
- Does it address regulatory/ethical concerns?

The app has hardcoded arrays of terms/phrases for each category. Your job is
to suggest NEW terms that should be added to each category, based on current
(${new Date().getFullYear()}) business, technology, and consulting language.

IMPORTANT RULES:
- Return ONLY new terms not already in the existing list
- Terms should be lowercase phrases (1-5 words typically)
- Keep acronyms uppercase (e.g., "ROI", "GDPR")
- Focus on terms actually used in real business documents in ${new Date().getFullYear()}
- Be practical — these are used for regex matching against document text
- Return 15-30 new terms per category
- Return valid JSON only, no markdown, no explanation
`;

// ── Dictionary definitions (name → description + current terms) ──────────

const DICTIONARIES = [
  {
    varName: "WEASEL_WORDS",
    description: "Vague, non-committal language used to hedge or avoid accountability. Words that sound meaningful but dilute the strength of claims. Used in business documents to avoid making firm commitments.",
  },
  {
    varName: "BUZZWORDS",
    description: "Overused business/tech jargon that sounds impressive but often lacks substance. Corporate-speak and consulting buzzwords commonly found in proposals and whitepapers.",
  },
  {
    varName: "FALSE_URGENCY_PATTERNS",
    description: "Phrases that create artificial time pressure to rush decision-making. Manipulation tactics that pressure readers to act quickly without proper evaluation. NOTE: return only plain string phrases, no regex patterns.",
    isStringOnly: true,
  },
  {
    varName: "JARGON_MASKING",
    description: "Complex-sounding phrases used to make simple ideas seem sophisticated. Corporate jargon that obscures meaning rather than clarifying it. Often used to hide lack of substance.",
  },
  {
    varName: "ACTION_VERBS",
    description: "Concrete implementation verbs that indicate actionable, practical content. Verbs you'd find in technical docs, runbooks, and implementation guides. The presence of these suggests the document has real substance.",
  },
  {
    varName: "VENDOR_TERMS",
    description: "Phrases indicating the document is written from a vendor/service-provider perspective. Self-promotional language where the company talks about itself and its offerings.",
  },
  {
    varName: "CLIENT_TERMS",
    description: "Phrases indicating the document is focused on the reader/client's needs. Language that centers the client's problems, goals, and outcomes rather than the vendor.",
  },
  {
    varName: "UPSELL_PATTERNS",
    description: "Phrases that indicate the document is trying to sell additional services, upgrades, or follow-on engagements. Signs that the primary goal is revenue generation rather than delivering value.",
  },
  {
    varName: "PROPRIETARY_FRAMEWORK_TERMS",
    description: "Terms indicating proprietary, branded, or trademarked frameworks and methodologies. Signs that a consulting firm is pushing their own branded tools rather than open standards. NOTE: return only plain string phrases, no regex patterns.",
    isStringOnly: true,
  },
  {
    varName: "GOVERNANCE_TERMS",
    description: "Enterprise governance, compliance, and organizational structure terms. Indicate the document targets large organizations with formal decision-making processes.",
  },
  {
    varName: "STARTUP_TERMS",
    description: "Lean/agile startup methodology language. Indicates the document targets startups or small, fast-moving teams.",
  },
  {
    varName: "ENTERPRISE_TERMS",
    description: "Large-scale enterprise transformation language. Indicates the document targets big corporations with complex, multi-year initiatives.",
  },
  {
    varName: "CSUITE_LANGUAGE",
    description: "Executive-level business and financial language. Terms that C-Suite executives (CEO, CFO, CTO) use in boardrooms and strategic discussions.",
  },
  {
    varName: "DEVELOPER_LANGUAGE",
    description: "Technical/developer-specific terms. Tools, frameworks, protocols, and concepts that software engineers use daily. Indicates the document targets a technical audience.",
  },
  {
    varName: "FINANCIAL_METRICS",
    description: "Financial and business metrics used to measure ROI, costs, and business impact. Terms found in financial analysis sections of business documents.",
  },
  {
    varName: "REGULATORY_TERMS",
    description: "Regulatory frameworks, compliance standards, and legal requirements. Laws, certifications, and standards that businesses must comply with. Include new AI regulations from 2024-2026.",
  },
  {
    varName: "ETHICAL_TERMS",
    description: "AI ethics, responsible technology, and fairness terms. Language around ethical AI development, bias, transparency, and accountability.",
  },
  {
    varName: "PRIVACY_TERMS",
    description: "Data privacy, protection, and security terms. GDPR-related concepts, data handling practices, and privacy-by-design terminology.",
  },
  {
    varName: "OUTDATED_TECH",
    description: "Outdated or legacy technology references that suggest the document is behind the times. Technologies, methodologies, and tools that have been superseded by modern alternatives as of 2026.",
  },
  {
    varName: "CURRENT_PRACTICES",
    description: "Cutting-edge, current technology practices and terms as of 2026. AI, ML, cloud-native, and modern engineering practices that indicate the document is up-to-date.",
  },
];

// ── Extract current terms from analyzer.ts ───────────────────────────────

function extractCurrentTerms(source, varName) {
  // Match: const VARNAME = [ ... ];  or  const VARNAME: (string | RegExp)[] = [ ... ];
  const pattern = new RegExp(
    `const\\s+${varName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`,
    "m"
  );
  const match = source.match(pattern);
  if (!match) {
    console.warn(`   ⚠ Could not find array "${varName}" in analyzer.ts`);
    return [];
  }

  const body = match[1];
  // Extract all plain string entries (ignore regex patterns)
  const strings = [];
  const strPattern = /["']([^"']+)["']/g;
  let m;
  while ((m = strPattern.exec(body)) !== null) {
    strings.push(m[1]);
  }
  return strings;
}

// ── Replace array in analyzer.ts ─────────────────────────────────────────

function replaceArray(source, varName, newTerms) {
  const pattern = new RegExp(
    `(const\\s+${varName}[^=]*=\\s*\\[)([\\s\\S]*?)(\\];)`,
    "m"
  );
  const match = source.match(pattern);
  if (!match) {
    console.warn(`   ⚠ Could not find array "${varName}" to replace`);
    return source;
  }

  const prefix = match[1];
  const oldBody = match[2];
  const suffix = match[3];

  // Preserve any regex patterns from the old body
  const regexPatterns = [];
  const regexPattern = /(\/[^/]+\/[gi]*)/g;
  let rm;
  while ((rm = regexPattern.exec(oldBody)) !== null) {
    regexPatterns.push(rm[1]);
  }

  // Format the new string entries (8 per line for readability)
  const lines = [];
  for (let i = 0; i < newTerms.length; i += 6) {
    const chunk = newTerms.slice(i, i + 6);
    const formatted = chunk.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ");
    lines.push(`  ${formatted},`);
  }

  // Add regex patterns at the end if any existed
  if (regexPatterns.length > 0) {
    lines.push(`  ${regexPatterns.join(", ")},`);
  }

  const newBody = "\n" + lines.join("\n") + "\n";
  return source.replace(pattern, `${prefix}${newBody}${suffix}`);
}

// ── Call Gemini for one dictionary ────────────────────────────────────────

async function getNewTerms(dict, currentTerms) {
  const prompt = `${APP_CONTEXT}

CATEGORY: ${dict.varName}
DESCRIPTION: ${dict.description}

EXISTING TERMS (do NOT repeat these):
${JSON.stringify(currentTerms, null, 2)}

Return a JSON array of 15-30 NEW string terms/phrases for this category.
Only the JSON array, nothing else. Example: ["term one", "term two", "term three"]`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text.trim();
  // Extract JSON array from response (handle possible markdown wrapping)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn(`   ⚠ Could not parse JSON from Gemini response for ${dict.varName}`);
    console.warn(`   Response: ${text.slice(0, 200)}`);
    return [];
  }

  try {
    const terms = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(terms)) return [];
    return terms.filter((t) => typeof t === "string" && t.length > 0);
  } catch (e) {
    console.warn(`   ⚠ JSON parse error for ${dict.varName}:`, e.message);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  DocDetector Dictionary Updater — Powered by Gemini");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Model: ${MODEL}`);
  console.log(`  Dictionaries: ${DICTIONARIES.length}`);
  console.log(`  File: ${ANALYZER_PATH}`);
  console.log("");

  let source = readFileSync(ANALYZER_PATH, "utf-8");
  let totalAdded = 0;

  for (const dict of DICTIONARIES) {
    process.stdout.write(`📖 ${dict.varName} ... `);

    // 1. Extract current terms
    const currentTerms = extractCurrentTerms(source, dict.varName);
    console.log(`(${currentTerms.length} existing)`);

    // 2. Call Gemini for new terms
    let newFromGemini;
    try {
      newFromGemini = await getNewTerms(dict, currentTerms);
    } catch (err) {
      console.error(`   ❌ Gemini API error: ${err.message}`);
      continue;
    }

    if (newFromGemini.length === 0) {
      console.log("   → No new terms returned");
      continue;
    }

    // 3. Merge and deduplicate (case-insensitive)
    const existingLower = new Set(currentTerms.map((t) => t.toLowerCase()));
    const genuinelyNew = newFromGemini.filter(
      (t) => !existingLower.has(t.toLowerCase())
    );

    if (genuinelyNew.length === 0) {
      console.log(`   → ${newFromGemini.length} returned but all were duplicates`);
      continue;
    }

    const merged = [...currentTerms, ...genuinelyNew];
    // Final dedup
    const seen = new Set();
    const deduped = merged.filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`   + ${genuinelyNew.length} new terms added (${deduped.length} total)`);
    totalAdded += genuinelyNew.length;

    // 4. Write back to source
    source = replaceArray(source, dict.varName, deduped);
  }

  // 5. Save the file
  if (totalAdded > 0) {
    writeFileSync(ANALYZER_PATH, source, "utf-8");
    console.log("");
    console.log("══════════════════════════════════════════════════════════════");
    console.log(`  ✓ Done! Added ${totalAdded} new terms across all dictionaries`);
    console.log(`  ✓ File updated: ${ANALYZER_PATH}`);
    console.log("══════════════════════════════════════════════════════════════");
  } else {
    console.log("");
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  ℹ No new terms were added. Dictionaries are up to date.");
    console.log("══════════════════════════════════════════════════════════════");
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
