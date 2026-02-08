# Configuration & Secrets Reference

This document lists every key, credential, and configuration value used by DocDetector, where it lives, and how to update it.

---

## 1. Firebase Configuration

**Location:** Hardcoded in `src/lib/firebase.ts` (lines ~24-31)

| Key | Value | Purpose |
|-----|-------|---------|
| `apiKey` | `AIzaSyDOiDbcWPbKmVQJ5m7brYm0LYPRvOkb_uY` | Firebase client SDK authentication |
| `authDomain` | `documentworthanalyser.firebaseapp.com` | Firebase Auth domain |
| `projectId` | `documentworthanalyser` | Firestore & Hosting project identifier |
| `storageBucket` | `documentworthanalyser.firebasestorage.app` | Firebase Storage bucket |
| `messagingSenderId` | `831032268912` | Firebase Cloud Messaging (not currently used) |
| `appId` | `1:831032268912:web:00f9914b3c6680762cfcb5` | Firebase app identifier |

**How to update:** Edit the `firebaseConfig` object in `src/lib/firebase.ts`. These values come from Firebase Console > Project Settings > General > Your apps > Web app.

**Security note:** Firebase client-side API keys are safe to expose in browser code. They are restricted by Firebase Security Rules, not by secrecy. This is by design.

**Also duplicated in:**
- `utility/reset-firebase.mjs` (for the database reset script)
- `utility/update-dictionaries.mjs` (for the dictionary updater — if it uses Firebase)

If you change the Firebase project, update all three locations.

---

## 2. Gemini API Key

**Location:** `.env.local` (root of `frontend/` folder)

```
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

**How to obtain:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create key in existing GCP project (`documentanalyseragent`)
5. Copy the generated key

**How to update:** Edit `.env.local` and replace the value. Restart the dev server (`next dev`) for changes to take effect.

**Security note:** The `NEXT_PUBLIC_` prefix makes this key visible in browser JavaScript. This is acceptable for development and low-volume use. For production at scale, move the Gemini call behind a Cloud Function so the key stays server-side.

**NEVER commit `.env.local` to git.** It is listed in `.gitignore`.

---

## 3. Firebase Hosting

**Location:** `firebase.json` and `.firebaserc`

| File | Purpose |
|------|---------|
| `firebase.json` | Hosting config: public directory (`out`), rewrites, headers, Firestore/Storage rules paths |
| `.firebaserc` | Maps project aliases to Firebase project IDs |

**Current alias mapping (`.firebaserc`):**
```json
{
  "projects": {
    "default": "documentworthanalyser"
  }
}
```

**How to deploy:**
```bash
# Build static export
npx next build    # (with output: "export" enabled in next.config.ts)

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

---

## 4. Firebase Security Rules

| File | Governs |
|------|---------|
| `firestore.rules` | Read/write access to Firestore collections (`analyses`, `glossary`, `prompt_configs`) |
| `storage.rules` | Read/write access to Firebase Storage (`uploads/`) |

**How to deploy rules:**
```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only storage
```

---

## 5. Next.js Configuration

**Location:** `next.config.ts`

| Setting | Dev Value | Deploy Value | Purpose |
|---------|-----------|--------------|---------|
| `output` | *(not set)* | `"export"` | Must be `"export"` for Firebase static hosting. Remove for local dev. |
| `images.unoptimized` | `true` | `true` | Required for static export |
| `trailingSlash` | `true` | `true` | Required for Firebase Hosting rewrites |

**Location:** `src/app/report/[id]/page.tsx`

| Setting | Dev Value | Deploy Value |
|---------|-----------|--------------|
| Route mode | `export const dynamic = "force-dynamic"` | `export function generateStaticParams() { return [{ id: "_" }]; }` |

**Important:** Before every deploy, switch both `next.config.ts` and `page.tsx` to deploy mode. Switch back after deploy for local development.

---

## 6. Environment Files Summary

| File | Committed to Git? | Contains Secrets? | Purpose |
|------|--------------------|-------------------|---------|
| `.env.local` | No (in `.gitignore`) | Yes | Gemini API key, any local overrides |
| `.env.local.example` | Yes | No | Template showing required variables |
| `firebase.json` | Yes | No | Hosting & rules config |
| `.firebaserc` | Yes | No | Project alias mapping |

---

## 7. GCP Projects Reference

| Name | Project ID | Purpose |
|------|-----------|---------|
| DocumentWorthAnalyser | `documentworthanalyser` | Firebase (Firestore, Storage, Hosting) |
| DocumentAnalyserAgent | `documentanalyseragent` | GCP services (Gemini API key, future Vertex AI) |

These are separate projects. Firebase runs on `documentworthanalyser`. The Gemini API key was created under `documentanalyseragent`. They are connected only by application code.

---

## Quick Checklist for New Developer Setup

1. Clone the repo
2. `cd frontend && npm install`
3. Create `.env.local` with `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`
4. `npx next dev` — runs on http://localhost:3000
5. To deploy: switch to export mode, `npx next build`, `npx firebase deploy --only hosting`
