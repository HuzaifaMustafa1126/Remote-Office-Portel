import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { logAudit } from "./audit.service.js";
import { getEffectivePermission } from "./effectivePermission.service.js";
import { notifyByPolicy } from "./notification.service.js";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Document, HeadingLevel, ImageRun, Packer, PageBreak, Paragraph, TextRun } from "docx";

const selectSql = viewerId => `SELECT n.id,n.title,n.summary,n.content,n.visibility,n.is_important isImportant,n.is_archived isArchived,n.author_user_id authorUserId,n.related_task_id relatedTaskId,COALESCE(n.related_task_title,t.title) relatedTaskTitle,n.created_at createdAt,n.updated_at updatedAt,CONCAT(e.first_name,' ',e.last_name) authorName,EXISTS(SELECT 1 FROM note_pins np WHERE np.note_id=n.id AND np.user_id=${Number(viewerId)}) isPinned,EXISTS(SELECT 1 FROM notifications nn WHERE nn.user_id=${Number(viewerId)} AND nn.reference_type='NOTE' AND nn.reference_id=n.id AND nn.is_read=0 AND nn.in_app_allowed=1) isNew,(SELECT id FROM note_images WHERE note_id=n.id ORDER BY uploaded_at,id LIMIT 1) previewImageId,(SELECT COUNT(*) FROM note_images WHERE note_id=n.id) imageCount,(SELECT COUNT(*) FROM note_replies nr WHERE nr.note_id=n.id AND nr.deleted_at IS NULL) replyCount FROM work_notes n JOIN users u ON u.id=n.author_user_id LEFT JOIN employees e ON e.id=u.employee_id LEFT JOIN tasks t ON t.id=n.related_task_id`;
const map = row => ({ ...row, isImportant: Boolean(row.isImportant), isArchived: Boolean(row.isArchived), isPinned: Boolean(row.isPinned), isNew: Boolean(row.isNew), imageCount: Number(row.imageCount || 0), replyCount: Number(row.replyCount || 0) });

async function isCeo(user, connection = pool) {
  const [[row]] = await connection.execute("SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND UPPER(r.name)='CEO') yes", [user.id]);
  return Boolean(row.yes);
}

async function access(user, params, executor=pool) {
  const clauses = ["n.author_user_id=?", "n.visibility='TEAM'"];
  params.push(user.id);
  if (await isCeo(user,executor)) clauses.push("n.visibility='CEO_ONLY'");
  return `(${clauses.join(" OR ")})`;
}

export async function requireAccessibleNote(id, user, includeArchived = false, executor = pool, forUpdate = false) {
  const params = [], predicate = await access(user, params,executor);
  const archiveOwner = includeArchived ? " AND n.author_user_id=?" : "";
  const [[note]] = await executor.execute(
    `SELECT n.id,n.title,n.visibility,n.status,n.is_archived isArchived,n.author_user_id authorUserId,CONCAT(e.first_name,' ',e.last_name) authorName
     FROM work_notes n JOIN users u ON u.id=n.author_user_id LEFT JOIN employees e ON e.id=u.employee_id
     WHERE n.id=? AND n.status='${includeArchived ? "ARCHIVED" : "PUBLISHED"}' AND n.is_archived=${includeArchived ? 1 : 0} AND ${predicate}${archiveOwner}${forUpdate ? " FOR UPDATE" : ""}`,
    [id, ...params, ...(includeArchived ? [user.id] : [])],
  );
  if (!note) throw new ApiError(404, "Note not found or no longer available");
  return { ...note, isArchived: Boolean(note.isArchived) };
}

