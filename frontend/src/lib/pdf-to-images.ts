// ═══════════════════════════════════════════════════════════════════════════
// PDF-to-Images — Renders PDF pages to canvas for Gemini multimodal input
// Uses pdfjs-dist to render pages, then exports as base64 JPEG.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert a PDF file's pages to base64-encoded JPEG images.
 * Returns up to `maxPages` images suitable for Gemini's inline_data format.
 *
 * @param file     The PDF File object
 * @param maxPages Maximum number of pages to render (default: 8)
 * @param width    Target render width in pixels (default: 768)
 */
export async function pdfToImages(
  file: File,
  maxPages = 8,
  width = 768,
): Promise<{ mimeType: string; data: string }[]> {
  // Only process PDFs
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type !== "application/pdf" && ext !== "pdf") {
    return [];
  }

  // Dynamically import pdfjs-dist
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pagesToRender = Math.min(pdf.numPages, maxPages);
  const images: { mimeType: string; data: string }[] = [];

  console.log(`[pdfToImages] Rendering ${pagesToRender} of ${pdf.numPages} pages at ${width}px width...`);

  for (let i = 1; i <= pagesToRender; i++) {
    try {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });

      // Calculate scale to reach target width
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Create an offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.warn(`[pdfToImages] Could not get canvas context for page ${i}`);
        continue;
      }

      // Render page to canvas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as any).promise;

      // Export as JPEG base64 (smaller than PNG, good enough for Gemini)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = dataUrl.split(",")[1]; // strip "data:image/jpeg;base64," prefix

      images.push({ mimeType: "image/jpeg", data: base64 });

      // Clean up
      canvas.width = 0;
      canvas.height = 0;
    } catch (err) {
      console.warn(`[pdfToImages] Failed to render page ${i}:`, err);
    }
  }

  console.log(`[pdfToImages] Done: ${images.length} page images generated`);
  return images;
}
