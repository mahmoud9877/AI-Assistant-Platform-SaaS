import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";
import { User } from "./user.model.js";

/** A one-time password-reset link. Only a SHA-256 hash of its token is stored. */
export class PasswordReset extends Model<InferAttributes<PasswordReset>, InferCreationAttributes<PasswordReset>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    PasswordReset.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Users", key: "id" },
          onDelete: "CASCADE",
        },
        tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
        createdAt: DataTypes.DATE,
      },
      { sequelize, modelName: "PasswordReset", timestamps: true, updatedAt: false }
    );
  }

  static associate(): void {
    User.hasMany(PasswordReset, { foreignKey: "userId", as: "passwordResets" });
  }
}
