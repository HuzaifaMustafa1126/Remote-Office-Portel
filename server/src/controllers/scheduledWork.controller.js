import * as service from "../services/scheduledWork.service.js";
import * as reminders from "../services/scheduledWorkReminder.service.js";
import * as snoozes from "../services/scheduledWorkSnooze.service.js";
export const create = async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await service.create(req.body, req.user) });
export const list = async (req, res) =>
  res.json({
    success: true,
    data: await service.list(req.validatedQuery, req.user),
  });
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
    data: await service.complete(req.params.id, req.user),
  });
export const cancel = async (req, res) =>
  res.json({
    success: true,
    data: await service.cancel(req.params.id, req.user),
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
