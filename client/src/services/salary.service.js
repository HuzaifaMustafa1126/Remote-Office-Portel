import api from "./api";
export const list = () => api.get("/salaries").then((r) => r.data.data);
export const mine = () => api.get("/salaries/my").then((r) => r.data.data);
