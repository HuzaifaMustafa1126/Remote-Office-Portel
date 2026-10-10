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
import {
  grantProfileAccess,
  revokeProfileAccess,
} from "../src/services/twofaAccess.service.js";
import { globalHistory, profileHistory } from "../src/services/twofaHistory.service.js";
import { listProfilesSchema, twofaHistoryQuerySchema } from "../src/validators/twofa.validator.js";

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
    CREATE TABLE role_permissions (
      role_id BIGINT UNSIGNED NOT NULL,
      permission_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY(role_id,permission_id),
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    CREATE TABLE user_permission_overrides (
      user_id BIGINT UNSIGNED NOT NULL,
      permission_id BIGINT UNSIGNED NOT NULL,
      effect ENUM('ALLOW','DENY') NOT NULL,
      created_by BIGINT UNSIGNED NOT NULL,
      updated_by BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY(user_id,permission_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  const migration = await fs.readFile(
    new URL("../database/migrations/075_twofa_manager_foundation.sql", import.meta.url),
    "utf8",
  );
  await database.query(migration);
  const accessMigration = await fs.readFile(
    new URL("../database/migrations/077_twofa_employee_access_capabilities.sql", import.meta.url),
    "utf8",
  );
  await database.query(accessMigration);
  const historyMigration = await fs.readFile(
    new URL("../database/migrations/078_twofa_activity_history_snapshots.sql", import.meta.url),
    "utf8",
  );
  await database.query(historyMigration);
  const [[schemaAudit]] = await database.execute(`
    SELECT
      (SELECT COUNT(*) FROM information_schema.columns
       WHERE table_schema=DATABASE() AND table_name='twofa_activity_logs'
         AND column_name IN('profile_name_snapshot','platform_name_snapshot','employee_name_snapshot')) snapshotColumns,
      (SELECT COUNT(DISTINCT index_name) FROM information_schema.statistics
       WHERE table_schema=DATABASE() AND table_name='twofa_activity_logs'
         AND index_name IN('idx_twofa_activity_status_created','idx_twofa_activity_profile_action_created','idx_twofa_activity_employee_action_created')) historyIndexes,
      (SELECT COUNT(*) FROM information_schema.referential_constraints
       WHERE constraint_schema=DATABASE() AND constraint_name='fk_twofa_access_employee'
         AND delete_rule='CASCADE') accessEmployeeCascade,
      (SELECT COUNT(*) FROM information_schema.referential_constraints
       WHERE constraint_schema=DATABASE() AND constraint_name IN(
         'fk_twofa_profile_creator','fk_twofa_profile_updater','fk_twofa_profile_deleter',
         'fk_twofa_platform_creator','fk_twofa_platform_updater','fk_twofa_platform_deleter',
         'fk_twofa_access_grantor'
       ) AND delete_rule='SET NULL') preservedActorLinks`);
  assert.equal(Number(schemaAudit.snapshotColumns), 3);
  assert.equal(Number(schemaAudit.historyIndexes), 3);
  assert.equal(Number(schemaAudit.accessEmployeeCascade), 1);
  assert.equal(Number(schemaAudit.preservedActorLinks), 7);

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
  await database.execute("INSERT INTO roles(name) VALUES('2FA Managers')");
  const [[managerRole]] = await database.execute("SELECT id FROM roles WHERE name='2FA Managers'");
  await database.execute("INSERT INTO user_roles(user_id,role_id) VALUES(?,?)", [owner.id, managerRole.id]);
  await database.execute(
    `INSERT INTO role_permissions(role_id,permission_id)
     SELECT ?,id FROM permissions WHERE name IN (
       '2fa.access.manage','2fa.profile.view','2fa.profile.edit',
       '2fa.information.reveal','2fa.key.reveal'
     )`,
    [managerRole.id],
  );

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
  assert.equal(outsiderList.meta.total, 2);
  const ceoList = await listProfiles(listQuery(), ceo, database);
  assert.equal(ceoList.meta.total, 2);

  assert.equal((await getProfile(created.id, outsider, requestContext, database)).id, created.id);
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

  await grantProfileAccess(
    created.id,
    { employeeId: colleague.employee_id },
    owner,
    requestContext,
    database,
  );
  assert.equal(
    (await getProfile(created.id, colleague, requestContext, database)).id,
    created.id,
  );
  await grantProfileAccess(
    created.id,
    { employeeId: outsider.employee_id },
    owner,
    requestContext,
    database,
  );
  assert.equal((await getProfile(created.id, outsider, requestContext, database)).id, created.id);
  await revokeProfileAccess(created.id, outsider.employee_id, owner, requestContext, database);
  assert.equal((await getProfile(created.id, outsider, requestContext, database)).id, created.id);

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
  const historyQuery = twofaHistoryQuerySchema.parse({ page: 1, limit: 100 });
  const history = await profileHistory(created.id, historyQuery, owner, database);
  assert.ok(history.rows.some((event) => event.action === "PROFILE_CREATED"));
  assert.ok(history.rows.some((event) => event.action === "PROFILE_UPDATED"));
  assert.ok(history.rows.some((event) => event.action === "PROFILE_DELETED"));
  assert.ok(history.rows.some((event) => event.action === "ACCESS_GRANTED"));
  assert.ok(history.rows.some((event) => event.action === "ACCESS_REVOKED"));
  assert.ok(history.rows.some((event) => event.action === "ACCESS_DENIED"));
  assert.equal(history.rows[0].profileName, "Client Zebra Updated");
  assert.match(history.rows[0].createdAt, /Z$/);
  assert.equal(history.rows.find((event) => event.action === "PROFILE_CREATED").profileName, "Client Zebra");
  await database.execute("UPDATE employees SET first_name='Renamed' WHERE id=?", [owner.employee_id]);
  const renamedHistory = await profileHistory(created.id, historyQuery, owner, database);
  assert.equal(renamedHistory.rows.find((event) => event.action === "PROFILE_CREATED").employeeName, "Owner Tester");
  const filtered = await profileHistory(
    created.id,
    twofaHistoryQuerySchema.parse({ action: "PROFILE_UPDATED", search: "Zebra", page: 1, limit: 1 }),
    owner,
    database,
  );
  assert.equal(filtered.meta.total, 1);
  assert.equal(filtered.rows.length, 1);
  const outsiderGlobal = await globalHistory(historyQuery, outsider, database);
  assert.equal(outsiderGlobal.rows.some((event) => event.profileId === created.id), true);
  const ceoGlobal = await globalHistory(historyQuery, ceo, database);
  assert.ok(ceoGlobal.rows.some((event) => event.profileId === created.id));
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
