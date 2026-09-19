import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { requireAccessibleNote } from "./note.service.js";
import { notifyByPolicy } from "./notification.service.js";

const replySelect = `SELECT nr.id,nr.note_id noteId,nr.content,nr.created_by createdBy,nr.created_at createdAt,nr.updated_at updatedAt,
  CONCAT(e.first_name,' ',e.last_name) authorName
  FROM note_replies nr JOIN users u ON u.id=nr.created_by LEFT JOIN employees e ON e.id=u.employee_id`;
const mapReply = (row, mentions = []) => ({
  ...row,
  edited: String(row.updatedAt) !== String(row.createdAt),
  mentions,
});

async function eligibleMentionUsers(
  note,
  currentUserId,
  search = "",
  executor = pool,
  limited = true,
) {
  if (note.visibility === "PRIVATE") return [];
  const params = [currentUserId],
    where = [
      "u.status='ACTIVE'",
      "e.status='ACTIVE'",
      "u.id<>?",
      `EXISTS(
    SELECT 1 FROM permissions p LEFT JOIN user_permission_overrides upo ON upo.permission_id=p.id AND upo.user_id=u.id
    WHERE p.name='notes.view_own' AND (upo.effect='ALLOW' OR (upo.effect IS NULL AND EXISTS(
      SELECT 1 FROM user_roles urp JOIN role_permissions rp ON rp.role_id=urp.role_id
      WHERE urp.user_id=u.id AND rp.permission_id=p.id
    )))
  )`,
    ];
  if (note.visibility === "CEO_ONLY") {
    where.push(
      "(u.id=? OR EXISTS(SELECT 1 FROM user_roles ur2 JOIN roles r2 ON r2.id=ur2.role_id WHERE ur2.user_id=u.id AND UPPER(r2.name)='CEO'))",
    );
    params.push(note.authorUserId);
  }
  if (search) {
    where.push(
      "(CONCAT(e.first_name,' ',e.last_name) LIKE ? OR u.email LIKE ?)",
    );
    params.push(`%${search}%`, `%${search}%`);
  }
  const [rows] = await executor.execute(
    `SELECT DISTINCT u.id userId,CONCAT(e.first_name,' ',e.last_name) name,
    COALESCE((SELECT GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id),'Employee') role
    FROM users u JOIN employees e ON e.id=u.employee_id WHERE ${where.join(" AND ")} ORDER BY name${limited ? " LIMIT 20" : ""}`,
    params,
  );
  return rows;
}

async function validateMentions(note, user, ids, executor = pool) {
  const unique = [...new Set(ids.map(Number))].filter(
    (id) => id !== Number(user.id),
  );
  if (!unique.length) return [];
  const eligible = await eligibleMentionUsers(
      note,
      user.id,
      "",
      executor,
      false,
    ),
    allowed = new Set(eligible.map((x) => Number(x.userId)));
  if (unique.some((id) => !allowed.has(id)))
    throw new ApiError(
      400,
      "One or more mentioned employees cannot access this note",
    );
  return unique;
}

async function hydrate(rows, executor = pool) {
  if (!rows.length) return [];
  const [mentions] = await executor.execute(
    `SELECT nrm.reply_id replyId,nrm.mentioned_user_id userId,CONCAT(e.first_name,' ',e.last_name) name
    FROM note_reply_mentions nrm JOIN users u ON u.id=nrm.mentioned_user_id LEFT JOIN employees e ON e.id=u.employee_id
    WHERE nrm.reply_id IN(${rows.map(() => "?").join(",")}) ORDER BY nrm.id`,
    rows.map((x) => x.id),
  );
  const grouped = new Map();
  for (const m of mentions)
    (
      grouped.get(Number(m.replyId)) ||
      (grouped.set(Number(m.replyId), []), grouped.get(Number(m.replyId)))
    ).push({ userId: Number(m.userId), name: m.name });
  return rows.map((row) => mapReply(row, grouped.get(Number(row.id)) || []));
}

export async function list(noteId, user, archived = false) {
  await requireAccessibleNote(noteId, user, archived);
  const [rows] = await pool.execute(
    `${replySelect} WHERE nr.note_id=? AND nr.deleted_at IS NULL ORDER BY nr.created_at,nr.id`,
    [noteId],
  );
  return hydrate(rows);
}

export async function mentionable(noteId, user, search = "", archived = false) {
  const note = await requireAccessibleNote(noteId, user, archived);
  return eligibleMentionUsers(note, user.id, search);
}

export function buildReplyNotificationPlan(
  noteOwnerId,
  actorId,
  mentionedIds,
  notifyCreator = true,
) {
  const mentions = [...new Set(mentionedIds.map(Number))].filter(
    (id) => id !== Number(actorId),
  );
  return {
    mentionRecipientIds: mentions,
    notifyOwner:
      notifyCreator &&
      Number(noteOwnerId) !== Number(actorId) &&
      !mentions.includes(Number(noteOwnerId)),
  };
}

const preview = (content) => content.replace(/\s+/g, " ").trim().slice(0, 110);

