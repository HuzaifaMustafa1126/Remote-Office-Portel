import test from "node:test";
import assert from "node:assert/strict";
import { assertTransition, isOverdue } from "../src/utils/taskStatus.js";
import {
  createSchema,
  imageSchema,
  commentSchema,
} from "../src/validators/task.validator.js";
test("task creation validation rejects invalid priority and invalid assignment shapes", () => {
  assert.equal(
    createSchema.safeParse({
      title: "Valid task",
      priority: "INVALID",
      assignmentType: "OPEN",
      publishMode: "NOW",
    }).success,
    false,
  );
  assert.equal(
    createSchema.safeParse({
      title: "Direct",
      priority: "MEDIUM",
      assignmentType: "DIRECT",
      publishMode: "NOW",
    }).success,
    false,
  );
  assert.equal(
    createSchema.safeParse({
      title: "Open",
      priority: "MEDIUM",
      assignmentType: "OPEN",
      assigneeEmployeeId: 4,
      publishMode: "NOW",
    }).success,
    false,
  );
});
test("draft and scheduled task shapes are supported", () => {
  assert.equal(
    createSchema.safeParse({
      title: "Draft task",
      priority: "MEDIUM",
      assignmentType: "DIRECT",
      publishMode: "DRAFT",
    }).success,
    true,
  );
  assert.equal(
    createSchema.safeParse({
      title: "Scheduled task",
      priority: "HIGH",
      assignmentType: "DIRECT",
      assigneeEmployeeId: 4,
      publishMode: "SCHEDULED",
      scheduledPublishAt: "2027-01-01T10:00:00+05:00",
    }).success,
    true,
  );
  assert.equal(
    createSchema.safeParse({
      title: "Unassigned scheduled direct task",
      priority: "MEDIUM",
      assignmentType: "DIRECT",
      publishMode: "SCHEDULED",
      scheduledPublishAt: "2027-01-01T10:00:00+05:00",
    }).success,
    false,
  );
  assert.equal(
    createSchema.safeParse({
      title: "Past scheduled task",
      priority: "MEDIUM",
      assignmentType: "OPEN",
      publishMode: "SCHEDULED",
      scheduledPublishAt: "2020-01-01T10:00:00+05:00",
    }).success,
    false,
  );
});
test("authoritative transitions honor review requirement", () => {
  assert.doesNotThrow(() => assertTransition("TO_DO", "IN_PROGRESS"));
  assert.doesNotThrow(() =>
    assertTransition("IN_PROGRESS", "SUBMITTED_FOR_REVIEW", {
      reviewRequired: true,
    }),
  );
  assert.throws(
    () =>
      assertTransition("IN_PROGRESS", "COMPLETED", { reviewRequired: true }),
    /submitted for review/,
  );
  assert.doesNotThrow(() =>
    assertTransition("COMPLETED", "ARCHIVED", { management: true }),
  );
  assert.throws(
    () => assertTransition("OPEN", "COMPLETED"),
    /Invalid task transition/,
  );
});
test("overdue is derived and preserves on-time submission fairness", () => {
  const due = "2026-09-08T10:00:00Z";
  assert.equal(
    isOverdue(
      { status: "IN_PROGRESS", dueAt: due },
      new Date("2026-09-08T11:00:00Z"),
    ),
    true,
  );
  assert.equal(
    isOverdue(
      {
        status: "SUBMITTED_FOR_REVIEW",
        dueAt: due,
        submittedAt: "2026-09-08T09:45:00Z",
      },
      new Date("2026-09-09T11:00:00Z"),
    ),
    false,
  );
  assert.equal(isOverdue({ status: "COMPLETED", dueAt: due }), false);
});
test("image metadata and short comment constraints are strict", () => {
  const image = {
    context: "SUBMISSION",
    storageKey: "tasks/1/a.png",
    originalFilename: "a.png",
    mimeType: "image/png",
    sizeBytes: 100,
  };
  assert.equal(imageSchema.safeParse(image).success, true);
  assert.equal(
    imageSchema.safeParse({ ...image, mimeType: "application/pdf" }).success,
    false,
  );
  assert.equal(
    imageSchema.safeParse({ ...image, sizeBytes: 11000000 }).success,
    false,
  );
  assert.equal(
    commentSchema.safeParse({ content: "x".repeat(1001) }).success,
    false,
  );
});
