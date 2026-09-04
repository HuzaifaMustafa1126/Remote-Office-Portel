import api from "./api";
export const login = (body) =>
  api.post("/auth/login", body).then((r) => r.data.data);
export const me = () => api.get("/auth/me").then((r) => r.data.data);
export const heartbeat=()=>api.post("/auth/heartbeat").then(r=>r.data.data);
export const logout=()=>api.post("/auth/logout").then(r=>r.data.data);
export const changePassword=(body)=>api.patch("/auth/change-password",body).then(r=>r.data);