async function sendNotifications(
  note,
  reply,
  actor,
  mentionedIds,
  notifyCreator = true,
) {
  const actionUrl = `/notes/${note.id}?reply=${reply.id}`;
  const plan = buildReplyNotificationPlan(
      note.authorUserId,
      actor.id,
      mentionedIds,
      notifyCreator,
    ),
    replyPreview = preview(reply.content);
  if (plan.mentionRecipientIds.length)
    await notifyByPolicy("NOTE_REPLY_MENTION", actor, {
      recipientUserIds: plan.mentionRecipientIds,
      respectAudience: true,
      title: "You Were Mentioned in a Note",
      message: `${reply.authorName} mentioned you in: ${note.title} — ${replyPreview}`,
      referenceType: "NOTE",
      referenceId: Number(note.id),
      actionUrl,
      priority: "IMPORTANT",
      eventKey: `NOTE_REPLY_MENTION:${reply.id}`,
    });
  if (plan.notifyOwner)
    await notifyByPolicy("NOTE_REPLY_CREATED", actor, {
      recipientUserIds: [note.authorUserId],
      respectAudience: true,
      title: "New Reply on Your Note",
      message: `${reply.authorName} replied to your note: ${note.title} — ${replyPreview}`,
      referenceType: "NOTE",
      referenceId: Number(note.id),
      actionUrl,
      eventKey: `NOTE_REPLY_CREATED:${reply.id}`,
    });
}

async function sendNotificationsSafely(
  note,
  reply,
  actor,
  mentionedIds,
  notifyCreator = true,
) {
  try {
    await sendNotifications(note, reply, actor, mentionedIds, notifyCreator);
  } catch (error) {
    console.error(
      `Reply ${reply.id} was saved, but its notifications failed:`,
      error,
    );
  }
}

export async function create(noteId, data, user) {
  const c = await pool.getConnection();
  let reply, mentions, note;
  try {
    await c.beginTransaction();
    note = await requireAccessibleNote(noteId, user, false, c, true);
    mentions = await validateMentions(note, user, data.mentionUserIds, c);
    const [result] = await c.execute(
      "INSERT INTO note_replies(note_id,content,created_by)VALUES(?,?,?)",
      [noteId, data.content, user.id],
    );
    for (const id of mentions)
      await c.execute(
        "INSERT INTO note_reply_mentions(reply_id,mentioned_user_id)VALUES(?,?)",
        [result.insertId, id],
      );
    const [[row]] = await c.execute(`${replySelect} WHERE nr.id=?`, [
      result.insertId,
    ]);
    reply = mapReply(row);
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
  reply = (await hydrate([reply]))[0];
  await sendNotificationsSafely(note, reply, user, mentions);
  return reply;
}

export async function update(noteId, replyId, data, user) {
  const c = await pool.getConnection();
  let reply,
    newMentions = [],
    note;
  try {
    await c.beginTransaction();
    note = await requireAccessibleNote(noteId, user, false, c, true);
    const [[owned]] = await c.execute(
      "SELECT id FROM note_replies WHERE id=? AND note_id=? AND deleted_at IS NULL AND created_by=? FOR UPDATE",
      [replyId, noteId, user.id],
    );
    if (!owned)
      throw new ApiError(404, "Reply not found or you cannot edit it");
    const ids = await validateMentions(note, user, data.mentionUserIds, c);
    const [oldRows] = await c.execute(
      "SELECT mentioned_user_id userId FROM note_reply_mentions WHERE reply_id=?",
      [replyId],
    );
    const old = new Set(oldRows.map((x) => Number(x.userId)));
    newMentions = ids.filter((id) => !old.has(id));
    await c.execute("UPDATE note_replies SET content=? WHERE id=?", [
      data.content,
      replyId,
    ]);
    if (ids.length)
      await c.execute(
        `DELETE FROM note_reply_mentions WHERE reply_id=? AND mentioned_user_id NOT IN(${ids.map(() => "?").join(",")})`,
        [replyId, ...ids],
      );
    else
      await c.execute("DELETE FROM note_reply_mentions WHERE reply_id=?", [
        replyId,
      ]);
    for (const id of newMentions)
      await c.execute(
        "INSERT IGNORE INTO note_reply_mentions(reply_id,mentioned_user_id)VALUES(?,?)",
        [replyId, id],
      );
    const [[row]] = await c.execute(`${replySelect} WHERE nr.id=?`, [replyId]);
    reply = mapReply(row);
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
  reply = (await hydrate([reply]))[0];
  if (newMentions.length)
    await sendNotificationsSafely(note, reply, user, newMentions, false);
  return reply;
}

export async function remove(noteId, replyId, user) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    await requireAccessibleNote(noteId, user, false, c, true);
    const [result] = await c.execute(
      "UPDATE note_replies SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND note_id=? AND created_by=? AND deleted_at IS NULL",
      [replyId, noteId, user.id],
    );
    if (!result.affectedRows)
      throw new ApiError(404, "Reply not found or you cannot delete it");
    await c.commit();
    return { id: Number(replyId) };
  } catch (error) {
    await c.rollback();
    throw error;
  } finally {
    c.release();
  }
}
