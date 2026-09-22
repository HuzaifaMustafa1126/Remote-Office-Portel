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
