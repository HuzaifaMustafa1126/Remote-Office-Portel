import * as service from "../services/dayEndReport.service.js";
export const today = async (req, res) =>
  res.json({ success: true, data: await service.today(req.user) });
export const workItems = async (req, res) =>
  res.json({ success: true, data: await service.todayWorkItems(req.user) });
export const submit = async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await service.submit(req.body, req.user) });
export const update = async (req, res) =>
  res.json({
    success: true,
    data: await service.update(req.params.id, req.body, req.user),
  });
export const managementList = async (req, res) =>
  res.json({
    success: true,
    data: await service.managementList(req.user, req.validatedQuery),
  });
export const managementDetails = async (req, res) =>
  res.json({
    success: true,
    data: await service.managementDetails(req.user, req.params.id),
  });
export const review = async (req, res) =>
  res.json({
    success: true,
    data: await service.review(req.user, req.params.id),
  });
export const ownDetails = async (req, res) =>
  res.json({ success: true, data: await service.ownDetails(req.user, req.params.id) });
export const myHistory = async (req, res) =>
  res.json({ success: true, data: await service.myHistory(req.user, req.validatedQuery) });
export const employeeHistory = async (req, res) =>
  res.json({ success: true, data: await service.employeeHistory(req.user, req.params.employeeId, req.validatedQuery) });
export const replies = async (req, res) =>
  res.json({ success: true, data: await service.listReplies(req.user, req.params.id, req.validatedQuery) });
export const reply = async (req, res) =>
  res.status(201).json({ success: true, data: await service.createReply(req.user, req.params.id, req.body) });
export const activity = async (req, res) =>
  res.json({ success: true, data: await service.activity(req.user, req.params.id) });
