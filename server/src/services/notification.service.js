import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { emitNotification } from "../sockets/notification.socket.js";

const select = `SELECT id,user_id AS userId,type,category,title,message,reference_type AS referenceType,
  reference_id AS referenceId,action_url AS actionUrl,priority,is_read AS isRead,in_app_allowed AS inAppAllowed,desktop_allowed AS desktopAllowed,sound_allowed AS soundAllowed,created_at AS createdAt,read_at AS readAt
  FROM notifications`;

export function categoryFor(type = "") {
  const prefix = String(type).split("_")[0];
  if (["CLOCK", "LATE", "HALF", "ON"].includes(prefix)) return "ATTENDANCE";
  if (prefix === "BREAK") return "BREAK";
  if (prefix === "LEAVE") return "LEAVE";
  if (["CALENDAR", "HOLIDAY"].includes(prefix)) return "CALENDAR";
  if (prefix === "TASK" || type === "OPEN_TASK_CREATED") return "TASK";
  if (prefix === "NOTE") return "NOTE";
  if (prefix === "AVAILABILITY") return "AVAILABILITY";
  if (["PAYROLL", "PAYSLIP", "SALARY"].includes(prefix)) return "PAYROLL";
  if (prefix === "SECURITY") return "SECURITY";
  if (prefix === "EMPLOYEE") return "EMPLOYEE";
  if (prefix === "SHIFT") return "SHIFT";
  if (["ANNOUNCEMENT", "SYSTEM"].includes(prefix)) return "ANNOUNCEMENT";
  return "SYSTEM";
}

const categoryPreference = {
  ATTENDANCE: "attendance_notifications",
  BREAK: "break_notifications",
  LEAVE: "leave_notifications",
  CALENDAR: "calendar_notifications",
  TASK: "task_notifications",
  NOTE: "note_notifications",
  PAYROLL: "payroll_notifications",
  AVAILABILITY: "availability_notifications",
  SECURITY: "security_notifications",
  EMPLOYEE: "employee_notifications",
  SHIFT: "shift_notifications",
  ANNOUNCEMENT: "announcement_notifications",
  SYSTEM: "announcement_notifications",
};

async function resolveDelivery(userId, type, requested = {}) {
  const category = categoryFor(type);
  const column = categoryPreference[category];
  const [[row]] = await pool.execute(
    `SELECT COALESCE(np.notifications_enabled,TRUE) notificationsEnabled,
      COALESCE(np.in_app_enabled,TRUE) globalInApp,
      COALESCE(np.browser_notifications,FALSE) globalDesktop,
      COALESCE(np.sound_enabled,TRUE) globalSound,
      COALESCE(np.do_not_disturb,FALSE) doNotDisturb,
      COALESCE(np.${column},TRUE) categoryEnabled,
      ep.in_app_enabled eventInApp,ep.desktop_enabled eventDesktop,ep.sound_enabled eventSound
     FROM users u LEFT JOIN notification_preferences np ON np.user_id=u.id
     LEFT JOIN notification_event_preferences ep ON ep.user_id=u.id AND ep.event_type=?
     WHERE u.id=? AND u.status='ACTIVE'`,
    [type, userId],
  );
  if (!row || !row.notificationsEnabled || !row.categoryEnabled) return null;
  const dnd = Boolean(row.doNotDisturb);
  return {
    inApp:
      Boolean(row.globalInApp) &&
      requested.inApp !== false &&
      row.eventInApp !== 0,
    desktop:
      !dnd &&
      Boolean(row.globalDesktop) &&
      requested.desktop !== false &&
      row.eventDesktop !== 0,
    sound:
      !dnd &&
      Boolean(row.globalSound) &&
      requested.sound !== false &&
      row.eventSound !== 0,
  };
}

