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
import { notifyByPolicy, notifyUser } from "./notification.service.js";
import {
  endTaskSession,
  getTaskTimeTracking,
  startTaskSession,
} from "./taskTime.service.js";
const select = `SELECT t.*,CONCAT(a.first_name,' ',a.last_name) assigneeName,CONCAT(c.first_name,' ',c.last_name) creatorName,(SELECT COUNT(*) FROM task_images ti WHERE ti.task_id=t.id) imageCount,(SELECT COUNT(*) FROM task_images ti WHERE ti.task_id=t.id AND ti.image_context='SUBMISSION') submissionImageCount,(SELECT reason FROM task_change_requests cr WHERE cr.task_id=t.id ORDER BY cr.id DESC LIMIT 1) changeReason,(SELECT revision_due_at FROM task_change_requests cr WHERE cr.task_id=t.id ORDER BY cr.id DESC LIMIT 1) revisionDueAt,(SELECT COALESCE(SUM(CASE WHEN tws.state='ACTIVE' THEN GREATEST(0,TIMESTAMPDIFF(SECOND,tws.started_at,CURRENT_TIMESTAMP)) ELSE COALESCE(tws.duration_seconds,0) END),0) FROM task_work_sessions tws WHERE tws.task_id=t.id) timeSpentSeconds,(SELECT started_at FROM task_work_sessions tws WHERE tws.task_id=t.id AND tws.state='ACTIVE' LIMIT 1) activeSessionStartedAt,(SELECT end_reason FROM task_work_sessions tws WHERE tws.task_id=t.id AND tws.state='ENDED' ORDER BY tws.ended_at DESC,tws.id DESC LIMIT 1) lastSessionEndReason,CURRENT_TIMESTAMP serverTime FROM tasks t LEFT JOIN employees a ON a.id=t.assignee_employee_id JOIN users cu ON cu.id=t.created_by LEFT JOIN employees c ON c.id=cu.employee_id`;
async function tx(fn) {
  const c = await pool.getConnection();
  const afterCommit=[];
  c.afterCommit=afterCommit;
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    const deliveries=await Promise.allSettled(afterCommit.map(deliver=>deliver()));
    for(const delivery of deliveries)if(delivery.status==="rejected")console.error("[TASK_NOTIFICATION]",delivery.reason);
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
const afterCommit=(c,deliver)=>c.afterCommit.push(deliver);
const taskNotification=(eventType,actor,task,{title,message,recipientUserIds}={})=>notifyByPolicy(eventType,actor,{title,message,recipientUserIds,referenceType:"TASK",referenceId:Number(task.id),actionUrl:`/tasks?task=${task.id}`,eventKey:`${eventType}:${task.id}`,priority:["TASK_OVERDUE","TASK_CHANGES_REQUIRED"].includes(eventType)?"WARNING":"NORMAL"});
async function eligibleOpenTaskUsers(){
  const [users]=await pool.execute(`SELECT DISTINCT u.id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN'))`);
  const allowed=[];for(const user of users)if(await getEffectivePermission(user.id,"task.view_own"))allowed.push(Number(user.id));return allowed;
}
async function assigneeUserId(employeeId){if(!employeeId)return null;const[[user]]=await pool.execute("SELECT id FROM users WHERE employee_id=? AND status='ACTIVE' LIMIT 1",[employeeId]);return user?.id?Number(user.id):null;}
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
    const created={id:r.insertId,status,title:data.title,assigneeEmployeeId:data.assigneeEmployeeId};
    if(status==="OPEN")afterCommit(c,async()=>taskNotification("OPEN_TASK_CREATED",actor,created,{title:"New Open Task",message:`A new open task is available: “${data.title}”.`,recipientUserIds:await eligibleOpenTaskUsers()}));
    if(status==="TO_DO"&&data.assigneeEmployeeId)afterCommit(c,async()=>{const[[recipient]]=await pool.execute("SELECT id FROM users WHERE employee_id=? AND status='ACTIVE' LIMIT 1",[data.assigneeEmployeeId]);return recipient&&taskNotification("TASK_ASSIGNED",actor,created,{title:"New Task Assigned",message:`You have been assigned: “${data.title}”.`,recipientUserIds:[recipient.id]})});
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
  return addUnread(rows.map((x) => ({
    ...x,
    overdue: isOverdue({
      status: x.status,
      dueAt: x.due_at,
      submittedAt: x.submitted_at,
      completedAt: x.completed_at,
    }),
  })),user.id);
}
async function addUnread(rows,userId){if(!rows.length)return rows;const ids=rows.map(x=>Number(x.id)),marks=ids.map(()=>"?").join(","),[counts]=await pool.execute(`SELECT a.task_id taskId,COUNT(*) unreadCount FROM task_activities a LEFT JOIN task_read_states r ON r.task_id=a.task_id AND r.user_id=? WHERE a.task_id IN(${marks}) AND COALESCE(a.actor_user_id,0)<>? AND a.created_at>COALESCE(r.last_read_at,'1970-01-01') GROUP BY a.task_id`,[userId,...ids,userId]);const byId=new Map(counts.map(x=>[Number(x.taskId),Number(x.unreadCount)]));return rows.map(x=>({...x,unreadCount:byId.get(Number(x.id))||0}));}
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
    "SELECT tc.id,tc.parent_comment_id parentCommentId,tc.author_user_id authorUserId,IF(tc.deleted_at IS NULL,tc.content,'Comment deleted') content,tc.created_at createdAt,tc.updated_at updatedAt,tc.deleted_at deletedAt,CONCAT(e.first_name,' ',e.last_name) author,e.job_title authorTitle FROM task_comments tc JOIN users u ON u.id=tc.author_user_id LEFT JOIN employees e ON e.id=u.employee_id WHERE tc.task_id=? ORDER BY tc.created_at,tc.id",
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
  const timeTracking = await getTaskTimeTracking(pool, id);
  timeTracking.lastEndReason = task.lastSessionEndReason || null;
  if (!all) timeTracking.contributors = [];
  const [attachments] = await pool.execute(
    "SELECT a.id,a.original_filename originalFilename,a.mime_type mimeType,a.size_bytes sizeBytes,a.created_at createdAt,a.uploaded_by uploadedByUserId,CONCAT(e.first_name,' ',e.last_name) uploadedBy FROM task_attachments a JOIN users u ON u.id=a.uploaded_by LEFT JOIN employees e ON e.id=u.employee_id WHERE a.task_id=? AND a.deleted_at IS NULL ORDER BY a.created_at DESC,a.id DESC",
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
    attachments,
    changeRequest: changeRequest || null,
    timeTracking,
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
    afterCommit(c,()=>taskNotification("TASK_CLAIMED",user,{id,title:task.title},{title:"Open Task Claimed",message:`${user.employee_name||"An employee"} claimed “${task.title}”.`}));
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
    const ownedWorkAction =
      Number(task.assignee_employee_id) === Number(user.employee_id) &&
      data.status === "IN_PROGRESS" &&
      ["TO_DO", "CHANGES_REQUIRED", "IN_PROGRESS"].includes(task.status);
    const resumingWork =
      ownedWorkAction && task.status !== "TO_DO";
    const resumingPausedWork =
      ownedWorkAction && task.status === "IN_PROGRESS";
    assertTransition(task.status, data.status, {
      management: manage && !ownedWorkAction,
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
        "SELECT id,status FROM attendance_records WHERE employee_id=? AND status IN('WORKING','ON_BREAK') ORDER BY id DESC LIMIT 1",
        [task.assignee_employee_id],
      );
      if (attendance?.status === "ON_BREAK")
        throw new ApiError(
          409,
          "End your break before starting or resuming a task.",
        );
      if (!attendance)
        throw new ApiError(
          409,
          resumingWork
            ? "Please clock in before resuming this task."
            : "Please clock in before starting a task.",
        );
      await startTaskSession(c, {
        taskId: id,
        employeeId: task.assignee_employee_id,
      });
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
    if (
      task.status === "IN_PROGRESS" &&
      ["COMPLETED", "SUBMITTED_FOR_REVIEW"].includes(data.status)
    )
      await endTaskSession(c, {
        taskId: id,
        employeeId: task.assignee_employee_id,
        reason: data.status === "COMPLETED" ? "COMPLETED" : "SUBMITTED",
      });
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
      resumingPausedWork ? "WORK_SESSION_RESUMED" : `TASK_${data.status}`,
      user,
      task.status,
      data.status,
      {
        reason: data.reason || null,
        revisionDueAt: data.revisionDueAt || null,
        note: data.note || null,
        ...(resumingPausedWork ? { reason: "MANUAL_RESUME" } : {}),
      },
    );
    await audit(
      c,
      id,
      resumingPausedWork ? "TASK_WORK_RESUMED" : "TASK_STATUS_CHANGED",
      user,
      resumingPausedWork
        ? `${task.title} work was resumed manually.`
        : `${task.title} changed from ${task.status} to ${data.status}.`,
      data,
    );
    const eventType=task.status==="COMPLETED"&&data.status==="CHANGES_REQUIRED"?"TASK_REOPENED":resumingWork?"TASK_RESUMED":data.status==="IN_PROGRESS"?"TASK_STARTED":data.status==="SUBMITTED_FOR_REVIEW"?"TASK_SUBMITTED":data.status==="CHANGES_REQUIRED"?"TASK_CHANGES_REQUIRED":data.status==="COMPLETED"?"TASK_COMPLETED":null;
    if(eventType)afterCommit(c,async()=>{const recipient=await assigneeUserId(task.assignee_employee_id);const employeeEvent=["TASK_RESUMED","TASK_CHANGES_REQUIRED","TASK_REOPENED"].includes(eventType);return taskNotification(eventType,user,{id,title:task.title},{title:eventType==="TASK_COMPLETED"?"Task Completed":eventType==="TASK_CHANGES_REQUIRED"?"Changes Required":eventType==="TASK_REOPENED"?"Task Reopened":eventType==="TASK_SUBMITTED"?"Task Submitted for Review":eventType==="TASK_STARTED"?"Task Started":"Task Resumed",message:`${user.employee_name||"An employee"} ${eventType==="TASK_COMPLETED"?"completed":eventType==="TASK_SUBMITTED"?"submitted":eventType==="TASK_STARTED"?"started":eventType==="TASK_RESUMED"?"resumed":eventType==="TASK_REOPENED"?"reopened":"must revise"} “${task.title}”.`,recipientUserIds:employeeEvent&&recipient?[recipient]:undefined})});
    return { id: Number(id), status: data.status };
  });
}
export async function addComment(id, data, user) {
  const result=await tx(async (c) => {
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
    if(data.parentCommentId){const [[parent]]=await c.execute("SELECT id,parent_comment_id FROM task_comments WHERE id=? AND task_id=? AND deleted_at IS NULL",[data.parentCommentId,id]);if(!parent)throw new ApiError(404,"Comment not found");if(parent.parent_comment_id)throw new ApiError(400,"Replies can only be nested one level");}
    const [r] = await c.execute(
      "INSERT INTO task_comments(task_id,author_user_id,parent_comment_id,content)VALUES(?,?,?,?)",
      [id, user.id, data.parentCommentId||null, data.content],
    );
    await activity(c, id, "COMMENT_ADDED", user, task.status, task.status, {
      commentId: r.insertId,parentCommentId:data.parentCommentId||null,
    });
    const recipients=new Set(data.mentionUserIds||[]);
    if(task.created_by!==user.id)recipients.add(Number(task.created_by));
    if(task.assignee_employee_id){const [[assignee]]=await c.execute("SELECT id FROM users WHERE employee_id=? AND status='ACTIVE' LIMIT 1",[task.assignee_employee_id]);if(assignee?.id!==user.id)recipients.add(Number(assignee.id));}
    if(data.parentCommentId){const [[parent]]=await c.execute("SELECT author_user_id id FROM task_comments WHERE id=?",[data.parentCommentId]);if(parent?.id!==user.id)recipients.add(Number(parent.id));}
    const allowed=[];for(const recipient of recipients){if(!recipient||recipient===user.id)continue;const [[candidate]]=await c.execute("SELECT u.id FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.id=? AND u.status='ACTIVE' AND (u.id=? OR e.id=? OR EXISTS(SELECT 1 FROM user_permissions up JOIN permissions p ON p.id=up.permission_id WHERE up.user_id=u.id AND p.name='task.view_all' AND up.granted=TRUE) OR EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=u.id AND p.name='task.view_all')) LIMIT 1",[recipient,task.created_by,task.assignee_employee_id]);if(candidate)allowed.push(recipient);}
    return {id:r.insertId,taskTitle:task.title,recipients:allowed,parentCommentId:data.parentCommentId||null,mentions:new Set(data.mentionUserIds||[])};
  });
  await notifyByPolicy("TASK_COMMENT",user,{recipientUserIds:result.recipients,title:result.parentCommentId?"New task reply":"New task comment",message:`${user.employee_name||"Someone"} commented on “${result.taskTitle}”`,referenceType:"TASK",referenceId:Number(id),actionUrl:`/tasks?task=${id}`,eventKey:`TASK_COMMENT:${result.id}`});
  return {id:result.id};
}

