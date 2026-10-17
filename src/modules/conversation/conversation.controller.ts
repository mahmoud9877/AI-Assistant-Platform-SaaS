import { asyncHandler, BaseController } from "../../core/http.js";
import type { ConversationService } from "./conversation.service.js";

export class ConversationController extends BaseController {
  constructor(private readonly conversations: ConversationService) {
    super();
  }

  readonly list = asyncHandler(async (req, res) => {
    const conversations = await this.conversations.list(this.currentUser(req).id, Number(req.query.employeeId));
    res.status(200).json({ conversations });
  });

  readonly create = asyncHandler(async (req, res) => {
    const conversation = await this.conversations.create(this.currentUser(req).id, Number(req.body.employeeId));
    res.status(201).json({ conversation });
  });

  readonly get = asyncHandler(async (req, res) => {
    res.status(200).json(await this.conversations.getWithMessages(this.currentUser(req).id, Number(req.params.id)));
  });

  readonly rename = asyncHandler(async (req, res) => {
    const conversation = await this.conversations.rename(
      this.currentUser(req).id,
      Number(req.params.id),
      req.body.title.trim()
    );
    res.status(200).json({ conversation });
  });

  readonly remove = asyncHandler(async (req, res) => {
    await this.conversations.remove(this.currentUser(req).id, Number(req.params.id));
    res.status(204).end();
  });

  readonly send = asyncHandler(async (req, res) => {
    const result = await this.conversations.send(
      this.currentUser(req).id,
      Number(req.params.id),
      req.body.message ?? undefined,
      req.file
    );
    res.status(200).json(result);
  });
}
