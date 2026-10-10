import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import {
  decryptTwofaValue,
  encryptTwofaValue,
} from "../utils/twofaEncryption.js";
import { recordTwofaActivity } from "./twofaActivity.service.js";
import {
  getTwofaProfileAuthorization,
  recordTwofaAccessDenied,
  requireTwofaEmployee,
  TWOFA_PROFILE_ACTION,
} from "./twofaAuthorization.service.js";

const platformNotFound = () =>
  new ApiError(404, "2FA platform not found", "TWOFA_PLATFORM_NOT_FOUND");
const profileNotFound = () =>
  new ApiError(404, "2FA profile not found", "TWOFA_PROFILE_NOT_FOUND");

const displayNames = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
  X_TWITTER: "X / Twitter",
  SNAPCHAT: "Snapchat",
  MICROSOFT: "Microsoft",
  OTHER: "Other",
};

const safeSelect = `
  SELECT tp.id,tp.profile_id profileId,tp.platform_name storedPlatformName,
    tp.platform_custom_name customPlatformName,tp.account_label accountLabel,
    (tp.twofa_information_ciphertext IS NOT NULL) hasTwofaInformation,
    (tp.auth_key_ciphertext IS NOT NULL) hasAuthKey,
    tp.created_by createdByUserId,cu.employee_id createdByEmployeeId,
    COALESCE(CONCAT(ce.first_name,' ',ce.last_name),cu.email) createdByName,
    tp.updated_by updatedByUserId,uu.employee_id updatedByEmployeeId,
    COALESCE(CONCAT(ue.first_name,' ',ue.last_name),uu.email) updatedByName,
    tp.created_at createdAt,tp.updated_at updatedAt
  FROM twofa_platforms tp
  LEFT JOIN users cu ON cu.id=tp.created_by
  LEFT JOIN employees ce ON ce.id=cu.employee_id
  LEFT JOIN users uu ON uu.id=tp.updated_by
  LEFT JOIN employees ue ON ue.id=uu.employee_id`;

