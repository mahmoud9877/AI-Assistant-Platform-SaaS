import { AppError } from "../../core/app-error.js";
import type { ChatTurn, CohereService } from "./cohere.service.js";
import type { Employee } from "../../db/models/employee.model.js";
import type { MessageSource } from "../../db/models/message.model.js";
import type { KnowledgeService, Passage } from "../knowledge/knowledge.service.js";

export interface Reply {
  text: string;
  /** The knowledge files the reply cites, in citation order. */
  sources: MessageSource[];
}

/** What an EVE employee says: finding what it knows about a question and answering with the AI. */
export class ChatService {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly ai: CohereService
  ) {}

  /** Adds a document to the employee's knowledge; only its owner may teach it. */
  async learn(employee: Employee, userId: number, file: Express.Multer.File): Promise<void> {
    await this.knowledge.add(employee, userId, file);
  }

  /** EVE's answer; with `onText`, each piece of it is passed on as soon as Cohere writes it. */
  async reply(
    employee: Employee,
    history: ChatTurn[],
    question: string | undefined,
    onText?: (text: string) => void
  ): Promise<Reply> {
    const passages = await this.findPassages(employee, history, question);
    // Still set only when the employee's old single-text knowledge couldn't be migrated yet.
    const legacyKnowledge = employee.knowledgeText;

    const grounding = passages.map((p) => ({ id: String(p.chunkId), title: p.fileName, text: p.content }));

    let answer;
    try {
      answer = onText
        ? await this.ai.askStream(employee, history, question, grounding, legacyKnowledge, onText)
        : await this.ai.ask(employee, history, question, grounding, legacyKnowledge);
    } catch (err) {
      // Logged in full here; the client only learns that the AI call failed.
      console.error("❌ Chat error:", err);
      throw new AppError("EVE could not answer right now. Please try again.", 502);
    }
    if (!answer) throw new AppError("No response generated from Cohere.", 502);

    return { text: answer.text, sources: ChatService.sourcesFor(answer.citedIds, passages) };
  }

  // A follow-up like "and the second one?" means little alone, so the previous
  // question is searched with it. Search failures leave the reply ungrounded, not failed.
  private async findPassages(employee: Employee, history: ChatTurn[], question: string | undefined): Promise<Passage[]> {
    const previous = [...history].reverse().find((turn) => turn.role === "user")?.content;
    const query = [previous, question].filter(Boolean).join("\n");
    try {
      return await this.knowledge.search(employee, query);
    } catch (err) {
      console.error("❌ Knowledge search failed:", err);
      return [];
    }
  }

  private static sourcesFor(citedIds: string[], passages: Passage[]): MessageSource[] {
    const byChunk = new Map(passages.map((p) => [String(p.chunkId), p]));
    const sources = new Map<number, MessageSource>();
    for (const id of citedIds) {
      const passage = byChunk.get(id);
      if (passage && !sources.has(passage.documentId)) {
        sources.set(passage.documentId, { documentId: passage.documentId, fileName: passage.fileName });
      }
    }
    return [...sources.values()];
  }
}
