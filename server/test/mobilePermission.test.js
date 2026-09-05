import { test } from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.JWT_SECRET = "test-only-secret-for-mobile-permission-tests";
const { default: pool } = await import("../src/config/database.js");
const { setRolePermissions } = await import("../src/services/permission.service.js");
for (const [name, privileged, current, next, denied] of [
  ["CEO can grant", true, false, [9], false],
  ["CEO can revoke", true, true, [], false],
  ["Admin cannot grant", false, false, [9], true],
  ["Admin cannot revoke", false, true, [], true],
  ["Admin can retain mobile while changing other permissions", false, true, [9,10], false],
]) test(name, async (t) => {
  let committed = false, rolledBack = false;
  const conn = {
    beginTransaction: async () => {}, release: () => {},
    commit: async () => { committed = true; }, rollback: async () => { rolledBack = true; },
    execute: async (sql) => {
      if (sql.includes('FROM roles WHERE')) return [[{id:2}]];
      if (sql.includes('FROM permissions WHERE id IN')) return [next.map(id=>({id}))];
      if (sql.includes("name='portal.access_mobile'")) return [[{id:9}]];
      if (sql.includes('SELECT 1 FROM role_permissions')) return [current ? [{}] : []];
      if (sql.includes('UPPER(r.name)')) return [privileged ? [{}] : []];
      return [{}];
    },
  };
  t.mock.method(pool, 'getConnection', async () => conn);
  t.mock.method(pool, 'execute', async () => [{}]);
  const action = setRolePermissions(2, next, {id:1,employee_id:1});
  if (denied) await assert.rejects(action, /Only the CEO or Super Admin/);
  else await action;
  assert.equal(committed, !denied);
  assert.equal(rolledBack, denied);
});
