import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { emitNotification } from "../sockets/notification.socket.js";

const select = `SELECT id,user_id AS userId,type,title,message,reference_type AS referenceType,
  reference_id AS referenceId,action_url AS actionUrl,is_read AS isRead,created_at AS createdAt,read_at AS readAt
  FROM notifications`;

export async function createNotification(data, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO notifications(user_id,type,title,message,reference_type,reference_id,action_url)
     VALUES(?,?,?,?,?,?,?)`,
    [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.referenceType || null,
      data.referenceId || null,
      data.actionUrl || null,
    ],
  );
  const [[notification]] = await executor.execute(`${select} WHERE id=?`, [
    result.insertId,
  ]);
  return notification;
}

export async function notifyUser(data) {
  const notification = await createNotification(data);
  emitNotification(notification);
  return notification;
}

export async function notifyRoles(roleNames, data) {
  const placeholders = roleNames.map(() => "?").join(",");
  const [users] = await pool.execute(
    `SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id
     JOIN roles r ON r.id=ur.role_id WHERE u.status='ACTIVE' AND r.name IN (${placeholders})`,
    roleNames,
  );
  return Promise.all(
    users.map(({ id }) => notifyUser({ ...data, userId: id })),
  );
}

export async function getUserNotifications(userId, filters) {
  const page = filters.page || 1,
    limit = filters.limit || 20,
    offset = (page - 1) * limit;
  const where = ["user_id=?"],
    params = [userId];
  if (filters.unread) where.push("is_read=FALSE");
  if (filters.category) {
    where.push("type LIKE ?");
    params.push(`${filters.category}_%`);
  }
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM notifications WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await pool.execute(
    `${select} WHERE ${where.join(" AND ")} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return {
    rows,
    pagination: {
      page,
      limit,
      total: Number(count.total),
      pages: Math.ceil(Number(count.total) / limit),
    },
  };
}

export async function getUnreadCount(userId) {
  const [[row]] = await pool.execute(
    "SELECT COUNT(*) count FROM notifications WHERE user_id=? AND is_read=FALSE",
    [userId],
  );
  return Number(row.count);
}

export async function markAsRead(id, userId) {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read=TRUE,read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE id=? AND user_id=?",
    [id, userId],
  );
  if (!result.affectedRows) {
    const [[owned]] = await pool.execute(
      "SELECT id FROM notifications WHERE id=? AND user_id=?",
      [id, userId],
    );
    if (!owned) throw new ApiError(404, "Notification not found");
  }
  return { id: Number(id), isRead: true };
}

export async function markAllAsRead(userId) {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read=TRUE,read_at=CURRENT_TIMESTAMP WHERE user_id=? AND is_read=FALSE",
    [userId],
  );
  return { updated: result.affectedRows };
}

export async function getPreferences(userId) {
  await pool.execute(
    "INSERT IGNORE INTO notification_preferences(user_id) VALUES(?)",
    [userId],
  );
  const [[row]] = await pool.execute(
    `SELECT browser_notifications AS desktopEnabled,sound_enabled AS soundEnabled,task_notifications AS taskEnabled,
     leave_notifications AS leaveEnabled,break_notifications AS breakEnabled,
     attendance_notifications AS attendanceEnabled,announcement_notifications AS announcementEnabled
     FROM notification_preferences WHERE user_id=?`,
    [userId],
  );
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Boolean(value)]),
  );
}

export async function updatePreferences(userId, data) {
  await pool.execute(
    "INSERT IGNORE INTO notification_preferences(user_id) VALUES(?)",
    [userId],
  );
  await pool.execute(
    `INSERT INTO notification_preferences(user_id,browser_notifications,sound_enabled,task_notifications,leave_notifications,break_notifications,attendance_notifications,announcement_notifications)
     VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE browser_notifications=VALUES(browser_notifications),sound_enabled=VALUES(sound_enabled),task_notifications=VALUES(task_notifications),leave_notifications=VALUES(leave_notifications),break_notifications=VALUES(break_notifications),attendance_notifications=VALUES(attendance_notifications),announcement_notifications=VALUES(announcement_notifications)`,
    [
      userId,
      data.desktopEnabled,
      data.soundEnabled,
      data.taskEnabled,
      data.leaveEnabled,
      data.breakEnabled,
      data.attendanceEnabled,
      data.announcementEnabled,
    ],
  );
  return getPreferences(userId);
}
