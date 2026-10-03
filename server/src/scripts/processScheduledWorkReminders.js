import { processReminderQueue } from "../services/scheduledWorkReminder.service.js";
import { processSnoozeQueue } from "../services/scheduledWorkSnooze.service.js";
import { generateActiveRecurrences } from "../services/scheduledWorkRecurrence.service.js";
import pool from "../config/database.js";

try {
  const [reminders, snoozes, recurrences] = await Promise.all([
    processReminderQueue({ batchSize: 100, maxBatches: 100 }),
    processSnoozeQueue({ batchSize: 100, maxBatches: 100 }),
    generateActiveRecurrences({ batchSize: 100 }),
  ]);
  console.log("Scheduled work processing", { reminders, snoozes, recurrences });
  process.exitCode = reminders.failed || snoozes.failed ? 1 : 0;
} catch (error) {
  console.error("Scheduled work reminder processor failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
