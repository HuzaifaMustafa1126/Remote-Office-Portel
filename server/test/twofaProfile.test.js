import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { authenticate } from "../src/middleware/auth.middleware.js";
import {
  createProfileSchema,
  listProfilesSchema,
  profileIdSchema,
  updateProfileSchema,
} from "../src/validators/twofa.validator.js";

test("profile payload validation trims names and rejects invalid structures", () => {
  assert.deepEqual(createProfileSchema.parse({ profileName: "  Client ABC  " }), {
    profileName: "Client ABC",
  });
  assert.equal(createProfileSchema.safeParse({ profileName: "   " }).success, false);
  assert.equal(
    createProfileSchema.safeParse({ profileName: "x".repeat(151) }).success,
    false,
  );
  assert.equal(
    createProfileSchema.safeParse({ profileName: "Client", createdBy: 4 })
      .success,
    false,
  );
  assert.equal(
    updateProfileSchema.safeParse({ profileName: "Client", deletedAt: null })
      .success,
    false,
  );
});

test("profile ID, pagination, search, and sort inputs are strictly bounded", () => {
  assert.equal(profileIdSchema.safeParse({ id: "12" }).success, true);
  assert.equal(profileIdSchema.safeParse({ id: "0" }).success, false);
  assert.equal(profileIdSchema.safeParse({ id: "abc" }).success, false);
  assert.equal(
    listProfilesSchema.safeParse({
      search: "client",
      page: "1",
      limit: "10",
      sortBy: "profileName",
      sortOrder: "ASC",
    }).success,
    true,
  );
  assert.equal(
    listProfilesSchema.safeParse({ sortBy: "profile_name; DROP TABLE users" })
      .success,
    false,
  );
  assert.equal(listProfilesSchema.safeParse({ limit: 101 }).success, false);
});

test("profile routes apply the requested granular permission middleware", () => {
  const source = fs.readFileSync(
    new URL("../src/routes/twofa.routes.js", import.meta.url),
    "utf8",
  );
  for (const permission of [
    "2fa.profile.create",
    "2fa.profile.view",
    "2fa.profile.edit",
    "2fa.profile.delete",
  ]) {
    assert.match(source, new RegExp(permission.replaceAll(".", "\\.")));
  }
  assert.match(source, /validate\(validation\.profileIdSchema, "params"\)/);
  assert.match(source, /validate\(validation\.listProfilesSchema, "query"\)/);
});

test("unauthenticated profile requests are rejected by the global authentication middleware", async () => {
  const error = await new Promise((resolve) =>
    authenticate({ headers: {} }, {}, resolve),
  );
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, "AUTH_REQUIRED");
});