export async function editComment(taskId,commentId,content,user){return tx(async c=>{await assertTaskAccess(c,taskId,user);const [[row]]=await c.execute("SELECT * FROM task_comments WHERE id=? AND task_id=? AND deleted_at IS NULL FOR UPDATE",[commentId,taskId]);if(!row)throw new ApiError(404,"Comment not found");const manage=await getEffectivePermission(user.id,"task.manage",c);if(!manage&&Number(row.author_user_id)!==Number(user.id))throw new ApiError(403,"You cannot edit this comment");await c.execute("UPDATE task_comments SET content=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",[content,commentId]);await activity(c,taskId,"COMMENT_EDITED",user,null,null,{commentId:Number(commentId)});return{id:Number(commentId)};});}
export async function deleteComment(taskId,commentId,user){return tx(async c=>{await assertTaskAccess(c,taskId,user);const [[row]]=await c.execute("SELECT * FROM task_comments WHERE id=? AND task_id=? AND deleted_at IS NULL FOR UPDATE",[commentId,taskId]);if(!row)throw new ApiError(404,"Comment not found");const manage=await getEffectivePermission(user.id,"task.manage",c);if(!manage&&Number(row.author_user_id)!==Number(user.id))throw new ApiError(403,"You cannot delete this comment");await c.execute("UPDATE task_comments SET content='',deleted_at=CURRENT_TIMESTAMP WHERE id=?",[commentId]);await activity(c,taskId,"COMMENT_DELETED",user,null,null,{commentId:Number(commentId)});return{id:Number(commentId)};});}

