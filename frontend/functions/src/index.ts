// ═══════════════════════════════════════════════════════════════════════════
// Cloud Function: Email notifications for starred comments
//
// Triggers on: analyses/{analysisId}/comments/{commentId} — onCreate
//
// Logic:
//   1. New starred comment → email admin
//   2. Any comment on a section that has starred comments →
//      email admin + all starred commenters in that section
// ═══════════════════════════════════════════════════════════════════════════

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {
  runGeminiPipeline,
  checkDocumentFitness,
  generateCommentReply,
} from "./gemini-server";

admin.initializeApp();
const db = admin.firestore();

// ── Config from .env file ────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contactbhasker7483@gmail.com";
const SMTP_EMAIL = process.env.SMTP_EMAIL || "";
const SMTP_APP_PASSWORD = process.env.SMTP_APP_PASSWORD || "";

// ── Email transporter (created lazily) ───────────────────────────────────
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

// ── Helper: send email ───────────────────────────────────────────────────
async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<void> {
  const mail = getTransporter();
  try {
    await mail.sendMail({
      from: `"DocDetector" <${SMTP_EMAIL}>`,
      to: to.join(", "),
      subject,
      html,
    });
    console.log(`[Email] Sent to: ${to.join(", ")} | Subject: ${subject}`);
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

// ── Helper: build email HTML ─────────────────────────────────────────────
function buildEmailHtml(params: {
  fileName: string;
  section: string;
  commentText: string;
  commenterName: string;
  isStarred: boolean;
  reportUrl: string;
  extraBlock?: string;
}): string {
  const badge = params.isStarred
    ? '<span style="background:#f59e0b;color:#000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">★ STARRED</span>'
    : '<span style="background:#666;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">Anonymous</span>';

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#1a1a1a;color:#e4e4e7;border-radius:12px;">
      <div style="border-bottom:1px solid #333;padding-bottom:16px;margin-bottom:16px;">
        <h2 style="margin:0;color:#60a5fa;">DocDetector — New Comment</h2>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr>
          <td style="padding:6px 12px;color:#a1a1aa;font-size:13px;width:100px;">File</td>
          <td style="padding:6px 12px;color:#e4e4e7;font-weight:600;">${params.fileName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#a1a1aa;font-size:13px;">Section</td>
          <td style="padding:6px 12px;color:#e4e4e7;">${params.section}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#a1a1aa;font-size:13px;">By</td>
          <td style="padding:6px 12px;color:#e4e4e7;">${params.commenterName} ${badge}</td>
        </tr>
      </table>

      <div style="background:#27272a;border:1px solid #3f3f46;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0;color:#d4d4d8;line-height:1.6;">${params.commentText}</p>
      </div>

      ${params.extraBlock || ""}

      <a href="${params.reportUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Report & Discussion
      </a>

      <p style="margin-top:20px;font-size:11px;color:#71717a;">
        This email was sent by DocDetector because a starred comment was posted or a reply was added to a starred thread.
      </p>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION: onCommentCreated
// ═══════════════════════════════════════════════════════════════════════════

export const onCommentCreated = onDocumentCreated(
  "analyses/{analysisId}/comments/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const comment = snap.data();
    const { analysisId } = event.params;

    console.log(
      `[onCommentCreated] New comment on analysis ${analysisId}`,
      `| starred: ${comment.is_starred}`,
      `| section: ${comment.section_reference}`
    );

    // ── Fetch the parent analysis doc for file name ────────────────
    const analysisSnap = await db.doc(`analyses/${analysisId}`).get();
    if (!analysisSnap.exists) {
      console.warn("[onCommentCreated] Parent analysis not found, skipping.");
      return;
    }
    const analysis = analysisSnap.data()!;
    const fileName = analysis.display_name || analysis.filename || "Unknown File";
    const sectionParam = encodeURIComponent(comment.section_reference || "");
    const reportUrl = `https://documentworthanalyser.web.app/report/${analysisId}?discuss=${sectionParam}`;

    // ── Determine who to email ─────────────────────────────────────
    const recipients = new Set<string>();
    const adminEmail = ADMIN_EMAIL;

    if (comment.is_starred) {
      // Case 1: This IS a starred comment → always email admin
      recipients.add(adminEmail);
    }

    // Case 2: Check if there are OTHER starred comments in this section
    // If so, email those commenters + admin (thread activity notification)
    const sectionCommentsSnap = await db
      .collection(`analyses/${analysisId}/comments`)
      .where("section_reference", "==", comment.section_reference)
      .where("is_starred", "==", true)
      .get();

    for (const doc of sectionCommentsSnap.docs) {
      // Skip the current comment (if starred, already handled above)
      if (doc.id === event.params.commentId) continue;

      const starredComment = doc.data();
      if (starredComment.commenter_email) {
        recipients.add(starredComment.commenter_email);
        recipients.add(adminEmail); // admin always gets notified on starred threads
      }
    }

    // Case 3: Escalation — Gemini auto-reply couldn't answer, needs admin review
    if (comment.is_auto_reply && comment.escalation_summary) {
      recipients.add(adminEmail);
      console.log("[onCommentCreated] Escalation detected — admin will be notified.");
    }

    if (recipients.size === 0) {
      console.log("[onCommentCreated] No starred context or escalation — no emails to send.");
      return;
    }

    // ── Build and send ─────────────────────────────────────────────
    const commenterName = comment.is_auto_reply
      ? "DocDetector AI"
      : comment.is_starred
      ? (comment.commenter_email || "User")
      : "Anonymous";

    const isEscalation = comment.is_auto_reply && comment.escalation_summary;

    const subject = isEscalation
      ? `[DocDetector] ⚠ Escalation — "${fileName}" — ${comment.section_reference}`
      : `[DocDetector] New comment on "${fileName}" — ${comment.section_reference}`;

    const escalationBlock = isEscalation
      ? `<div style="background:#7c2d12;border:1px solid #9a3412;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#fb923c;font-weight:bold;font-size:13px;">⚠ ESCALATION — AI could not respond</p>
          <p style="margin:0;color:#fed7aa;line-height:1.6;font-size:13px;">${comment.escalation_summary}</p>
         </div>`
      : "";

    const html = buildEmailHtml({
      fileName,
      section: comment.section_reference,
      commentText: comment.text,
      commenterName,
      isStarred: comment.is_starred ?? false,
      reportUrl,
      extraBlock: escalationBlock,
    });

    await sendEmail(Array.from(recipients), subject, html);

    console.log(
      `[onCommentCreated] Emails sent to: ${Array.from(recipients).join(", ")}`
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// CALLABLE FUNCTIONS: Gemini API proxy (keeps API key server-side)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check document fitness — quick Gemini call to classify document.
 * Callable from any client (no auth required — anonymous uploads allowed).
 */
export const geminiCheckFitness = onCall(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const { documentText } = request.data;
    if (!documentText || typeof documentText !== "string") {
      throw new HttpsError("invalid-argument", "documentText is required");
    }
    if (documentText.length > 200000) {
      throw new HttpsError("invalid-argument", "Document text too large (max 200k chars)");
    }

    try {
      const result = await checkDocumentFitness(documentText);
      return result;
    } catch (err) {
      console.error("[geminiCheckFitness] Error:", err);
      throw new HttpsError("internal", "Fitness check failed");
    }
  }
);

/**
 * Run the full 5-layer Gemini analysis pipeline.
 * Callable from any client (anonymous uploads are public).
 */
export const geminiAnalyze = onCall(
  { timeoutSeconds: 300, memory: "512MiB" },
  async (request) => {
    const { documentText, heuristicPrePass } = request.data;
    if (!documentText || typeof documentText !== "string") {
      throw new HttpsError("invalid-argument", "documentText is required");
    }
    if (!heuristicPrePass || typeof heuristicPrePass !== "object") {
      throw new HttpsError("invalid-argument", "heuristicPrePass is required");
    }
    if (documentText.length > 200000) {
      throw new HttpsError("invalid-argument", "Document text too large (max 200k chars)");
    }

    try {
      const result = await runGeminiPipeline(documentText, heuristicPrePass);
      return result;
    } catch (err) {
      console.error("[geminiAnalyze] Error:", err);
      throw new HttpsError("internal", "Gemini analysis pipeline failed");
    }
  }
);

/**
 * Generate an AI auto-reply to a comment.
 * Callable from any client.
 */
export const geminiCommentReply = onCall(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const { fileName, docSummary, analysisResultJson, sectionRef, existingComments, newCommentText, newCommentUser } = request.data;

    if (!newCommentText || typeof newCommentText !== "string") {
      throw new HttpsError("invalid-argument", "newCommentText is required");
    }

    try {
      const result = await generateCommentReply({
        fileName: fileName || "",
        docSummary: docSummary || "",
        analysisResultJson: analysisResultJson || "{}",
        sectionRef: sectionRef || "",
        existingComments: existingComments || [],
        newCommentText,
        newCommentUser: newCommentUser || "Anonymous",
      });
      return result;
    } catch (err) {
      console.error("[geminiCommentReply] Error:", err);
      throw new HttpsError("internal", "Comment reply generation failed");
    }
  }
);