async function buildAccessibleNotesQuery(filters, user) {
  const archived = filters.tab === "ARCHIVED";
  const where = [`n.status='${archived ? "ARCHIVED" : "PUBLISHED"}'`, `n.is_archived=${archived ? 1 : 0}`], params = [];
  where.push(await access(user, params));
  if (archived) { where.push("n.author_user_id=?"); params.push(user.id); }
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
  if (filters.dateRange === "TODAY") where.push("n.created_at>=CURRENT_DATE AND n.created_at<DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY)");
  if (filters.dateRange === "WEEK") where.push("n.created_at>=DATE_SUB(CURRENT_DATE,INTERVAL WEEKDAY(CURRENT_DATE) DAY) AND n.created_at<DATE_ADD(DATE_SUB(CURRENT_DATE,INTERVAL WEEKDAY(CURRENT_DATE) DAY),INTERVAL 7 DAY)");
  if (filters.dateRange === "MONTH") where.push("n.created_at>=DATE_FORMAT(CURRENT_DATE,'%Y-%m-01') AND n.created_at<DATE_ADD(DATE_FORMAT(CURRENT_DATE,'%Y-%m-01'),INTERVAL 1 MONTH)");
  if (filters.dateRange === "CUSTOM") { where.push("n.created_at>=? AND n.created_at<DATE_ADD(?,INTERVAL 1 DAY)"); params.push(`${filters.startDate} 00:00:00`, `${filters.endDate} 00:00:00`); }
  const order = { NEWEST: "n.created_at DESC,n.id DESC", OLDEST: "n.created_at ASC,n.id ASC", UPDATED: "n.updated_at DESC,n.id DESC", IMPORTANT: "n.is_important DESC,n.created_at DESC,n.id DESC" }[filters.sort];
  return { clause: where.join(" AND "), params, order };
}

