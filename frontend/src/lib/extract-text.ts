// ═══════════════════════════════════════════════════════════════════════════
// Text Extraction — Handles PDF, TXT, MD, DOCX
// PDFs are binary files; file.text() returns garbage.
// We use pdfjs-dist to extract the actual readable text.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract readable text from a File.
 * - PDF: parsed with pdfjs-dist, text extracted page by page
 * - TXT / MD: read directly via file.text()
 * - DOCX: basic XML-strip fallback
 */
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type;

  console.log(`[extractText] File: ${file.name}, MIME: ${mime}, ext: ${ext}`);

  // PDF
  if (mime === "application/pdf" || ext === "pdf") {
    try {
      const text = await extractPdfText(file);
      if (text.trim().length > 0) {
        return text;
      }
      console.warn("[extractText] PDF extraction returned empty text");
      return "[PDF contained no extractable text — the document may be image-based or scanned]";
    } catch (err) {
      console.error("[extractText] PDF extraction FAILED:", err);
      throw new Error(
        `Failed to extract text from PDF: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Plain text / Markdown
  if (
    mime === "text/plain" ||
    mime === "text/markdown" ||
    ext === "txt" ||
    ext === "md"
  ) {
    return file.text();
  }

  // DOCX — basic fallback (strip XML tags)
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const raw = await file.text();
    const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(`[extractText] DOCX: ${text.length} chars extracted`);
    return text;
  }

  // Fallback
  return file.text();
}

/**
 * Extract text from a PDF using pdfjs-dist.
 * Uses a CDN-hosted worker for maximum compatibility with any bundler.
 */
async function extractPdfText(file: File): Promise<string> {
  console.log("[extractPdfText] Loading pdfjs-dist…");

  // Dynamic import — keeps pdfjs-dist out of the SSR bundle
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Use CDN-hosted worker — avoids all bundler/URL resolution issues
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs";

  console.log("[extractPdfText] Reading file as ArrayBuffer…");
  const arrayBuffer = await file.arrayBuffer();

  console.log("[extractPdfText] Parsing PDF…");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  console.log(`[extractPdfText] PDF loaded: ${pdf.numPages} pages`);

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item: Record<string, unknown>) => typeof item.str === "string")
      .map((item: Record<string, unknown>) => item.str as string)
      .join(" ");
    pageTexts.push(pageText);
  }

  const fullText = pageTexts.join("\n\n").trim();
  console.log(
    `[extractPdfText] Done: ${pdf.numPages} pages, ${fullText.length} chars`
  );
  return fullText;
}
