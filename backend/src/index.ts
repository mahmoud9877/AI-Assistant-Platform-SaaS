import { App } from "./app.js";
import { config } from "./config/env.js";
import { Database } from "./db/database.js";

const start = async (): Promise<void> => {
  try {
    await new Database(config.databaseUrl).connect();
    new App(config).listen();
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
};

start();
