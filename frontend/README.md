# DocDetector — AI-Powered Agentic Document Analyzer

A SaaS application that performs AI-powered forensic analysis on business documents (consulting proposals, vendor pitches, whitepapers, advisory decks) across multiple dimensions: trust scoring, content forensics, bias detection, manipulation analysis, and more.

**Live URL:** https://documentworthanalyser.web.app

---

## Features for Testers

Below is what the application can do today. Visit the live URL and try these out:

- **Upload & Analyze Documents** — Upload PDF, DOCX, or TXT files. The app extracts text, runs heuristic pattern matching, and then sends the content through a 5-layer Gemini AI pipeline to produce a comprehensive forensic report.

- **Duplicate Detection** — The app computes a SHA-256 hash of every upload. If the same file has been analyzed before, it immediately redirects to the existing report instead of re-analyzing. It also performs fuzzy matching to flag similar (but not identical) documents.

- **Document Fitness Check** — Before analysis begins, Gemini checks if the document is a business/technology document suitable for forensic analysis. Non-qualifying documents (e.g. recipes, novels, personal letters) are rejected with an explanation.

- **5-Layer AI Analysis Pipeline** — Each document is analyzed across: (1) Heuristic pre-pass for word counts and pattern detection, (2) Raw forensics including deception detection, logical fallacies, and regulatory safety, (3) Informed analysis for bias, obsolescence risk, and implementation readiness, (4) Strategic classification for provider/consumer stance, company scale, audience level, (5) Synthesis for overall trust score, key findings, hype vs reality, and a narrative summary.

- **Interactive Report Dashboard** — Results are presented in a slide-based UI with scores, gauges, charts, and detailed breakdowns for each of the 25+ analysis drivers. Each section has hover tooltips explaining the metric.

- **Print-Ready Highlight Reel** — Generate a styled PDF summary (via browser Print to PDF) with the top findings, scores, and key insights formatted for sharing.

- **Google Authentication** — Sign in with your Google account to unlock private uploads and starred comments. Only your email is stored — no other personal data.

- **Private File Uploads** — When signed in, toggle a file as "Private" so that only you can see it in the file list and access its report. Others cannot view the report even with a direct URL. The default is Private when logged in.

- **Public File Uploads** — Files uploaded as Public (or uploaded without signing in) are visible to everyone in the "Previously Assessed" list.

- **"Show Only My Files" Filter** — When signed in, toggle this on the home page to filter the file list to only your uploads.

- **Platform Stats** — The home page shows total files analyzed and total words analyzed across all uploads (public and private combined).

- **Section-Level Discussion** — Every section of the report has a discussion button. Click it to open a comment panel scoped to that specific section.

- **Anonymous Comments** — Post comments without signing in. These appear without any identity attached.

- **Starred Comments** — Post comments with your Google identity attached. Starred comments display your email and timestamp, trigger an admin email alert, and guarantee a response from the admin within 7 working days. If you're not signed in, clicking "Starred" opens a Google sign-in popup and auto-posts your comment after login.

- **AI Auto-Reply to Comments** — Every comment (anonymous or starred) gets an instant AI-generated response from DocDetector. Gemini reads the full document, analysis results, and all prior comments in that section to generate a contextual reply. If Gemini cannot answer, it escalates to the admin with a detailed summary.

- **Email Notifications** — When a starred comment is posted, the admin receives an email alert. When anyone replies in a section that has starred comments, all starred commenters in that section plus the admin receive email notifications with a direct link to the discussion.

- **Admin Escalation** — If the AI auto-reply determines it cannot adequately respond, the admin receives an escalation email with a ~300-word analysis of why it couldn't answer, along with the original question.

- **Assessment Rules Glossary** — A dedicated page listing every metric, what it means, why it matters, and how it's calculated. Accessible from the header on every page.

- **Responsive Dark Theme UI** — The entire app uses a dark zinc/blue theme optimized for readability. Works on desktop and mobile.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **AI Engine:** Google Gemini 2.0 Flash (5-layer analysis pipeline + comment auto-reply)
- **Authentication:** Firebase Auth (Google sign-in)
- **Database:** Firebase Firestore (analyses, comments, glossary)
- **File Storage:** Firebase Storage (original uploaded files)
- **Cloud Functions:** Firebase Cloud Functions 2nd Gen (email notifications)
- **Email:** Nodemailer via Gmail SMTP (app password)
- **Hosting:** Firebase Hosting (static export)
- **PDF Parsing:** pdfjs-dist (Mozilla PDF.js) + canvas page-to-image conversion

---

## Project Structure

