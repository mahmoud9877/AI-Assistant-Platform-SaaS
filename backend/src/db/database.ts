import { DataTypes, QueryTypes, Sequelize } from "sequelize";
import { User } from "./models/user.model.js";
import { Department } from "./models/department.model.js";
import { INITIAL_DEPARTMENTS } from "./seed/departments.js";
import { Employee } from "./models/employee.model.js";
import { Conversation } from "./models/conversation.model.js";
import { Message } from "./models/message.model.js";
import { KnowledgeChunk } from "./models/knowledge-chunk.model.js";
import { KnowledgeDocument } from "./models/knowledge-document.model.js";
import { PasswordReset } from "./models/password-reset.model.js";

export class Database {
  readonly sequelize: Sequelize;

  constructor(databaseUrl: string) {
    this.sequelize = new Sequelize(databaseUrl, { dialect: "mysql", logging: false });

    User.initModel(this.sequelize);
    Department.initModel(this.sequelize);
    Employee.initModel(this.sequelize);
    Conversation.initModel(this.sequelize);
    Message.initModel(this.sequelize);
    KnowledgeDocument.initModel(this.sequelize);
    KnowledgeChunk.initModel(this.sequelize);
    PasswordReset.initModel(this.sequelize);
    Employee.associate();
    Conversation.associate();
    Message.associate();
    KnowledgeDocument.associate();
    KnowledgeChunk.associate();
    PasswordReset.associate();
  }

  async connect(): Promise<void> {
    await this.sequelize.authenticate();
    console.log("✅ DB Connected");
    await this.sequelize.sync();
    await this.addMissingColumns();
    await this.seedDepartments();
    await this.migrateEmployeeDepartments();
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

    const userColumns = await queryInterface.describeTable("Users");
    if (!userColumns.tokenVersion) {
      await queryInterface.addColumn("Users", "tokenVersion", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      console.log("✅ Added Users.tokenVersion column");
    }

    const messageColumns = await queryInterface.describeTable("Messages");
    if (!messageColumns.sources) {
      await queryInterface.addColumn("Messages", "sources", { type: DataTypes.JSON, allowNull: true });
      console.log("✅ Added Messages.sources column");
    }

    const personality: [string, Parameters<typeof queryInterface.addColumn>[2]][] = [
      ["tone", { type: DataTypes.STRING(20), allowNull: false, defaultValue: "professional" }],
      ["replyLanguage", { type: DataTypes.STRING(10), allowNull: false, defaultValue: "auto" }],
      ["customInstructions", { type: DataTypes.TEXT, allowNull: true }],
    ];
    for (const [column, definition] of personality) {
      if (!columns[column]) {
        await queryInterface.addColumn("EveEmployees", column, definition);
        console.log(`✅ Added EveEmployees.${column} column`);
      }
    }

    if (!columns.departmentId) {
      await queryInterface.addColumn("EveEmployees", "departmentId", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Departments", key: "id" },
        onDelete: "RESTRICT",
      });
      console.log("✅ Added EveEmployees.departmentId column");
    }
  }

  private async seedDepartments(): Promise<void> {
    if ((await Department.count()) > 0) return;
    await Department.bulkCreate(INITIAL_DEPARTMENTS.map((name) => ({ name })));
    console.log(`✅ Seeded ${INITIAL_DEPARTMENTS.length} departments`);
  }

  // Employees used to store their department as a fixed ENUM name. Each name becomes
  // (or matches) a Departments row, employees point at it by id, and the old column goes.
  private async migrateEmployeeDepartments(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("EveEmployees");
    if (!columns.department) return;

    await this.sequelize.transaction(async (transaction) => {
      const rows = await this.sequelize.query<{ department: string }>(
        "SELECT DISTINCT department FROM EveEmployees WHERE department IS NOT NULL",
        { type: QueryTypes.SELECT, transaction }
      );
      for (const { department } of rows) {
        await Department.findOrCreate({ where: { name: department }, transaction });
      }
      await this.sequelize.query(
        `UPDATE EveEmployees e JOIN Departments d ON d.name = e.department
         SET e.departmentId = d.id WHERE e.departmentId IS NULL`,
        { transaction }
      );
    });
    // DDL commits on its own in MySQL, so it runs once the data is safely copied.
    await queryInterface.removeColumn("EveEmployees", "department");
    console.log("✅ Moved employee departments to the Departments table");
  }
}
