import pool from "../config/database.js";
import { isCeoUser } from "../middleware/ceo.middleware.js";
import ApiError from "../utils/ApiError.js";
import { recordTwofaActivity } from "./twofaActivity.service.js";

const inaccessible = () =>
  new ApiError(404, "2FA profile not found", "TWOFA_PROFILE_NOT_FOUND");

function requireEmployee(actor) {
  if (!actor?.employee_id)
    throw new ApiError(
      403,
      "An employee account is required to use 2FA Manager",
      "TWOFA_EMPLOYEE_REQUIRED",
    );
}

const profileSelect = `
  SELECT p.id,p.profile_name profileName,
    p.created_by createdByUserId,cu.employee_id createdByEmployeeId,
    COALESCE(CONCAT(ce.first_name,' ',ce.last_name),cu.email) createdByName,
    p.updated_by updatedByUserId,uu.employee_id updatedByEmployeeId,
    COALESCE(CONCAT(ue.first_name,' ',ue.last_name),uu.email) updatedByName,
    p.created_at createdAt,p.updated_at updatedAt,
    (SELECT COUNT(*) FROM twofa_platforms tp
      WHERE tp.profile_id=p.id AND tp.deleted_at IS NULL) platformCount
  FROM twofa_profiles p
  JOIN users cu ON cu.id=p.created_by
  LEFT JOIN employees ce ON ce.id=cu.employee_id
  JOIN users uu ON uu.id=p.updated_by
  LEFT JOIN employees ue ON ue.id=uu.employee_id`;

