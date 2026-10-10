import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import env from "../src/config/env.js";
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile,
} from "../src/services/twofa.service.js";
import { listProfilesSchema } from "../src/validators/twofa.validator.js";

const databaseName = `twofa_profile_test_${Date.now()}_${process.pid}`;
const admin = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: true,
});
let database;

const requestContext = {
  ip: "127.0.0.1",
  userAgent: "2FA profile integration test",
  requestId: "phase-7.3-test",
};

const listQuery = (overrides = {}) =>
  listProfilesSchema.parse({ page: 1, limit: 20, ...overrides });

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
      CONSTRAINT fk_test_user_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT
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
  const migration = await fs.readFile(
    new URL("../database/migrations/075_twofa_manager_foundation.sql", import.meta.url),
    "utf8",
  );
  await database.query(migration);

  async function account(code, firstName, role = null) {
    const [employee] = await database.execute(
      "INSERT INTO employees(employee_code,first_name,last_name,email) VALUES(?,?,'Tester',?)",
      [code, firstName, `${code.toLowerCase()}@example.invalid`],
    );
    const [user] = await database.execute(
      "INSERT INTO users(employee_id,email,password_hash) VALUES(?,?,'dummy-test-hash')",
      [employee.insertId, `${code.toLowerCase()}@example.invalid`],
    );
    if (role) {
      await database.execute("INSERT IGNORE INTO roles(name) VALUES(?)", [role]);
      const [[savedRole]] = await database.execute(
        "SELECT id FROM roles WHERE name=?",
        [role],
      );
      await database.execute(
        "INSERT INTO user_roles(user_id,role_id) VALUES(?,?)",
        [user.insertId, savedRole.id],
      );
    }
    return { id: Number(user.insertId), employee_id: Number(employee.insertId) };
  }

  const owner = await account("OWNER", "Owner");
  const colleague = await account("COLLEAGUE", "Colleague");
  const outsider = await account("OUTSIDER", "Outsider");
  const ceo = await account("CEO", "Chief", "CEO");

  const created = await createProfile(
    { profileName: "Client Zebra" },
    owner,
    requestContext,
    database,
  );
  assert.equal(created.profileName, "Client Zebra");
  assert.equal(created.createdBy.employeeId, owner.employee_id);
  const [[ownerAccess]] = await database.execute(
    "SELECT access_type accessType FROM twofa_profile_access WHERE profile_id=? AND employee_id=?",
    [created.id, owner.employee_id],
  );
  assert.equal(ownerAccess.accessType, "OWNER");
  const [[createdEvent]] = await database.execute(
    "SELECT action,employee_id employeeId FROM twofa_activity_logs WHERE profile_id=? AND action='PROFILE_CREATED'",
    [created.id],
  );
  assert.equal(Number(createdEvent.employeeId), owner.employee_id);

  await createProfile(
    { profileName: "Alpha Client" },
    owner,
    requestContext,
    database,
  );

  const ownerList = await listProfiles(
    listQuery({ search: "Client", sortBy: "profileName", sortOrder: "ASC", limit: 1 }),
    owner,
    database,
  );
  assert.equal(ownerList.meta.total, 2);
  assert.equal(ownerList.rows.length, 1);
  assert.equal(ownerList.rows[0].profileName, "Alpha Client");

  const outsiderList = await listProfiles(listQuery(), outsider, database);
  assert.equal(outsiderList.meta.total, 0);
  const ceoList = await listProfiles(listQuery(), ceo, database);
  assert.equal(ceoList.meta.total, 2);

  await assert.rejects(
    getProfile(created.id, outsider, requestContext, database),
    (error) => error.statusCode === 404,
  );
  const [[deniedEvent]] = await database.execute(
    "SELECT event_status eventStatus FROM twofa_activity_logs WHERE profile_id=? AND action='ACCESS_DENIED' AND employee_id=?",
    [created.id, outsider.employee_id],
  );
  assert.equal(deniedEvent.eventStatus, "FAILURE");
  await assert.rejects(
    updateProfile(
      created.id,
      { profileName: "Unauthorized Rename" },
      outsider,
      requestContext,
      database,
    ),
    (error) => error.statusCode === 404,
  );
  await assert.rejects(
    deleteProfile(created.id, outsider, requestContext, database),
    (error) => error.statusCode === 404,
  );
  assert.equal(
    (await getProfile(created.id, owner, requestContext, database)).profileName,
    "Client Zebra",
  );

  await database.execute(
    "INSERT INTO twofa_profile_access(profile_id,employee_id,access_type,granted_by) VALUES(?,?,'GRANTED',?)",
    [created.id, colleague.employee_id, owner.id],
  );
  assert.equal(
    (await getProfile(created.id, colleague, requestContext, database)).id,
    created.id,
  );

  const [[beforeUnchanged]] = await database.execute(
    "SELECT COUNT(*) count FROM twofa_activity_logs WHERE profile_id=? AND action='PROFILE_UPDATED'",
    [created.id],
  );
  const unchanged = await updateProfile(
    created.id,
    { profileName: "Client Zebra" },
    colleague,
    requestContext,
    database,
  );
  assert.equal(unchanged.changed, false);
  const [[afterUnchanged]] = await database.execute(
    "SELECT COUNT(*) count FROM twofa_activity_logs WHERE profile_id=? AND action='PROFILE_UPDATED'",
    [created.id],
  );
  assert.equal(Number(afterUnchanged.count), Number(beforeUnchanged.count));

  const updated = await updateProfile(
    created.id,
    { profileName: "Client Zebra Updated" },
    colleague,
    requestContext,
    database,
  );
  assert.equal(updated.changed, true);
  assert.equal(updated.updatedBy.employeeId, colleague.employee_id);
  const [[updateEvent]] = await database.execute(
    "SELECT changed_fields changedFields FROM twofa_activity_logs WHERE profile_id=? AND action='PROFILE_UPDATED' ORDER BY id DESC LIMIT 1",
    [created.id],
  );
  const changedFields =
    typeof updateEvent.changedFields === "string"
      ? JSON.parse(updateEvent.changedFields)
      : updateEvent.changedFields;
  assert.deepEqual(changedFields, ["profile_name"]);

  const [platform] = await database.execute(
    `INSERT INTO twofa_platforms(
       profile_id,platform_name,twofa_information_ciphertext,twofa_information_iv,twofa_information_tag,
       auth_key_ciphertext,auth_key_iv,auth_key_tag,encryption_key_version,created_by,updated_by
     ) VALUES(?,'GOOGLE',?,?,?,?,?,?,1,?,?)`,
    [
      created.id,
      Buffer.from("dummy ciphertext"),
      Buffer.alloc(12, 1),
      Buffer.alloc(16, 2),
      Buffer.from("dummy auth ciphertext"),
      Buffer.alloc(12, 3),
      Buffer.alloc(16, 4),
      owner.id,
      owner.id,
    ],
  );
  await deleteProfile(created.id, colleague, requestContext, database);
  const [[deleted]] = await database.execute(
    "SELECT deleted_at deletedAt,deleted_by deletedBy FROM twofa_profiles WHERE id=?",
    [created.id],
  );
  assert.ok(deleted.deletedAt);
  assert.equal(Number(deleted.deletedBy), colleague.id);
  const [[deletedPlatform]] = await database.execute(
    "SELECT deleted_at deletedAt FROM twofa_platforms WHERE id=?",
    [platform.insertId],
  );
  assert.ok(deletedPlatform.deletedAt);
  await assert.rejects(
    getProfile(created.id, owner, requestContext, database),
    (error) => error.statusCode === 404,
  );
  const [[historyAfterDelete]] = await database.execute(
    "SELECT COUNT(*) count FROM twofa_activity_logs WHERE profile_id=?",
    [created.id],
  );
  assert.ok(Number(historyAfterDelete.count) >= 4);

  await database.query(`
    CREATE TRIGGER fail_profile_created_activity
    BEFORE INSERT ON twofa_activity_logs
    FOR EACH ROW
    BEGIN
      IF NEW.action='PROFILE_CREATED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced activity failure';
      END IF;
    END
  `);
  await assert.rejects(
    createProfile(
      { profileName: "Must Roll Back" },
      owner,
      requestContext,
      database,
    ),
    /forced activity failure/,
  );
  const [[rolledBack]] = await database.execute(
    "SELECT COUNT(*) count FROM twofa_profiles WHERE profile_name='Must Roll Back'",
  );
  assert.equal(Number(rolledBack.count), 0);

  console.log("2FA profile CRUD, authorization, history, soft-delete, and rollback integration tests passed.");
} finally {
  if (database) await database.end();
  await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await admin.end();
}
