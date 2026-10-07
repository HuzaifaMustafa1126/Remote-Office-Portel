import * as service from "../services/companyPolicy.service.js";

export async function list(req, res) {
  res.json({ success: true, data: await service.listPolicies() });
}

export async function get(req, res) {
  res.json({ success: true, data: await service.getPolicy(req.params.id) });
}

export async function create(req, res) {
  res.status(201).json({
    success: true,
    message: "Company policy created successfully.",
    data: await service.createPolicy(req.body, req.user),
  });
}

export async function update(req, res) {
  res.json({
    success: true,
    message: "Company policy updated successfully.",
    data: await service.updatePolicy(req.params.id, req.body),
  });
}

export async function remove(req, res) {
  res.json({
    success: true,
    message: "Company policy deleted successfully.",
    data: await service.deletePolicy(req.params.id),
  });
}
