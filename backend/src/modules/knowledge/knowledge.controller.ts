import { AppError } from "../../core/app-error.js";
import { asyncHandler, BaseController } from "../../core/http.js";
import type { KnowledgeService } from "./knowledge.service.js";

export class KnowledgeController extends BaseController {
  constructor(private readonly knowledge: KnowledgeService) {
    super();
  }

  readonly list = asyncHandler(async (req, res) => {
    const documents = await this.knowledge.list(this.currentUser(req).id, Number(req.query.employeeId));
    res.status(200).json({ documents });
  });

  readonly upload = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("Attach a PDF or Word (.docx) file.", 400);
    const document = await this.knowledge.upload(this.currentUser(req).id, Number(req.body.employeeId), req.file);
    res.status(201).json({ document });
  });

  readonly remove = asyncHandler(async (req, res) => {
    await this.knowledge.remove(this.currentUser(req).id, Number(req.params.id));
    res.status(204).end();
  });
}
