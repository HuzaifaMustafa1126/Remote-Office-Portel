import api from "./api";
export const getToday = () =>
  api.get("/day-end-reports/today").then((response) => response.data.data);
export const getWorkItems = () =>
  api
    .get("/day-end-reports/today/work-items")
    .then((response) => response.data.data);
export const submit = (data) =>
  api.post("/day-end-reports", data).then((response) => response.data.data);
export const update = (id, data) =>
  api
    .patch(`/day-end-reports/${id}`, data)
    .then((response) => response.data.data);
export const list = (params) =>
  api
    .get("/day-end-reports", { params })
    .then((response) => response.data.data);
export const get = (id) =>
  api.get(`/day-end-reports/${id}`).then((response) => response.data.data);
export const review = (id) =>
  api
    .patch(`/day-end-reports/${id}/review`)
    .then((response) => response.data.data);
export const myHistory = (params) =>
  api.get("/day-end-reports/my-history", { params }).then((r) => r.data.data);
export const employeeHistory = (employeeId, params) =>
  api
    .get(`/day-end-reports/employees/${employeeId}/history`, { params })
    .then((r) => r.data.data);
export const getOwn = (id) =>
  api.get(`/day-end-reports/mine/${id}`).then((r) => r.data.data);
export const getReplies = (id, params = {}) =>
  api
    .get(`/day-end-reports/${id}/replies`, { params })
    .then((r) => r.data.data);
export const sendReply = (id, message) =>
  api
    .post(`/day-end-reports/${id}/replies`, { message })
    .then((r) => r.data.data);
export const getActivity = (id) =>
  api.get(`/day-end-reports/${id}/activity`).then((r) => r.data.data);
