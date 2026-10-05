import * as service from "../services/scheduledWork.service.js";
import * as reminders from "../services/scheduledWorkReminder.service.js";
import * as snoozes from "../services/scheduledWorkSnooze.service.js";
import * as recurrence from "../services/scheduledWorkRecurrence.service.js";
import * as execution from "../services/scheduledWorkExecution.service.js";
import * as team from "../services/scheduledWorkTeam.service.js";
export const teamCreate = async (req, res) => {
  const work = await service.create(req.body, req.user, { allowAssignment: true });
  await team.notifyAssignment(work, req.user);
  res.status(201).json({ success: true, data: work });
};
export const teamList = async (req, res) => res.json({ success: true, data: await team.listTeam(req.validatedQuery) });
export const teamOverview = async (_req, res) => res.json({ success: true, data: await team.overviewTeam() });
export const teamCalendar = async (req, res) => res.json({ success: true, data: await team.calendarTeam(req.validatedQuery) });
export const teamEmployees = async (_req, res) => res.json({ success: true, data: await team.employees() });
export const teamReassign = async (req, res) => res.json({ success: true, data: await team.reassign(req.params.id, req.body, req.user) });
export const teamReschedule = async (req, res) => res.json({ success: true, data: await team.reschedule(req.params.id, req.body, req.user) });
export const teamCancel = async (req, res) => res.json({ success: true, data: await team.cancel(req.params.id, req.user) });
export const teamRescheduleOccurrence = async (req, res) => res.json({ success: true, data: await team.rescheduleOccurrence(req.params.id, req.params.occurrenceId, req.body, req.user) });
export const teamCancelOccurrence = async (req, res) => res.json({ success: true, data: await team.cancelOccurrence(req.params.id, req.params.occurrenceId, req.user) });
export const create = async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await service.create(req.body, req.user) });
export const list = async (req, res) =>
  res.json({
    success: true,
    data: await service.list(req.validatedQuery, req.user),
  });
export const recurring = async (req, res) =>
  res.json({ success: true, data: await recurrence.listRecurring(req.user) });
export const overview = async (req, res) =>
  res.json({ success: true, data: await service.overview(req.user) });
export const calendar = async (req, res) =>
  res.json({ success: true, data: await service.calendar(req.validatedQuery, req.user) });
export const completed = async (req, res) =>
  res.json({ success: true, data: await service.list({ ...req.validatedQuery, status: "COMPLETED" }, req.user) });
export const occurrences = async (req, res) =>
  res.json({ success: true, data: await recurrence.listOccurrences(req.params.id, req.validatedQuery, req.user) });
export const occurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.getOccurrence(req.params.id, req.params.occurrenceId, req.user) });
export const pauseRecurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.pauseRecurrence(req.params.id, req.user) });
export const resumeRecurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.resumeRecurrence(req.params.id, req.user) });
export const endRecurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.endRecurrence(req.params.id, req.user) });
export const updateRecurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.updateRecurrence(req.params.id, req.body.repeat, req.user) });
export const startOccurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.startOccurrence(req.params.id, req.params.occurrenceId, req.user) });
export const startWork = async (req, res) =>
  res.json({ success: true, data: await execution.startWork(req.params.id, null, req.user) });
export const startOccurrenceWork = async (req, res) =>
  res.json({ success: true, data: await execution.startWork(req.params.id, req.params.occurrenceId, req.user) });
export const rescheduleOccurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.rescheduleOccurrence(req.params.id, req.params.occurrenceId, req.body, req.user) });
export const completeOccurrence = async (req, res) =>
  res.json({ success: true, data: await recurrence.completeOccurrence(req.params.id, req.params.occurrenceId, req.user, req.body) });
export const today = async (req, res) =>
  res.json({
    success: true,
    data: await service.list(req.validatedQuery, req.user, "today"),
  });
export const upcoming = async (req, res) =>
  res.json({
    success: true,
    data: await service.list(req.validatedQuery, req.user, "upcoming"),
  });
export const overdue = async (req, res) =>
  res.json({
    success: true,
    data: await service.list(req.validatedQuery, req.user, "overdue"),
  });
export const get = async (req, res) =>
  res.json({ success: true, data: await service.get(req.params.id, req.user) });
export const update = async (req, res) =>
  res.json({
    success: true,
    data: await service.update(req.params.id, req.body, req.user),
  });
export const start = async (req, res) =>
  res.json({ success: true, data: await service.start(req.params.id, req.user) });
export const reschedule = async (req, res) =>
  res.json({
    success: true,
    data: await service.reschedule(req.params.id, req.body, req.user),
  });
export const complete = async (req, res) =>
  res.json({
    success: true,
    data: await service.complete(req.params.id, req.user, req.body),
  });
export const cancel = async (req, res) =>
  res.json({
    success: true,
    data: await service.cancel(req.params.id, req.user, req.body),
  });
export const listReminders = async (req, res) =>
  res.json({
    success: true,
    data: await reminders.list(req.params.id, req.user),
  });
export const addReminder = async (req, res) =>
  res.status(201).json({
    success: true,
    data: await reminders.add(req.params.id, req.body, req.user),
  });
export const removeReminder = async (req, res) =>
  res.json({
    success: true,
    data: await reminders.remove(
      req.params.id,
      req.params.reminderId,
      req.user,
    ),
  });
export const snooze = async (req, res) =>
  res.status(201).json({ success: true, data: await snoozes.snooze(req.params.id, req.body, req.user) });
export const listSnoozes = async (req, res) =>
  res.json({ success: true, data: await snoozes.list(req.params.id, req.user) });
export const snoozeOccurrence = async (req, res) =>
  res.status(201).json({ success: true, data: await snoozes.snoozeOccurrence(req.params.id, req.params.occurrenceId, req.body, req.user) });
