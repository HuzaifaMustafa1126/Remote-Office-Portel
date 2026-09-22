import api from "./api";
export const getToday = () => api.get("/day-end-reports/today").then((response) => response.data.data);
export const getWorkItems = () => api.get("/day-end-reports/today/work-items").then((response) => response.data.data);
export const submit = (data) => api.post("/day-end-reports", data).then((response) => response.data.data);
