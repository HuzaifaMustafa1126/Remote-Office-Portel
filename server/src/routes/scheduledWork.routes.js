import { Router } from "express";
import * as c from "../controllers/scheduledWork.controller.js";
import * as v from "../validators/scheduledWork.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router();
r.get("/today", validate(v.listSchema, "query"), asyncHandler(c.today));
r.get("/upcoming", validate(v.listSchema, "query"), asyncHandler(c.upcoming));
r.get("/overdue", validate(v.listSchema, "query"), asyncHandler(c.overdue));
r.get("/", validate(v.listSchema, "query"), asyncHandler(c.list));
r.post("/", validate(v.createSchema), asyncHandler(c.create));
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
r.post("/:id/cancel", validate(v.idSchema, "params"), asyncHandler(c.cancel));
export default r;
