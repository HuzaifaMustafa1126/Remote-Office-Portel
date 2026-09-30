import { processReminderQueue } from "../services/scheduledWorkReminder.service.js";
import { processSnoozeQueue } from "../services/scheduledWorkSnooze.service.js";
import pool from "../config/database.js";

try {
  const [reminders, snoozes] = await Promise.all([
    processReminderQueue({ batchSize: 100, maxBatches: 100 }),
    processSnoozeQueue({ batchSize: 100, maxBatches: 100 }),
  ]);
  console.log("Scheduled work reminder processing", { reminders, snoozes });
  process.exitCode = reminders.failed || snoozes.failed ? 1 : 0;
} catch (error) {
  console.error("Scheduled work reminder processor failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
