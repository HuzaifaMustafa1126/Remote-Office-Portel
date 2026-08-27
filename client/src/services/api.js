import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  timeout: 10000,
});
api.interceptors.request.use((c) => {
  const token =
    localStorage.getItem("rop_token") || sessionStorage.getItem("rop_token");
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("rop_token");
      sessionStorage.removeItem("rop_token");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(e);
  },
);
export default api;
