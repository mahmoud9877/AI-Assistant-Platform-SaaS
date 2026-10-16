import mammoth from "mammoth";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface PdfTextItem {
  str: string;
  transform: number[];
}

export class DocumentTextExtractor {
  // Returns the file's text, or null when the type can't be parsed.
  async extract(file: Express.Multer.File): Promise<string | null> {
    if (file.mimetype === "application/pdf") return this.extractPdf(file.buffer);
    if (file.mimetype === DOCX) {
      return (await mammoth.extractRawText({ buffer: file.buffer })).value;
    }
    return null;
  }

  // One "--- Page N ---" section per page.
  private async extractPdf(buffer: Buffer): Promise<string> {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const { items } = await page.getTextContent();
        pages.push(`\n\n--- Page ${i} ---\n${this.joinLines(items as PdfTextItem[])}`);
      } catch (err) {
        console.warn(`❌ Failed to read page ${i}:`, (err as Error).message);
      }
    }

    await doc.cleanup();
    return pages.join("\n");
  }

  // Joins text items, starting a new line whenever the vertical position changes.
  private joinLines(items: PdfTextItem[]): string {
    let lastY: number | null = null;
    let text = "";

    for (const item of items) {
      if (!item.str?.trim()) continue;
      const y = item.transform[5];
      text += lastY === null || lastY === y ? `${item.str} ` : `\n${item.str} `;
      lastY = y;
    }

    return text.trim();
  }
}
