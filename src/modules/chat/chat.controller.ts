import type { RequestHandler } from "express";
import { AppError } from "../../core/app-error.js";
import { BaseController } from "../../core/http.js";
import type { ChatService } from "./chat.service.js";

// Chat errors use { error } (not { message }) — the frontend's existing contract.
export class ChatController extends BaseController {
  constructor(private readonly chatService: ChatService) {
    super();
  }

  readonly send: RequestHandler = async (req, res) => {
    try {
      const { message, employeeId } = req.body;
      const reply = await this.chatService.chat(Number(employeeId), message, req.file);
      res.json({ reply });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("❌ Chat error:", (err as Error).message);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  };
}
