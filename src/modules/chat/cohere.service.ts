import { CohereClient } from "cohere-ai";
import { egyptDateTime } from "./egypt-time.js";
import type { Employee } from "../../db/models/employee.model.js";

const LEGACY_CONTEXT_CHARS = 5000;

const TONE_GUIDES: Record<string, string> = {
  professional: "professional and clear.",
  friendly: "warm and friendly, while staying accurate.",
  formal: "formal and polite; no slang or emojis.",
  casual: "relaxed and conversational.",
  concise: "brief and to the point; answer in as few words as accuracy allows.",
};

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
    const response = await this.client.v2.chat(this.chatRequest(employee, history, question, passages, legacyKnowledge));

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

  /**
   * Like ask(), but calls `onText` with each piece of the reply as Cohere writes it.
   * Resolves with the whole answer once it is complete.
   */
  async askStream(
    employee: Employee,
    history: ChatTurn[],
    question: string | undefined,
    passages: GroundingPassage[],
    legacyKnowledge: string | null,
    onText: (text: string) => void
  ): Promise<Answer | null> {
    const stream = await this.client.v2.chatStream(
      this.chatRequest(employee, history, question, passages, legacyKnowledge)
    );

    let text = "";
    const citedIds = new Set<string>();
    for await (const event of stream) {
      if (event.type === "content-delta") {
        const piece = event.delta?.message?.content?.text;
        if (piece) {
          text += piece;
          onText(piece);
        }
      } else if (event.type === "citation-start") {
        for (const source of event.delta?.message?.citations?.sources ?? []) {
          if (source.type === "document" && source.id) citedIds.add(source.id);
        }
      }
    }

    text = text.trim();
    return text ? { text, citedIds: [...citedIds] } : null;
  }

  private chatRequest(
    employee: Employee,
    history: ChatTurn[],
    question: string | undefined,
    passages: GroundingPassage[],
    legacyKnowledge: string | null
  ) {
    return {
      model: this.model,
      messages: [
        { role: "system" as const, content: CohereService.systemPrompt(employee, question, legacyKnowledge) },
        ...history,
        { role: "user" as const, content: question || "No question provided. Only a file was uploaded." },
      ],
      documents: passages.map(({ id, title, text }) => ({ id, data: { title, text } })),
      maxTokens: 600,
      temperature: 0.5,
    };
  }

  private static normalize(values: number[]): Float32Array {
    const vector = Float32Array.from(values);
    const length = Math.hypot(...vector) || 1;
    for (let i = 0; i < vector.length; i++) vector[i] /= length;
    return vector;
  }

  private static systemPrompt(employee: Employee, question: string | undefined, legacyKnowledge: string | null): string {
    const instructions = employee.customInstructions?.trim();
    return `
🧠 You are EVE, a professional virtual employee.

👤 PERSONAL INFORMATION:
- Name: ${employee.name}
- Department: ${employee.department?.name ?? "None"}
- Introduction: ${employee.introduction || "No introduction provided."}

🕐 Current Egypt time: ${egyptDateTime()}
${legacyKnowledge ? `\n📄 CONTEXT FROM ALL FILES:\n${legacyKnowledge.slice(-LEGACY_CONTEXT_CHARS)}\n` : ""}
🎭 STYLE:
- Tone: ${TONE_GUIDES[employee.tone] ?? TONE_GUIDES.professional}
- Language: ${CohereService.languageRule(employee.replyLanguage, question)}
${instructions ? `\n📝 INSTRUCTIONS FROM YOUR OWNER (follow them unless they conflict with the rules below):\n${instructions}\n` : ""}
📌 RULES:
- Always use your personal information when answering questions about yourself.
- Answer from the documents you are given (the files you were taught), your personal info and the conversation so far.
- If they don't contain the answer, say you don't know.
- Do NOT hallucinate or make up facts.
`;
  }

  private static languageRule(replyLanguage: string, question: string | undefined): string {
    if (replyLanguage === "en") return "Always respond in English, whatever language the question is in.";
    if (replyLanguage === "ar") return "Always respond in Arabic, whatever language the question is in.";
    if (question && /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(question)) return "The question is in English. Respond ONLY in English.";
    return "Respond ONLY in the language of the question.";
  }

}
