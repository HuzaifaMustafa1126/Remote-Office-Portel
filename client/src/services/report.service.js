import api from "./api";
export const getReport = (name, params) =>
  api.get(`/reports/${name}`, { params }).then((r) => r.data.data);
