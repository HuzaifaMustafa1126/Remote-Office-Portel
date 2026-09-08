import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { getEffectivePermission } from "./effectivePermission.service.js";
import { assertTransition, isOverdue } from "../utils/taskStatus.js";
import {
  mkdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
const select = `SELECT t.*,CONCAT(a.first_name,' ',a.last_name) assigneeName,CONCAT(c.first_name,' ',c.last_name) creatorName,(SELECT COUNT(*) FROM task_images ti WHERE ti.task_id=t.id) imageCount,(SELECT COUNT(*) FROM task_images ti WHERE ti.task_id=t.id AND ti.image_context='SUBMISSION') submissionImageCount,(SELECT reason FROM task_change_requests cr WHERE cr.task_id=t.id ORDER BY cr.id DESC LIMIT 1) changeReason,(SELECT revision_due_at FROM task_change_requests cr WHERE cr.task_id=t.id ORDER BY cr.id DESC LIMIT 1) revisionDueAt,(SELECT COALESCE(SUM(COALESCE(tws.duration_seconds,TIMESTAMPDIFF(SECOND,tws.started_at,CURRENT_TIMESTAMP))),0) FROM task_work_sessions tws WHERE tws.task_id=t.id) timeSpentSeconds FROM tasks t LEFT JOIN employees a ON a.id=t.assignee_employee_id JOIN users cu ON cu.id=t.created_by LEFT JOIN employees c ON c.id=cu.employee_id`;
async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
const dbDate = (value) => (value ? new Date(value) : null);
async function activity(
  c,
  taskId,
  type,
  actor,
  oldStatus,
  newStatus,
  metadata = {},
) {
  await c.execute(
    "INSERT INTO task_activities(task_id,event_type,actor_user_id,previous_status,new_status,metadata)VALUES(?,?,?,?,?,?)",
    [
      taskId,
      type,
      actor.id,
      oldStatus || null,
      newStatus || null,
      JSON.stringify(metadata),
    ],
  );
}
async function audit(c, taskId, type, actor, description, metadata = {}) {
  await c.execute(
    "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,new_values)VALUES(?,?,?,'TASK',?,?,?)",
    [
      actor.id,
      actor.employee_id,
      type,
      taskId,
      description,
      JSON.stringify(metadata),
    ],
  );
}
async function eligibleAssignee(c, id) {
  const [[e]] = await c.execute(
    `SELECT e.id,e.status,GROUP_CONCAT(UPPER(r.name)) roles FROM employees e JOIN users u ON u.employee_id=e.id LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id WHERE e.id=? GROUP BY e.id`,
    [id],
  );
  if (!e) throw new ApiError(404, "Employee not found");
  if (e.status !== "ACTIVE") throw new ApiError(409, "Employee is inactive");
  if (
    String(e.roles || "")
      .split(",")
      .some((x) => ["CEO", "ADMIN", "SUPER_ADMIN"].includes(x))
  )
    throw new ApiError(400, "Management users cannot be task assignees");
  return e;
}
export async function create(data, actor) {
  return tx(async (c) => {
    if (data.assigneeEmployeeId)
      await eligibleAssignee(c, data.assigneeEmployeeId);
    const status =
      data.publishMode === "DRAFT"
        ? "DRAFT"
        : data.publishMode === "SCHEDULED"
          ? "SCHEDULED"
          : data.assignmentType === "OPEN"
            ? "OPEN"
            : "TO_DO";
    const published = data.publishMode === "NOW" ? new Date() : null;
    const [r] = await c.execute(
      `INSERT INTO tasks(title,description,instructions,priority,assignment_type,assignee_employee_id,status,start_at,due_at,publish_mode,scheduled_publish_at,published_at,review_required,completion_image_required,created_by,updated_by)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.title,
        data.description || null,
        data.instructions || null,
        data.priority,
        data.assignmentType,
        data.assigneeEmployeeId || null,
        status,
        dbDate(data.startAt),
        dbDate(data.dueAt),
        data.publishMode,
        dbDate(data.scheduledPublishAt),
        published,
        data.reviewRequired,
        data.completionImageRequired,
        actor.id,
        actor.id,
      ],
    );
    if (data.assigneeEmployeeId)
      await c.execute(
        "INSERT INTO task_assignment_history(task_id,new_employee_id,changed_by,assignment_source)VALUES(?,?,?,'DIRECT')",
        [r.insertId, data.assigneeEmployeeId, actor.id],
      );
    await activity(
      c,
      r.insertId,
      status === "DRAFT" ? "DRAFT_CREATED" : "TASK_CREATED",
      actor,
      null,
      status,
      { assignmentType: data.assignmentType },
    );
    await audit(
      c,
      r.insertId,
      "TASK_CREATED",
      actor,
      `${data.title} was created as ${status}.`,
      { status },
    );
    return { id: r.insertId, status };
  });
}
export async function list(filters, user) {
  const all = await getEffectivePermission(user.id, "task.view_all");
  const where = [],
    params = [];
  if (!all) {
    where.push(
      "(t.assignee_employee_id=? OR (t.assignment_type='OPEN' AND t.status='OPEN'))",
    );
    params.push(user.employee_id);
    where.push("t.status NOT IN('DRAFT','SCHEDULED')");
    if (
      filters.employeeId &&
      Number(filters.employeeId) !== Number(user.employee_id)
    )
      throw new ApiError(403, "You cannot view another employee's tasks");
  } else if (filters.employeeId) {
    where.push("t.assignee_employee_id=?");
    params.push(filters.employeeId);
  }
  if (filters.search) {
    where.push("(t.title LIKE ? OR t.id=?)");
    params.push(`%${filters.search}%`, Number(filters.search) || 0);
  }
  if (filters.priority) {
    where.push("t.priority=?");
    params.push(filters.priority);
  }
  if (filters.status) {
    where.push("t.status=?");
    params.push(filters.status);
  }
  if (filters.from) {
    where.push("t.due_at>=?");
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    where.push("t.due_at<DATE_ADD(?,INTERVAL 1 DAY)");
    params.push(filters.to);
  }
  const [rows] = await pool.execute(
    `${select}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY FIELD(t.priority,'URGENT','HIGH','MEDIUM','LOW'),t.due_at IS NULL,t.due_at,t.id DESC`,
    params,
  );
  return rows.map((x) => ({
    ...x,
    overdue: isOverdue({
      status: x.status,
      dueAt: x.due_at,
      submittedAt: x.submitted_at,
      completedAt: x.completed_at,
    }),
  }));
}
export async function get(id, user) {
  const [[task]] = await pool.execute(`${select} WHERE t.id=?`, [id]);
  if (!task) throw new ApiError(404, "Task not found");
  const all = await getEffectivePermission(user.id, "task.view_all");
  if (
    !all &&
    (Number(task.assignee_employee_id) !== Number(user.employee_id) ||
      ["DRAFT", "SCHEDULED"].includes(task.status)) &&
    !(task.assignment_type === "OPEN" && task.status === "OPEN")
  )
    throw new ApiError(403, "You cannot view this task");
  const [activities] = await pool.execute(
    "SELECT ta.*,CONCAT(e.first_name,' ',e.last_name) actor FROM task_activities ta LEFT JOIN users u ON u.id=ta.actor_user_id LEFT JOIN employees e ON e.id=u.employee_id WHERE ta.task_id=? ORDER BY ta.created_at DESC,ta.id DESC",
    [id],
  );
  const [comments] = await pool.execute(
    "SELECT tc.id,tc.content,tc.created_at createdAt,CONCAT(e.first_name,' ',e.last_name) author FROM task_comments tc JOIN users u ON u.id=tc.author_user_id LEFT JOIN employees e ON e.id=u.employee_id WHERE tc.task_id=? ORDER BY tc.created_at",
    [id],
  );
  const [images] = await pool.execute(
    "SELECT ti.id,ti.image_context context,ti.original_filename originalFilename,ti.mime_type mimeType,ti.size_bytes sizeBytes,ti.created_at createdAt,CONCAT(e.first_name,' ',e.last_name) uploadedBy FROM task_images ti JOIN users u ON u.id=ti.uploaded_by LEFT JOIN employees e ON e.id=u.employee_id WHERE ti.task_id=? ORDER BY ti.created_at,ti.id",
    [id],
  );
  const [[changeRequest]] = await pool.execute(
    "SELECT cr.id,cr.reason,cr.previous_due_at previousDueAt,cr.revision_due_at revisionDueAt,cr.created_at requestedAt,CONCAT(e.first_name,' ',e.last_name) requestedBy FROM task_change_requests cr JOIN users u ON u.id=cr.requested_by LEFT JOIN employees e ON e.id=u.employee_id WHERE cr.task_id=? ORDER BY cr.id DESC LIMIT 1",
    [id],
  );
  return {
    ...task,
    overdue: isOverdue({
      status: task.status,
      dueAt: task.due_at,
      submittedAt: task.submitted_at,
      completedAt: task.completed_at,
    }),
    activities,
    comments,
    images,
    changeRequest: changeRequest || null,
  };
}
export async function claim(id, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (
      task.assignment_type !== "OPEN" ||
      task.status !== "OPEN" ||
      task.assignee_employee_id
    )
      throw new ApiError(
        409,
        "This task has already been claimed by another employee.",
      );
    await eligibleAssignee(c, user.employee_id);
    await c.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
      user.employee_id,
    ]);
    const [[settings]] = await c.execute(
      "SELECT max_open_claims_per_employee claimLimit FROM task_settings WHERE id=1",
    );
    const [[count]] = await c.execute(
      "SELECT COUNT(*) total FROM task_assignment_history h JOIN tasks t ON t.id=h.task_id WHERE h.new_employee_id=? AND h.assignment_source='CLAIM' AND t.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')",
      [user.employee_id],
    );
    if (Number(count.total) >= Number(settings.claimLimit))
      throw new ApiError(409, "You have reached your Open Task claim limit.");
    await c.execute(
      "UPDATE tasks SET assignee_employee_id=?,status='TO_DO',updated_by=? WHERE id=?",
      [user.employee_id, user.id, id],
    );
    await c.execute(
      "INSERT INTO task_assignment_history(task_id,new_employee_id,changed_by,assignment_source)VALUES(?,?,?,'CLAIM')",
      [id, user.employee_id, user.id],
    );
    await activity(c, id, "TASK_CLAIMED", user, "OPEN", "TO_DO");
    await audit(c, id, "TASK_CLAIMED", user, `${task.title} was claimed.`);
    return { id: Number(id), status: "TO_DO" };
  });
}
export async function getClaimStatus(user) {
  const [[settings]] = await pool.execute(
    "SELECT max_open_claims_per_employee claimLimit FROM task_settings WHERE id=1",
  );
  const [[count]] = await pool.execute(
    "SELECT COUNT(*) claimed FROM task_assignment_history h JOIN tasks t ON t.id=h.task_id WHERE h.new_employee_id=? AND h.assignment_source='CLAIM' AND t.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')",
    [user.employee_id],
  );
  return {
    claimed: Number(count.claimed),
    limit: Number(settings.claimLimit),
    reached: Number(count.claimed) >= Number(settings.claimLimit),
  };
}
export async function transition(id, data, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    const manage = await getEffectivePermission(user.id, "task.manage", c);
    if (
      !manage &&
      Number(task.assignee_employee_id) !== Number(user.employee_id)
    )
      throw new ApiError(
        403,
        "You do not have permission to update this task.",
      );
    assertTransition(task.status, data.status, {
      management: manage,
      reviewRequired: Boolean(task.review_required),
    });
    if (data.status === "CHANGES_REQUIRED" && !data.reason)
      throw new ApiError(400, "Reason for changes is required.");
    if (data.status === "IN_PROGRESS") {
      const [[leave]] = await c.execute(
        "SELECT 1 present FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=? AND ld.leave_date=CURRENT_DATE AND lr.status='APPROVED' LIMIT 1",
        [task.assignee_employee_id],
      );
      if (leave)
        throw new ApiError(
          409,
          "You cannot start a task while you are on approved leave.",
        );
      const [[attendance]] = await c.execute(
        "SELECT id,status FROM attendance_records WHERE employee_id=? AND status='WORKING' ORDER BY id DESC LIMIT 1",
        [task.assignee_employee_id],
      );
      if (!attendance)
        throw new ApiError(409, "Clock in before starting this task.");
      const [[active]] = await c.execute(
        "SELECT task_id FROM task_work_sessions WHERE employee_id=? AND state='ACTIVE' AND task_id<>? LIMIT 1",
        [task.assignee_employee_id, id],
      );
      if (active)
        throw new ApiError(409, "You already have another active task.");
      try {
        await c.execute(
          "INSERT INTO task_work_sessions(task_id,employee_id,started_at)VALUES(?,?,CURRENT_TIMESTAMP)",
          [id, task.assignee_employee_id],
        );
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY")
          throw new ApiError(409, "You already have another active task.");
        throw error;
      }
    }
    if (
      !manage &&
      task.completion_image_required &&
      ["COMPLETED", "SUBMITTED_FOR_REVIEW"].includes(data.status)
    ) {
      const [[images]] = await c.execute(
        "SELECT COUNT(*) total FROM task_images WHERE task_id=? AND image_context='SUBMISSION'",
        [id],
      );
      if (!Number(images.total))
        throw new ApiError(
          400,
          "At least one completion image is required for this task.",
        );
    }
    if (task.status === "IN_PROGRESS")
      await c.execute(
        "UPDATE task_work_sessions SET state='ENDED',ended_at=CURRENT_TIMESTAMP,duration_seconds=TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP),end_reason=? WHERE task_id=? AND state='ACTIVE'",
        [data.status === "COMPLETED" ? "COMPLETED" : "SUBMITTED", id],
      );
    if (data.status === "CHANGES_REQUIRED")
      await c.execute(
        "INSERT INTO task_change_requests(task_id,requested_by,reason,previous_due_at,revision_due_at)VALUES(?,?,?,?,?)",
        [id, user.id, data.reason, task.due_at, dbDate(data.revisionDueAt)],
      );
    await c.execute(
      `UPDATE tasks SET status=?,submitted_at=IF(?='SUBMITTED_FOR_REVIEW',CURRENT_TIMESTAMP,submitted_at),completed_at=IF(?='COMPLETED',CURRENT_TIMESTAMP,completed_at),archived_at=IF(?='ARCHIVED',CURRENT_TIMESTAMP,IF(?='COMPLETED',NULL,archived_at)),due_at=COALESCE(?,due_at),updated_by=? WHERE id=?`,
      [
        data.status,
        data.status,
        data.status,
        data.status,
        data.status,
        dbDate(data.revisionDueAt),
        user.id,
        id,
      ],
    );
    await activity(
      c,
      id,
      `TASK_${data.status}`,
      user,
      task.status,
      data.status,
      {
        reason: data.reason || null,
        revisionDueAt: data.revisionDueAt || null,
      },
    );
    await audit(
      c,
      id,
      "TASK_STATUS_CHANGED",
      user,
      `${task.title} changed from ${task.status} to ${data.status}.`,
      data,
    );
    return { id: Number(id), status: data.status };
  });
}
export async function addComment(id, content, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    const manage = await getEffectivePermission(user.id, "task.manage", c);
    if (
      !manage &&
      Number(task.assignee_employee_id) !== Number(user.employee_id)
    )
      throw new ApiError(403, "You cannot comment on this task");
    const [r] = await c.execute(
      "INSERT INTO task_comments(task_id,author_user_id,content)VALUES(?,?,?)",
      [id, user.id, content],
    );
    await activity(c, id, "COMMENT_ADDED", user, task.status, task.status, {
      commentId: r.insertId,
    });
    return { id: r.insertId };
  });
}
export async function addImage(id, data, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    const manage = await getEffectivePermission(user.id, "task.manage", c);
    if (
      !manage &&
      Number(task.assignee_employee_id) !== Number(user.employee_id)
    )
      throw new ApiError(403, "You cannot add images to this task");
    const [[n]] = await c.execute(
      "SELECT COUNT(*) total FROM task_images WHERE task_id=? AND image_context=?",
      [id, data.context],
    );
    if (Number(n.total) >= 5)
      throw new ApiError(400, "Maximum 5 images per context");
    const [r] = await c.execute(
      "INSERT INTO task_images(task_id,uploaded_by,image_context,storage_key,original_filename,mime_type,size_bytes)VALUES(?,?,?,?,?,?,?)",
      [
        id,
        user.id,
        data.context,
        data.storageKey,
        data.originalFilename,
        data.mimeType,
        data.sizeBytes,
      ],
    );
    await activity(c, id, "IMAGE_ADDED", user, task.status, task.status, {
      imageId: r.insertId,
      context: data.context,
    });
    return { id: r.insertId };
  });
}
export async function getSettings() {
  const [[row]] = await pool.execute(
    "SELECT offline_timeout_minutes offlineTimeoutMinutes,max_open_claims_per_employee maxOpenClaimsPerEmployee FROM task_settings WHERE id=1",
  );
  return row;
}
export async function updateSettings(data, user) {
  await pool.execute(
    "UPDATE task_settings SET offline_timeout_minutes=?,max_open_claims_per_employee=?,updated_by=? WHERE id=1",
    [data.offlineTimeoutMinutes, data.maxOpenClaimsPerEmployee, user.id],
  );
  return getSettings();
}
export async function employeeAvailability(id) {
  const [[e]] = await pool.execute(
    `SELECT e.id,e.status,EXISTS(SELECT 1 FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=e.id AND ld.leave_date=CURRENT_DATE AND lr.status='APPROVED') onLeave,EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.employee_id=e.id AND ar.status IN('WORKING','ON_BREAK')) online,EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.employee_id=e.id AND ar.status='ON_BREAK') onBreak,CASE WHEN ws.id IS NULL THEN TRUE WHEN ws.end_time>ws.start_time THEN CURRENT_TIME BETWEEN ws.start_time AND ws.end_time ELSE CURRENT_TIME>=ws.start_time OR CURRENT_TIME<=ws.end_time END withinShift FROM employees e LEFT JOIN employee_shift_assignments esa ON esa.employee_id=e.id AND esa.status='ACTIVE' AND esa.effective_from<=CURRENT_DATE AND(esa.effective_to IS NULL OR esa.effective_to>=CURRENT_DATE) LEFT JOIN work_shifts ws ON ws.id=esa.shift_id WHERE e.id=? ORDER BY esa.effective_from DESC LIMIT 1`,
    [id],
  );
  if (!e) throw new ApiError(404, "Employee not found");
  return {
    ...e,
    onLeave: Boolean(e.onLeave),
    online: Boolean(e.online),
    onBreak: Boolean(e.onBreak),
    withinShift: Boolean(e.withinShift),
  };
}
export async function permanentlyDelete(id, user) {
  const root = path.resolve(
      new URL("../../uploads/tasks", import.meta.url).pathname,
    ),
    source = path.join(root, String(id)),
    trash = path.join(root, `.deleting-${id}-${randomUUID()}`);
  let moved = false;
  try {
    await rename(source, trash);
    moved = true;
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new ApiError(500, "Unable to prepare task image cleanup");
  }
  try {
    const result = await tx(async (c) => {
      const [[task]] = await c.execute(
        "SELECT * FROM tasks WHERE id=? FOR UPDATE",
        [id],
      );
      if (!task) throw new ApiError(404, "Task not found");
      if (!["DRAFT", "SCHEDULED", "ARCHIVED"].includes(task.status))
        throw new ApiError(
          409,
          "Only draft, scheduled, or archived tasks can be permanently deleted",
        );
      await c.execute(
        "INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description,old_values)VALUES(?,?,'TASK_DELETED','TASK',?,?,?)",
        [
          user.id,
          user.employee_id,
          id,
          `${task.title} was permanently deleted.`,
          JSON.stringify({ title: task.title, status: task.status }),
        ],
      );
      await c.execute("DELETE FROM tasks WHERE id=?", [id]);
      return { deleted: true };
    });
    if (moved) await rm(trash, { recursive: true, force: true });
    return result;
  } catch (error) {
    if (moved) await rename(trash, source).catch(() => {});
    throw error;
  }
}
export async function assign(id, data, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (
      ![
        "TO_DO",
        "IN_PROGRESS",
        "SUBMITTED_FOR_REVIEW",
        "CHANGES_REQUIRED",
      ].includes(task.status)
    )
      throw new ApiError(409, "This task is not eligible for reassignment");
    await eligibleAssignee(c, data.employeeId);
    const started = [
      "IN_PROGRESS",
      "SUBMITTED_FOR_REVIEW",
      "CHANGES_REQUIRED",
    ].includes(task.status);
    if (started && !data.reason)
      throw new ApiError(
        400,
        "A reassignment reason is required after work has started",
      );
    await c.execute(
      "UPDATE task_work_sessions SET state='ENDED',ended_at=CURRENT_TIMESTAMP,duration_seconds=TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP),end_reason='REASSIGNED' WHERE task_id=? AND state='ACTIVE'",
      [id],
    );
    await c.execute(
      "UPDATE tasks SET assignee_employee_id=?,assignment_type='DIRECT',status='TO_DO',updated_by=? WHERE id=?",
      [data.employeeId, user.id, id],
    );
    await c.execute(
      "INSERT INTO task_assignment_history(task_id,previous_employee_id,new_employee_id,changed_by,reason,assignment_source)VALUES(?,?,?,?,?,'REASSIGN')",
      [
        id,
        task.assignee_employee_id,
        data.employeeId,
        user.id,
        data.reason || null,
      ],
    );
    await activity(c, id, "TASK_REASSIGNED", user, task.status, "TO_DO", {
      previousEmployeeId: task.assignee_employee_id,
      newEmployeeId: data.employeeId,
      reason: data.reason || null,
      previousStatus: task.status,
    });
    await audit(
      c,
      id,
      "TASK_REASSIGNED",
      user,
      `${task.title} was reassigned.`,
      data,
    );
    return { id: Number(id), employeeId: data.employeeId, status: "TO_DO" };
  });
}
export async function duplicate(id, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute("SELECT * FROM tasks WHERE id=?", [id]);
    if (!task) throw new ApiError(404, "Task not found");
    const [r] = await c.execute(
      `INSERT INTO tasks(title,description,instructions,priority,assignment_type,status,publish_mode,review_required,completion_image_required,created_by,updated_by)VALUES(?,?,?,?,?,'DRAFT','DRAFT',?,?,?,?)`,
      [
        task.title,
        task.description,
        task.instructions,
        task.priority,
        task.assignment_type,
        task.review_required,
        task.completion_image_required,
        user.id,
        user.id,
      ],
    );
    await activity(c, r.insertId, "DRAFT_CREATED", user, null, "DRAFT", {
      duplicatedFrom: Number(id),
    });
    await audit(
      c,
      r.insertId,
      "TASK_CREATED",
      user,
      `${task.title} was duplicated as a draft.`,
      { duplicatedFrom: Number(id) },
    );
    return { id: r.insertId, status: "DRAFT" };
  });
}
export async function listAssignableEmployees() {
  const [rows] = await pool.execute(
    `SELECT e.id,CONCAT(e.first_name,' ',e.last_name) name,e.department,e.job_title jobTitle FROM employees e JOIN users u ON u.employee_id=e.id WHERE e.status='ACTIVE' AND u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN')) ORDER BY e.first_name,e.last_name`,
  );
  return Promise.all(
    rows.map(async (e) => ({
      ...e,
      availability: await employeeAvailability(e.id),
    })),
  );
}
function publicationStatus(task) {
  if (task.assignment_type === "DIRECT") {
    if (!task.assignee_employee_id)
      throw new ApiError(400, "Direct tasks require one assignee");
    return "TO_DO";
  }
  return "OPEN";
}
export async function update(id, data, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (!["DRAFT", "SCHEDULED", "OPEN", "TO_DO"].includes(task.status))
      throw new ApiError(409, "Task definition is locked after work starts");
    const assignmentType = data.assignmentType ?? task.assignment_type,
      assignee =
        data.assigneeEmployeeId === undefined
          ? task.assignee_employee_id
          : data.assigneeEmployeeId;
    if (
      ["OPEN", "TO_DO"].includes(task.status) &&
      (assignmentType !== task.assignment_type ||
        Number(assignee || 0) !== Number(task.assignee_employee_id || 0))
    )
      throw new ApiError(
        409,
        "Use Reassign Task to change assignment after publication",
      );
    if (assignmentType === "OPEN" && assignee)
      throw new ApiError(400, "Open tasks cannot have an assignee");
    if (assignee) await eligibleAssignee(c, assignee);
    const fields = {
      title: "title",
      description: "description",
      instructions: "instructions",
      priority: "priority",
      assignmentType: "assignment_type",
      assigneeEmployeeId: "assignee_employee_id",
      startAt: "start_at",
      dueAt: "due_at",
      scheduledPublishAt: "scheduled_publish_at",
      reviewRequired: "review_required",
      completionImageRequired: "completion_image_required",
    };
    const entries = Object.entries(data).filter(([key]) => fields[key]);
    if (entries.length) {
      await c.execute(
        `UPDATE tasks SET ${entries.map(([key]) => `${fields[key]}=?`).join(",")},updated_by=? WHERE id=?`,
        [
          ...entries.map(([key, value]) =>
            ["startAt", "dueAt", "scheduledPublishAt"].includes(key)
              ? dbDate(value)
              : value,
          ),
          user.id,
          id,
        ],
      );
    }
    await activity(c, id, "TASK_UPDATED", user, task.status, task.status);
    return { id: Number(id), status: task.status };
  });
}
export async function publish(id, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (!["DRAFT", "SCHEDULED"].includes(task.status))
      throw new ApiError(409, "Only draft or scheduled tasks can be published");
    const status = publicationStatus(task);
    await c.execute(
      "UPDATE tasks SET status=?,publish_mode='NOW',scheduled_publish_at=NULL,published_at=CURRENT_TIMESTAMP,updated_by=? WHERE id=?",
      [status, user.id, id],
    );
    await activity(c, id, "TASK_PUBLISHED", user, task.status, status);
    await audit(
      c,
      id,
      "TASK_STATUS_CHANGED",
      user,
      `${task.title} was published.`,
      { status },
    );
    return { id: Number(id), status };
  });
}
export async function schedule(id, scheduledPublishAt, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (!["DRAFT", "SCHEDULED"].includes(task.status))
      throw new ApiError(409, "Only draft or scheduled tasks can be scheduled");
    publicationStatus(task);
    if (
      task.due_at &&
      new Date(scheduledPublishAt) >=
        new Date(`${task.due_at.replace(" ", "T")}+05:00`)
    )
      throw new ApiError(
        400,
        "Scheduled publish time must be before the task due time",
      );
    await c.execute(
      "UPDATE tasks SET status='SCHEDULED',publish_mode='SCHEDULED',scheduled_publish_at=?,updated_by=? WHERE id=?",
      [dbDate(scheduledPublishAt), user.id, id],
    );
    await activity(
      c,
      id,
      task.status === "SCHEDULED" ? "TASK_RESCHEDULED" : "TASK_SCHEDULED",
      user,
      task.status,
      "SCHEDULED",
      { scheduledPublishAt },
    );
    return { id: Number(id), status: "SCHEDULED" };
  });
}
export async function cancelSchedule(id, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (task.status !== "SCHEDULED")
      throw new ApiError(409, "Task is not scheduled");
    await c.execute(
      "UPDATE tasks SET status='DRAFT',publish_mode='DRAFT',scheduled_publish_at=NULL,updated_by=? WHERE id=?",
      [user.id, id],
    );
    await activity(
      c,
      id,
      "TASK_SCHEDULE_CANCELLED",
      user,
      "SCHEDULED",
      "DRAFT",
    );
    return { id: Number(id), status: "DRAFT" };
  });
}
export async function uploadReferenceImage(id, file, buffer, user) {
  const uploadRoot = path.resolve(
      new URL("../../uploads", import.meta.url).pathname,
    ),
    dir = path.join(uploadRoot, "tasks", String(id));
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${file.extension}`,
    full = path.join(dir, filename),
    storageKey = `/uploads/tasks/${id}/${filename}`;
  await writeFile(full, buffer);
  try {
    const result = await addImage(
      id,
      {
        context: "TASK_REFERENCE",
        storageKey,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
      user,
    );
    return { ...result, url: storageKey };
  } catch (error) {
    await unlink(full).catch(() => {});
    throw error;
  }
}
export async function uploadSubmissionImage(id, file, buffer, user) {
  const [[task]] = await pool.execute(
    "SELECT assignee_employee_id,status FROM tasks WHERE id=?",
    [id],
  );
  if (!task) throw new ApiError(404, "Task not found");
  if (Number(task.assignee_employee_id) !== Number(user.employee_id))
    throw new ApiError(
      403,
      "You cannot upload completion images for this task.",
    );
  if (task.status !== "IN_PROGRESS")
    throw new ApiError(
      409,
      "Completion images can only be added while a task is in progress.",
    );
  const uploadRoot = path.resolve(
      new URL("../../uploads", import.meta.url).pathname,
    ),
    dir = path.join(uploadRoot, "tasks", String(id));
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${file.extension}`,
    full = path.join(dir, filename),
    storageKey = `/uploads/tasks/${id}/${filename}`;
  await writeFile(full, buffer);
  try {
    const result = await addImage(
      id,
      {
        context: "SUBMISSION",
        storageKey,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
      user,
    );
    return { ...result, url: storageKey };
  } catch (error) {
    await unlink(full).catch(() => {});
    throw error;
  }
}
export async function uploadChangesImage(id, file, buffer, user) {
  const [[task]] = await pool.execute("SELECT status FROM tasks WHERE id=?", [
    id,
  ]);
  if (!task) throw new ApiError(404, "Task not found");
  if (!["SUBMITTED_FOR_REVIEW", "COMPLETED"].includes(task.status))
    throw new ApiError(
      409,
      "Changes Required references can only be added during review or reopening.",
    );
  if (!(await getEffectivePermission(user.id, "task.review")))
    throw new ApiError(403, "You cannot review this task.");
  const uploadRoot = path.resolve(
      new URL("../../uploads", import.meta.url).pathname,
    ),
    dir = path.join(uploadRoot, "tasks", String(id));
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${file.extension}`,
    full = path.join(dir, filename),
    storageKey = `/uploads/tasks/${id}/${filename}`;
  await writeFile(full, buffer);
  try {
    const result = await addImage(
      id,
      {
        context: "CHANGES_REQUIRED",
        storageKey,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
      user,
    );
    return { ...result };
  } catch (error) {
    await unlink(full).catch(() => {});
    throw error;
  }
}
export async function getImageContent(taskId, imageId, user) {
  await get(taskId, user);
  const [[image]] = await pool.execute(
    "SELECT storage_key storageKey,mime_type mimeType,original_filename originalFilename FROM task_images WHERE id=? AND task_id=?",
    [imageId, taskId],
  );
  if (!image) throw new ApiError(404, "Image not found");
  if (!image.storageKey.startsWith("/uploads/tasks/"))
    throw new ApiError(404, "Image file is unavailable");
  const root = path.resolve(new URL("../../uploads", import.meta.url).pathname),
    full = path.resolve(root, image.storageKey.replace("/uploads/", ""));
  if (!full.startsWith(`${root}${path.sep}`))
    throw new ApiError(403, "Invalid image path");
  try {
    return { ...image, buffer: await readFile(full) };
  } catch {
    throw new ApiError(404, "Image file is unavailable");
  }
}
export async function removeImage(taskId, imageId, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT status FROM tasks WHERE id=? FOR UPDATE",
      [taskId],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (!["DRAFT", "SCHEDULED"].includes(task.status))
      throw new ApiError(
        409,
        "Reference images can only be removed before publication",
      );
    const [[item]] = await c.execute(
      "SELECT storage_key FROM task_images WHERE id=? AND task_id=? AND image_context='TASK_REFERENCE'",
      [imageId, taskId],
    );
    if (!item) throw new ApiError(404, "Image not found");
    await c.execute("DELETE FROM task_images WHERE id=?", [imageId]);
    if (item.storage_key.startsWith("/uploads/"))
      await unlink(
        path.resolve(
          new URL("../../uploads", import.meta.url).pathname,
          item.storage_key.replace("/uploads/", ""),
        ),
      ).catch(() => {});
    return { deleted: true };
  });
}
export async function publishDueScheduled() {
  return tx(async (c) => {
    const [rows] = await c.execute(
      "SELECT * FROM tasks WHERE status='SCHEDULED' AND scheduled_publish_at<=CURRENT_TIMESTAMP FOR UPDATE",
    );
    for (const task of rows) {
      const status = publicationStatus(task);
      await c.execute(
        "UPDATE tasks SET status=?,publish_mode='NOW',scheduled_publish_at=NULL,published_at=CURRENT_TIMESTAMP WHERE id=?",
        [status, task.id],
      );
      await c.execute(
        "INSERT INTO task_activities(task_id,event_type,previous_status,new_status,metadata)VALUES(?,'TASK_AUTO_PUBLISHED','SCHEDULED',?,?)",
        [task.id, status, JSON.stringify({ scheduled: true })],
      );
    }
    return rows.length;
  });
}
export async function listManagement(filters) {
  const where = [],
    params = [];
  if (filters.search) {
    where.push("(t.title LIKE ? OR t.id=?)");
    params.push(`%${filters.search}%`, Number(filters.search) || 0);
  }
  if (filters.priority) {
    where.push("t.priority=?");
    params.push(filters.priority);
  }
  if (filters.status) {
    where.push("t.status=?");
    params.push(filters.status);
  } else where.push("t.status<>'ARCHIVED'");
  if (filters.employeeId) {
    where.push("t.assignee_employee_id=?");
    params.push(filters.employeeId);
  }
  if (filters.from) {
    where.push("t.due_at>=?");
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    where.push("t.due_at<DATE_ADD(?,INTERVAL 1 DAY)");
    params.push(filters.to);
  }
  if (filters.overdue)
    where.push(
      "t.due_at<CURRENT_TIMESTAMP AND t.status NOT IN('COMPLETED','ARCHIVED')",
    );
  const clause = where.length ? ` WHERE ${where.join(" AND ")}` : "",
    offset = (filters.page - 1) * filters.limit;
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM tasks t${clause}`,
    params,
  );
  const [items] = await pool.execute(
    `${select}${clause} ORDER BY t.updated_at DESC,t.id DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset],
  );
  return {
    items: items.map((x) => ({
      ...x,
      overdue: isOverdue({
        status: x.status,
        dueAt: x.due_at,
        submittedAt: x.submitted_at,
        completedAt: x.completed_at,
      }),
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: Number(count.total),
      pages: Math.max(1, Math.ceil(Number(count.total) / filters.limit)),
    },
  };
}
export async function changeDeadline(id, data, user) {
  return tx(async (c) => {
    const [[task]] = await c.execute(
      "SELECT * FROM tasks WHERE id=? FOR UPDATE",
      [id],
    );
    if (!task) throw new ApiError(404, "Task not found");
    if (["DRAFT", "SCHEDULED", "ARCHIVED"].includes(task.status))
      throw new ApiError(409, "Use task editing to change this deadline");
    const next = dbDate(data.dueAt);
    await c.execute("UPDATE tasks SET due_at=?,updated_by=? WHERE id=?", [
      next,
      user.id,
      id,
    ]);
    await activity(
      c,
      id,
      "TASK_DEADLINE_CHANGED",
      user,
      task.status,
      task.status,
      {
        previousDueAt: task.due_at,
        newDueAt: data.dueAt,
        reason: data.reason || null,
      },
    );
    await audit(
      c,
      id,
      "TASK_DEADLINE_CHANGED",
      user,
      `${task.title} deadline changed.`,
      {
        previousDueAt: task.due_at,
        newDueAt: data.dueAt,
        reason: data.reason || null,
      },
    );
    return { id: Number(id), dueAt: data.dueAt };
  });
}
export async function bulk(data, user) {
  const results = [];
  for (const id of data.taskIds) {
    try {
      if (data.action === "PRIORITY")
        await update(id, { priority: data.priority }, user);
      else if (data.action === "REASSIGN") {
        const [[task]] = await pool.execute(
          "SELECT status FROM tasks WHERE id=?",
          [id],
        );
        if (task?.status !== "TO_DO")
          throw new ApiError(409, "Only To Do tasks support bulk reassignment");
        await assign(id, { employeeId: data.employeeId }, user);
      } else if (data.action === "ARCHIVE") {
        const [[task]] = await pool.execute(
          "SELECT status FROM tasks WHERE id=?",
          [id],
        );
        if (task?.status !== "COMPLETED")
          throw new ApiError(409, "Only Completed tasks can be archived");
        await transition(id, { status: "ARCHIVED" }, user);
      } else await permanentlyDelete(id, user);
      results.push({ id, success: true });
    } catch (error) {
      results.push({
        id,
        success: false,
        reason: error.message || "Not eligible",
      });
    }
  }
  return {
    updated: results.filter((x) => x.success).length,
    skipped: results.filter((x) => !x.success).length,
    results,
  };
}