export async function list(filters, user) {
  const { clause, params, order } = await buildAccessibleNotesQuery(filters, user), offset = (filters.page - 1) * filters.limit;
  const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM work_notes n JOIN users u ON u.id=n.author_user_id LEFT JOIN employees e ON e.id=u.employee_id LEFT JOIN tasks t ON t.id=n.related_task_id WHERE ${clause}`, params);
  const [rows] = await pool.execute(`${selectSql(user.id)} WHERE ${clause} ORDER BY isPinned DESC,${order} LIMIT ? OFFSET ?`, [...params, filters.limit, offset]);
  return { rows: rows.map(map), pagination: { page: filters.page, limit: filters.limit, total: Number(count.total), pages: Math.max(1, Math.ceil(Number(count.total) / filters.limit)) } };
}

export async function authors(user) {
  const params = [], predicate = await access(user, params);
  const [rows] = await pool.execute(`SELECT DISTINCT e.id employeeId,CONCAT(e.first_name,' ',e.last_name) name FROM work_notes n JOIN users u ON u.id=n.author_user_id JOIN employees e ON e.id=u.employee_id WHERE n.status='PUBLISHED' AND n.is_archived=0 AND ${predicate} ORDER BY name`, params);
  return rows;
}

export async function get(id, user, includeArchived = false) {
  const params = [];
  const archiveOwner = includeArchived ? " AND n.author_user_id=?" : "";
  const [[row]] = await pool.execute(`${selectSql(user.id)} WHERE n.id=? AND n.status='${includeArchived ? "ARCHIVED" : "PUBLISHED"}' AND n.is_archived=${includeArchived ? 1 : 0} AND ${await access(user, params)}${archiveOwner}`, [id, ...params, ...(includeArchived ? [user.id] : [])]);
  if (!row) {
    const [[existing]] = await pool.execute("SELECT id FROM work_notes WHERE id=? AND status='PUBLISHED'", [id]);
    if (existing) throw new ApiError(403, "This note is no longer available to you.");
    throw new ApiError(404, "This note is no longer available.");
  }
  const [images] = await pool.execute("SELECT id,original_filename originalFilename,mime_type mimeType,size_bytes sizeBytes,uploaded_at uploadedAt FROM note_images WHERE note_id=? ORDER BY uploaded_at,id", [id]);
  await pool.execute("INSERT INTO note_reads(note_id,user_id,read_at) VALUES(?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE read_at=CURRENT_TIMESTAMP", [id, user.id]);
  await pool.execute("UPDATE notifications SET is_read=1,read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE user_id=? AND reference_type='NOTE' AND reference_id=? AND is_read=0", [user.id, id]);
  return { ...map(row), images };
}

async function recipients(visibility, actorId) {
  if (visibility === "PRIVATE") return [];
  const role = visibility === "CEO_ONLY"
    ? "AND EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name)='CEO')"
    : "";
  const [rows] = await pool.execute(
    `SELECT u.id FROM users u JOIN employees e ON e.id=u.employee_id
     WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND u.id<>? ${role}
       AND EXISTS(
         SELECT 1 FROM permissions p
         LEFT JOIN user_permission_overrides upo ON upo.permission_id=p.id AND upo.user_id=u.id
         WHERE p.name='notes.view_own'
           AND (upo.effect='ALLOW' OR (upo.effect IS NULL AND EXISTS(
             SELECT 1 FROM user_roles urp JOIN role_permissions rp ON rp.role_id=urp.role_id
             WHERE urp.user_id=u.id AND rp.permission_id=p.id
           )))
       )`,
    [actorId],
  );
  return rows.map((row) => row.id);
}

export function resolveNoteNotification(note, kind) {
  if (note.visibility === "PRIVATE") return null;
  const important = Boolean(note.isImportant);
  if (kind === "shared") return note.visibility === "CEO_ONLY"
    ? { type: "NOTE_SHARED_CEO", title: "Note Shared With CEO", verb: "shared a note with you" }
    : { type: "NOTE_SHARED_TEAM", title: "Note Shared With Team", verb: "shared a note with the team" };
  if (kind === "updated") return { type: "NOTE_UPDATED", title: "Note Updated", verb: "updated a note" };
  if (important) return { type: "NOTE_IMPORTANT_PUBLISHED", title: note.visibility === "CEO_ONLY" ? "⭐ Important Note for CEO" : "⭐ Important Team Note", verb: "added an important note" };
  return note.visibility === "CEO_ONLY"
    ? { type: "NOTE_CEO_PUBLISHED", title: "New Note for CEO", verb: "added a new note for CEO" }
    : { type: "NOTE_TEAM_PUBLISHED", title: "New Team Note", verb: "added a new note" };
}

async function notifyNote(note, user, kind) {
  const recipientUserIds = await recipients(note.visibility, user.id);
  if (!recipientUserIds.length) return;
  const event = resolveNoteNotification(note, kind);
  if (!event) return;
  const { type, title, verb } = event, important = Boolean(note.isImportant);
  await notifyByPolicy(type, user, { recipientUserIds, respectAudience: true, title, message: `${note.authorName || "A team member"} ${verb}: ${note.title}`, referenceType: "NOTE", referenceId: Number(note.id), actionUrl: `/notes/${note.id}`, priority: important ? "IMPORTANT" : "NORMAL", eventKey: `${type}:${note.id}:${kind === "published" ? "published" : new Date(note.updatedAt).getTime()}` });
}

async function notifyNoteSafely(note, user, kind) {
  try {
    await notifyNote(note, user, kind);
  } catch (error) {
    console.error(`Note ${note.id} was saved, but ${kind} notifications failed:`, error);
  }
}

export async function togglePin(id, user) {
  await requireAccessibleNote(id,user);
  const [result] = await pool.execute("DELETE FROM note_pins WHERE user_id=? AND note_id=?", [user.id, id]);
  if (!result.affectedRows) await pool.execute("INSERT INTO note_pins(user_id,note_id) VALUES(?,?)", [user.id, id]);
  return { id: Number(id), isPinned: !result.affectedRows };
}

export async function create(data, user) {
  const connection = await pool.getConnection(); let noteId;
  try {
    await connection.beginTransaction(); let task = null;
    if (data.relatedTaskId) {
      const [[row]] = await connection.execute("SELECT id,title,status,assignee_employee_id assigneeEmployeeId FROM tasks WHERE id=?", [data.relatedTaskId]);
      if (!row) throw new ApiError(400, "Related task not found");
      if (row.status !== "COMPLETED") throw new ApiError(400, "Work notes can only be added to completed tasks");
      const manage = await getEffectivePermission(user.id, "task.view_all", connection);
      if (!manage && Number(row.assigneeEmployeeId) !== Number(user.employee_id)) throw new ApiError(403, "You cannot add a work note to this task");
      task = row;
    }
    const [result] = await connection.execute("INSERT INTO work_notes(title,summary,content,author_user_id,visibility,is_important,related_task_id,related_task_title,status,published_at)VALUES(?,?,?,?,?,?,?,?,'PUBLISHED',CURRENT_TIMESTAMP)", [data.title, data.summary, data.content, user.id, data.visibility, data.isImportant, task?.id || null, task?.title || null]);
    noteId = result.insertId;
    await connection.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'NOTE_PUBLISHED','WORK_NOTE',?,?)", [user.id,user.employee_id,noteId,`Note “${data.title}” was published.${task ? ` Related task: #${task.id}.` : ""}`]);
    await connection.commit();
  } catch(error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  return get(noteId, user);
}

export async function publishNotifications(id, user) {
  const owned = await requireNoteOwner(id, user);
  if (owned.isArchived) throw new ApiError(400, "Archived notes cannot be published");
  const note = await get(id, user);
  await notifyNoteSafely(note, user, "published");
  return note;
}

async function requireNoteOwner(id, user, executor = pool, forUpdate = false, action = "modify") {
  const [[note]] = await executor.execute(`SELECT id,title,visibility,is_important isImportant,is_archived isArchived,author_user_id authorUserId FROM work_notes WHERE id=?${forUpdate ? " FOR UPDATE" : ""}`, [id]);
  if (!note) throw new ApiError(404, "Note not found");
  if (Number(note.authorUserId) !== Number(user.id)) throw new ApiError(403, `You don't have permission to ${action} this note.`);
  return note;
}

