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
