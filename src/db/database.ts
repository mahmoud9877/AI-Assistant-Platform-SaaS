import { DataTypes, Sequelize } from "sequelize";
import { User } from "./models/user.model.js";
import { Employee } from "./models/employee.model.js";

export class Database {
  readonly sequelize: Sequelize;

  constructor(databaseUrl: string) {
    this.sequelize = new Sequelize(databaseUrl, { dialect: "mysql", logging: false });

    User.initModel(this.sequelize);
    Employee.initModel(this.sequelize);
    Employee.associate();
  }

  async connect(): Promise<void> {
    await this.sequelize.authenticate();
    console.log("✅ DB Connected");
    await this.sequelize.sync();
    await this.addMissingColumns();
    console.log("✅ DB Synced");
  }

  // sync() creates missing tables but never adds columns to existing ones,
  // so columns added after the first deploy are created here.
  private async addMissingColumns(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("EveEmployees");

    if (!columns.introduction) {
      await queryInterface.addColumn("EveEmployees", "introduction", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
      console.log("✅ Added EveEmployees.introduction column");
    }
  }
}
