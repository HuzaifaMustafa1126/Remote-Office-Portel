import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { startOngoingWork } from "./ongoingWork.service.js";

async function transaction(action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY")
      throw new ApiError(
        409,
        "This scheduled work already has an execution record.",
        "SCHEDULED_EXECUTION_EXISTS",
      );
    throw error;
  } finally {
    connection.release();
  }
}

export async function startWork(workId, occurrenceId, actor) {
  if (!actor.employee_id)
    throw new ApiError(403, "An employee profile is required.");
  return transaction(async (connection) => {
    const [[parent]] = await connection.execute(
      `SELECT w.id,w.title,w.description,w.assigned_to assignedTo,w.status,w.linked_task_id linkedTaskId,
       t.title linkedTaskTitle,t.status linkedTaskStatus
       FROM scheduled_work w LEFT JOIN tasks t ON t.id=w.linked_task_id
       WHERE w.id=? AND w.assigned_to=? FOR UPDATE`,
      [workId, actor.employee_id],
    );
    if (!parent) throw new ApiError(404, "Scheduled work was not found.");
    let target = parent;
    if (occurrenceId) {
      const [[occurrence]] = await connection.execute(
        "SELECT id,status,started_at startedAt FROM scheduled_work_occurrences WHERE id=? AND scheduled_work_id=? AND assigned_to=? FOR UPDATE",
        [occurrenceId, workId, actor.employee_id],
      );
      if (!occurrence)
        throw new ApiError(404, "Scheduled work occurrence was not found.");
      target = occurrence;
    }
    if (target.status !== "UPCOMING")
      throw new ApiError(
        409,
        `This scheduled work is already ${target.status.toLowerCase()}.`,
      );
    if (parent.linkedTaskId) {
      const [[task]] = await connection.execute(
        "SELECT id,title,status FROM tasks WHERE id=? AND assignee_employee_id=?",
        [parent.linkedTaskId, actor.employee_id],
      );
      if (!task)
        throw new ApiError(404, "The linked task is no longer accessible.");
      return {
        scheduledWorkId: Number(workId),
        occurrenceId: occurrenceId ? Number(occurrenceId) : null,
        executionType: "TASK",
        task,
      };
    }
    const [[existing]] = await connection.execute(
      `SELECT id FROM ongoing_work WHERE source_type='SCHEDULED_WORK' AND source_scheduled_work_id=?
       AND ${occurrenceId ? "source_occurrence_id=?" : "source_occurrence_id IS NULL"} AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      occurrenceId ? [workId, occurrenceId] : [workId],
    );
    let ongoingWorkId = existing?.id;
    if (!ongoingWorkId) {
      const [created] = await connection.execute(
        `INSERT INTO ongoing_work(employee_id,title,description,status,started_at,source_type,source_scheduled_work_id,source_occurrence_id)
         VALUES(?,?,?,'PAUSED',NULL,'SCHEDULED_WORK',?,?)`,
        [
          actor.employee_id,
          parent.title.slice(0, 200),
          parent.description?.slice(0, 1000) || null,
          workId,
          occurrenceId || null,
        ],
      );
      ongoingWorkId = created.insertId;
      await connection.execute(
        "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,?,'SCHEDULED_WORK',?,?,?)",
        [
          actor.id,
          actor.employee_id,
          "SCHEDULED_WORK_ONGOING_LINKED",
          workId,
          "Scheduled work linked to ongoing work.",
          JSON.stringify({
            scheduledWorkId: Number(workId),
            occurrenceId: occurrenceId ? Number(occurrenceId) : null,
            ongoingWorkId,
          }),
        ],
      );
    }
    const started = await startOngoingWork(connection, ongoingWorkId, actor);
    if (started.attendanceRequired)
      throw new ApiError(
        409,
        "Clock in before starting ongoing work.",
        "ATTENDANCE_REQUIRED",
      );
    if (started.breakActive)
      throw new ApiError(
        409,
        "End your break before starting ongoing work.",
        "BREAK_ACTIVE",
      );
    const table = occurrenceId
      ? "scheduled_work_occurrences"
      : "scheduled_work";
    await connection.execute(
      `UPDATE ${table} SET started_at=COALESCE(started_at,CURRENT_TIMESTAMP) WHERE id=?`,
      [occurrenceId || workId],
    );
    const condition = occurrenceId
      ? "occurrence_id=?"
      : "scheduled_work_id=? AND occurrence_id IS NULL";
    await connection.execute(
      `UPDATE scheduled_work_reminders SET status='CANCELLED' WHERE ${condition} AND status='PENDING'`,
      [occurrenceId || workId],
    );
    await connection.execute(
      `UPDATE scheduled_work_snoozes SET status='CANCELLED' WHERE ${condition} AND status='PENDING'`,
      [occurrenceId || workId],
    );
    await connection.execute(
      "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values) VALUES(?,?,?,'SCHEDULED_WORK',?,?,?)",
      [
        actor.id,
        actor.employee_id,
        "SCHEDULED_WORK_STARTED",
        workId,
        "Scheduled work execution started.",
        JSON.stringify({
          scheduledWorkId: Number(workId),
          occurrenceId: occurrenceId ? Number(occurrenceId) : null,
          ongoingWorkId: Number(ongoingWorkId),
          executionType: "ONGOING_WORK",
        }),
      ],
    );
    return {
      scheduledWorkId: Number(workId),
      occurrenceId: occurrenceId ? Number(occurrenceId) : null,
      ongoingWorkId: Number(ongoingWorkId),
      startedAt: started.activeWork.startedAt,
      executionType: "ONGOING_WORK",
      ongoingWork: started.activeWork,
    };
  });
}
