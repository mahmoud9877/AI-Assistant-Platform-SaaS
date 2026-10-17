import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";

/** A department EVE employees belong to; managed by admins. */
export class Department extends Model<InferAttributes<Department>, InferCreationAttributes<Department>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    Department.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        // Unique ignoring case under MySQL's default collation, so "HR" and "hr" can't both exist.
        name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, modelName: "Department", timestamps: true }
    );
  }
}
