# Open Items

## 1. Get Gemini API Key for Dictionary Updater
**Status:** Pending  
**Priority:** Medium  

The utility script `utility/update-dictionaries.mjs` needs a Gemini API key to call the AI and refresh the word dictionaries in `analyzer.ts`.

**How to get the key:**
- Go to https://aistudio.google.com/apikey
- Click "Create API Key"
- Select project **DocumentWorthAnalyser**
- Copy the key

**How to run once you have the key (PowerShell):**
```
$env:GEMINI_API_KEY="your-key-here"; node utility/update-dictionaries.mjs
```

---

## 2. PDF Text Extraction Not Working
**Status:** Pending  
**Priority:** High  

Uploading a PDF still shows garbled binary data in Key Findings and analysis results. The `pdfjs-dist` library was installed and `src/lib/extract-text.ts` was created, but the PDF.js worker URL may not be resolving correctly in the Next.js dev/build environment. Needs debugging — check browser console for errors when uploading a PDF.

---

## 3. Integrate Vertex AI / Gemini for Real Analysis
**Status:** Future  
**Priority:** High  

The current analysis engine (`src/lib/analyzer.ts`) is a heuristic pattern-matching engine — it counts hardcoded words, not AI. The original plan calls for replacing it with Google Vertex AI (Gemini 1.5 Flash) to get genuine semantic understanding of documents. This is a separate piece of work.

---

## 4. Auto-Populate PDF Filename in Save Dialog
**Status:** Future  
**Priority:** Low  

When using "Print to PDF", the browser save dialog does not pick up the `document.title` as the suggested filename. We set `document.title` to `"[display_name] - Assessment Report"` before calling `window.print()`, but Chrome/Edge's "Save as PDF" dialog ignores it and leaves the filename blank.

This appears to be a browser limitation — the `document.title` trick works inconsistently across browsers and OS versions. A server-side PDF generation approach (see Item #5) would allow setting the filename via `Content-Disposition` headers.

---

## 5. Server-Side PDF Generation with Clickable Links
**Status:** Future  
**Priority:** Medium  

Browser "Print to PDF" (`window.print()`) renders pages as flat images — `<a>` tags are present in the HTML but the resulting PDF does not preserve clickable hyperlinks. This is a known browser limitation across Chrome/Edge.

**To get truly clickable links** in the exported PDF highlight reel, we need a server-side PDF generator library such as:
- **Puppeteer** — headless Chrome that can generate PDFs with working links
- **jsPDF** — client-side PDF generation with explicit link annotations
- **React-PDF / @react-pdf/renderer** — React components that render directly to PDF

This would be a bigger architectural change: either a Cloud Function endpoint that renders the highlight reel via Puppeteer, or a client-side rewrite of `ReportPrintHighlights.tsx` using a PDF library instead of CSS `@media print`.

**Current workaround:** URLs are printed as visible text so readers can copy/paste them.

---
