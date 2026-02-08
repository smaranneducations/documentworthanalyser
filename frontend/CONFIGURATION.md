# Configuration & Secrets Reference

This document lists every key, credential, and configuration value used by DocDetector, where it lives, and how to update it.

---

## 1. Firebase Configuration

**Location:** Hardcoded in `src/lib/firebase.ts`

| Key | Value | Purpose |
|-----|-------|---------|
| `apiKey` | `AIzaSyDOiDbcWPbKmVQJ5m7brYm0LYPRvOkb_uY` | Firebase client SDK authentication |
| `authDomain` | `documentworthanalyser.firebaseapp.com` | Firebase Auth domain |
| `projectId` | `documentworthanalyser` | Firestore & Hosting project identifier |
| `storageBucket` | `documentworthanalyser.firebasestorage.app` | Firebase Storage bucket |
| `messagingSenderId` | `831032268912` | Firebase Cloud Messaging (not currently used) |
| `appId` | `1:831032268912:web:00f9914b3c6680762cfcb5` | Firebase app identifier |

**How to update:** Edit the `firebaseConfig` object in `src/lib/firebase.ts`. These values come from Firebase Console > Project Settings > General > Your apps > Web app.

**Security note:** Firebase client-side API keys are safe to expose in browser code. They are restricted by Firebase Security Rules, not by secrecy. This is by design. Google may send warning emails about publicly accessible API keys — these can be safely ignored for Firebase client keys.

**Also duplicated in:**
- `utility/reset-firebase.mjs` (for the database reset script)

If you change the Firebase project, update both locations.

---

## 2. Gemini API Key

**Location:** `frontend/.env.local`

```
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

**How to obtain:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create key in existing GCP project
5. Copy the generated key

**How to update:** Edit `.env.local` and replace the value. Restart the dev server (`next dev`) for changes to take effect.

**Security note:** The `NEXT_PUBLIC_` prefix makes this key visible in browser JavaScript. This is acceptable for development and low-volume use. For production at scale, move the Gemini call behind a Cloud Function so the key stays server-side.

**NEVER commit `.env.local` to git.** It is listed in `.gitignore`.

---

## 3. Firebase Authentication (Google Sign-In)

**Location:** Configured in `src/lib/auth.tsx`

Firebase Auth is set up with the Google provider. No additional configuration is needed beyond the Firebase config above. The Google sign-in provider is enabled in Firebase Console > Authentication > Sign-in method > Google.

**What is stored:** Only the user's email address and Firebase UID. No other personal data is collected or stored.

---

## 4. Cloud Functions Environment Variables

**Location:** `frontend/functions/.env`

```
ADMIN_EMAIL=contactbhasker7483@gmail.com
SMTP_EMAIL=contactbhasker7483@gmail.com
SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Email address that receives all admin alerts, starred comment notifications, and escalations |
| `SMTP_EMAIL` | Gmail address used as the "from" address for sending emails |
| `SMTP_APP_PASSWORD` | Gmail App Password (16 characters, spaces included) for SMTP authentication |

**How to get a Gmail App Password:**
1. Go to Google Account > Security
2. Enable 2-Step Verification (required)
3. Go to 2-Step Verification > App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

**NEVER commit `functions/.env` to git.** It is listed in `functions/.gitignore`.

**How to deploy:** Cloud Functions automatically read from the `.env` file during deployment. Run:
```bash
npx firebase deploy --only functions
```

---

## 5. Firebase Hosting

**Location:** `firebase.json` and `.firebaserc`

| File | Purpose |
|------|---------|
| `firebase.json` | Hosting config: public directory (`out`), rewrites, headers, functions config, Firestore/Storage rules paths |
| `.firebaserc` | Maps project aliases to Firebase project IDs |

**Current alias mapping (`.firebaserc`):**
```json
{
  "projects": {
    "default": "documentworthanalyser"
  }
}
```

**Key rewrites in `firebase.json`:**
- `/report/**` → `/report/placeholder/index.html` (client-side routing for dynamic report pages)
- `/glossary/**` → `/glossary/index.html`
- `**` → `/index.html` (SPA fallback)

**How to deploy:**
```bash
# Build static export
npx next build

# Deploy hosting only
npx firebase deploy --only hosting

# Deploy hosting + functions together
npx firebase deploy --only "hosting,functions"
```

---

## 6. Firebase Security Rules

| File | Governs |
|------|---------|
| `firestore.rules` | Read/write access to Firestore collections (`analyses`, `glossary`, comments sub-collections) |
| `storage.rules` | Read/write access to Firebase Storage (`uploads/`) |

**How to deploy rules:**
```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only storage
```

---

## 7. Next.js Configuration

**Location:** `next.config.ts`

| Setting | Value | Purpose |
|---------|-------|---------|
| `output` | `"export"` | Static export for Firebase Hosting |
| `images.unoptimized` | `true` | Required for static export |
| `trailingSlash` | `true` | Required for Firebase Hosting rewrites |

**Location:** `src/app/report/[id]/page.tsx`

The report page uses `generateStaticParams` with a placeholder ID and a `<Suspense>` boundary to support static export while allowing client-side dynamic rendering.

---

## 8. Environment Files Summary

| File | Committed to Git? | Contains Secrets? | Purpose |
|------|--------------------|-------------------|---------|
| `frontend/.env.local` | No (in `.gitignore`) | Yes | Gemini API key |
| `frontend/functions/.env` | No (in `functions/.gitignore`) | Yes | SMTP credentials, admin email |
| `firebase.json` | Yes | No | Hosting, functions & rules config |
| `.firebaserc` | Yes | No | Project alias mapping |
| `next.config.ts` | Yes | No | Next.js build configuration |

---

## 9. GCP Projects Reference

| Name | Project ID | Purpose |
|------|-----------|---------|
| DocumentWorthAnalyser | `documentworthanalyser` | Firebase (Auth, Firestore, Storage, Hosting, Cloud Functions) |

---

## Quick Checklist for New Developer Setup

1. Clone the repo
2. `cd frontend && npm install`
3. Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
4. `cd functions && npm install`
5. Create `frontend/functions/.env`:
   ```
   ADMIN_EMAIL=admin@example.com
   SMTP_EMAIL=sender@gmail.com
   SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
6. `cd .. && npx next dev` — runs on http://localhost:3000
7. To deploy: `npx next build && npx firebase deploy --only "hosting,functions"`
