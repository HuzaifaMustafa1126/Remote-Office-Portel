import test from "node:test";
import assert from "node:assert/strict";
import {
  createSchema,
  executionCompletionSchema,
  rescheduleSchema,
} from "../src/validators/scheduledWork.validator.js";
import { completionSchema } from "../src/validators/ongoingWork.validator.js";

test("scheduled work accepts an authorized task-link identifier shape", () => {
  const value = createSchema.parse({
    title: "Review campaign",
    scheduleType: "EXACT",
    scheduledAt: "2026-10-08T19:00:00+05:00",
    linkedTaskId: 42,
  });
  assert.equal(value.linkedTaskId, 42);
});

test("completion choices are explicit and ongoing completion defaults to independent", () => {
  assert.equal(
    executionCompletionSchema.parse({ executionHandling: "COMPLETE_BOTH" })
      .executionHandling,
    "COMPLETE_BOTH",
  );
  assert.equal(
    completionSchema.parse({ completionNote: "Finished" })
      .completeLinkedSchedule,
    false,
  );
});

test("rescheduling an active execution requires a boolean confirmation shape", () => {
  assert.equal(
    rescheduleSchema.parse({
      scheduleType: "RELATIVE",
      relativeValue: 24,
      relativeUnit: "HOURS",
      confirmActiveExecution: true,
    }).confirmActiveExecution,
    true,
  );
});
