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
