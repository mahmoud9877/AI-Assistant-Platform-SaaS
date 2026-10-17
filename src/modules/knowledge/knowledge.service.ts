import { Op, type Transaction } from "sequelize";
import { AppError } from "../../core/app-error.js";
import { chunkText } from "../../services/text-chunker.js";
import { KnowledgeChunk } from "../../db/models/knowledge-chunk.model.js";
import { KnowledgeDocument } from "../../db/models/knowledge-document.model.js";
import type { Employee } from "../../db/models/employee.model.js";
import type { CohereService } from "../chat/cohere.service.js";
import type { EmployeeService } from "../eve-employee/eve-employee.service.js";
import type { DocumentTextExtractor } from "../../services/document-text-extractor.js";

const MAX_KNOWLEDGE_CHARACTERS = 1_000_000;
const MAX_DOCUMENTS = 100;
// Passages handed to the AI per question.
const TOP_PASSAGES = 8;

// A file's passages with their embeddings, ready to be saved.
interface PreparedDocument {
  fileName: string;
  characters: number;
  passages: string[];
  vectors: Float32Array[];
}

/** A passage found for a question, with the file it came from. */
export interface Passage {
  chunkId: number;
  documentId: number;
  fileName: string;
  content: string;
}

// Uploads used to be appended to Employee.knowledgeText after a marker like this.
const LEGACY_UPLOAD_MARKER = /\n*--- New Upload at (.+?) ---\n/;

const DOCUMENT_FIELDS = ["id", "employeeId", "fileName", "characters", "chunkCount", "createdAt"];

/** What an EVE employee has been taught: its files, split into embedded passages. */
export class KnowledgeService {
  // Employees whose legacy knowledge is being migrated by this process right now.
  private readonly migrating = new Map<number, Promise<void>>();

  constructor(
    private readonly employees: EmployeeService,
    private readonly extractor: DocumentTextExtractor,
    private readonly ai: CohereService
  ) {}

  async list(userId: number, employeeId: number): Promise<KnowledgeDocument[]> {
    const employee = await this.employees.getById(employeeId);
    KnowledgeService.assertOwner(employee, userId);
    await this.migrateLegacy(employee).catch(() => {});
    return KnowledgeDocument.findAll({
      where: { employeeId },
      attributes: DOCUMENT_FIELDS,
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });
  }

  async upload(userId: number, employeeId: number, file: Express.Multer.File): Promise<KnowledgeDocument> {
    return this.add(await this.employees.getById(employeeId), userId, file);
  }

  /** Teaches the employee a file. Only the employee's owner may change what it knows. */
  async add(employee: Employee, userId: number, file: Express.Multer.File): Promise<KnowledgeDocument> {
    KnowledgeService.assertOwner(employee, userId);

    let text: string | null;
    try {
      text = await this.extractor.extract(file);
    } catch (err) {
      console.error("❌ File analysis failed:", err);
      throw new AppError("File analysis failed.", 500);
    }
    if (text === null) throw new AppError("Unsupported file type. Upload a PDF or Word (.docx) file.", 400);
    if (!text.trim()) throw new AppError("No readable text was found in this file.", 400);

    await this.assertRoomFor(employee.id, text.length);
    const prepared = await this.prepare(file.originalname, text);
    return KnowledgeDocument.sequelize!.transaction((transaction) =>
      this.save(employee.id, userId, prepared, transaction)
    );
  }

  async remove(userId: number, documentId: number): Promise<void> {
    const document = await KnowledgeDocument.findByPk(documentId);
    const employee = document && (await this.employees.findById(document.employeeId));
    // 404 rather than 403 for someone else's file, so ids can't be probed.
    if (!document || !employee || employee.createdBy !== userId) {
      throw new AppError("Document not found", 404);
    }
    await document.destroy();
  }

