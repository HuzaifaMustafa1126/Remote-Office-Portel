import api from "./api";
export const listDays = (params) =>
  api.get("/company-calendar", { params }).then((r) => r.data.data);
export const getUpcoming = () =>
  api.get("/company-calendar/upcoming").then((r) => r.data.data);
export const getDay = (date) =>
  api.get(`/company-calendar/day/${date}`).then((r) => r.data.data);
export const createDays = (data) =>
  api.post("/company-calendar", data).then((r) => r.data);
export const updateDay = (id, data) =>
  api.patch(`/company-calendar/${id}`, data).then((r) => r.data);
export const cancelDay = (id) =>
  api.delete(`/company-calendar/${id}`).then((r) => r.data);
