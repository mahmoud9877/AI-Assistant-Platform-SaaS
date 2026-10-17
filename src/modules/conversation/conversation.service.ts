import { AppError } from "../../core/app-error.js";
import type { InferAttributes } from "sequelize";
import { Message } from "../../db/models/message.model.js";
import { Conversation, DEFAULT_CONVERSATION_TITLE } from "../../db/models/conversation.model.js";
import type { ChatService } from "../chat/chat.service.js";
import type { EmployeeService } from "../eve-employee/eve-employee.service.js";

// How many earlier messages the AI sees, and how much of the first one becomes the title.
const HISTORY_MESSAGES = 20;
const TITLE_LENGTH = 60;

const MESSAGE_FIELDS = ["id", "role", "content", "fileName", "sources", "createdAt"] as const;

/** A message as the client sees it. */
export type MessageView = Pick<InferAttributes<Message>, (typeof MESSAGE_FIELDS)[number]>;

export class ConversationService {
  constructor(
    private readonly employees: EmployeeService,
    private readonly chat: ChatService
  ) {}

  /** The user's conversations with one employee, most recently active first. */
  list(userId: number, employeeId: number): Promise<Conversation[]> {
    return Conversation.findAll({
      where: { userId, employeeId },
      order: [
        ["updatedAt", "DESC"],
        ["id", "DESC"],
      ],
    });
  }

  async create(userId: number, employeeId: number): Promise<Conversation> {
    await this.employees.getById(employeeId);
    return Conversation.create({ userId, employeeId });
  }

  async getWithMessages(userId: number, id: number): Promise<{ conversation: Conversation; messages: MessageView[] }> {
    const conversation = await this.getOwned(userId, id);
    const messages = await Message.findAll({
      where: { conversationId: id },
      attributes: [...MESSAGE_FIELDS],
      order: [["id", "ASC"]],
    });
    return { conversation, messages: messages.map(ConversationService.view) };
  }

  async rename(userId: number, id: number, title: string): Promise<Conversation> {
    const conversation = await this.getOwned(userId, id);
    conversation.title = title;
    return conversation.save();
  }

  async remove(userId: number, id: number): Promise<void> {
    // Its messages go with it (ON DELETE CASCADE).
    await (await this.getOwned(userId, id)).destroy();
  }

  /** Sends the user's message (and optional document) and stores it with EVE's reply. */
  async send(
    userId: number,
    id: number,
    question: string | undefined,
    file?: Express.Multer.File
  ): Promise<{ conversation: Conversation; messages: MessageView[] }> {
    const text = question?.trim();
    if (!text && !file) {
      throw new AppError("Either message or file is required.", 400);
    }

    const conversation = await this.getOwned(userId, id);
    const employee = await this.employees.getById(conversation.employeeId);

    if (file) await this.chat.learn(employee, userId, file);

    const history = await Message.findAll({
      where: { conversationId: id },
      attributes: ["role", "content"],
      order: [["id", "DESC"]],
      limit: HISTORY_MESSAGES,
    });
    const reply = await this.chat.reply(
      employee,
      history.reverse().map(({ role, content }) => ({ role, content })),
      text
    );

    // Both messages are saved only once there is a reply, so a failed send leaves no
    // half-finished exchange behind and the client can simply retry.
    const messages = await Conversation.sequelize!.transaction(async (transaction) => {
      const sent = await Message.create(
        { conversationId: id, role: "user", content: text || "Sent a file", fileName: file?.originalname ?? null },
        { transaction }
      );
      const answer = await Message.create(
        { conversationId: id, role: "assistant", content: reply.text, sources: reply.sources },
        { transaction }
      );

      if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
        conversation.title = ConversationService.titleFrom(text || file!.originalname);
      }
      // Bumps updatedAt even when the title is unchanged, so the list stays in activity order.
      conversation.changed("updatedAt", true);
      await conversation.save({ transaction });

      return [sent, answer];
    });

    return { conversation, messages: messages.map(ConversationService.view) };
  }

  // 404 rather than 403 for someone else's conversation, so ids can't be probed.
  private async getOwned(userId: number, id: number): Promise<Conversation> {
    const conversation = await Conversation.findOne({ where: { id, userId } });
    if (!conversation) throw new AppError("Conversation not found", 404);
    return conversation;
  }

  private static titleFrom(text: string): string {
    const line = text.replace(/\s+/g, " ").trim();
    return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1)}…` : line;
  }

  private static view(message: Message): MessageView {
    const { id, role, content, fileName, sources, createdAt } = message.get();
    return { id, role, content, fileName, sources: sources ?? null, createdAt };
  }
}
