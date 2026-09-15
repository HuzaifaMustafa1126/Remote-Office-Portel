import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";
import { getEffectivePermission } from "./effectivePermission.service.js";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const selectSql = viewerId => `SELECT n.id,n.title,n.summary,n.content,n.visibility,n.is_important isImportant,n.author_user_id authorUserId,n.related_task_id relatedTaskId,COALESCE(n.related_task_title,t.title) relatedTaskTitle,n.created_at createdAt,n.updated_at updatedAt,CONCAT(e.first_name,' ',e.last_name) authorName,EXISTS(SELECT 1 FROM note_pins np WHERE np.note_id=n.id AND np.user_id=${Number(viewerId)}) isPinned,(SELECT id FROM note_images WHERE note_id=n.id ORDER BY uploaded_at,id LIMIT 1) previewImageId,(SELECT COUNT(*) FROM note_images WHERE note_id=n.id) imageCount FROM work_notes n JOIN users u ON u.id=n.author_user_id LEFT JOIN employees e ON e.id=u.employee_id LEFT JOIN tasks t ON t.id=n.related_task_id`;
const map = row => ({ ...row, isImportant: Boolean(row.isImportant), isPinned: Boolean(row.isPinned), imageCount: Number(row.imageCount || 0) });

async function isCeo(user, connection = pool) {
  const [[row]] = await connection.execute("SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name) IN('CEO','SUPER_ADMIN')) yes", [user.id]);
  return Boolean(row.yes);
}

async function access(user, params) {
  const clauses = ["n.author_user_id=?", "n.visibility='TEAM'"];
  params.push(user.id);
  if (await isCeo(user)) clauses.push("n.visibility='CEO_ONLY'");
  return `(${clauses.join(" OR ")})`;
}

