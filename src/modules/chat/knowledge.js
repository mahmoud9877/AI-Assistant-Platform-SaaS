import mammoth from "mammoth";
import { extractTextFromPDF } from "../../utils/pdf.js";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MAX_KNOWLEDGE_LENGTH = 500000;

// Returns the file's text, or null when the type can't be parsed.
export const extractText = async (file) => {
  if (file.mimetype === "application/pdf") {
    return (await extractTextFromPDF(file.buffer)).text;
  }
  if (file.mimetype === DOCX) {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value;
  }
  return null;
};

export const getEgyptDateTime = () =>
  new Date().toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
