import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  categoryCreateSchema,
  categoryDeleteSchema,
  categoryRemoveSchema,
  categoryReorderSchema,
  createSchema,
  listSchema,
} from "../src/validators/note.validator.js";

const note = {
  title: "Release notes",
  summary: "Summary",
  content: "Details",
  visibility: "TEAM",
  isImportant: false,
};

test("new notes no longer require a category while legacy category ids remain accepted", () => {
  assert.equal(createSchema.safeParse(note).success, true);
  assert.equal(createSchema.safeParse({ ...note, categoryId: 3 }).success, true);
  assert.equal(createSchema.safeParse({ ...note, categoryId: 0 }).success, false);
});

test("category filter accepts an id or Uncategorized only", () => {
  assert.equal(listSchema.safeParse({ categoryId: "12" }).success, true);
  assert.equal(listSchema.safeParse({ categoryId: "UNCATEGORIZED" }).success, true);
  assert.equal(listSchema.safeParse({ categoryId: "all-private-notes" }).success, false);
});

test("historical category administration payload validation remains safe", () => {
  assert.equal(categoryCreateSchema.safeParse({ name: "HR", color: "#13a46b" }).success, true);
  assert.equal(categoryCreateSchema.safeParse({ name: "HR", color: "red" }).success, false);
  assert.equal(categoryReorderSchema.safeParse({ categoryIds: [1, 2, 3] }).success, true);
  assert.equal(categoryRemoveSchema.safeParse({ mode: "REASSIGN" }).success, false);
  assert.equal(categoryRemoveSchema.safeParse({ mode: "UNCATEGORIZED", targetCategoryId: null }).success, true);
  assert.equal(categoryDeleteSchema.safeParse({ confirmName: "HR" }).success, true);
  assert.equal(categoryDeleteSchema.safeParse({ confirmName: "" }).success, false);
});

test("historical category data and administration logic remain preserved", async () => {
  const service = await readFile(new URL("../src/services/note.service.js", import.meta.url), "utf8");
  const migration = await readFile(new URL("../database/migrations/062_note_category_management.sql", import.meta.url), "utf8");
  assert.match(service, /LEFT JOIN work_notes n[\s\S]*AND \$\{predicate\}/);
  assert.match(service, /Only the CEO can manage note categories/);
  assert.match(migration, /UPPER\(r\.name\) NOT IN \('CEO', 'SUPER_ADMIN'\)/);
  assert.doesNotMatch(service, /NOTE_CATEGORY_[A-Z_]+[\s\S]{0,120}notifyByPolicy/);
});