export async function list(filters, user) {
  const where = ["n.status='PUBLISHED'", "n.is_archived=0"], params = [];
  where.push(await access(user, params));
  if (filters.tab === "MY") { where.push("n.author_user_id=?"); params.push(user.id); }
  if (filters.tab === "IMPORTANT") where.push("n.is_important=1");
  if (filters.tab === "PINNED") { where.push("EXISTS(SELECT 1 FROM note_pins pin WHERE pin.note_id=n.id AND pin.user_id=?)"); params.push(user.id); }
  if (filters.tab === "TASK") where.push("n.related_task_id IS NOT NULL");
  if (filters.visibility) { where.push("n.visibility=?"); params.push(filters.visibility); }
  if (filters.importance) { where.push("n.is_important=?"); params.push(filters.importance === "IMPORTANT"); }
  if (filters.source) where.push(filters.source === "TASK" ? "n.related_task_id IS NOT NULL" : "n.related_task_id IS NULL");
  if (filters.authorEmployeeId) { where.push("u.employee_id=?"); params.push(filters.authorEmployeeId); }
  if (filters.relatedTaskId) { where.push("n.related_task_id=?"); params.push(filters.relatedTaskId); }
  if (filters.search) {
    const query = `%${filters.search}%`;
    where.push("(n.title LIKE ? OR n.summary LIKE ? OR n.content LIKE ? OR CONCAT(e.first_name,' ',e.last_name) LIKE ? OR COALESCE(n.related_task_title,t.title,'') LIKE ?)");
    params.push(query, query, query, query, query);
  }
  if (filters.dateRange === "TODAY") where.push("DATE(n.created_at)=CURRENT_DATE");
  if (filters.dateRange === "WEEK") where.push("YEARWEEK(n.created_at,1)=YEARWEEK(CURRENT_DATE,1)");
  if (filters.dateRange === "MONTH") where.push("YEAR(n.created_at)=YEAR(CURRENT_DATE) AND MONTH(n.created_at)=MONTH(CURRENT_DATE)");
  if (filters.dateRange === "CUSTOM") { where.push("DATE(n.created_at) BETWEEN ? AND ?"); params.push(filters.startDate, filters.endDate); }
  const order = { NEWEST: "n.created_at DESC,n.id DESC", OLDEST: "n.created_at ASC,n.id ASC", UPDATED: "n.updated_at DESC,n.id DESC", IMPORTANT: "n.is_important DESC,n.created_at DESC,n.id DESC" }[filters.sort];
  const clause = where.join(" AND "), offset = (filters.page - 1) * filters.limit;
  const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM work_notes n JOIN users u ON u.id=n.author_user_id LEFT JOIN employees e ON e.id=u.employee_id LEFT JOIN tasks t ON t.id=n.related_task_id WHERE ${clause}`, params);
  const [rows] = await pool.execute(`${selectSql(user.id)} WHERE ${clause} ORDER BY isPinned DESC,${order} LIMIT ? OFFSET ?`, [...params, filters.limit, offset]);
  return { rows: rows.map(map), pagination: { page: filters.page, limit: filters.limit, total: Number(count.total), pages: Math.max(1, Math.ceil(Number(count.total) / filters.limit)) } };
}

export async function authors(user) {
  const params = [], predicate = await access(user, params);
  const [rows] = await pool.execute(`SELECT DISTINCT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) name FROM work_notes n JOIN users u ON u.id=n.author_user_id JOIN employees e ON e.id=u.employee_id WHERE n.status='PUBLISHED' AND n.is_archived=0 AND ${predicate} ORDER BY name`, params);
  return rows;
}

export async function get(id, user) {
  const params = [];
  const [[row]] = await pool.execute(`${selectSql(user.id)} WHERE n.id=? AND n.status='PUBLISHED' AND n.is_archived=0 AND ${await access(user, params)}`, [id, ...params]);
  if (!row) throw new ApiError(404, "Note not found");
  const [images] = await pool.execute("SELECT id,original_filename originalFilename,mime_type mimeType,size_bytes sizeBytes,uploaded_at uploadedAt FROM note_images WHERE note_id=? ORDER BY uploaded_at,id", [id]);
  return { ...map(row), images };
}

export async function togglePin(id, user) {
  await get(id, user);
  const [result] = await pool.execute("DELETE FROM note_pins WHERE user_id=? AND note_id=?", [user.id, id]);
  if (!result.affectedRows) await pool.execute("INSERT INTO note_pins(user_id,note_id) VALUES(?,?)", [user.id, id]);
  return { id: Number(id), isPinned: !result.affectedRows };
}

export async function create(data, user) {
  let task = null;
  if (data.relatedTaskId) {
    const [[row]] = await pool.execute("SELECT id,title,status,assignee_employee_id assigneeEmployeeId FROM tasks WHERE id=?", [data.relatedTaskId]);
    if (!row) throw new ApiError(400, "Related task not found");
    if (row.status !== "COMPLETED") throw new ApiError(400, "Work notes can only be added to completed tasks");
    const manage = await getEffectivePermission(user.id, "task.view_all", pool);
    if (!manage && Number(row.assigneeEmployeeId) !== Number(user.employee_id)) throw new ApiError(403, "You cannot add a work note to this task");
    task = row;
  }
  const [result] = await pool.execute("INSERT INTO work_notes(title,summary,content,author_user_id,visibility,is_important,related_task_id,related_task_title,status,published_at)VALUES(?,?,?,?,?,?,?,?,'PUBLISHED',CURRENT_TIMESTAMP)", [data.title, data.summary, data.content, user.id, data.visibility, data.isImportant, task?.id || null, task?.title || null]);
  await logAudit({ userId: user.id, employeeId: user.employee_id, action: "NOTE_CREATED", entityType: "WORK_NOTE", entityId: result.insertId, description: `Note “${data.title}” was created.${task ? ` Related task: #${task.id}.` : ""}` });
  return get(result.insertId, user);
}

async function own(id, user) {
  const [[note]] = await pool.execute("SELECT id,title,author_user_id authorUserId FROM work_notes WHERE id=? AND is_archived=0", [id]);
  if (!note) throw new ApiError(404, "Note not found");
  if (Number(note.authorUserId) !== Number(user.id)) throw new ApiError(403, "Only the note creator can modify this note");
  return note;
}

export async function update(id, data, user) {
  await own(id, user);
  await pool.execute("UPDATE work_notes SET title=?,summary=?,content=?,visibility=?,is_important=? WHERE id=?", [data.title, data.summary, data.content, data.visibility, data.isImportant, id]);
  await logAudit({ userId: user.id, employeeId: user.employee_id, action: "NOTE_UPDATED", entityType: "WORK_NOTE", entityId: id, description: `Note “${data.title}” was updated.` });
  return get(id, user);
}

export async function addImage(id, file, buffer, user) {
  await own(id, user);
  const directory = path.resolve(new URL(`../../uploads/notes/${id}/images`, import.meta.url).pathname);
  await mkdir(directory, { recursive: true });
  const storageKey = path.join(directory, `${randomUUID()}.${file.extension}`);
  await writeFile(storageKey, buffer, { flag: "wx" });
  try {
    const [result] = await pool.execute("INSERT INTO note_images(note_id,uploaded_by,storage_key,original_filename,mime_type,size_bytes)VALUES(?,?,?,?,?,?)", [id, user.id, storageKey, file.originalFilename, file.mimeType, file.sizeBytes]);
    return { id: result.insertId };
  } catch (error) { await unlink(storageKey).catch(() => {}); throw error; }
}

export async function imageContent(noteId, imageId, user) {
  await get(noteId, user);
  const [[file]] = await pool.execute("SELECT storage_key,original_filename originalFilename,mime_type mimeType FROM note_images WHERE id=? AND note_id=?", [imageId, noteId]);
  if (!file) throw new ApiError(404, "Image not found");
  return { ...file, buffer: await readFile(file.storage_key) };
}

export async function removeImage(noteId, imageId, user) {
  await own(noteId, user);
  const [[file]] = await pool.execute("SELECT storage_key FROM note_images WHERE id=? AND note_id=?", [imageId, noteId]);
  if (!file) throw new ApiError(404, "Image not found");
  await unlink(file.storage_key).catch(() => {});
  await pool.execute("DELETE FROM note_images WHERE id=?", [imageId]);
  return { id: Number(imageId) };
}
