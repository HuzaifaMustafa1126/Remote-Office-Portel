import app from "./app.js";
import env from "./config/env.js";
import { verifyDatabase } from "./config/database.js";
import { createServer } from "node:http";
import { initializeNotifications } from "./sockets/notification.socket.js";
import { validateSchema } from "./services/schema.service.js";
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
    server.listen(env.PORT, () =>
      console.log(`API listening on http://localhost:${env.PORT}`),
    );
  } catch (e) {
    console.error("Unable to connect to MySQL:", e.message);
    process.exit(1);
  }
}
start();
