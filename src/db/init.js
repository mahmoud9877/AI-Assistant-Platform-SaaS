import { DataTypes } from "sequelize";
import sequelize from "./connection.js";
import "./models/index.js";

// sync() creates missing tables but never adds columns to existing ones,
// so columns added after the first deploy are created here.
const addMissingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("EveEmployees");

  if (!columns.introduction) {
    await queryInterface.addColumn("EveEmployees", "introduction", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    console.log("✅ Added EveEmployees.introduction column");
  }
};

export const initDatabase = async () => {
  await sequelize.authenticate();
  console.log("✅ DB Connected");
  await sequelize.sync();
  await addMissingColumns();
  console.log("✅ DB Synced");
};
