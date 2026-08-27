import api from "./api";
export const getToday = () =>
  api.get("/attendance/today").then((r) => r.data.data);
export const clockIn = () =>
  api.post("/attendance/clock-in").then((r) => r.data);
export const startBreak = () =>
  api.post("/attendance/break/start").then((r) => r.data);
export const endBreak = () =>
  api.post("/attendance/break/end").then((r) => r.data);
export const clockOut = () =>
  api.post("/attendance/clock-out").then((r) => r.data);
export const getHistory = (params) =>
  api.get("/attendance/history", { params }).then((r) => r.data.data);
export const getAttendance = (params) =>
  api.get("/attendance", { params }).then((r) => r.data.data);
export const getLive = () =>
  api.get("/attendance/live").then((r) => r.data.data);
export const getActivity = () =>
  api.get("/attendance/activity").then((r) => r.data.data);
export const getDailyReport = (params) =>
  api.get("/attendance/reports/daily", { params }).then((r) => r.data.data);
export const getMonthlyReport = (params) =>
  api.get("/attendance/reports/monthly", { params }).then((r) => r.data.data);