```
frontend/
  src/
    app/
      page.tsx                — Home page (upload + recent analyses + stats)
      report/[id]/page.tsx    — Dynamic report page (with Suspense boundary)
      glossary/page.tsx       — Glossary/catalogue of all assessment terms
      login/page.tsx          — Google sign-in page
      layout.tsx              — Root layout (wraps app in AuthProvider)
    components/
      ReportClient.tsx        — Main report dashboard + AI auto-reply logic
      UploadGatekeeper.tsx    — File upload with SHA-256 dedup + private/public toggle
      CommentPanel.tsx        — Section-specific comments (anonymous + starred)
      UserMenu.tsx            — Header login/logout + user email display
      Providers.tsx           — AuthProvider wrapper for global auth context
      HelpTooltip.tsx         — Hover tooltips on every label
      dashboard/              — Dashboard sub-components (slides, charts, gauges)
    lib/
      auth.tsx                — AuthContext: Google sign-in, user state, signOut
      analyzer.ts             — Heuristic analysis engine (Layer 0)
      gemini.ts               — Gemini API calls (Layers 1-5 + comment auto-reply)
      extract-text.ts         — PDF/TXT/DOCX text extraction
      pdf-to-images.ts        — PDF page-to-image conversion for multimodal analysis
      firebase.ts             — All Firestore & Storage CRUD operations
      types.ts                — TypeScript type definitions (AnalysisDoc, CommentDoc)
      tooltips.ts             — Tooltip text dictionary
      glossary.ts             — Glossary entries (seeded to Firestore)
      fuzzy-match.ts          — Fuzzy document similarity detection
  functions/
    src/index.ts              — Cloud Function: onCommentCreated (email notifications)
    package.json              — Cloud Functions dependencies
    tsconfig.json             — Cloud Functions TypeScript config
    .env                      — Cloud Functions secrets (SMTP credentials, admin email)
    .gitignore                — Excludes .env and compiled JS from git
  utility/
    reset-firebase.mjs        — Clears all data from Firestore & Storage
  public/
    logo.png                  — Application logo (favicon + branding)
  firebase.json               — Firebase deployment config (hosting + functions)
  firestore.rules             — Firestore security rules
  storage.rules               — Storage security rules
  .env.local                  — Frontend secrets (Gemini API key)
```

---

## Firestore Schema

### `analyses/{id}`
| Field | Type | Description |
|---|---|---|
| file_hash | string | SHA-256 of original file |
| filename | string | Original filename |
| display_name | string | AI-extracted document title |
| author | string | AI-extracted document author |
| doc_summary | string | AI-extracted one-line summary |
| file_size | number | File size in bytes |
| file_type | string | MIME type |
| summary | string | Max 300-word analysis summary |
| analysis_result | map | Full analysis result object (all 25+ drivers) |
| visibility | string | `"public"` or `"private"` |
| uploader_uid | string \| null | Firebase Auth UID of uploader |
| uploader_email | string \| null | Email of uploader |
| uploaded_at | timestamp | When the file was uploaded |

**Sub-collection:** `analyses/{id}/comments/{commentId}`

| Field | Type | Description |
|---|---|---|
| user_name | string | Display name (or "Anonymous") |
| text | string | Comment body |
| section_reference | string | Which report section this comment belongs to |
| is_starred | boolean | Whether this is a starred (authenticated) comment |
| commenter_email | string \| null | Email of commenter (starred comments only) |
| commenter_uid | string \| null | Firebase Auth UID (starred comments only) |
| is_auto_reply | boolean | Whether this is an AI-generated auto-reply |
| comment_category | string \| null | AI classification (appreciative, abusive, question, suggestion, contesting) |
| escalation_summary | string \| null | AI escalation summary when it cannot answer (~300 words) |
| likes | number | Like count |
| dislikes | number | Dislike count |
| created_at | timestamp | When the comment was posted |

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
cd frontend
npm install
```

Create `.env.local` in the `frontend/` folder:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
npm run dev
```

Open http://localhost:3000

### Cloud Functions (for email notifications)

```bash
cd frontend/functions
npm install
```

Create `functions/.env`:
```
ADMIN_EMAIL=your_admin_email@gmail.com
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
```

To get a Gmail App Password: Google Account > Security > 2-Step Verification > App Passwords > Generate.

---

## Deploying

The project uses static export for Firebase Hosting. `next.config.ts` has `output: "export"` set permanently.

```bash
cd frontend

# Build static export
npx next build

# Deploy hosting + cloud functions
npx firebase deploy --only "hosting,functions"
```

If deploying only hosting changes:
```bash
npx firebase deploy --only hosting
```

If deploying only function changes:
```bash
npx firebase deploy --only functions
```

---

## Utility Scripts

**Reset all data (for testing):**
```bash
node utility/reset-firebase.mjs
```
Clears all Firestore collections (analyses, glossary) and all files from Storage.

---

## Firebase Project

- **Project:** DocumentWorthAnalyser
- **Project ID:** `documentworthanalyser`
- **Firestore:** Standard edition, nam5 region, Native mode
- **Console:** https://console.firebase.google.com/project/documentworthanalyser
- **Hosting URL:** https://documentworthanalyser.web.app
