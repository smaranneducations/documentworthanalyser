# DocDetector — AI-Powered Agentic Document Analyzer

A SaaS application that performs forensic analysis on business documents (proposals, whitepapers, strategic documents) across multiple dimensions: trust scoring, content forensics, bias detection, implementation readiness, and more.

**Live URL:** https://documentworthanalyser.web.app

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database:** Firebase Firestore (analyses, comments, glossary)
- **File Storage:** Firebase Storage (original uploaded files)
- **Hosting:** Firebase Hosting (static export)
- **PDF Parsing:** pdfjs-dist (Mozilla PDF.js)

---

## How the Analysis Engine Works (IMPORTANT)

### Current State: Heuristic Pattern Matching (No AI)

The analysis engine (`src/lib/analyzer.ts`) is a **client-side heuristic engine** that runs entirely in the browser. It does **NOT** call any AI API (no Vertex AI, no Gemini, no OpenAI).

It works by counting occurrences of hardcoded word/phrase lists against the document text:

| Dictionary | Size | Examples |
|---|---|---|
| Weasel Words | 26 | "arguably", "virtually", "might", "could" |
| Buzzwords | 38 | "synergy", "leverage", "paradigm shift" |
| False Urgency | 12 | "act now", "window is closing" |
| Jargon Masking | 22 | "solutioning", "ideate", "north star" |
| Vendor Terms | 20 | "our solution", "our platform" |
| Client Terms | 15 | "your needs", "your business" |
| C-Suite Language | 15 | "ROI", "EBITDA", "shareholder value" |
| Developer Language | 18 | "API", "SDK", "kubernetes", "CI/CD" |
| Regulatory Terms | 13 | "GDPR", "HIPAA", "SOC2" |
| Outdated Tech | 10 | "GPT-3", "waterfall methodology" |
| Current Practices | 14 | "agentic AI", "RAG", "LLM" |
| _(+ several more)_ | | |

**Scores are derived from:** word counts, density ratios (per 10k words), pattern matching via regex, and weighted composite formulas.

### Key Limitations

1. **Static dictionaries** — If a new term gets coined tomorrow, the engine won't detect it. Someone must manually edit the arrays in `analyzer.ts` and redeploy.
2. **No semantic understanding** — It counts words, not meaning. It cannot understand context, sarcasm, contradictions, or nuanced reasoning.
3. **No learning** — It doesn't improve over time. Every user gets the same static pattern matching.
4. **Pattern-only detection** — Logical fallacies, bias, and deception are detected via simple regex, not true comprehension.

### Future: Vertex AI / Gemini Integration

The original design calls for replacing the heuristic engine with **Google Vertex AI (Gemini 1.5 Flash)** which would:

- Understand language semantically (recognize new terms by context)
- Detect nuance, sarcasm, and complex reasoning
- Provide genuinely intelligent analysis rather than word counting
- Improve over time as the model evolves

The current heuristic engine was built as a **placeholder** to get the UI, data pipeline, and infrastructure working. The real value comes when it's swapped for an actual AI backend.

---

## Project Structure

```
frontend/
  src/
    app/
      page.tsx              — Home page (upload + recent analyses)
      report/[id]/page.tsx  — Dynamic report page
      glossary/page.tsx     — Glossary/catalogue of all terms
    components/
      ReportClient.tsx      — Main report dashboard
      UploadGatekeeper.tsx  — File upload with SHA-256 dedup
      HelpTooltip.tsx       — Hover tooltips on every label
      CommentPanel.tsx      — Section-specific comments
      dashboard/            — Dashboard sub-components
    lib/
      analyzer.ts           — Heuristic analysis engine (see above)
      extract-text.ts       — PDF/TXT/DOCX text extraction
      firebase.ts           — All Firestore & Storage operations
      types.ts              — TypeScript type definitions
      tooltips.ts           — Tooltip text dictionary
      glossary.ts           — Glossary entries (seeded to Firestore)
  utility/
    reset-firebase.mjs      — Clears all data from Firestore & Storage
  firestore.rules           — Firestore security rules
  storage.rules             — Storage security rules
  firebase.json             — Firebase deployment config
```

---

## Firestore Schema

### `analyses/{id}`
| Field | Type | Description |
|---|---|---|
| file_hash | string | SHA-256 of original file |
| filename | string | Original filename |
| file_size | number | File size in bytes |
| file_type | string | MIME type |
| summary | string | Max 300-word analysis summary |
| analysis_result | map | Full analysis result object |
| uploaded_at | timestamp | When the file was uploaded |

**Sub-collection:** `analyses/{id}/comments/{commentId}`

### `glossary/{termId}`
| Field | Type | Description |
|---|---|---|
| term | string | The term name |
| category | string | Category grouping |
| meaning | string | What it means |
| importance | string | Why it matters |
| calculation | string | How it's calculated |
| order | number | Sort order |

### Firebase Storage
```
uploads/{analysisId}/{filename}  — Original uploaded file (PDF, DOCX, etc.)
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploying

The deploy process requires toggling two config files for static export:

1. In `next.config.ts` — add `output: "export"`
2. In `src/app/report/[id]/page.tsx` — replace `export const dynamic = "force-dynamic"` with `export function generateStaticParams() { return [{ id: "_" }]; }`
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
4. Revert both files back after deploying

## Utility Scripts

**Reset all data (for testing):**
```bash
node utility/reset-firebase.mjs
```
Clears all Firestore collections (analyses, glossary) and all files from Storage.

---

## Firebase Project

- **Project:** DocumentWorthAnalyser
- **Firestore:** Standard edition, nam5 region, Native mode
- **Console:** https://console.firebase.google.com/project/documentworthanalyser
