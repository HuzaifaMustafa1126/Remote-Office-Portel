import assert from "node:assert/strict";
import pool from "../src/config/database.js";
import { isCeoUser } from "../src/middleware/ceo.middleware.js";
import { previewAuditCleanup } from "../src/services/audit.service.js";
import { previewLoginSecurityCleanup } from "../src/services/loginSecurity.service.js";
import {
  cleanupPreviewSchema,
  cleanupSchema,
} from "../src/validators/historyCleanup.validator.js";

try {
  assert.equal(cleanupPreviewSchema.safeParse({ mode: "90_DAYS" }).success, true);
  assert.equal(cleanupPreviewSchema.safeParse({ mode: "CUSTOM" }).success, false);
  assert.equal(
    cleanupSchema.safeParse({ mode: "ALL", confirmation: "DELETE" }).success,
    false,
  );
  assert.equal(
    cleanupSchema.safeParse({ mode: "ALL", confirmation: "DELETE ALL" }).success,
    true,
  );

  const [[ceo]] = await pool.execute(
    `SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id
     JOIN roles r ON r.id=ur.role_id WHERE UPPER(r.name)='CEO' LIMIT 1`,
  );
  assert.ok(ceo, "A CEO account is required for cleanup authorization.");
  assert.equal(await isCeoUser(ceo.id), true);
  const [[nonCeo]] = await pool.execute(
    `SELECT u.id FROM users u WHERE NOT EXISTS(
       SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id
       WHERE ur.user_id=u.id AND UPPER(r.name)='CEO'
     ) LIMIT 1`,
  );
  if (nonCeo) assert.equal(await isCeoUser(nonCeo.id), false);

  const audit = await previewAuditCleanup({ mode: "90_DAYS" });
  assert.ok(audit.recordsToDelete >= 0 && audit.recordsToKeep >= 0);
  const security = await previewLoginSecurityCleanup({ mode: "ALL" });
  assert.ok(security.recordsToDelete >= 0);
  assert.ok(security.activeSessionsProtected >= 1);
  assert.equal(
    security.recordsToDelete + security.recordsToKeep,
    security.totalRecords,
  );
  console.log("Security history cleanup authorization and preview tests passed.");
} finally {
  await pool.end();
}