async function assertTaskAccess(c,id,user){const [[task]]=await c.execute("SELECT * FROM tasks WHERE id=?",[id]);if(!task)throw new ApiError(404,"Task not found");const all=await getEffectivePermission(user.id,"task.view_all",c);if(!all&&Number(task.assignee_employee_id)!==Number(user.employee_id)&&!(task.assignment_type==='OPEN'&&task.status==='OPEN'))throw new ApiError(403,"You cannot view this task");return task;}
export async function mentionableUsers(id,search,user){const c=await pool.getConnection();try{const task=await assertTaskAccess(c,id,user),params=[task.created_by,task.assignee_employee_id,`%${search}%`,`%${search}%`];const [rows]=await c.execute("SELECT DISTINCT u.id,CONCAT(e.first_name,' ',e.last_name) name,e.job_title jobTitle FROM users u LEFT JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND (u.id=? OR e.id=? OR EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=u.id AND p.name='task.view_all')) AND (CONCAT(e.first_name,' ',e.last_name) LIKE ? OR e.job_title LIKE ?) ORDER BY name LIMIT 10",params);return rows;}finally{c.release();}}
export async function markTaskRead(id,user){return tx(async c=>{await assertTaskAccess(c,id,user);await c.execute("INSERT INTO task_read_states(task_id,user_id,last_read_at)VALUES(?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE last_read_at=CURRENT_TIMESTAMP",[id,user.id]);return{id:Number(id),read:true};});}
export async function uploadAttachment(id,file,buffer,user){const task=await tx(async c=>{const current=await assertTaskAccess(c,id,user);const folder=path.resolve(new URL(`../../uploads/tasks/${id}/attachments`,import.meta.url).pathname);await mkdir(folder,{recursive:true});const key=path.join(folder,`${randomUUID()}.${file.extension}`);await writeFile(key,buffer,{flag:"wx"});try{const[r]=await c.execute("INSERT INTO task_attachments(task_id,uploaded_by,storage_key,original_filename,mime_type,size_bytes)VALUES(?,?,?,?,?,?)",[id,user.id,key,file.originalFilename,file.mimeType,file.sizeBytes]);await activity(c,id,"ATTACHMENT_ADDED",user,current.status,current.status,{attachmentId:r.insertId,filename:file.originalFilename});return{id:r.insertId,title:current.title,creatorId:current.created_by,assigneeEmployeeId:current.assignee_employee_id};}catch(error){await unlink(key).catch(()=>{});throw error;}});const recipients=new Set([Number(task.creatorId)]);if(task.assigneeEmployeeId){const[[u]]=await pool.execute("SELECT id FROM users WHERE employee_id=? AND status='ACTIVE'",[task.assigneeEmployeeId]);if(u)recipients.add(Number(u.id));}recipients.delete(Number(user.id));await Promise.allSettled([...recipients].map(userId=>notifyUser({userId,type:"TASK_ATTACHMENT_ADDED",title:"Task attachment added",message:`${file.originalFilename} was added to “${task.title}”`,referenceType:"TASK",referenceId:Number(id),actionUrl:`/tasks?task=${id}`,eventKey:`TASK_ATTACHMENT:${task.id}:${userId}`,delivery:{desktop:false,sound:false}})));return{id:task.id};}
export async function getAttachmentContent(taskId,attachmentId,user){const c=await pool.getConnection();try{await assertTaskAccess(c,taskId,user);const[[file]]=await c.execute("SELECT storage_key,original_filename originalFilename,mime_type mimeType FROM task_attachments WHERE id=? AND task_id=? AND deleted_at IS NULL",[attachmentId,taskId]);if(!file)throw new ApiError(404,"Attachment not found");return{...file,buffer:await readFile(file.storage_key)};}finally{c.release();}}
export async function deleteAttachment(taskId,attachmentId,user){let key;await tx(async c=>{await assertTaskAccess(c,taskId,user);const[[file]]=await c.execute("SELECT * FROM task_attachments WHERE id=? AND task_id=? AND deleted_at IS NULL FOR UPDATE",[attachmentId,taskId]);if(!file)throw new ApiError(404,"Attachment not found");const manage=await getEffectivePermission(user.id,"task.manage",c);if(!manage&&Number(file.uploaded_by)!==Number(user.id))throw new ApiError(403,"You cannot delete this attachment");key=file.storage_key;await c.execute("UPDATE task_attachments SET deleted_at=CURRENT_TIMESTAMP WHERE id=?",[attachmentId]);await activity(c,taskId,"ATTACHMENT_DELETED",user,null,null,{attachmentId:Number(attachmentId),filename:file.original_filename});});try{await unlink(key);}catch(error){await pool.execute("UPDATE task_attachments SET deleted_at=NULL WHERE id=?",[attachmentId]);throw new ApiError(500,"Unable to delete attachment safely");}return{id:Number(attachmentId)};}
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
    `SELECT e.id,e.status,EXISTS(SELECT 1 FROM leave_days ld JOIN leave_requests lr ON lr.id=ld.leave_request_id WHERE ld.employee_id=e.id AND ld.leave_date=CURRENT_DATE AND lr.status='APPROVED') onLeave,EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.employee_id=e.id AND ar.status IN('WORKING','ON_BREAK')) online,EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.employee_id=e.id AND ar.status='ON_BREAK') onBreak,EXISTS(SELECT 1 FROM task_work_sessions tws WHERE tws.employee_id=e.id AND tws.state='ACTIVE') hasActiveTask,(SELECT COUNT(*) FROM tasks t WHERE t.assignee_employee_id=e.id AND t.status='TO_DO') todoWorkload,(SELECT COUNT(*) FROM tasks t WHERE t.assignee_employee_id=e.id AND t.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')) activeTaskCount,(SELECT COUNT(*) FROM tasks t WHERE t.assignee_employee_id=e.id AND t.due_at<CURRENT_TIMESTAMP AND t.status NOT IN('COMPLETED','ARCHIVED') AND NOT(t.status='SUBMITTED_FOR_REVIEW' AND t.submitted_at<=t.due_at)) overdueTaskCount,CASE WHEN ws.id IS NULL THEN TRUE WHEN ws.end_time>ws.start_time THEN CURRENT_TIME BETWEEN ws.start_time AND ws.end_time ELSE CURRENT_TIME>=ws.start_time OR CURRENT_TIME<=ws.end_time END withinShift FROM employees e LEFT JOIN employee_shift_assignments esa ON esa.employee_id=e.id AND esa.status='ACTIVE' AND esa.effective_from<=CURRENT_DATE AND(esa.effective_to IS NULL OR esa.effective_to>=CURRENT_DATE) LEFT JOIN work_shifts ws ON ws.id=esa.shift_id WHERE e.id=? ORDER BY esa.effective_from DESC LIMIT 1`,
    [id],
  );
  if (!e) throw new ApiError(404, "Employee not found");
  return {
    ...e,
    onLeave: Boolean(e.onLeave),
    online: Boolean(e.online),
    onBreak: Boolean(e.onBreak),
    hasActiveTask: Boolean(e.hasActiveTask),
    todoWorkload: Number(e.todoWorkload),
    activeTaskCount: Number(e.activeTaskCount),
    overdueTaskCount: Number(e.overdueTaskCount),
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
    await endTaskSession(c, {
      taskId: id,
      employeeId: task.assignee_employee_id,
      reason: "REASSIGNED",
      required: false,
    });
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
    afterCommit(c,async()=>{const recipient=await assigneeUserId(data.employeeId);return taskNotification("TASK_REASSIGNED",user,{id,title:task.title},{title:"Task Assigned to You",message:`“${task.title}” has been reassigned to you.`,recipientUserIds:recipient?[recipient]:[]})});
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
    const updateEvent=data.priority!==undefined?"TASK_PRIORITY_CHANGED":data.dueAt!==undefined?"TASK_DEADLINE_CHANGED":"TASK_UPDATED";
    afterCommit(c,async()=>{const recipient=await assigneeUserId(task.assignee_employee_id);return taskNotification(updateEvent,user,{id,title:data.title||task.title},{title:updateEvent==="TASK_PRIORITY_CHANGED"?"Task Priority Changed":updateEvent==="TASK_DEADLINE_CHANGED"?"Task Deadline Updated":"Task Updated",message:updateEvent==="TASK_PRIORITY_CHANGED"?`“${data.title||task.title}” priority changed to ${data.priority}.`:updateEvent==="TASK_DEADLINE_CHANGED"?`The deadline for “${data.title||task.title}” has changed.`:`Details for “${data.title||task.title}” were updated.`,recipientUserIds:recipient?[recipient]:[]})});
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
      const actor={id:task.created_by,employee_id:null};
      if(status==="OPEN")afterCommit(c,async()=>taskNotification("OPEN_TASK_CREATED",actor,task,{title:"New Open Task",message:`A new open task is available: “${task.title}”.`,recipientUserIds:await eligibleOpenTaskUsers()}));
      if(status==="TO_DO")afterCommit(c,async()=>{const recipient=await assigneeUserId(task.assignee_employee_id);return taskNotification("TASK_ASSIGNED",actor,task,{title:"New Task Assigned",message:`You have been assigned: “${task.title}”.`,recipientUserIds:recipient?[recipient]:[]})});
    }
    return rows.length;
  });
}
export async function sendTaskDeadlineNotifications(){
  const [tasks]=await pool.execute(`SELECT id,title,assignee_employee_id,due_at FROM tasks WHERE assignee_employee_id IS NOT NULL AND due_at IS NOT NULL AND status NOT IN('COMPLETED','ARCHIVED','DRAFT','SCHEDULED') AND due_at<=DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 2 HOUR)`);
  let delivered=0;
  for(const task of tasks){const recipient=await assigneeUserId(task.assignee_employee_id);if(!recipient)continue;const overdue=new Date(task.due_at)<new Date(),eventType=overdue?"TASK_OVERDUE":"TASK_DUE_SOON";const result=await taskNotification(eventType,{id:0,employee_id:null},task,{title:overdue?"Task Overdue":"Task Due Soon",message:overdue?`“${task.title}” is now overdue.`:`“${task.title}” is due within 2 hours.`,recipientUserIds:[recipient]});delivered+=result.filter(Boolean).length;}
  return delivered;
}
export async function listManagement(filters,user) {
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
    items: await addUnread(items.map((x) => ({
      ...x,
      overdue: isOverdue({
        status: x.status,
        dueAt: x.due_at,
        submittedAt: x.submitted_at,
        completedAt: x.completed_at,
      }),
    })),user.id),
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
    afterCommit(c,async()=>{const recipient=await assigneeUserId(task.assignee_employee_id);return taskNotification("TASK_DEADLINE_CHANGED",user,{id,title:task.title},{title:"Task Deadline Updated",message:`The deadline for “${task.title}” has changed.`,recipientUserIds:recipient?[recipient]:[]})});
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
function analyticsDates(filters){
  const now=new Date(),local=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  if(filters.range==="CUSTOM")return {start:filters.startDate,end:filters.endDate};
  let start=new Date(now),end=new Date(now);
  if(filters.range==="7_DAYS")start.setDate(start.getDate()-6);
  else if(filters.range==="30_DAYS")start.setDate(start.getDate()-29);
  else if(filters.range==="3_MONTHS")start.setMonth(start.getMonth()-3);
  else if(filters.range==="6_MONTHS")start.setMonth(start.getMonth()-6);
  else if(filters.range==="12_MONTHS")start.setFullYear(start.getFullYear()-1);
  else if(filters.range==="THIS_WEEK")start.setDate(start.getDate()-((start.getDay()+6)%7));
  else if(filters.range==="THIS_MONTH")start=new Date(now.getFullYear(),now.getMonth(),1);
  else if(filters.range==="LAST_MONTH"){start=new Date(now.getFullYear(),now.getMonth()-1,1);end=new Date(now.getFullYear(),now.getMonth(),0)}
  else if(filters.range==="THIS_YEAR")start=new Date(now.getFullYear(),0,1);
  return {start:local(start),end:local(end)};
}
export async function analytics(filters,user){
  const all=await getEffectivePermission(user.id,"task.view_all");
  if(!all&&filters.employeeId&&Number(filters.employeeId)!==Number(user.employee_id))throw new ApiError(403,"You cannot view another employee's analytics");
  const period=analyticsDates(filters),employeeId=all?filters.employeeId:user.employee_id,scope=employeeId?" AND t.assignee_employee_id=?":"",params=[period.start,period.end,...(employeeId?[employeeId]:[])],eligible="t.status NOT IN('DRAFT','SCHEDULED','ARCHIVED')",overdue="t.due_at<CURRENT_TIMESTAMP AND t.status NOT IN('COMPLETED','ARCHIVED')",bucket=(new Date(period.end)-new Date(period.start)>100*86400000)?"DATE_FORMAT(%s,'%Y-%m-01')":"DATE(%s)";
  const startDate=new Date(period.start+"T00:00:00"),endDate=new Date(period.end+"T00:00:00"),days=Math.round((endDate-startDate)/86400000)+1,previousEnd=new Date(startDate.getTime()-86400000),previousStart=new Date(previousEnd.getTime()-(days-1)*86400000),local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,previous={start:local(previousStart),end:local(previousEnd)};
  const summarySql=`SELECT COUNT(*) total,SUM(t.status='COMPLETED') completed,SUM(t.status='IN_PROGRESS') inProgress,SUM(t.status IN('OPEN','TO_DO','CHANGES_REQUIRED')) pending,SUM(t.status='SUBMITTED_FOR_REVIEW') pendingApproval,SUM(${overdue}) overdue,SUM(t.due_at>CURRENT_TIMESTAMP AND t.due_at<=DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 7 DAY) AND ${eligible}) upcoming,SUM(DATE(t.due_at)=CURRENT_DATE AND ${eligible}) dueToday,SUM(DATE(t.due_at)=DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY) AND ${eligible}) dueTomorrow,SUM(t.due_at>=CURRENT_TIMESTAMP AND t.due_at<DATE_ADD(CURRENT_DATE,INTERVAL 8 DAY) AND ${eligible}) dueThisWeek,SUM(t.due_at>=DATE_ADD(CURRENT_DATE,INTERVAL 8 DAY) AND t.due_at<DATE_ADD(CURRENT_DATE,INTERVAL 15 DAY) AND ${eligible}) dueNextWeek,SUM(${eligible}) eligible FROM tasks t WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY)${scope}`;
  const prioritySql=`SELECT t.priority,COUNT(*) total FROM tasks t WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY) AND ${eligible}${scope} GROUP BY t.priority`;
  const employeeSql=`SELECT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) name,(SELECT COUNT(*) FROM tasks ca WHERE ca.assignee_employee_id=e.id AND ca.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')) active,(SELECT COUNT(*) FROM tasks ca WHERE ca.assignee_employee_id=e.id AND ca.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED') AND DATE(ca.due_at)=CURRENT_DATE) dueToday,(SELECT COUNT(*) FROM tasks ca WHERE ca.assignee_employee_id=e.id AND ca.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED') AND ca.due_at>=CURRENT_TIMESTAMP AND ca.due_at<DATE_ADD(CURRENT_DATE,INTERVAL 8 DAY)) dueThisWeek,COUNT(*) assigned,SUM(t.status='COMPLETED') completed,SUM(t.status='IN_PROGRESS') inProgress,SUM(${overdue}) overdue,ROUND(100*SUM(t.status='COMPLETED')/NULLIF(COUNT(*),0)) completionRate,ROUND(100*SUM(t.status='COMPLETED' AND(t.due_at IS NULL OR t.completed_at<=t.due_at))/NULLIF(SUM(t.status='COMPLETED'),0)) onTimeRate FROM tasks t JOIN employees e ON e.id=t.assignee_employee_id WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY) AND ${eligible}${scope} GROUP BY e.id,e.first_name,e.last_name ORDER BY assigned DESC LIMIT 10`;
  const projectSql=`SELECT IF(t.assignment_type='OPEN','Open Assignments','Direct Assignments') name,COUNT(*) total,SUM(t.status='COMPLETED') completed,SUM(t.status='IN_PROGRESS') inProgress,SUM(${overdue}) overdue,ROUND(100*SUM(t.status='COMPLETED')/NULLIF(COUNT(*),0)) progress FROM tasks t WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY) AND ${eligible}${scope} GROUP BY t.assignment_type ORDER BY total DESC`;
  const createdSql=`SELECT ${bucket.replace("%s","t.created_at")} date,COUNT(*) value FROM tasks t WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY)${scope} GROUP BY date ORDER BY date`;
  const completedParams=[period.start,period.end,...(employeeId?[employeeId]:[])],completedSql=`SELECT ${bucket.replace("%s","t.completed_at")} date,COUNT(*) value FROM tasks t WHERE t.completed_at>=? AND t.completed_at<DATE_ADD(?,INTERVAL 1 DAY)${scope} GROUP BY date ORDER BY date`,overdueSql=`SELECT ${bucket.replace("%s","t.due_at")} date,COUNT(*) value FROM tasks t WHERE t.due_at>=? AND t.due_at<DATE_ADD(?,INTERVAL 1 DAY) AND(t.completed_at IS NULL OR t.completed_at>t.due_at)${scope} GROUP BY date ORDER BY date`;
  const previousSql=`SELECT SUM(t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY)) created,SUM(t.completed_at>=? AND t.completed_at<DATE_ADD(?,INTERVAL 1 DAY)) completed,SUM(t.due_at>=? AND t.due_at<DATE_ADD(?,INTERVAL 1 DAY) AND(t.completed_at IS NULL OR t.completed_at>t.due_at)) overdue FROM tasks t WHERE 1=1${scope}`,previousParams=[previous.start,previous.end,previous.start,previous.end,previous.start,previous.end,...(employeeId?[employeeId]:[])];
  const [[summary],[priorities],[employees],[projects],[created],[completed],[late],[previousRows]]=await Promise.all([pool.execute(summarySql,params),pool.execute(prioritySql,params),pool.execute(employeeSql,params),pool.execute(projectSql,params),pool.execute(createdSql,params),pool.execute(completedSql,completedParams),pool.execute(overdueSql,completedParams),pool.execute(previousSql,previousParams)]);
  const points=new Map(),put=(rows,key)=>rows.forEach(x=>{const d=String(x.date).slice(0,10),v=points.get(d)||{date:d,created:0,completed:0,overdue:0};v[key]=Number(x.value);points.set(d,v)});put(created,"created");put(completed,"completed");put(late,"overdue");
  const s=summary[0]||{},priority=Object.fromEntries(["URGENT","HIGH","MEDIUM","LOW"].map(x=>[x.toLowerCase(),Number(priorities.find(p=>p.priority===x)?.total||0)]));
  const totals={created:created.reduce((n,x)=>n+Number(x.value),0),completed:completed.reduce((n,x)=>n+Number(x.value),0),overdue:late.reduce((n,x)=>n+Number(x.value),0)},prev=previousRows[0]||{},trend=(current,before)=>Number(before)?Math.round((current-Number(before))*1000/Number(before))/10:null;
  return {period,scope:all?"TEAM":"PERSONAL",summary:{total:Number(s.total||0),completed:Number(s.completed||0),inProgress:Number(s.inProgress||0),pending:Number(s.pending||0),pendingApproval:Number(s.pendingApproval||0),overdue:Number(s.overdue||0),upcoming:Number(s.upcoming||0),dueToday:Number(s.dueToday||0),dueTomorrow:Number(s.dueTomorrow||0),dueThisWeek:Number(s.dueThisWeek||0),dueNextWeek:Number(s.dueNextWeek||0),completionRate:Number(s.eligible)?Math.round(100*Number(s.completed||0)/Number(s.eligible)):0},trends:{created:trend(totals.created,prev.created),completed:trend(totals.completed,prev.completed),overdue:trend(totals.overdue,prev.overdue)},activity:[...points.values()].sort((a,b)=>a.date.localeCompare(b.date)),priorities:priority,employees:all?employees.map(x=>({...x,assigned:Number(x.assigned),active:Number(x.active),dueToday:Number(x.dueToday),dueThisWeek:Number(x.dueThisWeek),workload:Number(x.active)<=3?'Low':Number(x.active)<=7?'Normal':Number(x.active)<=12?'High':'Heavy',completed:Number(x.completed),inProgress:Number(x.inProgress),overdue:Number(x.overdue),completionRate:Number(x.completionRate||0),onTimeRate:Number(x.onTimeRate||0)})):[],projects:projects.map(x=>({...x,total:Number(x.total),completed:Number(x.completed),inProgress:Number(x.inProgress),overdue:Number(x.overdue),progress:Number(x.progress||0) }))};
}
export async function employeePerformance(employeeId,filters,user){
  const id=Number(employeeId),all=await getEffectivePermission(user.id,"task.view_all");
  if(!all&&id!==Number(user.employee_id))throw new ApiError(403,"You can only view your own task performance");
  const [[employee]]=await pool.execute(`SELECT e.id,CONCAT(e.first_name,' ',e.last_name) name,e.department,e.job_title jobTitle,e.employee_code employeeCode,GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) roles FROM employees e LEFT JOIN users u ON u.employee_id=e.id LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id WHERE e.id=? GROUP BY e.id`,[id]);
  if(!employee)throw new ApiError(404,"Employee not found");
  const period=analyticsDates(filters),range=[period.start,period.end,id],active="t.status IN('TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED')",late="t.due_at<CURRENT_TIMESTAMP AND t.status NOT IN('COMPLETED','ARCHIVED') AND NOT(t.status='SUBMITTED_FOR_REVIEW' AND t.submitted_at<=t.due_at)",effective="COALESCE(t.submitted_at,t.completed_at)";
  const summarySql=`SELECT COUNT(*) assigned,SUM(t.status='COMPLETED') completed,SUM(t.status='IN_PROGRESS') inProgress,SUM(t.status='SUBMITTED_FOR_REVIEW') pendingApproval,SUM(${late}) overdue,SUM(t.status='CHANGES_REQUIRED') needsRevision,SUM(t.status='COMPLETED' AND t.due_at IS NOT NULL AND ${effective}<=t.due_at) onTime,SUM(t.status='COMPLETED' AND t.due_at IS NOT NULL AND ${effective}>t.due_at) completedLate,SUM(t.status='COMPLETED' AND t.due_at IS NOT NULL) timedCompleted FROM tasks t WHERE t.created_at>=? AND t.created_at<DATE_ADD(?,INTERVAL 1 DAY) AND t.assignee_employee_id=? AND t.status NOT IN('DRAFT','SCHEDULED','ARCHIVED')`;
  const workloadSql=`SELECT SUM(${active}) active,SUM(${active} AND t.priority='URGENT') urgent,SUM(${active} AND t.priority='HIGH') high,SUM(${active} AND DATE(t.due_at)=CURRENT_DATE) dueToday,SUM(${active} AND t.due_at>=CURRENT_TIMESTAMP AND t.due_at<DATE_ADD(CURRENT_DATE,INTERVAL 8 DAY)) dueThisWeek,SUM(${late}) overdue FROM tasks t WHERE t.assignee_employee_id=?`;
  const listBase=`SELECT t.id,t.title,t.description,t.priority,t.status,t.assignment_type,t.due_at,t.completed_at,t.submitted_at,t.created_at,(SELECT MAX(h.created_at) FROM task_assignment_history h WHERE h.task_id=t.id AND h.new_employee_id=?) assignedAt FROM tasks t WHERE t.assignee_employee_id=?`;
  const [summaryRows,workloadRows,activeRows,overdueRows,completedRows,atRiskRows,analyticsData,timelinessRows]=await Promise.all([
    pool.execute(summarySql,range),pool.execute(workloadSql,[id]),
    pool.execute(`${listBase} AND ${active} ORDER BY t.due_at IS NULL,t.due_at LIMIT 50`,[id,id]),
    pool.execute(`${listBase} AND ${late} ORDER BY t.due_at LIMIT 50`,[id,id]),
    pool.execute(`${listBase} AND t.status='COMPLETED' AND t.completed_at>=? AND t.completed_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY t.completed_at DESC LIMIT 50`,[id,id,period.start,period.end]),
    pool.execute(`${listBase} AND ${active} AND(${late} OR(t.due_at<=DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 48 HOUR) AND t.priority IN('URGENT','HIGH'))) ORDER BY t.due_at LIMIT 20`,[id,id]),
    analytics({...filters,employeeId:id},user),
    pool.execute(`SELECT SUM(DATE(${effective})<DATE(t.due_at)) early,SUM(DATE(${effective})=DATE(t.due_at)) onDueDate,SUM(${effective}>t.due_at) late FROM tasks t WHERE t.assignee_employee_id=? AND t.status='COMPLETED' AND t.due_at IS NOT NULL AND ${effective} IS NOT NULL AND t.completed_at>=? AND t.completed_at<DATE_ADD(?,INTERVAL 1 DAY)`,[id,period.start,period.end])
  ]);
  const s=summaryRows[0][0]||{},w=workloadRows[0][0]||{},activeCount=Number(w.active||0),level=activeCount<=3?"Low":activeCount<=7?"Normal":activeCount<=12?"High":"Heavy",map=x=>({...x,overdue:isOverdue({status:x.status,dueAt:x.due_at,submittedAt:x.submitted_at,completedAt:x.completed_at}),progress:{TO_DO:10,IN_PROGRESS:55,SUBMITTED_FOR_REVIEW:85,CHANGES_REQUIRED:65,COMPLETED:100}[x.status]||0});
  return {employee:{...employee,roles:String(employee.roles||"").split(",").filter(Boolean)},period,summary:{assigned:Number(s.assigned||0),completed:Number(s.completed||0),inProgress:Number(s.inProgress||0),pendingApproval:Number(s.pendingApproval||0),overdue:Number(s.overdue||0),needsRevision:Number(s.needsRevision||0),completionRate:Number(s.assigned)?Math.round(Number(s.completed||0)*1000/Number(s.assigned))/10:0,onTimeRate:Number(s.timedCompleted)?Math.round(Number(s.onTime||0)*1000/Number(s.timedCompleted))/10:0,onTime:Number(s.onTime||0),late:Number(s.completedLate||0)},workload:{active:activeCount,urgent:Number(w.urgent||0),high:Number(w.high||0),dueToday:Number(w.dueToday||0),dueThisWeek:Number(w.dueThisWeek||0),overdue:Number(w.overdue||0),level},activeTasks:activeRows[0].map(map),overdueTasks:overdueRows[0].map(map),completionHistory:completedRows[0].map(map),atRisk:atRiskRows[0].map(map),timeliness:Object.fromEntries(Object.entries(timelinessRows[0][0]||{}).map(([k,v])=>[k,Number(v||0)])),analytics:analyticsData};
}
