const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

/**
 * Splits text into passages of about CHUNK_SIZE characters for embedding. Breaks fall on
 * paragraph, line or sentence ends where possible, and each passage repeats the last
 * CHUNK_OVERLAP characters of the one before, so a fact split across a break is still
 * found whole in one of them.
 */
export function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    if (end < clean.length) end = breakPoint(clean, start, end);

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

// The last natural break in the second half of [start, end), or `end` if there is none.
function breakPoint(text: string, start: number, end: number): number {
  const window = text.slice(start, end);
  const minimum = Math.floor(window.length / 2);
  for (const separator of ["\n\n", "\n", ". ", "؟ ", "? ", "! ", "، ", ", ", " "]) {
    const at = window.lastIndexOf(separator);
    if (at >= minimum) return start + at + separator.length;
  }
  return end;
}
