import { DataTypes } from "sequelize";
import sequelize from "../connection.js";

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
];

export const STATUSES = ["online", "away", "busy", "in meeting"];

const Employee = sequelize.define(
  "EveEmployee",
  {
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
  },
  { timestamps: true }
);

export default Employee;
