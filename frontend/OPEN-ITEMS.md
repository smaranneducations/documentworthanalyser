# Open Items

## Resolved

### ~~1. Get Gemini API Key for Dictionary Updater~~
**Status:** Resolved  
Gemini API key is now configured in `.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`. The full Gemini analysis pipeline (5 layers) is integrated and operational.

### ~~2. PDF Text Extraction Not Working~~
**Status:** Resolved  
PDF text extraction via `pdfjs-dist` is working correctly. PDF pages are also converted to images for multimodal analysis by Gemini.

### ~~3. Integrate Vertex AI / Gemini for Real Analysis~~
**Status:** Resolved  
Gemini 2.0 Flash is fully integrated via `src/lib/gemini.ts`. The analysis pipeline runs 5 layered Gemini calls per document (raw forensics, informed analysis, strategic classification, synthesis, and document identity extraction). The heuristic engine remains as Layer 0 providing foundational counts to Gemini.

---

## Open

### 4. Auto-Populate PDF Filename in Save Dialog
**Status:** Future  
**Priority:** Low  

When using "Print to PDF", the browser save dialog does not pick up the `document.title` as the suggested filename. We set `document.title` to `"[display_name] - Assessment Report"` before calling `window.print()`, but Chrome/Edge's "Save as PDF" dialog ignores it and leaves the filename blank.

This appears to be a browser limitation. A server-side PDF generation approach (see Item #5) would allow setting the filename via `Content-Disposition` headers.

---

### 5. Server-Side PDF Generation with Clickable Links
**Status:** Future  
**Priority:** Medium  

Browser "Print to PDF" (`window.print()`) renders pages as flat images — `<a>` tags are present in the HTML but the resulting PDF does not preserve clickable hyperlinks. This is a known browser limitation across Chrome/Edge.

**To get truly clickable links** in the exported PDF highlight reel, a server-side PDF generator is needed (Puppeteer, jsPDF, or React-PDF). This would be a bigger architectural change.

**Current workaround:** URLs are printed as visible text so readers can copy/paste them.

---

### 6. Firestore Security Rules Hardening
**Status:** Future  
**Priority:** Medium  

Current Firestore rules are permissive for development. For production hardening:
- Private analyses should only be readable by the `uploader_uid`.
- Comments should validate that `commenter_uid` matches the authenticated user for starred comments.
- Rate limiting on comment creation to prevent spam.

---

### 7. API Key Restrictions
**Status:** Recommended  
**Priority:** Medium  

The Firebase API key is publicly visible (by design) but should have restrictions applied in the Google Cloud Console:
- **HTTP referrer restrictions:** Limit to `documentworthanalyser.web.app/*` and `localhost:3000/*`
- **API restrictions:** Limit to only the Firebase/Google Cloud APIs actually used

This prevents potential billing abuse from unauthorized usage of the key.

---

### 8. Gemini API Key Server-Side Migration
**Status:** Future  
**Priority:** Medium  

The Gemini API key is currently exposed in browser JavaScript via `NEXT_PUBLIC_GEMINI_API_KEY`. For production at scale, move the Gemini calls behind a Firebase Cloud Function so the key stays server-side and is not visible to end users.

---