export async function update(id, data, user) {
  const connection=await pool.getConnection();let previous;
  try{await connection.beginTransaction();previous=await requireNoteOwner(id,user,connection,true);if(previous.isArchived)throw new ApiError(400,"Restore this note before editing it");
    await connection.execute("UPDATE work_notes SET title=?,summary=?,content=?,visibility=?,is_important=? WHERE id=?",[data.title,data.summary,data.content,data.visibility,data.isImportant,id]);
    await connection.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'NOTE_UPDATED','WORK_NOTE',?,?)",[user.id,user.employee_id,id,`Note “${data.title}” was updated.`]);
    if(previous.visibility!==data.visibility)await connection.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,'NOTE_VISIBILITY_CHANGED','WORK_NOTE',?,?)",[user.id,user.employee_id,id,`Note visibility changed from ${previous.visibility} to ${data.visibility}.`]);
    await connection.commit();
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  const note = await get(id, user);
  if (data.visibility !== "PRIVATE" && previous.visibility !== data.visibility) await notifyNoteSafely(note, user, "shared");
  else if (data.notifyViewers) {
    await notifyNoteSafely(note, user, "updated");
    await logAudit({ userId: user.id, employeeId: user.employee_id, action: "NOTE_UPDATE_NOTIFICATION_SENT", entityType: "WORK_NOTE", entityId: id, description: `Viewers were notified that note “${data.title}” was updated.` }).catch((error)=>console.error(`Note ${id} was updated, but its notification audit entry failed:`,error.message));
  }
  return note;
}

export async function setArchived(id, archived, user) {
  const connection=await pool.getConnection();let note;
  try{await connection.beginTransaction();note=await requireNoteOwner(id,user,connection,true);if(Boolean(note.isArchived)===archived){await connection.rollback();return{id:Number(id),isArchived:archived};}
    await connection.execute("UPDATE work_notes SET is_archived=?,status=?,archived_at=? WHERE id=?",[archived,archived?"ARCHIVED":"PUBLISHED",archived?new Date():null,id]);
    await connection.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,?,'WORK_NOTE',?,?)",[user.id,user.employee_id,archived?"NOTE_ARCHIVED":"NOTE_RESTORED",id,`Note “${note.title}” was ${archived?"archived":"restored"}.`]);await connection.commit();
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  return { id: Number(id), isArchived: archived };
}

export async function remove(id, user) {
  const connection = await pool.getConnection();
  let files = [], title = "";
  try {
    await connection.beginTransaction();
    const note = await requireNoteOwner(id, user, connection, true, "delete");
    title = note.title;
    const [images] = await connection.execute("SELECT storage_key storageKey FROM note_images WHERE note_id=? UNION ALL SELECT storage_key FROM note_attachments WHERE note_id=?", [id, id]);
    files = images.map((image) => image.storageKey);
    await connection.execute("DELETE FROM work_notes WHERE id=?", [id]);
    await connection.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description) VALUES(?,?,'NOTE_DELETED','WORK_NOTE',?,?)", [user.id, user.employee_id, id, `Note “${title}” was permanently deleted.`]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  await Promise.allSettled(files.map((file) => unlink(file)));
  return { id: Number(id) };
}

