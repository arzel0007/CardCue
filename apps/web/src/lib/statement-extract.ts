/**
 * Extract text from statement PDFs and images (client-side).
 * PDF text layer first; OCR (Tesseract) for scans / screenshots.
 */

export type ExtractResult = {
  text: string;
  method: "pdf-text" | "ocr" | "pdf-ocr";
  pages: number;
};

export class StatementExtractError extends Error {
  code:
    | "unsupported-type"
    | "decode-failed"
    | "ocr-failed"
    | "pdf-failed"
    | "too-large"
    | "empty";

  constructor(
    code: StatementExtractError["code"],
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options as ErrorOptions);
    this.code = code;
    this.name = "StatementExtractError";
  }
}

const MAX_BYTES = 15 * 1024 * 1024;

export async function extractStatementText(
  file: File,
  onProgress?: (p: number) => void
): Promise<ExtractResult> {
  if (file.size > MAX_BYTES) {
    throw new StatementExtractError(
      "too-large",
      "That file is over 15MB. Try a smaller screenshot or a PDF."
    );
  }

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  const isPdf = type === "application/pdf" || name.endsWith(".pdf");
  const isImage =
    type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(name);

  if (isPdf) return extractFromPdf(file, onProgress);
  if (isImage) return extractFromImage(file, onProgress);

  throw new StatementExtractError(
    "unsupported-type",
    `“${file.name}” isn’t a PDF or image we can read. Use PDF, PNG, or JPG.`
  );
}

async function extractFromPdf(
  file: File,
  onProgress?: (p: number) => void
): Promise<ExtractResult> {
  try {
    const pdfjs = await import("pdfjs-dist");
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
    } catch {
      // fall back to main thread
    }

    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    const chunks: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.(i / doc.numPages / 2);
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      chunks.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" ")
      );
      page.cleanup();
    }

    const text = chunks.join("\n").trim();
    if (text.replace(/\s/g, "").length >= 40) {
      await (doc as { destroy?: () => Promise<void> }).destroy?.();
      return { text, method: "pdf-text", pages: doc.numPages };
    }

    onProgress?.(0.5);
    const ocrBits: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1.7 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as unknown as Parameters<typeof page.render>[0]).promise;
        const blob = await new Promise<Blob | null>((r) =>
          canvas.toBlob(r, "image/png")
        );
        if (blob) {
          ocrBits.push(await ocrImageBlob(blob, (p) => onProgress?.(0.5 + p / 2)));
        }
      }
      page.cleanup();
    }
    await (doc as { destroy?: () => Promise<void> }).destroy?.();
    return {
      text: ocrBits.join("\n").trim(),
      method: "pdf-ocr",
      pages: doc.numPages,
    };
  } catch (e) {
    if (e instanceof StatementExtractError) throw e;
    throw new StatementExtractError(
      "pdf-failed",
      "We couldn’t open that PDF. Try re-exporting it or use a clear photo instead.",
      { cause: e }
    );
  }
}

async function extractFromImage(
  file: File,
  onProgress?: (p: number) => void
): Promise<ExtractResult> {
  const blob = await normalizeImage(file);
  const text = await ocrImageBlob(blob, onProgress);
  return { text, method: "ocr", pages: 1 };
}

/**
 * Decode via canvas so HEIC/screenshots that Safari can display become PNG
 * for Tesseract. Throws a clear error if the browser can’t decode it.
 */
async function normalizeImage(file: File): Promise<Blob> {
  const name = file.name.toLowerCase();
  if (/\.heic$|\.heif$/.test(name) || /heic|heif/.test(file.type)) {
    // Many browsers cannot decode HEIC in canvas — try anyway, then fail clearly.
    try {
      return await rasterize(file);
    } catch {
      throw new StatementExtractError(
        "decode-failed",
        "HEIC/HEIF photos often can’t be read in the browser. On iPhone: Photos → Share → Save as JPEG, or take a PNG screenshot, then upload again."
      );
    }
  }

  try {
    return await rasterize(file);
  } catch {
    throw new StatementExtractError(
      "decode-failed",
      "We couldn’t open that image. Try a PNG or JPG screenshot of the statement."
    );
  }
}

async function rasterize(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  // Cap long screenshots so OCR stays fast
  const maxEdge = 2200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("to-blob-failed"))),
      "image/png"
    );
  });
}

async function ocrImageBlob(file: Blob, onProgress?: (p: number) => void): Promise<string> {
  let worker: {
    recognize: (b: Blob) => Promise<{ data: { text?: string } }>;
    terminate: () => Promise<unknown>;
  } | null = null;

  const timeout = new Promise<never>((_, reject) => {
    const t = setTimeout(() => {
      reject(
        new StatementExtractError(
          "ocr-failed",
          "OCR took too long to start (language pack / worker load). Paste the statement text below instead."
        )
      );
    }, 45_000);
    (t as unknown as { unref?: () => void }).unref?.();
  });

  try {
    const { createWorker } = await import("tesseract.js");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    onProgress?.(0.05);
    // corePath as directory → worker picks *-lstm.wasm.js for SIMD.
    // langPath serves eng.traineddata.gz with gzip: true.
    worker = await Promise.race([
      createWorker("eng", 1, {
        workerPath: `${origin}/ocr/worker.min.js`,
        corePath: `${origin}/ocr/`,
        langPath: `${origin}/ocr/lang`,
        gzip: true,
        logger: (m: { progress?: number; status?: string }) => {
          const status = m.status ?? "";
          if (status.includes("recognizing") && m.progress != null) {
            onProgress?.(0.35 + m.progress * 0.6);
          } else if (status.includes("core")) {
            onProgress?.(0.12);
          } else if (status.includes("lang")) {
            onProgress?.(0.22);
          } else if (status) {
            onProgress?.(0.18);
          }
        },
      }),
      timeout,
    ]);
    onProgress?.(0.35);
    const { data } = await Promise.race([worker.recognize(file), timeout]);
    onProgress?.(1);
    return data.text ?? "";
  } catch (e) {
    if (e instanceof StatementExtractError) throw e;
    console.error("[CardO] OCR failed", e);
    throw new StatementExtractError(
      "ocr-failed",
      "OCR didn’t start (worker/language pack). You can paste the statement text below instead.",
      { cause: e }
    );
  } finally {
    try {
      await worker?.terminate();
    } catch {
      // ignore
    }
  }
}

export function extractErrorMessage(e: unknown): string {
  if (e instanceof StatementExtractError) return e.message;
  return "We couldn’t read that file. You can paste statement text below, or try a PNG screenshot or PDF.";
}
