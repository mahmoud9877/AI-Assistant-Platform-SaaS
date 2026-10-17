import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from "sequelize";
import { User } from "./user.model.js";
import { Department } from "./department.model.js";

export const STATUSES = ["online", "away", "busy", "in meeting"] as const;

export type EmployeeStatus = (typeof STATUSES)[number];

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare role: CreationOptional<string>;
  declare introduction: string | null;
  declare knowledgeText: string | null;
  declare photoUrl: string | null;
  declare departmentId: number | null;
  /** Loaded when the query includes it (as "department"). */
  declare department?: NonAttribute<Department | null>;
  declare status: CreationOptional<EmployeeStatus>;
  declare createdBy: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): void {
    Employee.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: { len: [2, 20] },
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "visitor",
        },
        introduction: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        knowledgeText: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
        photoUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        departmentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Departments", key: "id" },
          // The API refuses to delete a department that still has employees; this backs it up.
          onDelete: "RESTRICT",
        },
        status: {
          type: DataTypes.ENUM(...STATUSES),
          defaultValue: "online",
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onDelete: "CASCADE",
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, modelName: "EveEmployee", timestamps: true }
    );
  }

  static associate(): void {
    User.hasMany(Employee, { foreignKey: "createdBy", as: "employees" });
    Employee.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    Department.hasMany(Employee, { foreignKey: "departmentId", as: "employees" });
    Employee.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
  }
}