const displayDate = (value) => new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export async function exportDocx(filters, user) {
  const { mode, ...current } = filters;
  const modeTab = { ALL: "ALL", MY: "MY", IMPORTANT: "IMPORTANT", TASK: "TASK", ARCHIVED: "ARCHIVED" }[mode];
  const base = mode === "FILTERED" ? current : { tab: modeTab, dateRange: "ALL", sort: current.sort || "NEWEST" };
  const normalized = { tab: base.tab || "ALL", dateRange: base.dateRange || "ALL", sort: base.sort || "NEWEST", ...base };
  const { clause, params, order } = await buildAccessibleNotesQuery(normalized, user);
  const [rows] = await pool.execute(`${selectSql(user.id)} WHERE ${clause} ORDER BY isPinned DESC,${order}`, params);
  const notes = rows.map(map);
  if (!notes.length) throw new ApiError(422, "No notes available to export.");
  const ids = notes.map((note) => note.id), placeholders = ids.map(() => "?").join(",");
  const [images] = await pool.execute(`SELECT note_id noteId,storage_key storageKey,mime_type mimeType,original_filename originalFilename FROM note_images WHERE note_id IN(${placeholders}) ORDER BY note_id,id`, ids);
  const byNote = new Map();
  for (const image of images) (byNote.get(Number(image.noteId)) || (byNote.set(Number(image.noteId), []), byNote.get(Number(image.noteId)))).push(image);
  const applied = mode === "FILTERED" ? Object.entries(current).filter(([key, value]) => value !== undefined && value !== "" && !["page","limit"].includes(key)).map(([key, value]) => `${key}: ${value}`).join(" · ") : `Export selection: ${mode.toLowerCase()}`;
  const children = [
    new Paragraph({ text: "Remote Office Portal — Notes Export", heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Export date: ${displayDate(new Date())}`, bold: true })] }),
    new Paragraph(`Exported by: ${user.name || user.email || `User ${user.id}`}`),
    new Paragraph(`Applied filters: ${applied || "None"}`),
    new Paragraph(`Total notes: ${notes.length}`),
  ];
  for (const [index, note] of notes.entries()) {
    if (index) children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: note.title, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Summary", bold: true })] }), new Paragraph(note.summary));
    children.push(new Paragraph({ children: [new TextRun({ text: "Content", bold: true })] }), ...String(note.content).split(/\r?\n/).map((line) => new Paragraph(line || " ")));
    const details = [`Created by: ${note.authorName}`, `Created: ${displayDate(note.createdAt)}`, `Updated: ${displayDate(note.updatedAt)}`, `Visibility: ${{TEAM:"All Team Members",PRIVATE:"Private",CEO_ONLY:"Only CEO"}[note.visibility]}`, `Important: ${note.isImportant ? "Yes" : "No"}`];
    if (note.relatedTaskTitle) details.push(`Related task: ${note.relatedTaskTitle}`);
    children.push(...details.map((text) => new Paragraph({ children: [new TextRun(text)] })));
    for (const image of byNote.get(Number(note.id)) || []) {
      if (!/image\/(png|jpe?g|gif|bmp)/i.test(image.mimeType)) { children.push(new Paragraph(`Image: ${image.originalFilename} (format not embeddable)`)); continue; }
      try { children.push(new Paragraph({ children: [new ImageRun({ data: await readFile(image.storageKey), transformation: { width: 480, height: 270 }, type: image.mimeType.split("/")[1].replace("jpeg", "jpg") })] })); } catch { children.push(new Paragraph(`Image unavailable: ${image.originalFilename}`)); }
    }
  }
  const document = new Document({ sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }] });
  return { buffer: await Packer.toBuffer(document), filename: `Work-Notes-Report-${new Date().toISOString().slice(0,10)}.docx` };
}

export async function addImage(id, file, buffer, user) {
  const note=await requireNoteOwner(id,user);if(note.isArchived)throw new ApiError(400,"Restore this note before adding images");
  const directory = fileURLToPath(new URL(`../../uploads/notes/${id}/images/`, import.meta.url));
  await mkdir(directory, { recursive: true });
  const storageKey = path.join(directory, `${randomUUID()}.${file.extension}`);
  await writeFile(storageKey, buffer, { flag: "wx" });
  try {
    const [result] = await pool.execute("INSERT INTO note_images(note_id,uploaded_by,storage_key,original_filename,mime_type,size_bytes) SELECT id,?,?,?,?,? FROM work_notes WHERE id=? AND author_user_id=? AND is_archived=0 AND status='PUBLISHED'", [user.id, storageKey, file.originalFilename, file.mimeType, file.sizeBytes,id,user.id]);
    if(!result.affectedRows)throw new ApiError(409,"The note changed before the image could be saved");
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
  const note=await requireNoteOwner(noteId,user);if(note.isArchived)throw new ApiError(400,"Restore this note before removing images");
  const [[file]] = await pool.execute("SELECT storage_key FROM note_images WHERE id=? AND note_id=?", [imageId, noteId]);
  if (!file) throw new ApiError(404, "Image not found");
  await pool.execute("DELETE FROM note_images WHERE id=?", [imageId]);
  await unlink(file.storage_key).catch((error) => console.error(`Removed image ${imageId} from the database but could not delete its file:`,error.message));
  return { id: Number(imageId) };
}
