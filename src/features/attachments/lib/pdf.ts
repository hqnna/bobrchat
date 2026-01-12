import type { Buffer } from "node:buffer";

import { PDFDocument } from "pdf-lib";

/**
 * Extracts the page count from a PDF buffer.
 *
 * @param buffer The PDF file buffer
 * @returns The number of pages, or null if extraction fails
 */
export async function getPdfPageCount(buffer: Buffer): Promise<number | null> {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  }
  catch (error) {
    console.error("Failed to extract PDF page count:", error);
    return null;
  }
}
