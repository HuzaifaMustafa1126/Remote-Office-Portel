import api from "./api";
export const login = (body) =>
  api.post("/auth/login", body).then((r) => r.data.data);
export const me = () => api.get("/auth/me").then((r) => r.data.data);
