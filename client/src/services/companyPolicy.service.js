import api from "./api";

export const listPolicies = () =>
  api.get("/company-policies").then((response) => response.data.data);
export const getPolicy = (id) =>
  api.get(`/company-policies/${id}`).then((response) => response.data.data);
export const createPolicy = (data) =>
  api.post("/company-policies", data).then((response) => response.data.data);
export const updatePolicy = (id, data) =>
  api
    .patch(`/company-policies/${id}`, data)
    .then((response) => response.data.data);
export const deletePolicy = (id) =>
  api.delete(`/company-policies/${id}`).then((response) => response.data.data);
