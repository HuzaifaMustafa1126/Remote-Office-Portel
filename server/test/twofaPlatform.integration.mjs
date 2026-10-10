import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

process.env.TWOFA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.TWOFA_ENCRYPTION_KEY_VERSION = "1";

const { default: env } = await import("../src/config/env.js");
const { createProfile } = await import("../src/services/twofa.service.js");
const {
  addPlatforms,
  listPlatforms,
  removePlatform,
  revealCredential,
  updatePlatform,
} = await import("../src/services/twofaPlatform.service.js");

const databaseName = `twofa_platform_test_${Date.now()}_${process.pid}`;
const admin = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: true,
});
let database;
const context = {
  ip: "127.0.0.1",
  userAgent: "2FA platform integration test",
  requestId: "phase-7.4-test",
};

try {
  await admin.query(
    `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  database = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: databaseName,
    connectionLimit: 4,
    multipleStatements: true,
    dateStrings: true,
  });
  await database.query(`
    CREATE TABLE employees (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(30) NOT NULL UNIQUE,
      first_name VARCHAR(80) NOT NULL,
      last_name VARCHAR(80) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id BIGINT UNSIGNED NULL UNIQUE,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      CONSTRAINT fk_platform_test_user_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE roles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE permissions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE user_roles (
      user_id BIGINT UNSIGNED NOT NULL,
      role_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY(user_id,role_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  for (const migrationName of [
    "075_twofa_manager_foundation.sql",
    "076_twofa_platform_credentials.sql",
    "077_twofa_employee_access_capabilities.sql",
    "078_twofa_activity_history_snapshots.sql",
  ]) {
    const migration = await fs.readFile(
      new URL(`../database/migrations/${migrationName}`, import.meta.url),
      "utf8",
    );
    await database.query(migration);
  }

  async function account(code, firstName, password) {
    const [employee] = await database.execute(
      "INSERT INTO employees(employee_code,first_name,last_name,email) VALUES(?,?,'Tester',?)",
      [code, firstName, `${code.toLowerCase()}@example.invalid`],
    );
    const hash = await bcrypt.hash(password, 4);
    const [user] = await database.execute(
      "INSERT INTO users(employee_id,email,password_hash) VALUES(?,?,?)",
      [employee.insertId, `${code.toLowerCase()}@example.invalid`, hash],
    );
    return { id: Number(user.insertId), employee_id: Number(employee.insertId) };
  }

  const ownerPassword = "Dummy owner password";
  const owner = await account("OWNER", "Owner", ownerPassword);
  const outsider = await account("OUTSIDER", "Outsider", "Dummy outsider password");
  const profile = await createProfile(
    { profileName: "Dummy Platform Profile" },
    owner,
    context,
    database,
  );

  const twofaSecret = "dummy manually entered 2FA information";
  const [instagram] = await addPlatforms(
    profile.id,
    [
      {
        platformName: "INSTAGRAM",
        accountLabel: "Main",
        twofaInformation: twofaSecret,
      },
    ],
    owner,
    context,
    database,
  );
  assert.equal(instagram.hasTwofaInformation, true);
  assert.equal(instagram.hasAuthKey, false);
  assert.equal(Object.hasOwn(instagram, "twofaInformation"), false);
  assert.equal(Object.hasOwn(instagram, "authKey"), false);

  const authSecret = "dummy auth key preserving spaces";
  const bulk = await addPlatforms(
    profile.id,
    [
      {
        platformName: "GOOGLE",
        accountLabel: "Primary",
        authKey: authSecret,
      },
      {
        platformName: "GOOGLE",
        accountLabel: "Backup",
        twofaInformation: "dummy backup information",
        authKey: "dummy backup key",
      },
    ],
    owner,
    context,
    database,
  );
  assert.equal(bulk.length, 2);
  assert.equal(bulk[0].platformType, "GOOGLE");
  assert.equal(bulk[1].platformType, "GOOGLE");

  const [[storedInstagram]] = await database.execute(
    `SELECT twofa_information_ciphertext ciphertext,
      twofa_information_iv iv,twofa_information_tag tag,
      auth_key_ciphertext authCiphertext,encryption_context encryptionContext
     FROM twofa_platforms WHERE id=?`,
    [instagram.id],
  );
  assert.ok(Buffer.isBuffer(storedInstagram.ciphertext));
  assert.equal(storedInstagram.iv.length, 12);
  assert.equal(storedInstagram.tag.length, 16);
  assert.equal(storedInstagram.authCiphertext, null);
  assert.equal(storedInstagram.ciphertext.includes(Buffer.from(twofaSecret)), false);

  const listed = await listPlatforms(profile.id, owner, context, database);
  assert.equal(listed.length, 3);
  const serializedList = JSON.stringify(listed);
  for (const forbidden of [
    "ciphertext",
    "encryptionContext",
    "encryptionKeyVersion",
    twofaSecret,
    authSecret,
  ])
    assert.equal(serializedList.includes(forbidden), false);

  await assert.rejects(
    addPlatforms(
      profile.id,
      [{ platformName: "FACEBOOK", authKey: "denied dummy key" }],
      outsider,
      context,
      database,
    ),
    (error) => error.statusCode === 404,
  );
  await assert.rejects(
    revealCredential(
      instagram.id,
      "twofa_information",
      outsider,
      context,
      {},
      database,
    ),
    (error) => error.statusCode === 404,
  );

  const beforeMetadataUpdate = Buffer.from(storedInstagram.ciphertext);
  const renamed = await updatePlatform(
    instagram.id,
    { accountLabel: "Updated Main" },
    owner,
    context,
    database,
  );
  assert.equal(renamed.accountLabel, "Updated Main");
  assert.equal(renamed.updatedBy.employeeId, owner.employee_id);
  const [[afterMetadataUpdate]] = await database.execute(
    "SELECT twofa_information_ciphertext ciphertext FROM twofa_platforms WHERE id=?",
    [instagram.id],
  );
  assert.deepEqual(afterMetadataUpdate.ciphertext, beforeMetadataUpdate);

  const replacementTwofa = "replacement dummy 2FA information";
  const replacementKey = "replacement dummy authentication key";
  await updatePlatform(
    instagram.id,
    { twofaInformation: replacementTwofa, authKey: replacementKey },
    owner,
    context,
    database,
  );
  assert.equal(
    (
      await revealCredential(
        instagram.id,
        "twofa_information",
        owner,
        context,
        {},
        database,
      )
    ).value,
    replacementTwofa,
  );
  await assert.rejects(
    revealCredential(
      instagram.id,
      "auth_key",
      owner,
      context,
      { currentPassword: "wrong dummy password" },
      database,
    ),
    (error) =>
      error.statusCode === 401 && error.code === "TWOFA_REAUTHENTICATION_FAILED",
  );
  assert.equal(
    (
      await revealCredential(
        instagram.id,
        "auth_key",
        owner,
        context,
        { currentPassword: ownerPassword },
        database,
      )
    ).value,
    replacementKey,
  );

  const cleared = await updatePlatform(
    instagram.id,
    { clearTwofaInformation: true },
    owner,
    context,
    database,
  );
  assert.equal(cleared.hasTwofaInformation, false);
  assert.equal(cleared.hasAuthKey, true);
  await assert.rejects(
    updatePlatform(
      instagram.id,
      { clearAuthKey: true },
      owner,
      context,
      database,
    ),
    (error) => error.statusCode === 400,
  );

  const beforeRollback = listed.length;
  await database.query(`
    CREATE TRIGGER fail_platform_activity
    BEFORE INSERT ON twofa_activity_logs
    FOR EACH ROW
    BEGIN
      IF NEW.action='PLATFORM_ADDED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced platform activity failure';
      END IF;
    END
  `);
  await assert.rejects(
    addPlatforms(
      profile.id,
      [
        { platformName: "FACEBOOK", authKey: "dummy rollback key one" },
        { platformName: "MICROSOFT", authKey: "dummy rollback key two" },
      ],
      owner,
      context,
      database,
    ),
    /forced platform activity failure/,
  );
  const [[afterRollback]] = await database.execute(
    "SELECT COUNT(*) count FROM twofa_platforms WHERE profile_id=? AND deleted_at IS NULL",
    [profile.id],
  );
  assert.equal(Number(afterRollback.count), beforeRollback);
  await database.query("DROP TRIGGER fail_platform_activity");

  await database.query(`
    CREATE TRIGGER fail_reveal_activity
    BEFORE INSERT ON twofa_activity_logs
    FOR EACH ROW
    BEGIN
      IF NEW.action='AUTH_KEY_REVEALED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced reveal activity failure';
      END IF;
    END
  `);
  await assert.rejects(
    revealCredential(instagram.id, "auth_key", owner, context, { currentPassword: ownerPassword }, database),
    /forced reveal activity failure/,
  );
  await database.query("DROP TRIGGER fail_reveal_activity");

  await removePlatform(instagram.id, owner, context, database);
  await assert.rejects(
    revealCredential(
      instagram.id,
      "auth_key",
      owner,
      context,
      { currentPassword: ownerPassword },
      database,
    ),
    (error) => error.statusCode === 404,
  );
  const remaining = await listPlatforms(profile.id, owner, context, database);
  assert.equal(remaining.length, 2);
  assert.equal(remaining.every((item) => item.id !== instagram.id), true);

  const [activity] = await database.execute(
    `SELECT action,changed_fields changedFields,metadata,
       profile_name_snapshot profileName,platform_name_snapshot platformName,
       employee_name_snapshot employeeName
     FROM twofa_activity_logs WHERE profile_id=? ORDER BY id`,
    [profile.id],
  );
  const serializedActivity = JSON.stringify(activity);
  for (const secret of [
    twofaSecret,
    authSecret,
    replacementTwofa,
    replacementKey,
    ownerPassword,
  ])
    assert.equal(serializedActivity.includes(secret), false);
  for (const action of [
    "PLATFORM_ADDED",
    "PLATFORM_UPDATED",
    "TWOFA_UPDATED",
    "AUTH_KEY_UPDATED",
    "TWOFA_REVEALED",
    "AUTH_KEY_REVEALED",
    "PLATFORM_REMOVED",
    "ACCESS_DENIED",
  ])
    assert.equal(activity.some((row) => row.action === action), true, action);

  console.log(
    "2FA platform encryption, CRUD, bulk rollback, reveal, reauthentication, authorization, deletion, and audit tests passed.",
  );
} finally {
  if (database) await database.end();
  await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await admin.end();
}
