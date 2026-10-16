import { CohereClient } from "cohere-ai";
import { egyptDateTime } from "./egypt-time.js";
import type { Employee } from "../../db/models/employee.model.js";

const MODEL = "command-r-plus";
const SUMMARIZE_ABOVE = 10000;
const CONTEXT_CHARS = 5000;

export class CohereService {
  private readonly client: CohereClient;

  constructor(apiKey: string | undefined) {
    this.client = new CohereClient({ token: apiKey });
  }

  async summarizeIfLong(text: string): Promise<string> {
    if (text.length <= SUMMARIZE_ABOVE) return text;
    const { summary } = await this.client.summarize({ text, model: MODEL, length: "long" });
    return summary || text;
  }

  // Returns the reply text, or null when Cohere generated nothing.
  async ask(employee: Employee, question: string | undefined): Promise<string | null> {
    const response = await this.client.generate({
      model: MODEL,
      prompt: CohereService.buildPrompt(employee, question),
      maxTokens: 600,
      temperature: 0.5,
    });

    return response?.generations?.[0]?.text.trim() ?? null;
  }

  private static buildPrompt(employee: Employee, question: string | undefined): string {
    let prompt = `
🧠 You are EVE, a professional virtual employee.

👤 PERSONAL INFORMATION:
- Name: ${employee.name}
- Department: ${employee.department}
- Introduction: ${employee.introduction || "No introduction provided."}

🕐 Current Egypt time: ${egyptDateTime()}

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
  }
}
