import api from "./api";

export const getTeam = () =>
  api.get("/availability/team").then((response) => response.data.data);
export const getMine = () =>
  api.get("/availability/me").then((response) => response.data.data);
export const setMine = (body) =>
  api.patch("/availability/me", body).then((response) => response.data);
export const clearMine = () =>
  api.delete("/availability/me/manual").then((response) => response.data);
