import { AppError } from "../../core/app-error.js";
import type { InferAttributes } from "sequelize";
import { Message } from "../../db/models/message.model.js";
import { Conversation, DEFAULT_CONVERSATION_TITLE } from "../../db/models/conversation.model.js";
import type { Employee } from "../../db/models/employee.model.js";
import type { ChatService } from "../chat/chat.service.js";
import type { EmployeeService } from "../eve-employee/eve-employee.service.js";

// How many earlier messages the AI sees, and how much of the first one becomes the title.
const HISTORY_MESSAGES = 20;
const TITLE_LENGTH = 60;

const MESSAGE_FIELDS = ["id", "role", "content", "fileName", "sources", "createdAt"] as const;

/** A message the user sent, checked and ready to be answered. */
export interface PreparedSend {
  conversation: Conversation;
  employee: Employee;
  text: string | undefined;
  fileName: string | null;
}

export interface SendResult {
  conversation: Conversation;
  messages: MessageView[];
}

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
  ): Promise<SendResult> {
    return this.answer(await this.prepareSend(userId, id, question, file));
  }

  /**
   * Everything that can reject a message (validation, ownership, learning the file) runs
   * here, before any reply is generated, so a streaming caller can still answer with a
   * plain error status.
   */
  async prepareSend(
    userId: number,
    id: number,
    question: string | undefined,
    file?: Express.Multer.File
  ): Promise<PreparedSend> {
    const text = question?.trim();
    if (!text && !file) {
      throw new AppError("Either message or file is required.", 400);
    }

    const conversation = await this.getOwned(userId, id);
    const employee = await this.employees.getById(conversation.employeeId);

    if (file) await this.chat.learn(employee, userId, file);

    return { conversation, employee, text, fileName: file?.originalname ?? null };
  }

  /** Generates EVE's reply (streamed to `onText` when given) and stores the exchange. */
  async answer({ conversation, employee, text, fileName }: PreparedSend, onText?: (text: string) => void): Promise<SendResult> {
    const id = conversation.id;
    const history = await Message.findAll({
      where: { conversationId: id },
      attributes: ["role", "content"],
      order: [["id", "DESC"]],
      limit: HISTORY_MESSAGES,
    });
    const reply = await this.chat.reply(
      employee,
      history.reverse().map(({ role, content }) => ({ role, content })),
      text,
      onText
    );

    // Both messages are saved only once there is a reply, so a failed send leaves no
    // half-finished exchange behind and the client can simply retry.
    const messages = await Conversation.sequelize!.transaction(async (transaction) => {
      const sent = await Message.create(
        { conversationId: id, role: "user", content: text || "Sent a file", fileName },
        { transaction }
      );
      const answer = await Message.create(
        { conversationId: id, role: "assistant", content: reply.text, sources: reply.sources },
        { transaction }
      );

      if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
        conversation.title = ConversationService.titleFrom(text || fileName!);
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
