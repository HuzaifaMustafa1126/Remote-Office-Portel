import pool from "../config/database.js";

const checks = {
  multipleActiveTimers: `
    SELECT employee_id employeeId,COUNT(*) activeTimers
    FROM ongoing_work_sessions WHERE ended_at IS NULL
    GROUP BY employee_id HAVING COUNT(*)>1`,
  statusSessionMismatch: `
    SELECT ow.id ongoingWorkId,ow.employee_id employeeId,ow.status,
      COUNT(s.id) activeSessions
    FROM ongoing_work ow
    LEFT JOIN ongoing_work_sessions s
      ON s.ongoing_work_id=ow.id AND s.ended_at IS NULL
    GROUP BY ow.id,ow.employee_id,ow.status
    HAVING (ow.status='WORKING' AND COUNT(s.id)<>1)
       OR (ow.status<>'WORKING' AND COUNT(s.id)<>0)`,
  activeWithoutAttendance: `
    SELECT s.id sessionId,s.ongoing_work_id ongoingWorkId,s.employee_id employeeId
    FROM ongoing_work_sessions s
    LEFT JOIN attendance_records ar
      ON ar.id=s.attendance_record_id AND ar.status IN('WORKING','ON_BREAK')
    WHERE s.ended_at IS NULL AND ar.id IS NULL`,
  activeDuringBreak: `
    SELECT s.id sessionId,s.ongoing_work_id ongoingWorkId,s.employee_id employeeId,
      ab.id breakId
    FROM ongoing_work_sessions s
    JOIN attendance_records ar ON ar.id=s.attendance_record_id
    JOIN attendance_breaks ab ON ab.attendance_id=ar.id AND ab.status='ACTIVE'
    WHERE s.ended_at IS NULL`,
  orphanSessions: `
    SELECT s.id sessionId,s.ongoing_work_id ongoingWorkId,s.employee_id employeeId
    FROM ongoing_work_sessions s
    LEFT JOIN ongoing_work ow ON ow.id=s.ongoing_work_id
    LEFT JOIN employees e ON e.id=s.employee_id
    LEFT JOIN users u ON u.id=s.user_id
    WHERE ow.id IS NULL OR e.id IS NULL OR u.id IS NULL`,
  invalidRetentionArchive: `
    SELECT id ongoingWorkId,employee_id employeeId,status,completed_at completedAt,
      deleted_at deletedAt,deletion_reason deletionReason
    FROM ongoing_work
    WHERE deleted_at IS NOT NULL
      AND (status<>'COMPLETED' OR completed_at IS NULL OR deletion_reason IS NULL)`,
};

try {
  const report = {};
  let issueCount = 0;
  for (const [name, sql] of Object.entries(checks)) {
    const [rows] = await pool.execute(sql);
    report[name] = { count: rows.length, rows };
    issueCount += rows.length;
  }
  const [[retention]] = await pool.execute(
    `SELECT auto_cleanup_enabled autoCleanupEnabled,retention_days retentionDays
     FROM ongoing_work_retention_settings WHERE id=1`,
  );
  console.log(JSON.stringify({
    ok: issueCount === 0,
    issueCount,
    retention: {
      autoCleanupEnabled: Boolean(retention.autoCleanupEnabled),
      retentionDays: Number(retention.retentionDays),
    },
    checks: report,
  }, null, 2));
  process.exitCode = issueCount ? 1 : 0;
} finally {
  await pool.end();
}
