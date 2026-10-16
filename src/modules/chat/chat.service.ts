import { AppError } from "../../core/app-error.js";
import { egyptDateTime } from "./egypt-time.js";
import type { CohereService } from "./cohere.service.js";
import type { Employee } from "../../db/models/employee.model.js";
import type { EmployeeService } from "../eve-employee/eve-employee.service.js";
import type { DocumentTextExtractor } from "../../services/document-text-extractor.js";

const MAX_KNOWLEDGE_LENGTH = 500000;

export class ChatService {
  constructor(
    private readonly employees: EmployeeService,
    private readonly extractor: DocumentTextExtractor,
    private readonly ai: CohereService
  ) {}

  async chat(employeeId: number, question: string | undefined, file?: Express.Multer.File): Promise<string> {
    if (!question && !file) {
      throw new AppError("Either message or file is required.", 400);
    }

    const employee = await this.employees.findById(employeeId);
    if (!employee) throw new AppError("Employee not found.", 404);

    if (file) await this.addToKnowledge(employee, file);

    const reply = await this.ai.ask(employee, question);
    if (!reply) throw new AppError("No response generated from Cohere.", 500);
    return reply;
  }

  // Appends the file's text (summarized if long) to the employee's knowledge.
  private async addToKnowledge(employee: Employee, file: Express.Multer.File): Promise<void> {
    let text: string | null;
    try {
      text = await this.extractor.extract(file);
      if (text !== null) text = await this.ai.summarizeIfLong(text);
    } catch (err) {
      console.error("❌ File analysis failed:", err);
      throw new AppError("File analysis failed.", 500);
    }
    if (text === null) throw new AppError("Unsupported file type.", 400);

    const knowledge = `${employee.knowledgeText || ""}\n\n--- New Upload at ${egyptDateTime()} ---\n${text}`;
    if (knowledge.length > MAX_KNOWLEDGE_LENGTH) {
      throw new AppError("The total knowledge size exceeds the allowed limit.", 400);
    }

    employee.knowledgeText = knowledge;
    await employee.save();
    console.log("✅ Knowledge updated for employee:", employee.id);
  }
}
