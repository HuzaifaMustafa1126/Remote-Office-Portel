import { Router } from "express";
import * as c from "../controllers/scheduledWork.controller.js";
import * as v from "../validators/scheduledWork.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/today", validate(v.listSchema, "query"), asyncHandler(c.today));
r.get("/upcoming", validate(v.listSchema, "query"), asyncHandler(c.upcoming));
r.get("/overdue", validate(v.listSchema, "query"), asyncHandler(c.overdue));
r.get("/recurring", asyncHandler(c.recurring));
r.get("/", validate(v.listSchema, "query"), asyncHandler(c.list));
r.post("/", validate(v.createSchema), asyncHandler(c.create));
r.get("/:id/occurrences", validate(v.idSchema,"params"), validate(v.occurrenceListSchema,"query"), asyncHandler(c.occurrences));
r.get("/:id/occurrences/:occurrenceId", validate(v.occurrenceIdSchema,"params"), asyncHandler(c.occurrence));
r.post("/:id/recurrence/pause", validate(v.idSchema,"params"), asyncHandler(c.pauseRecurrence));
r.post("/:id/recurrence/resume", validate(v.idSchema,"params"), asyncHandler(c.resumeRecurrence));
r.post("/:id/recurrence/end", validate(v.idSchema,"params"), asyncHandler(c.endRecurrence));
r.patch("/:id/recurrence", validate(v.idSchema,"params"), validate(v.recurrenceUpdateSchema), asyncHandler(c.updateRecurrence));
r.post("/:id/occurrences/:occurrenceId/start", validate(v.occurrenceIdSchema,"params"), asyncHandler(c.startOccurrence));
r.post("/:id/occurrences/:occurrenceId/complete", validate(v.occurrenceIdSchema,"params"), asyncHandler(c.completeOccurrence));
r.post("/:id/occurrences/:occurrenceId/snooze", validate(v.occurrenceIdSchema,"params"), validate(v.snoozeSchema), asyncHandler(c.snoozeOccurrence));
r.get(
  "/:id/reminders",
  validate(v.idSchema, "params"),
  asyncHandler(c.listReminders),
);
r.post(
  "/:id/reminders",
  validate(v.idSchema, "params"),
  validate(v.reminderSchema),
  asyncHandler(c.addReminder),
);
r.delete(
  "/:id/reminders/:reminderId",
  validate(v.reminderIdSchema, "params"),
  asyncHandler(c.removeReminder),
);
r.get("/:id/snoozes", validate(v.idSchema, "params"), asyncHandler(c.listSnoozes));
r.post(
  "/:id/snooze",
  validate(v.idSchema, "params"),
  validate(v.snoozeSchema),
  asyncHandler(c.snooze),
);
r.get("/:id", validate(v.idSchema, "params"), asyncHandler(c.get));
r.patch(
  "/:id",
  validate(v.idSchema, "params"),
  validate(v.updateSchema),
  asyncHandler(c.update),
);
r.post(
  "/:id/reschedule",
  validate(v.idSchema, "params"),
  validate(v.rescheduleSchema),
  asyncHandler(c.reschedule),
);
r.post(
  "/:id/complete",
  validate(v.idSchema, "params"),
  asyncHandler(c.complete),
);
r.post("/:id/start", validate(v.idSchema, "params"), asyncHandler(c.start));
r.post("/:id/cancel", validate(v.idSchema, "params"), asyncHandler(c.cancel));
export default r;
