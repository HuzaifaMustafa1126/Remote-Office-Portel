import { processReminderQueue } from "../services/scheduledWorkReminder.service.js";
import pool from "../config/database.js";

try {
  const result = await processReminderQueue({
    batchSize: 100,
    maxBatches: 100,
  });
  console.log("Scheduled work reminder processing", result);
  process.exitCode = result.failed ? 1 : 0;
} catch (error) {
  console.error("Scheduled work reminder processor failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
