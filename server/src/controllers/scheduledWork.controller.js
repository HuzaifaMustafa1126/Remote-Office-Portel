import * as service from "../services/scheduledWork.service.js";
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
