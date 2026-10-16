import { Sequelize } from "sequelize";
import env from "../config/env.js";

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "mysql",
  logging: false,
});

export default sequelize;
