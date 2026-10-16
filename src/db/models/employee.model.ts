import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from "sequelize";
import { User } from "./user.model.js";

export const DEPARTMENTS = [
  "CF PS HR MFG & Purchases",
  "CF PS MFG EGYPT",
  "F&A",
  "FPWH",
  "General Operations",
  "GMDSO",
  "HR",
  "HS&E",
  "IWS",
  "Line-1",
  "Line-10",
  "Line-2",
  "Line-9",
  "P&E CFS ENG",
  "P&E Cairo/Karachi",
  "PFSS",
  "QA",
  "Regional GMDSO",
  "Regional Tech Pack",
  "Engineering",
  "Marketing",
  "Sales",
  "Human Resources",
  "General Employee",
  "RPM WH",
  "Shave Care Operations",
  "Shave Care Qualilty",
  "Storeroom",
  "TSG Matrix",
  "TSM",
  "Utilities",
] as const;

export const STATUSES = ["online", "away", "busy", "in meeting"] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type EmployeeStatus = (typeof STATUSES)[number];

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare role: CreationOptional<string>;
  declare introduction: string | null;
  declare knowledgeText: string | null;
  declare photoUrl: string | null;
  declare department: Department | null;
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
        department: {
          type: DataTypes.ENUM(...DEPARTMENTS),
          allowNull: true,
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
  }
}