const present = (row) => ({
  id: Number(row.id),
  profileName: row.profileName,
  createdBy: {
    userId: Number(row.createdByUserId),
    employeeId: row.createdByEmployeeId
      ? Number(row.createdByEmployeeId)
      : null,
    name: row.createdByName,
  },
  updatedBy: {
    userId: Number(row.updatedByUserId),
    employeeId: row.updatedByEmployeeId
      ? Number(row.updatedByEmployeeId)
      : null,
    name: row.updatedByName,
  },
  platformCount: Number(row.platformCount || 0),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

async function hasProfileAccess(executor, profile, actor) {
  if (Number(profile.created_by) === Number(actor.id)) return true;
  if (await isCeoUser(actor.id, executor)) return true;
  const [[access]] = await executor.execute(
    `SELECT 1 allowed FROM twofa_profile_access
     WHERE profile_id=? AND employee_id=? LIMIT 1`,
    [profile.id, actor.employee_id],
  );
  return Boolean(access);
}

async function recordDenied(profileId, actor, operation, context, executor = pool) {
  await recordTwofaActivity(executor, {
    profileId,
    actor,
    action: "ACCESS_DENIED",
    context,
    eventStatus: "FAILURE",
    metadata: { operation },
  });
}

async function activeProfile(executor, id, lock = false) {
  const [[profile]] = await executor.execute(
    `SELECT id,created_by FROM twofa_profiles
     WHERE id=? AND deleted_at IS NULL${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  return profile || null;
}

async function getPresentation(executor, id) {
  const [[row]] = await executor.execute(
    `${profileSelect} WHERE p.id=? AND p.deleted_at IS NULL`,
    [id],
  );
  return row ? present(row) : null;
}

export async function createProfile(data, actor, context, database = pool) {
  requireEmployee(actor);
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [created] = await connection.execute(
      `INSERT INTO twofa_profiles(profile_name,created_by,updated_by)
       VALUES(?,?,?)`,
      [data.profileName, actor.id, actor.id],
    );
    await connection.execute(
      `INSERT INTO twofa_profile_access(
         profile_id,employee_id,access_type,granted_by
       ) VALUES(?,?,'OWNER',?)`,
      [created.insertId, actor.employee_id, actor.id],
    );
    await recordTwofaActivity(connection, {
      profileId: created.insertId,
      actor,
      action: "PROFILE_CREATED",
      changedFields: ["profile_name"],
      context,
    });
    const profile = await getPresentation(connection, created.insertId);
    await connection.commit();
    return profile;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listProfiles(query, actor, database = pool) {
  requireEmployee(actor);
  const canViewAll = await isCeoUser(actor.id, database);
  const where = ["p.deleted_at IS NULL"];
  const params = [];
  if (!canViewAll) {
    where.push(`(
      p.created_by=? OR EXISTS(
        SELECT 1 FROM twofa_profile_access pa
        WHERE pa.profile_id=p.id AND pa.employee_id=?
      )
    )`);
    params.push(actor.id, actor.employee_id);
  }
  if (query.search) {
    where.push("p.profile_name LIKE ?");
    params.push(`%${query.search}%`);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const orderColumns = {
    createdAt: "p.created_at",
    updatedAt: "p.updated_at",
    profileName: "p.profile_name",
  };
  const orderColumn = orderColumns[query.sortBy];
  const orderDirection = query.sortOrder === "ASC" ? "ASC" : "DESC";
  const offset = (query.page - 1) * query.limit;
  const [[count]] = await database.execute(
    `SELECT COUNT(*) total FROM twofa_profiles p ${clause}`,
    params,
  );
  const [rows] = await database.execute(
    `${profileSelect} ${clause}
     ORDER BY ${orderColumn} ${orderDirection},p.id ${orderDirection}
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  const total = Number(count.total);
  return {
    rows: rows.map(present),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getProfile(id, actor, context, database = pool) {
  requireEmployee(actor);
  const profile = await activeProfile(database, id);
  if (!profile) throw inaccessible();
  if (!(await hasProfileAccess(database, profile, actor))) {
    await recordDenied(profile.id, actor, "VIEW_PROFILE", context, database);
    throw inaccessible();
  }
  const result = await getPresentation(database, id);
  if (!result) throw inaccessible();
  return result;
}

export async function updateProfile(id, data, actor, context, database = pool) {
  requireEmployee(actor);
  const connection = await database.getConnection();
  let deniedProfileId = null;
  try {
    await connection.beginTransaction();
    const [[profile]] = await connection.execute(
      `SELECT id,profile_name,created_by FROM twofa_profiles
       WHERE id=? AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!profile) throw inaccessible();
    if (!(await hasProfileAccess(connection, profile, actor))) {
      deniedProfileId = profile.id;
      await connection.rollback();
    } else if (profile.profile_name === data.profileName) {
      const unchanged = await getPresentation(connection, id);
      await connection.commit();
      return { ...unchanged, changed: false };
    } else {
      await connection.execute(
        `UPDATE twofa_profiles
         SET profile_name=?,updated_by=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [data.profileName, actor.id, id],
      );
      await recordTwofaActivity(connection, {
        profileId: id,
        actor,
        action: "PROFILE_UPDATED",
        changedFields: ["profile_name"],
        context,
      });
      const updated = await getPresentation(connection, id);
      await connection.commit();
      return { ...updated, changed: true };
    }
  } catch (error) {
    if (!deniedProfileId) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await recordDenied(deniedProfileId, actor, "UPDATE_PROFILE", context, database);
  throw inaccessible();
}

export async function deleteProfile(id, actor, context, database = pool) {
  requireEmployee(actor);
  const connection = await database.getConnection();
  let deniedProfileId = null;
  try {
    await connection.beginTransaction();
    const [[profile]] = await connection.execute(
      `SELECT id,created_by FROM twofa_profiles
       WHERE id=? AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!profile) throw inaccessible();
    if (!(await hasProfileAccess(connection, profile, actor))) {
      deniedProfileId = profile.id;
      await connection.rollback();
    } else {
      await connection.execute(
        `UPDATE twofa_platforms
         SET deleted_at=CURRENT_TIMESTAMP,deleted_by=?,updated_by=?
         WHERE profile_id=? AND deleted_at IS NULL`,
        [actor.id, actor.id, id],
      );
      await connection.execute(
        `UPDATE twofa_profiles
         SET deleted_at=CURRENT_TIMESTAMP,deleted_by=?,updated_by=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [actor.id, actor.id, id],
      );
      await recordTwofaActivity(connection, {
        profileId: id,
        actor,
        action: "PROFILE_DELETED",
        changedFields: ["deleted_at"],
        context,
      });
      await connection.commit();
      return { id: Number(id) };
    }
  } catch (error) {
    if (!deniedProfileId) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await recordDenied(deniedProfileId, actor, "DELETE_PROFILE", context, database);
  throw inaccessible();
}
