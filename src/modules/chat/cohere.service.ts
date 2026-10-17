import { CohereClient } from "cohere-ai";
import { egyptDateTime } from "./egypt-time.js";
import type { Employee } from "../../db/models/employee.model.js";

const LEGACY_CONTEXT_CHARS = 5000;

// embed-v4.0 is multilingual; 512 dimensions keep stored vectors small with little loss.
const EMBED_MODEL = "embed-v4.0";
export const EMBEDDING_DIMENSIONS = 512;
// The most texts Cohere embeds in one request.
const EMBED_BATCH = 96;

/** One earlier turn of the conversation, oldest first. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** A passage the answer may be grounded in; `id` comes back in the citations. */
export interface GroundingPassage {
  id: string;
  title: string;
  text: string;
}

export interface Answer {
  text: string;
  /** Ids of the passages the answer cites. */
  citedIds: string[];
}

// Uses Cohere's v2 Chat and Embed APIs; the v1 generate/summarize endpoints are retired.
export class CohereService {
  private readonly client: CohereClient;

  constructor(
    apiKey: string | undefined,
    private readonly model: string
  ) {
    this.client = new CohereClient({ token: apiKey });
  }

  /**
   * Embeds texts as vectors scaled to length 1, so a dot product is their cosine similarity.
   * `document` for stored passages, `query` for a question searched against them.
   */
  async embed(texts: string[], kind: "document" | "query"): Promise<Float32Array[]> {
    const vectors: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH) {
      const response = await this.client.v2.embed({
        model: EMBED_MODEL,
        texts: texts.slice(i, i + EMBED_BATCH),
        inputType: kind === "document" ? "search_document" : "search_query",
        embeddingTypes: ["float"],
        outputDimension: EMBEDDING_DIMENSIONS,
      });
      for (const values of response.embeddings.float ?? []) vectors.push(CohereService.normalize(values));
    }
    if (vectors.length !== texts.length) throw new Error("Cohere returned fewer embeddings than texts");
    return vectors;
  }

  /**
   * Answers as `employee`, grounded in `passages` when there are any. `legacyKnowledge` is
   * the old single-text knowledge, used only for employees whose files aren't migrated yet.
   * Returns null when Cohere generated nothing.
   */
  async ask(
    employee: Employee,
    history: ChatTurn[],
    question: string | undefined,
    passages: GroundingPassage[],
    legacyKnowledge: string | null
  ): Promise<Answer | null> {
    const response = await this.client.v2.chat({
      model: this.model,
      messages: [
        { role: "system", content: CohereService.systemPrompt(employee, question, legacyKnowledge) },
        ...history,
        { role: "user", content: question || "No question provided. Only a file was uploaded." },
      ],
      documents: passages.map(({ id, title, text }) => ({ id, data: { title, text } })),
      maxTokens: 600,
      temperature: 0.5,
    });

    const text = response.message.content
      ?.map((item) => (item.type === "text" ? item.text : ""))
      .join("")
      .trim();
    if (!text) return null;

    const citedIds = new Set<string>();
    for (const citation of response.message.citations ?? []) {
      for (const source of citation.sources ?? []) {
        if (source.type === "document" && source.id) citedIds.add(source.id);
      }
    }
    return { text, citedIds: [...citedIds] };
  }

  private static normalize(values: number[]): Float32Array {
    const vector = Float32Array.from(values);
    const length = Math.hypot(...vector) || 1;
    for (let i = 0; i < vector.length; i++) vector[i] /= length;
    return vector;
  }

  private static systemPrompt(employee: Employee, question: string | undefined, legacyKnowledge: string | null): string {
    let prompt = `
🧠 You are EVE, a professional virtual employee.

👤 PERSONAL INFORMATION:
- Name: ${employee.name}
- Department: ${employee.department?.name ?? "None"}
- Introduction: ${employee.introduction || "No introduction provided."}

🕐 Current Egypt time: ${egyptDateTime()}
${legacyKnowledge ? `\n📄 CONTEXT FROM ALL FILES:\n${legacyKnowledge.slice(-LEGACY_CONTEXT_CHARS)}\n` : ""}
📌 RULES:
- Always use your personal information when answering questions about yourself.
- Respond ONLY in the language of the question.
- Answer from the documents you are given (the files you were taught), your personal info and the conversation so far.
- If they don't contain the answer, say you don't know.
- Do NOT hallucinate or make up facts.
`;

    if (question && /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(question)) {
      prompt += "\n\nIMPORTANT: The question is in English. Respond ONLY in English.";
    }

    return prompt;
  }
}
