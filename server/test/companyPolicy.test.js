import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { createSchema, updateSchema, idSchema } =
  await import("../src/validators/companyPolicy.validator.js");

test("company policies accept only a plain title and content", () => {
  const valid = createSchema.safeParse({
    title: " Attendance Policy ",
    content: " Follow your assigned working hours. ",
  });
  assert.equal(valid.success, true);
  assert.deepEqual(valid.data, {
    title: "Attendance Policy",
    content: "Follow your assigned working hours.",
  });
  assert.equal(
    createSchema.safeParse({ title: "Policy", content: "Text", tags: [] })
      .success,
    false,
  );
  assert.equal(
    updateSchema.safeParse({ title: "", content: "Text" }).success,
    false,
  );
  assert.equal(idSchema.safeParse({ id: "12" }).data.id, 12);
});

test("company policy migration grants read access broadly and management narrowly", () => {
  const sql = fs.readFileSync(
    new URL("../../database/migrations/074_company_policies.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /company_policy\.view/);
  assert.match(sql, /company_policy\.manage/);
  assert.match(sql, /UPPER\(r\.name\) IN\('CEO','ADMIN','SUPER_ADMIN'\)/);
  assert.doesNotMatch(sql, /notification_policies/);
});
