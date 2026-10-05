import pool from "../config/database.js";

const checks = {
  orphanReminders: `SELECT r.id reminderId FROM scheduled_work_reminders r LEFT JOIN scheduled_work w ON w.id=r.scheduled_work_id WHERE w.id IS NULL`,
  invalidReminderOccurrences: `SELECT r.id reminderId,r.scheduled_work_id scheduledWorkId,r.occurrence_id occurrenceId FROM scheduled_work_reminders r JOIN scheduled_work_occurrences o ON o.id=r.occurrence_id WHERE o.scheduled_work_id<>r.scheduled_work_id`,
  orphanSnoozes: `SELECT s.id snoozeId FROM scheduled_work_snoozes s LEFT JOIN scheduled_work w ON w.id=s.scheduled_work_id LEFT JOIN employees e ON e.id=s.employee_id WHERE w.id IS NULL OR e.id IS NULL`,
  invalidSnoozeOccurrences: `SELECT s.id snoozeId,s.scheduled_work_id scheduledWorkId,s.occurrence_id occurrenceId FROM scheduled_work_snoozes s JOIN scheduled_work_occurrences o ON o.id=s.occurrence_id WHERE o.scheduled_work_id<>s.scheduled_work_id`,
  invalidSnoozeReminders: `SELECT s.id snoozeId,s.reminder_id reminderId FROM scheduled_work_snoozes s JOIN scheduled_work_reminders r ON r.id=s.reminder_id WHERE r.scheduled_work_id<>s.scheduled_work_id OR NOT (r.occurrence_id<=>s.occurrence_id)`,
  duplicateOccurrences: `SELECT scheduled_work_id scheduledWorkId,scheduled_at scheduledAt,COUNT(*) duplicates FROM scheduled_work_occurrences GROUP BY scheduled_work_id,scheduled_at HAVING COUNT(*)>1`,
  completedWithPendingReminders: `SELECT r.id reminderId,r.scheduled_work_id scheduledWorkId,r.occurrence_id occurrenceId FROM scheduled_work_reminders r JOIN scheduled_work w ON w.id=r.scheduled_work_id LEFT JOIN scheduled_work_occurrences o ON o.id=r.occurrence_id WHERE r.status='PENDING' AND IF(r.occurrence_id IS NULL,w.status,o.status) IN('COMPLETED','CANCELLED')`,
  inactiveWithPendingSnoozes: `SELECT s.id snoozeId,s.scheduled_work_id scheduledWorkId,s.occurrence_id occurrenceId FROM scheduled_work_snoozes s JOIN scheduled_work w ON w.id=s.scheduled_work_id LEFT JOIN scheduled_work_occurrences o ON o.id=s.occurrence_id WHERE s.status='PENDING' AND IF(s.occurrence_id IS NULL,w.status,o.status) IN('COMPLETED','CANCELLED')`,
  duplicateExecutionLinks: `SELECT source_scheduled_work_id scheduledWorkId,source_occurrence_id occurrenceId,COUNT(*) duplicates FROM ongoing_work WHERE source_scheduled_work_id IS NOT NULL AND deleted_at IS NULL GROUP BY source_scheduled_work_id,source_occurrence_id HAVING COUNT(*)>1`,
  invalidExecutionOwnership: `SELECT ow.id ongoingWorkId,ow.employee_id executionEmployeeId,COALESCE(o.assigned_to,w.assigned_to) assignedTo FROM ongoing_work ow JOIN scheduled_work w ON w.id=ow.source_scheduled_work_id LEFT JOIN scheduled_work_occurrences o ON o.id=ow.source_occurrence_id WHERE ow.deleted_at IS NULL AND ow.employee_id<>COALESCE(o.assigned_to,w.assigned_to)`,
  staleReminderClaims: `SELECT id reminderId,claimed_at claimedAt FROM scheduled_work_reminders WHERE status='PROCESSING' AND claimed_at<DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 10 MINUTE)`,
  staleSnoozeClaims: `SELECT id snoozeId,claimed_at claimedAt FROM scheduled_work_snoozes WHERE status='PROCESSING' AND claimed_at<DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 10 MINUTE)`,
};

try {
  const report = {};
  let issueCount = 0;
  for (const [name, sql] of Object.entries(checks)) {
    const [rows] = await pool.execute(sql);
    report[name] = { count: rows.length, rows: rows.slice(0, 100) };
    issueCount += rows.length;
  }
  const [collationRows] = await pool.execute(`SELECT table_name tableName,table_collation collation
    FROM information_schema.tables WHERE table_schema=DATABASE()
      AND table_name LIKE 'scheduled_work%' AND table_collation<>'utf8mb4_unicode_ci'`);
  report.wrongCollations = { count: collationRows.length, rows: collationRows };
  issueCount += collationRows.length;
  const requiredIndexes = [
    ["scheduled_work_reminders", "idx_scheduled_work_reminder_retry"],
    ["scheduled_work_snoozes", "idx_scheduled_work_snooze_retry"],
    ["scheduled_work_occurrences", "uq_scheduled_work_occurrence_time"],
    ["scheduled_work_occurrences", "idx_scheduled_work_occurrence_assignee_status_time"],
  ];
  const [indexRows] = await pool.execute(`SELECT table_name tableName,index_name indexName
    FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name LIKE 'scheduled_work%'`);
  const availableIndexes = new Set(indexRows.map((row) => `${row.tableName}.${row.indexName}`));
  const missingIndexes = requiredIndexes
    .filter(([table, index]) => !availableIndexes.has(`${table}.${index}`))
    .map(([tableName, indexName]) => ({ tableName, indexName }));
  report.missingIndexes = { count: missingIndexes.length, rows: missingIndexes };
  issueCount += missingIndexes.length;
  const [reminderPlan] = await pool.execute(`EXPLAIN SELECT id FROM scheduled_work_reminders
    WHERE status='PENDING' AND remind_at<=CURRENT_TIMESTAMP
      AND (next_attempt_at IS NULL OR next_attempt_at<=CURRENT_TIMESTAMP)
    ORDER BY remind_at,id LIMIT 100`);
  const [snoozePlan] = await pool.execute(`EXPLAIN SELECT id FROM scheduled_work_snoozes
    WHERE status='PENDING' AND snoozed_until<=CURRENT_TIMESTAMP
      AND (next_attempt_at IS NULL OR next_attempt_at<=CURRENT_TIMESTAMP)
    ORDER BY snoozed_until,id LIMIT 100`);
  const [[queue]] = await pool.execute(`SELECT
    SUM(status='PENDING') pendingReminders,SUM(status='FAILED') failedReminders,
    MIN(IF(status='PENDING',remind_at,NULL)) oldestPendingReminder
    FROM scheduled_work_reminders`);
  const [[snoozes]] = await pool.execute(`SELECT
    SUM(status='PENDING') pendingSnoozes,SUM(status='FAILED') failedSnoozes,
    MIN(IF(status='PENDING',snoozed_until,NULL)) oldestPendingSnooze
    FROM scheduled_work_snoozes`);
  console.log(JSON.stringify({ ok: issueCount === 0, issueCount, queue, snoozes, queryPlans: { reminders: reminderPlan, snoozes: snoozePlan }, checks: report }, null, 2));
  process.exitCode = issueCount ? 1 : 0;
} finally {
  await pool.end();
}
