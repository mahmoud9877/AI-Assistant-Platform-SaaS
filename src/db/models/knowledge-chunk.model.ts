import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";
import { KnowledgeDocument } from "./knowledge-document.model.js";

/** A passage of a knowledge document with its embedding, for similarity search. */
export class KnowledgeChunk extends Model<InferAttributes<KnowledgeChunk>, InferCreationAttributes<KnowledgeChunk>> {
  declare id: CreationOptional<number>;
  declare documentId: number;
  // Copied from the document so an employee's chunks can be searched without a join.
  declare employeeId: number;
  declare position: number;
  declare content: string;
  /** Float32 vector of length 1, stored as raw bytes. */
  declare embedding: Buffer;

  static initModel(sequelize: Sequelize): void {
    KnowledgeChunk.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        documentId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "KnowledgeDocuments", key: "id" },
          onDelete: "CASCADE",
        },
        employeeId: { type: DataTypes.INTEGER, allowNull: false },
        position: { type: DataTypes.INTEGER, allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        embedding: { type: DataTypes.BLOB, allowNull: false },
      },
      { sequelize, modelName: "KnowledgeChunk", timestamps: false, indexes: [{ fields: ["employeeId"] }] }
    );
  }

  static associate(): void {
    KnowledgeDocument.hasMany(KnowledgeChunk, { foreignKey: "documentId", as: "chunks", onDelete: "CASCADE" });
    KnowledgeChunk.belongsTo(KnowledgeDocument, { foreignKey: "documentId", as: "document" });
  }

  static toBlob(vector: Float32Array): Buffer {
    return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
  }

  static fromBlob(blob: Buffer): Float32Array {
    // Copied so the floats are 4-byte aligned, which a Float32Array view requires.
    const bytes = new Uint8Array(blob);
    return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  }
}
