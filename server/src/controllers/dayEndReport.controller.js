import * as service from "../services/dayEndReport.service.js";
export const today = async (req, res) => res.json({ success: true, data: await service.today(req.user) });
export const workItems = async (req, res) => res.json({ success: true, data: await service.todayWorkItems(req.user) });
export const submit = async (req, res) => res.status(201).json({ success: true, data: await service.submit(req.body, req.user) });
