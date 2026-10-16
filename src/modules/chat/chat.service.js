import { CohereClient } from "cohere-ai";
import env from "../../config/env.js";
import { getEgyptDateTime } from "./knowledge.js";

const MODEL = "command-r-plus";
const SUMMARIZE_ABOVE = 10000;
const CONTEXT_CHARS = 5000;

const cohere = new CohereClient({ token: env.cohereApiKey });

export const summarizeIfLong = async (text) => {
  if (text.length <= SUMMARIZE_ABOVE) return text;
  const { summary } = await cohere.summarize({ text, model: MODEL, length: "long" });
  return summary || text;
};

const buildPrompt = (employee, question) => {
  let prompt = `
🧠 You are EVE, a professional virtual employee.

👤 PERSONAL INFORMATION:
- Name: ${employee.name}
- Department: ${employee.department}
- Introduction: ${employee.introduction || "No introduction provided."}

🕐 Current Egypt time: ${getEgyptDateTime()}

📄 CONTEXT FROM ALL FILES:
${employee.knowledgeText?.slice(-CONTEXT_CHARS) || "No context available."}

❓ USER QUESTION:
${question || "No question provided. Only a file was uploaded."}

📌 RULES:
- Always use your personal information when answering questions about yourself.
- Respond ONLY in the language of the question.
- If you don't know the answer, say you don't know.
- Do NOT hallucinate or make up facts.
- Base your answer ONLY on the provided context and your personal info.

🧾 ANSWER:
`;

  if (question && /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(question)) {
    prompt += "\n\nIMPORTANT: The question is in English. Respond ONLY in English.";
  }

  return prompt;
};

// Returns the reply text, or null when Cohere generated nothing.
export const askEmployee = async (employee, question) => {
  const response = await cohere.generate({
    model: MODEL,
    prompt: buildPrompt(employee, question),
    max_tokens: 600,
    temperature: 0.5,
  });

  return response?.generations?.[0]?.text.trim() ?? null;
};
