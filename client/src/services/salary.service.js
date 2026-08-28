import api from "./api";
export const list = () => api.get("/salaries").then((r) => r.data.data);
export const mine = () => api.get("/salaries/my").then((r) => r.data.data);
export const myAccrual = () =>
  api.get("/salaries/my/accrual").then((r) => r.data.data);
export const employeeAccrual = (id) =>
  api.get(`/employees/${id}/salary-accrual`).then((r) => r.data.data);
