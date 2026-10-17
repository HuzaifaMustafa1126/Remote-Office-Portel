import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { employeeAccessParamsSchema, grantProfileAccessSchema } from "../src/validators/twofa.validator.js";

test("grant access accepts only an employee selection", () => {
  assert.deepEqual(grantProfileAccessSchema.parse({ employeeId: "12" }), { employeeId: 12 });
  assert.equal(grantProfileAccessSchema.safeParse({ employeeId: 12, permissions: {} }).success, false);
  assert.equal(employeeAccessParamsSchema.safeParse({ profileId: "2", employeeId: "3" }).success, true);
});

test("all access-management routes require the dedicated module permission", () => {
  const source = fs.readFileSync(new URL("../src/routes/twofa.routes.js", import.meta.url), "utf8");
  assert.equal((source.match(/permit\("2fa\.access\.manage"\)/g) || []).length, 3);
  assert.doesNotMatch(source, /"\/access\/employees"/);
  for (const verb of ["get", "post", "delete"])
    assert.match(source, new RegExp(`router\\.${verb}\\(`));
});

test("authorization shares read actions and scopes changes to creators or admins", () => {
  const source = fs.readFileSync(new URL("../src/services/twofaAuthorization.service.js", import.meta.url), "utf8");
  for (const column of ["can_view", "can_edit", "can_reveal_twofa", "can_reveal_auth_key"])
    assert.match(source, new RegExp(column));
  assert.match(source, /status='ACTIVE'/);
  for (const action of ["VIEW", "ADD", "REVEAL_TWOFA", "REVEAL_AUTH_KEY"])
    assert.match(source, new RegExp(`TWOFA_PROFILE_ACTION\\.${action}`));
  assert.match(source, /isCeo \|\| isCreator/);
});

test("profile and platform operations use centralized action authorization", () => {
  const profile = fs.readFileSync(new URL("../src/services/twofa.service.js", import.meta.url), "utf8");
  const platform = fs.readFileSync(new URL("../src/services/twofaPlatform.service.js", import.meta.url), "utf8");
  assert.match(profile, /TWOFA_PROFILE_ACTION\.EDIT/);
  assert.match(platform, /TWOFA_PROFILE_ACTION\.VIEW/);
  assert.match(platform, /TWOFA_PROFILE_ACTION\.REVEAL_TWOFA/);
  assert.match(platform, /TWOFA_PROFILE_ACTION\.REVEAL_AUTH_KEY/);
});
