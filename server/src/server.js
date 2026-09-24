import app from "./app.js";
import env from "./config/env.js";
import { verifyDatabase } from "./config/database.js";
import { createServer } from "node:http";
import { initializeNotifications } from "./sockets/notification.socket.js";
import { validateSchema } from "./services/schema.service.js";
import { publishDueScheduled,sendTaskDeadlineNotifications } from "./services/task.service.js";
import { pauseStaleTaskSessions } from "./services/taskPresence.service.js";
import { processDayEndReportFollowups } from "./services/dayEndReportFollowup.service.js";

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
    let startupTimer;
    const schema = await Promise.race([
      (async () => {
        await verifyDatabase();
        return validateSchema();
      })(),
      new Promise((_, reject) => {
        startupTimer = setTimeout(
          () => reject(new Error(`Startup checks exceeded ${env.STARTUP_TIMEOUT_MS}ms`)),
          env.STARTUP_TIMEOUT_MS,
        );
        startupTimer.unref();
      }),
    ]).finally(() => clearTimeout(startupTimer));
    console.log("Remote Office Portal API");
    console.log("Database connected.");
    if (!schema.valid) {
      console.warn(
        `Database schema is outdated. Missing tables: ${schema.missing.join(", ") || "none"}; missing columns: ${schema.missingColumns.join(", ") || "none"}; missing migrations: ${schema.missingMigrations.join(", ") || "none"}. Run npm run migrate.`,
      );
    } else {
      console.log(
        `Schema validation passed (${schema.migrations.length} migrations recorded).`,
      );
    }
    const server = createServer(app);
    server.requestTimeout = env.REQUEST_TIMEOUT_MS;
    server.timeout = env.REQUEST_TIMEOUT_MS;
    server.headersTimeout = env.REQUEST_TIMEOUT_MS + 5000;
    server.keepAliveTimeout = 5000;
    initializeNotifications(server);
    const publishTimer=setInterval(()=>publishDueScheduled().catch(error=>console.error("Scheduled task publication failed:",error.message)),30000);
    publishTimer.unref();
    const deadlineTimer=setInterval(()=>sendTaskDeadlineNotifications().catch(error=>console.error("Task deadline notification check failed:",error.message)),60000);
    deadlineTimer.unref();
    const presenceTimer = setInterval(
      () =>
        pauseStaleTaskSessions().catch((error) =>
          console.error("Task presence check failed:", error.message),
        ),
      60000,
    );
    presenceTimer.unref();
    const dayEndTimer = setInterval(
      () => processDayEndReportFollowups().catch((error) => console.error("Day-End Report follow-up check failed:", error.message)),
      60000,
    );
    dayEndTimer.unref();
    processDayEndReportFollowups().catch((error) => console.error("Initial Day-End Report follow-up check failed:", error.message));
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`API listening on port ${PORT}`),
    );
  } catch (e) {
    console.error("Server startup failed:", e.message);
    process.exit(1);
  }
}
start();
