import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";
import { User } from "./user.model.js";
import { Employee } from "./employee.model.js";

export const DEFAULT_CONVERSATION_TITLE = "New chat";

/** One user's chat thread with one EVE employee; private to that user. */
export class Conversation extends Model<InferAttributes<Conversation>, InferCreationAttributes<Conversation>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare employeeId: number;
  declare title: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    Conversation.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Users", key: "id" },
          onDelete: "CASCADE",
        },
        employeeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "EveEmployees", key: "id" },
          onDelete: "CASCADE",
        },
        title: {
          type: DataTypes.STRING(120),
          allowNull: false,
          defaultValue: DEFAULT_CONVERSATION_TITLE,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: "Conversation",
        timestamps: true,
        indexes: [{ fields: ["userId", "employeeId", "updatedAt"] }],
      }
    );
  }

  static associate(): void {
    User.hasMany(Conversation, { foreignKey: "userId", as: "conversations" });
    Conversation.belongsTo(User, { foreignKey: "userId", as: "user" });
    Employee.hasMany(Conversation, { foreignKey: "employeeId", as: "conversations" });
    Conversation.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
  }
}
