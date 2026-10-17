import { AppError } from "../../core/app-error.js";
import { EventStream } from "../../core/event-stream.js";
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

  /**
   * Like `send`, but streams the reply as Server-Sent Events: `delta` ({ text }) for each
   * piece, then `done` (the same body `send` returns) once it is saved, or `error`
   * ({ message }) if generating it failed. A message that can't be sent at all (bad
   * input, someone else's conversation, a file that can't be read) gets a normal JSON
   * error status instead, before the stream starts.
   */
  readonly sendStream = asyncHandler(async (req, res) => {
    const prepared = await this.conversations.prepareSend(
      this.currentUser(req).id,
      Number(req.params.id),
      req.body.message ?? undefined,
      req.file
    );

    // The reply is generated and saved even if the client disconnects meanwhile,
    // so the conversation's history stays complete.
    const stream = new EventStream(res);
    try {
      const result = await this.conversations.answer(prepared, (text) => stream.send("delta", { text }));
      stream.send("done", result);
    } catch (err) {
      if (!(err instanceof AppError)) console.error("❌ Streaming reply failed:", err);
      stream.send("error", { message: err instanceof AppError ? err.message : "Something went wrong. Please try again." });
    } finally {
      stream.end();
    }
  });
}