  /** The employee's passages most similar to `query`, best first; none if it has no documents. */
  async search(employee: Employee, query: string): Promise<Passage[]> {
    await this.migrateLegacy(employee);

    const chunks = await KnowledgeChunk.findAll({
      where: { employeeId: employee.id },
      attributes: ["id", "embedding"],
      raw: true,
    });
    if (!chunks.length || !query.trim()) return [];

    const [queryVector] = await this.ai.embed([query], "query");
    const best = chunks
      .map(({ id, embedding }) => ({ id, score: dot(queryVector, KnowledgeChunk.fromBlob(embedding)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_PASSAGES);

    const rows = await KnowledgeChunk.findAll({
      where: { id: { [Op.in]: best.map(({ id }) => id) } },
      attributes: ["id", "documentId", "content"],
      include: [{ model: KnowledgeDocument, as: "document", attributes: ["fileName"] }],
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    return best.flatMap(({ id }) => {
      const row = byId.get(id) as (KnowledgeChunk & { document?: KnowledgeDocument }) | undefined;
      return row ? [{ chunkId: id, documentId: row.documentId, fileName: row.document?.fileName ?? "", content: row.content }] : [];
    });
  }

  /**
   * Moves uploads kept in the old single knowledgeText field into documents, once per
   * employee, then clears the field. Runs on first use; if it fails (e.g. Cohere is
   * unreachable), the field is kept and the chat falls back to it.
   */
  migrateLegacy(employee: Employee): Promise<void> {
    if (!employee.knowledgeText) return Promise.resolve();

    let running = this.migrating.get(employee.id);
    if (!running) {
      running = this.runLegacyMigration(employee).finally(() => this.migrating.delete(employee.id));
      this.migrating.set(employee.id, running);
    }
    return running;
  }

  private async runLegacyMigration(employee: Employee): Promise<void> {
    // [intro, date1, text1, date2, text2, ...]; the intro is already in the system prompt.
    const parts = employee.knowledgeText!.split(LEGACY_UPLOAD_MARKER);
    const prepared: PreparedDocument[] = [];
    for (let i = 1; i + 1 < parts.length; i += 2) {
      const text = parts[i + 1].trim();
      if (text) prepared.push(await this.prepare(`Earlier upload (${parts[i].trim()})`, text));
    }

    // All or nothing, so a failed attempt can simply run again later without duplicates.
    await KnowledgeDocument.sequelize!.transaction(async (transaction) => {
      for (const document of prepared) await this.save(employee.id, employee.createdBy, document, transaction);
      employee.knowledgeText = null;
      await employee.save({ transaction });
    });
    console.log("✅ Migrated legacy knowledge for employee:", employee.id);
  }

  // Splits and embeds outside any transaction: the Cohere calls can take a while.
  private async prepare(fileName: string, text: string): Promise<PreparedDocument> {
    const passages = chunkText(text);
    try {
      return { fileName, characters: text.length, passages, vectors: await this.ai.embed(passages, "document") };
    } catch (err) {
      console.error("❌ Embedding failed:", err);
      throw new AppError("Could not process this file right now. Please try again.", 502);
    }
  }

  private async save(
    employeeId: number,
    userId: number | null,
    { fileName, characters, passages, vectors }: PreparedDocument,
    transaction: Transaction
  ): Promise<KnowledgeDocument> {
    const document = await KnowledgeDocument.create(
      { employeeId, uploadedBy: userId, fileName, characters, chunkCount: passages.length },
      { transaction }
    );
    await KnowledgeChunk.bulkCreate(
      passages.map((content, position) => ({
        documentId: document.id,
        employeeId,
        position,
        content,
        embedding: KnowledgeChunk.toBlob(vectors[position]),
      })),
      { transaction }
    );
    console.log(`✅ Learned "${fileName}" (${passages.length} passages) for employee:`, employeeId);
    return document;
  }

  private async assertRoomFor(employeeId: number, characters: number): Promise<void> {
    const [count, used] = await Promise.all([
      KnowledgeDocument.count({ where: { employeeId } }),
      KnowledgeDocument.sum("characters", { where: { employeeId } }),
    ]);
    if (count >= MAX_DOCUMENTS) {
      throw new AppError(`This EVE already knows ${MAX_DOCUMENTS} files. Delete one to add another.`, 400);
    }
    if ((used || 0) + characters > MAX_KNOWLEDGE_CHARACTERS) {
      throw new AppError("The total knowledge size exceeds the allowed limit. Delete a file to make room.", 400);
    }
  }

  private static assertOwner(employee: Employee, userId: number): void {
    if (employee.createdBy !== userId) {
      throw new AppError("Only this EVE's owner can manage what it knows.", 403);
    }
  }
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
