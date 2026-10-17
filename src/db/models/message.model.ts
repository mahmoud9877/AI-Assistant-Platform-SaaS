import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";
import { Conversation } from "./conversation.model.js";

export const MESSAGE_ROLES = ["user", "assistant"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

/** A knowledge document an assistant reply cites. */
export interface MessageSource {
  documentId: number;
  fileName: string;
}

export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: CreationOptional<number>;
  declare conversationId: number;
  declare role: MessageRole;
  declare content: string;
  // Name of the document sent with the message; its text goes to the employee's knowledge.
  declare fileName: CreationOptional<string | null>;
  declare sources: CreationOptional<MessageSource[] | null>;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    Message.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        conversationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Conversations", key: "id" },
          onDelete: "CASCADE",
        },
        role: {
          type: DataTypes.ENUM(...MESSAGE_ROLES),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        fileName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sources: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: "Message",
        timestamps: true,
        updatedAt: false,
        indexes: [{ fields: ["conversationId", "id"] }],
      }
    );
  }

  static associate(): void {
    Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages", onDelete: "CASCADE" });
    Message.belongsTo(Conversation, { foreignKey: "conversationId", as: "conversation" });
  }
}
