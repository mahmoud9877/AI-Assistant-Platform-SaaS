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

/** A file an EVE employee was taught; its text is stored as searchable chunks. */
export class KnowledgeDocument extends Model<
  InferAttributes<KnowledgeDocument>,
  InferCreationAttributes<KnowledgeDocument>
> {
  declare id: CreationOptional<number>;
  declare employeeId: number;
  declare uploadedBy: number | null;
  declare fileName: string;
  /** Length of the extracted text, counted against the employee's knowledge limit. */
  declare characters: number;
  declare chunkCount: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    KnowledgeDocument.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        employeeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "EveEmployees", key: "id" },
          onDelete: "CASCADE",
        },
        uploadedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onDelete: "SET NULL",
        },
        fileName: { type: DataTypes.STRING, allowNull: false },
        characters: { type: DataTypes.INTEGER, allowNull: false },
        chunkCount: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, modelName: "KnowledgeDocument", timestamps: true, indexes: [{ fields: ["employeeId"] }] }
    );
  }

  static associate(): void {
    Employee.hasMany(KnowledgeDocument, { foreignKey: "employeeId", as: "documents" });
    KnowledgeDocument.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
    KnowledgeDocument.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });
  }
}
