import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

/**
 * Extract the text of a PDF, one "--- Page N ---" section per page.
 * @param {Buffer} buffer - PDF file contents
 * @returns {Promise<{ text: string, numpages: number, numrender: number }>}
 */
export async function extractTextFromPDF(buffer) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const textParts = [];
  let numrender = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      textParts.push(`\n\n--- Page ${i} ---\n${await renderPageText(page)}`);
      numrender++;
    } catch (err) {
      console.warn(`❌ Failed to read page ${i}:`, err.message);
    }
  }

  doc.cleanup();
  return { text: textParts.join("\n"), numpages: doc.numPages, numrender };
}

// Joins text items, starting a new line whenever the vertical position changes.
async function renderPageText(page) {
  const { items } = await page.getTextContent({
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  });

  let lastY = null;
  let text = "";

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    text += lastY === null || lastY === y ? `${item.str} ` : `\n${item.str} `;
    lastY = y;
  }

  return text.trim();
}
