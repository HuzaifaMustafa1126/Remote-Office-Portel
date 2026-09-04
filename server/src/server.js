import app from "./app.js";
import env from "./config/env.js";
import { verifyDatabase } from "./config/database.js";
import { createServer } from "node:http";
import { initializeNotifications } from "./sockets/notification.socket.js";
import { validateSchema } from "./services/schema.service.js";

const PORT = Number(process.env.PORT) || 4000;

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error("Unhandled rejection:", message);
  process.exit(1);
});

async function start() {
  try {
    await verifyDatabase();
    const schema = await validateSchema();
    console.log("Remote Office Portal API");
    console.log("Database connected.");
    if (!schema.valid)
      throw new Error(
        `Database schema is outdated. Missing tables: ${schema.missing.join(", ")}. Run npm run migrate.`,
      );
    console.log(
      `Schema validation passed (${schema.migrations.length} migrations recorded).`,
    );
    const server = createServer(app);
    initializeNotifications(server);
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`API listening on port ${PORT}`),
    );
  } catch (e) {
    console.error("Server startup failed:", e.message);
    process.exit(1);
  }
}
start();
