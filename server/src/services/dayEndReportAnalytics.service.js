import pool from "../config/database.js";

const employeeFilter = (employeeId, alias = "r") => employeeId ? { sql: ` AND ${alias}.employee_id=?`, params: [employeeId] } : { sql: "", params: [] };
const numbers = (row) => Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key,
  value == null ? 0 : typeof value === "number" || (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) ? Number(value) : value]));

export async function analytics({ from, to, employeeId }) {
  const reportEmployee = employeeFilter(employeeId, "r");
  const attendanceEmployee = employeeFilter(employeeId, "ar");
  const rangeParams = [from, to, ...reportEmployee.params];
  const [reportResult, trendResult, blockerResult, blockerTrendResult, sourceResult, attendanceResult, attentionResult, employeeResult] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) reportsSubmitted,SUM(r.status='REVIEWED') reviewed,SUM(r.status='SUBMITTED') awaitingReview,
       SUM(r.blocker_type<>'NONE') blockerReports,
       COUNT(DISTINCT CASE WHEN EXISTS(SELECT 1 FROM day_end_report_replies dr WHERE dr.report_id=r.id) THEN r.id END) reportsWithDiscussion
       FROM day_end_reports r WHERE r.report_date BETWEEN ? AND ?${reportEmployee.sql}`, rangeParams),
    pool.execute(
      `SELECT r.report_date reportDate,MAX(r.id) reportId,COUNT(DISTINCT r.id) reports,
       SUM(i.status_snapshot='COMPLETED') completed,SUM(i.status_snapshot<>'COMPLETED') pending,
       SUM(CASE WHEN i.source_type='TASK' THEN i.tracked_minutes_snapshot ELSE 0 END) trackedMinutes
       FROM day_end_reports r LEFT JOIN day_end_report_items i ON i.report_id=r.id
       WHERE r.report_date BETWEEN ? AND ?${reportEmployee.sql} GROUP BY r.report_date ORDER BY r.report_date`, rangeParams),
    pool.execute(
      `SELECT r.blocker_type blockerType,COUNT(*) count FROM day_end_reports r
       WHERE r.report_date BETWEEN ? AND ? AND r.blocker_type<>'NONE'${reportEmployee.sql}
       GROUP BY r.blocker_type ORDER BY count DESC`, rangeParams),
    pool.execute(
      `SELECT r.report_date reportDate,COUNT(*) count FROM day_end_reports r
       WHERE r.report_date BETWEEN ? AND ? AND r.blocker_type<>'NONE'${reportEmployee.sql}
       GROUP BY r.report_date ORDER BY r.report_date`, rangeParams),
    pool.execute(
      `SELECT COUNT(i.id) workItems,SUM(i.status_snapshot='COMPLETED') completed,
       SUM(i.status_snapshot<>'COMPLETED') carryForwardOccurrences,
       SUM(i.source_type='TASK') taskItems,SUM(i.source_type='ONGOING_WORK') ongoingWorkItems,
       SUM(CASE WHEN i.source_type='TASK' THEN i.tracked_minutes_snapshot ELSE 0 END) trackedMinutes
       FROM day_end_reports r LEFT JOIN day_end_report_items i ON i.report_id=r.id
       WHERE r.report_date BETWEEN ? AND ?${reportEmployee.sql}`, rangeParams),
    pool.execute(
      `SELECT COUNT(DISTINCT ar.id) expectedWorkdays,
       COUNT(DISTINCT der.id) reportsSubmitted,
       COUNT(DISTINCT CASE WHEN der.id IS NULL AND ar.status='CLOCKED_OUT' THEN ar.id END) outstanding
       FROM attendance_records ar LEFT JOIN day_end_reports der ON der.attendance_id=ar.id
       WHERE ar.work_date BETWEEN ? AND ? AND ar.clock_in_at IS NOT NULL
       AND ar.work_date>=COALESCE((SELECT DATE(applied_at) FROM schema_migrations WHERE migration_name='057_day_end_report_phase1.sql'),?)${attendanceEmployee.sql}`,
      [from, to, from, ...attendanceEmployee.params]),
    pool.execute(
      `SELECT
       (SELECT COUNT(*) FROM day_end_reports r WHERE r.report_date BETWEEN ? AND ? AND r.blocker_type='WAITING_ADMIN'${reportEmployee.sql}) waitingAdmin,
       (SELECT COUNT(*) FROM day_end_reports r WHERE r.report_date BETWEEN ? AND ? AND r.blocker_type='TECHNICAL'${reportEmployee.sql}) technicalBlockers,
       (SELECT COUNT(*) FROM day_end_reports r WHERE r.report_date BETWEEN ? AND ? AND r.status='SUBMITTED'${reportEmployee.sql}) awaitingReview,
       (SELECT COUNT(*) FROM attendance_records ar LEFT JOIN day_end_reports der ON der.attendance_id=ar.id CROSS JOIN day_end_report_settings ds
        WHERE ar.work_date BETWEEN ? AND ? AND ar.status IN('WORKING','ON_BREAK') AND der.id IS NULL
        AND CURRENT_TIMESTAMP>=DATE_ADD(ar.scheduled_clock_out,INTERVAL ds.overdue_grace_minutes MINUTE)${attendanceEmployee.sql}) overdue`,
      [from, to, ...reportEmployee.params, from, to, ...reportEmployee.params, from, to, ...reportEmployee.params, from, to, ...attendanceEmployee.params]),
    pool.execute("SELECT id,CONCAT(first_name,' ',last_name) name FROM employees WHERE status='ACTIVE' ORDER BY first_name,last_name"),
  ]);
  const [reportRows] = reportResult, [trend] = trendResult, [blockers] = blockerResult,
    [blockerTrend] = blockerTrendResult, [sourceRows] = sourceResult,
    [attendanceRows] = attendanceResult, [attentionRows] = attentionResult, [employees] = employeeResult;
  const reportTotals = reportRows[0] || {}, sources = sourceRows[0] || {},
    attendanceTotals = attendanceRows[0] || {}, attention = attentionRows[0] || {};

  const [carryForward] = await pool.execute(
    `WITH range_keys AS (
       SELECT DISTINCT r.employee_id,i.source_type,
        COALESCE(CAST(i.task_id AS CHAR),CAST(i.ongoing_work_id AS CHAR),CONCAT('TITLE:',i.title_snapshot)) sourceKey
       FROM day_end_reports r JOIN day_end_report_items i ON i.report_id=r.id
       WHERE r.report_date BETWEEN ? AND ?${reportEmployee.sql}
     ), ranked AS (
       SELECT r.id reportId,r.employee_id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,r.report_date reportDate,
        r.blocker_type blockerType,i.source_type sourceType,i.title_snapshot title,i.status_snapshot status,
        i.whats_left whatsLeft,i.estimated_remaining_minutes estimatedRemainingMinutes,
        i.estimated_remaining_value estimatedRemainingValue,i.estimated_remaining_unit estimatedRemainingUnit,
        ROW_NUMBER() OVER(PARTITION BY r.employee_id,i.source_type,
          COALESCE(CAST(i.task_id AS CHAR),CAST(i.ongoing_work_id AS CHAR),CONCAT('TITLE:',i.title_snapshot))
          ORDER BY r.report_date DESC,r.id DESC,i.id DESC) rn
       FROM day_end_reports r JOIN day_end_report_items i ON i.report_id=r.id JOIN employees e ON e.id=r.employee_id
       JOIN range_keys k ON k.employee_id=r.employee_id AND k.source_type=i.source_type AND k.sourceKey=COALESCE(CAST(i.task_id AS CHAR),CAST(i.ongoing_work_id AS CHAR),CONCAT('TITLE:',i.title_snapshot))
     ) SELECT * FROM ranked WHERE rn=1 AND status<>'COMPLETED' ORDER BY reportDate DESC,employeeName,title LIMIT 100`,
    [from, to, ...reportEmployee.params],
  );
  const [priorities] = await pool.execute(
    `WITH ranked AS (SELECT r.id reportId,r.employee_id employeeId,CONCAT(e.first_name,' ',e.last_name) employeeName,
      r.report_date reportDate,r.tomorrow_priority tomorrowPriority,
      ROW_NUMBER() OVER(PARTITION BY r.employee_id ORDER BY r.report_date DESC,r.id DESC) rn
      FROM day_end_reports r JOIN employees e ON e.id=r.employee_id
      WHERE r.report_date BETWEEN ? AND ?${reportEmployee.sql})
     SELECT reportId,employeeId,employeeName,reportDate,tomorrowPriority FROM ranked WHERE rn=1 ORDER BY employeeName`, rangeParams);
  return {
    range: { from, to }, employeeId: employeeId || null,
    summary: { ...numbers(reportTotals), ...numbers(sources), expectedWorkdays: Number(attendanceTotals.expectedWorkdays || 0), outstanding: Number(attendanceTotals.outstanding || 0) },
    trend: trend.map(numbers), blockers: blockers.map(numbers), blockerTrend: blockerTrend.map(numbers),
    sources: { task: Number(sources.taskItems || 0), ongoingWork: Number(sources.ongoingWorkItems || 0) },
    review: { reviewed: Number(reportTotals.reviewed || 0), awaitingReview: Number(reportTotals.awaitingReview || 0) },
    attendance: numbers(attendanceTotals), attention: numbers(attention), carryForward, priorities, employees,
  };
}