const present = (row) => ({
  id: Number(row.id),
  profileId: Number(row.profileId),
  platformName: displayNames[row.storedPlatformName] || row.storedPlatformName,
  platformType: row.storedPlatformName,
  customPlatformName: row.customPlatformName || null,
  accountLabel: row.accountLabel || null,
  hasTwofaInformation: Boolean(row.hasTwofaInformation),
  hasAuthKey: Boolean(row.hasAuthKey),
  createdBy: {
    userId: row.createdByUserId ? Number(row.createdByUserId) : null,
    employeeId: row.createdByEmployeeId
      ? Number(row.createdByEmployeeId)
      : null,
    name: row.createdByName,
  },
  updatedBy: {
    userId: row.updatedByUserId ? Number(row.updatedByUserId) : null,
    employeeId: row.updatedByEmployeeId
      ? Number(row.updatedByEmployeeId)
      : null,
    name: row.updatedByName,
  },
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const encryptedBundle = (value, context, field) => {
  if (value === undefined) return { ciphertext: null, iv: null, tag: null };
  return encryptTwofaValue(value, context, field);
};

async function safePlatform(executor, id) {
  const [[row]] = await executor.execute(
    `${safeSelect} WHERE tp.id=? AND tp.deleted_at IS NULL`,
    [id],
  );
  return row ? present(row) : null;
}

async function deniedPlatform(
  executor,
  platform,
  actor,
  operation,
  context,
) {
  await recordTwofaActivity(executor, {
    profileId: platform.profile_id,
    platformId: platform.id,
    actor,
    action: "ACCESS_DENIED",
    context,
    eventStatus: "FAILURE",
    metadata: { operation },
  });
}

async function insertPlatform(connection, profileId, data, actor, context) {
  const encryptionContext = randomUUID();
  const twofa = encryptedBundle(
    data.twofaInformation,
    encryptionContext,
    "twofa_information",
  );
  const authKey = encryptedBundle(
    data.authKey,
    encryptionContext,
    "auth_key",
  );
  const keyVersion = twofa.version || authKey.version;
  const [created] = await connection.execute(
    `INSERT INTO twofa_platforms(
       profile_id,platform_name,platform_custom_name,account_label,encryption_context,
       twofa_information_ciphertext,twofa_information_iv,twofa_information_tag,
       auth_key_ciphertext,auth_key_iv,auth_key_tag,encryption_key_version,
       created_by,updated_by
     ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      profileId,
      data.platformName,
      data.customPlatformName || null,
      data.accountLabel || null,
      encryptionContext,
      twofa.ciphertext,
      twofa.iv,
      twofa.tag,
      authKey.ciphertext,
      authKey.iv,
      authKey.tag,
      keyVersion,
      actor.id,
      actor.id,
    ],
  );
  await recordTwofaActivity(connection, {
    profileId,
    platformId: created.insertId,
    actor,
    action: "PLATFORM_ADDED",
    changedFields: [
      "platform_name",
      ...(data.customPlatformName ? ["platform_custom_name"] : []),
      ...(data.accountLabel ? ["account_label"] : []),
      ...(data.twofaInformation ? ["twofa_information"] : []),
      ...(data.authKey ? ["auth_key"] : []),
    ],
    context,
    metadata: {
      platformType: data.platformName,
      accountLabel: data.accountLabel || null,
    },
  });
  return safePlatform(connection, created.insertId);
}

export async function addPlatforms(
  profileId,
  platforms,
  actor,
  context,
  database = pool,
) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = null;
  try {
    await connection.beginTransaction();
    const authorization = await getTwofaProfileAuthorization(
      connection, profileId, actor, TWOFA_PROFILE_ACTION.EDIT, { lock: true },
    );
    if (!authorization.profile) throw profileNotFound();
    if (!authorization.allowed) {
      denied = authorization.profile.id;
      await connection.rollback();
    } else {
      const created = [];
      for (const platform of platforms)
        created.push(
          await insertPlatform(connection, authorization.profile.id, platform, actor, context),
        );
      await connection.commit();
      return created;
    }
  } catch (error) {
    if (!denied) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await recordTwofaAccessDenied(
    denied,
    actor,
    "ADD_PLATFORM",
    context,
    database,
  );
  throw profileNotFound();
}

export async function listPlatforms(
  profileId,
  actor,
  context,
  database = pool,
) {
  requireTwofaEmployee(actor);
  const authorization = await getTwofaProfileAuthorization(
    database, profileId, actor, TWOFA_PROFILE_ACTION.VIEW,
  );
  if (!authorization.profile) throw profileNotFound();
  if (!authorization.allowed) {
    await recordTwofaAccessDenied(
      authorization.profile.id,
      actor,
      "LIST_PLATFORMS",
      context,
      database,
    );
    throw profileNotFound();
  }
  const [rows] = await database.execute(
    `${safeSelect}
     WHERE tp.profile_id=? AND tp.deleted_at IS NULL
     ORDER BY tp.created_at,tp.id`,
    [profileId],
  );
  return rows.map(present);
}

async function lockedPlatform(connection, platformId) {
  const [[row]] = await connection.execute(
    `SELECT tp.*,p.created_by profile_created_by
     FROM twofa_platforms tp
     JOIN twofa_profiles p ON p.id=tp.profile_id AND p.deleted_at IS NULL
     WHERE tp.id=? AND tp.deleted_at IS NULL FOR UPDATE`,
    [platformId],
  );
  return row || null;
}

export async function updatePlatform(
  platformId,
  data,
  actor,
  context,
  database = pool,
) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = null;
  try {
    await connection.beginTransaction();
    const platform = await lockedPlatform(connection, platformId);
    if (!platform) throw platformNotFound();
    const profile = {
      id: platform.profile_id,
      created_by: platform.profile_created_by,
    };
    const authorization = await getTwofaProfileAuthorization(
      connection, profile.id, actor, TWOFA_PROFILE_ACTION.EDIT,
    );
    if (!authorization.allowed) {
      denied = platform;
      await connection.rollback();
    } else {
      const has = (field) => Object.prototype.hasOwnProperty.call(data, field);
      const nextPlatformName = data.platformName || platform.platform_name;
      let nextCustomName = platform.platform_custom_name;
      if (nextPlatformName === "OTHER") {
        if (has("customPlatformName")) nextCustomName = data.customPlatformName;
        if (!nextCustomName)
          throw new ApiError(400, "Custom platform name is required for Other");
      } else {
        if (has("customPlatformName") && data.customPlatformName)
          throw new ApiError(
            400,
            "Custom platform name is only allowed for Other",
          );
        nextCustomName = null;
      }
      const nextAccountLabel = has("accountLabel")
        ? data.accountLabel
        : platform.account_label;
      let twofa = {
        ciphertext: platform.twofa_information_ciphertext,
        iv: platform.twofa_information_iv,
        tag: platform.twofa_information_tag,
      };
      let authKey = {
        ciphertext: platform.auth_key_ciphertext,
        iv: platform.auth_key_iv,
        tag: platform.auth_key_tag,
      };
      let keyVersion = platform.encryption_key_version;
      let twofaChanged = false;
      let authKeyChanged = false;
      if (has("twofaInformation")) {
        twofa = encryptTwofaValue(
          data.twofaInformation,
          platform.encryption_context,
          "twofa_information",
        );
        keyVersion = twofa.version;
        twofaChanged = true;
      } else if (data.clearTwofaInformation && twofa.ciphertext) {
        twofa = { ciphertext: null, iv: null, tag: null };
        twofaChanged = true;
      }
      if (has("authKey")) {
        authKey = encryptTwofaValue(
          data.authKey,
          platform.encryption_context,
          "auth_key",
        );
        keyVersion = authKey.version;
        authKeyChanged = true;
      } else if (data.clearAuthKey && authKey.ciphertext) {
        authKey = { ciphertext: null, iv: null, tag: null };
        authKeyChanged = true;
      }
      if (!twofa.ciphertext && !authKey.ciphertext)
        throw new ApiError(
          400,
          "At least one credential value must remain on the platform",
        );
      const metadataFields = [];
      if (nextPlatformName !== platform.platform_name)
        metadataFields.push("platform_name");
      if (nextCustomName !== platform.platform_custom_name)
        metadataFields.push("platform_custom_name");
      if (nextAccountLabel !== platform.account_label)
        metadataFields.push("account_label");
      if (!metadataFields.length && !twofaChanged && !authKeyChanged) {
        const unchanged = await safePlatform(connection, platformId);
        await connection.commit();
        return { ...unchanged, changed: false };
      }
      await connection.execute(
        `UPDATE twofa_platforms SET
           platform_name=?,platform_custom_name=?,account_label=?,
           twofa_information_ciphertext=?,twofa_information_iv=?,twofa_information_tag=?,
           auth_key_ciphertext=?,auth_key_iv=?,auth_key_tag=?,encryption_key_version=?,
           updated_by=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [
          nextPlatformName,
          nextCustomName,
          nextAccountLabel,
          twofa.ciphertext,
          twofa.iv,
          twofa.tag,
          authKey.ciphertext,
          authKey.iv,
          authKey.tag,
          keyVersion,
          actor.id,
          platformId,
        ],
      );
      if (metadataFields.length)
        await recordTwofaActivity(connection, {
          profileId: profile.id,
          platformId,
          actor,
          action: "PLATFORM_UPDATED",
          changedFields: metadataFields,
          context,
          metadata: {
            platformType: nextPlatformName,
            accountLabel: nextAccountLabel || null,
          },
        });
      if (twofaChanged)
        await recordTwofaActivity(connection, {
          profileId: profile.id,
          platformId,
          actor,
          action: "TWOFA_UPDATED",
          changedFields: ["twofa_information"],
          context,
          metadata: {
            changeType: data.clearTwofaInformation
              ? "CLEARED"
              : platform.twofa_information_ciphertext ? "UPDATED" : "ADDED",
          },
        });
      if (authKeyChanged)
        await recordTwofaActivity(connection, {
          profileId: profile.id,
          platformId,
          actor,
          action: "AUTH_KEY_UPDATED",
          changedFields: ["auth_key"],
          context,
          metadata: {
            changeType: data.clearAuthKey
              ? "CLEARED"
              : platform.auth_key_ciphertext ? "UPDATED" : "ADDED",
          },
        });
      const updated = await safePlatform(connection, platformId);
      await connection.commit();
      return { ...updated, changed: true };
    }
  } catch (error) {
    if (!denied) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await deniedPlatform(database, denied, actor, "UPDATE_PLATFORM", context);
  throw platformNotFound();
}

export async function removePlatform(
  platformId,
  actor,
  context,
  database = pool,
) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = null;
  try {
    await connection.beginTransaction();
    const platform = await lockedPlatform(connection, platformId);
    if (!platform) throw platformNotFound();
    const profile = {
      id: platform.profile_id,
      created_by: platform.profile_created_by,
    };
    const authorization = await getTwofaProfileAuthorization(
      connection, profile.id, actor, TWOFA_PROFILE_ACTION.EDIT,
    );
    if (!authorization.allowed) {
      denied = platform;
      await connection.rollback();
    } else {
      await connection.execute(
        `UPDATE twofa_platforms
         SET deleted_at=CURRENT_TIMESTAMP,deleted_by=?,updated_by=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [actor.id, actor.id, platformId],
      );
      await recordTwofaActivity(connection, {
        profileId: profile.id,
        platformId,
        actor,
        action: "PLATFORM_REMOVED",
        changedFields: ["deleted_at"],
        context,
        metadata: {
          platformType: platform.platform_name,
          accountLabel: platform.account_label || null,
        },
      });
      await connection.commit();
      return { id: Number(platformId), profileId: Number(profile.id) };
    }
  } catch (error) {
    if (!denied) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await deniedPlatform(database, denied, actor, "DELETE_PLATFORM", context);
  throw platformNotFound();
}

export async function revealCredential(
  platformId,
  field,
  actor,
  context,
  options = {},
  database = pool,
) {
  requireTwofaEmployee(actor);
  const connection = await database.getConnection();
  let denied = null;
  let rejection = null;
  try {
    await connection.beginTransaction();
    const platform = await lockedPlatform(connection, platformId);
    if (!platform) throw platformNotFound();
    const profile = {
      id: platform.profile_id,
      created_by: platform.profile_created_by,
    };
    const action = field === "auth_key"
      ? TWOFA_PROFILE_ACTION.REVEAL_AUTH_KEY
      : TWOFA_PROFILE_ACTION.REVEAL_TWOFA;
    const authorization = await getTwofaProfileAuthorization(
      connection, profile.id, actor, action,
    );
    if (!authorization.allowed) {
      denied = platform;
      await connection.rollback();
    } else {
      const isKey = field === "auth_key";
      if (isKey) {
        const [[user]] = await connection.execute(
          "SELECT password_hash FROM users WHERE id=? AND status='ACTIVE'",
          [actor.id],
        );
        if (
          !user ||
          !(await bcrypt.compare(options.currentPassword || "", user.password_hash))
        ) {
          await deniedPlatform(
            connection,
            platform,
            actor,
            "REVEAL_AUTH_KEY_REAUTHENTICATION",
            context,
          );
          await connection.commit();
          rejection = new ApiError(
            401,
            "Current password verification failed",
            "TWOFA_REAUTHENTICATION_FAILED",
          );
        }
      }
      if (!rejection) {
        const prefix = isKey ? "auth_key" : "twofa_information";
        const ciphertext = platform[`${prefix}_ciphertext`];
        if (!ciphertext)
          throw new ApiError(
            404,
            isKey
              ? "Authentication key is not stored for this platform"
              : "2FA information is not stored for this platform",
            "TWOFA_CREDENTIAL_NOT_FOUND",
          );
        const value = decryptTwofaValue(
          {
            ciphertext,
            iv: platform[`${prefix}_iv`],
            tag: platform[`${prefix}_tag`],
            version: platform.encryption_key_version,
          },
          platform.encryption_context,
          prefix,
        );
        await recordTwofaActivity(connection, {
          profileId: profile.id,
          platformId,
          actor,
          action: isKey ? "AUTH_KEY_REVEALED" : "TWOFA_REVEALED",
          context,
        });
        await connection.commit();
        return { value };
      }
    }
  } catch (error) {
    if (!denied && !rejection) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  if (rejection) throw rejection;
  await deniedPlatform(
    database,
    denied,
    actor,
    field === "auth_key" ? "REVEAL_AUTH_KEY" : "REVEAL_TWOFA",
    context,
  );
  throw platformNotFound();
}
