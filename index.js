import env from "./src/config/env.js";
import { createApp } from "./src/app.js";
import { initDatabase } from "./src/db/init.js";

const startServer = async () => {
  try {
    await initDatabase();
    createApp().listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
};

startServer();