export async function createNotification(data, executor = pool) {
  const [result] = await executor.execute(
    `INSERT IGNORE INTO notifications(user_id,type,category,title,message,reference_type,reference_id,action_url,priority,event_key,in_app_allowed,desktop_allowed,sound_allowed)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.userId,
      data.type,
      data.category || categoryFor(data.type),
      data.title,
      data.message,
      data.referenceType || null,
      data.referenceId || null,
      data.actionUrl || null,
      data.priority || "NORMAL",
      data.eventKey || null,
      data.delivery?.inApp ?? true,
      data.delivery?.desktop ?? true,
      data.delivery?.sound ?? true,
    ],
  );
  if (!result.insertId) return null;
  const [[notification]] = await executor.execute(`${select} WHERE id=?`, [
    result.insertId,
  ]);
  return notification;
}

export async function notifyUser(data) {
  const delivery = await resolveDelivery(data.userId, data.type, data.delivery);
  if (!delivery || !Object.values(delivery).some(Boolean)) return null;
  const notification = await createNotification({ ...data, delivery });
  if (!notification) return null;
  emitNotification(notification);
  return notification;
}

export async function notifyByPolicy(eventType, actor, data) {
  const [[policy]] = await pool.execute(
    "SELECT * FROM notification_policies WHERE event_type=? AND enabled=TRUE AND audience_type<>'NOBODY'",
    [eventType],
  );
  if (!policy) return [];
  const conditions = [];
  const params = [];
  if (policy.audience_type === "CEO_ADMIN")
    conditions.push("UPPER(r.name) IN('CEO','ADMIN')");
  else if (policy.audience_type === "MANAGERS")
    conditions.push("UPPER(r.name) LIKE '%MANAGER%'");
  else if (policy.audience_type === "SAME_DEPARTMENT") {
    conditions.push(
      "e.department=(SELECT department FROM employees WHERE id=?)",
    );
    params.push(actor.employee_id);
  } else if (
    policy.audience_type === "SELECTED_ROLES" &&
    (!data.recipientUserIds || data.respectAudience)
  ) {
    conditions.push(
      "r.id IN(SELECT role_id FROM notification_policy_roles WHERE policy_id=?)",
    );
    params.push(policy.id);
  } else if (
    policy.audience_type === "SELECTED_EMPLOYEES" &&
    (!data.recipientUserIds || data.respectAudience)
  ) {
    conditions.push(
      "e.id IN(SELECT employee_id FROM notification_policy_employees WHERE policy_id=?)",
    );
    params.push(policy.id);
  } else conditions.push("1=1");
  if (data.recipientUserIds) {
    const recipients = [
      ...new Set(data.recipientUserIds.map(Number).filter(Boolean)),
    ];
    if (!recipients.length) return [];
    conditions.push(`u.id IN(${recipients.map(() => "?").join(",")})`);
    params.push(...recipients);
  }
  if (!policy.notify_actor) {
    conditions.push("u.id<>?");
    params.push(actor.id);
  }
  const [users] = await pool.execute(
    `SELECT DISTINCT u.id FROM users u JOIN employees e ON e.id=u.employee_id LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND ${conditions.join(" AND ")}`,
    [...params],
  );
  const { recipientUserIds: _, respectAudience: __, ...notification } = data;
  return Promise.all(
    users.map(({ id }) =>
      notifyUser({
        ...notification,
        userId: id,
        type: eventType,
        eventKey: data.eventKey
          ? `${data.eventKey}:${id}`
          : `${eventType}:${data.referenceId}:${id}`,
        delivery: {
          inApp: Boolean(policy.in_app_enabled),
          desktop: Boolean(policy.desktop_enabled),
          sound: Boolean(policy.sound_enabled),
          push: Boolean(policy.push_enabled),
        },
      }),
    ),
  );
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
  const where = ["user_id=?", "in_app_allowed=TRUE"],
    params = [userId];
  if (filters.unread) where.push("is_read=FALSE");
  if (filters.category) {
    where.push("category=?");
    params.push(filters.category);
  }
  if (filters.type) {
    where.push("type=?");
    params.push(filters.type);
  }
  if (filters.search) {
    where.push("(title LIKE ? OR message LIKE ?)");
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.from) {
    where.push("created_at>=?");
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    where.push("created_at<DATE_ADD(?,INTERVAL 1 DAY)");
    params.push(`${filters.to} 00:00:00`);
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
    "SELECT COUNT(*) count FROM notifications WHERE user_id=? AND in_app_allowed=TRUE AND is_read=FALSE",
    [userId],
  );
  return Number(row.count);
}

export async function markAsRead(id, userId) {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read=TRUE,read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE id=? AND user_id=? AND in_app_allowed=TRUE",
    [id, userId],
  );
  if (!result.affectedRows) {
    const [[owned]] = await pool.execute(
      "SELECT id FROM notifications WHERE id=? AND user_id=? AND in_app_allowed=TRUE",
      [id, userId],
    );
    if (!owned) throw new ApiError(404, "Notification not found");
  }
  return { id: Number(id), isRead: true };
}

export async function markAllAsRead(userId) {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read=TRUE,read_at=CURRENT_TIMESTAMP WHERE user_id=? AND in_app_allowed=TRUE AND is_read=FALSE",
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
    `SELECT notifications_enabled AS notificationsEnabled,in_app_enabled AS inAppEnabled,browser_notifications AS desktopEnabled,sound_enabled AS soundEnabled,do_not_disturb AS doNotDisturb,volume,
     task_notifications AS taskEnabled,note_notifications AS noteEnabled,
     leave_notifications AS leaveEnabled,break_notifications AS breakEnabled,
     attendance_notifications AS attendanceEnabled,availability_notifications AS availabilityEnabled,announcement_notifications AS announcementEnabled,
     calendar_notifications AS calendarEnabled,payroll_notifications AS payrollEnabled,
     security_notifications AS securityEnabled,employee_notifications AS employeeEnabled,shift_notifications AS shiftEnabled
     FROM notification_preferences WHERE user_id=?`,
    [userId],
  );
  const [events] = await pool.execute(
    "SELECT event_type eventType,in_app_enabled inAppEnabled,desktop_enabled desktopEnabled,sound_enabled soundEnabled FROM notification_event_preferences WHERE user_id=? ORDER BY event_type",
    [userId],
  );
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      key === "volume" ? Number(value) : Boolean(value),
    ]),
  );
  normalized.eventPreferences = events.map((e) => ({
    ...e,
    inAppEnabled: e.inAppEnabled === null ? null : Boolean(e.inAppEnabled),
    desktopEnabled:
      e.desktopEnabled === null ? null : Boolean(e.desktopEnabled),
    soundEnabled: e.soundEnabled === null ? null : Boolean(e.soundEnabled),
  }));
  return normalized;
}

export async function updatePreferences(userId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "INSERT IGNORE INTO notification_preferences(user_id) VALUES(?)",
      [userId],
    );
    await connection.execute(
      `INSERT INTO notification_preferences(user_id,notifications_enabled,in_app_enabled,browser_notifications,sound_enabled,do_not_disturb,volume,task_notifications,note_notifications,leave_notifications,break_notifications,attendance_notifications,availability_notifications,announcement_notifications,calendar_notifications,payroll_notifications,security_notifications,employee_notifications,shift_notifications)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE notifications_enabled=VALUES(notifications_enabled),in_app_enabled=VALUES(in_app_enabled),browser_notifications=VALUES(browser_notifications),sound_enabled=VALUES(sound_enabled),do_not_disturb=VALUES(do_not_disturb),volume=VALUES(volume),task_notifications=VALUES(task_notifications),note_notifications=VALUES(note_notifications),leave_notifications=VALUES(leave_notifications),break_notifications=VALUES(break_notifications),attendance_notifications=VALUES(attendance_notifications),availability_notifications=VALUES(availability_notifications),announcement_notifications=VALUES(announcement_notifications),calendar_notifications=VALUES(calendar_notifications),payroll_notifications=VALUES(payroll_notifications),security_notifications=VALUES(security_notifications),employee_notifications=VALUES(employee_notifications),shift_notifications=VALUES(shift_notifications)`,
      [
        userId,
        data.notificationsEnabled,
        data.inAppEnabled,
        data.desktopEnabled,
        data.soundEnabled,
        data.doNotDisturb,
        data.volume,
        data.taskEnabled,
        data.noteEnabled,
        data.leaveEnabled,
        data.breakEnabled,
        data.attendanceEnabled,
        data.availabilityEnabled,
        data.announcementEnabled,
        data.calendarEnabled,
        data.payrollEnabled,
        data.securityEnabled,
        data.employeeEnabled,
        data.shiftEnabled,
      ],
    );
    for (const event of data.eventPreferences || [])
      await connection.execute(
        `INSERT INTO notification_event_preferences(user_id,event_type,in_app_enabled,desktop_enabled,sound_enabled)
     VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE in_app_enabled=VALUES(in_app_enabled),desktop_enabled=VALUES(desktop_enabled),sound_enabled=VALUES(sound_enabled)`,
        [
          userId,
          event.eventType,
          event.inAppEnabled,
          event.desktopEnabled,
          event.soundEnabled,
        ],
      );
    await connection.execute(
      "INSERT INTO audit_logs(user_id,action,entity_type,description) VALUES(?,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE','Notification preferences were updated.')",
      [userId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getPreferences(userId);
}

export async function sendTestNotification(userId) {
  return notifyUser({
    userId,
    type: "TEST_NOTIFICATION",
    title: "Test notification",
    message: "Your notification system is working correctly.",
    referenceType: "SYSTEM",
    eventKey: `TEST_NOTIFICATION:${userId}:${Date.now()}`,
    priority: "IMPORTANT",
    delivery: { inApp: true, desktop: true, sound: true },
  });
}
