import api from "./api";

const data = (request) => request.then((response) => response.data.data);
export const listProfiles = (params) =>
  data(api.get("/2fa/profiles", { params }));
export const createProfile = (payload) =>
  data(api.post("/2fa/profiles", payload));
export const getProfile = (id) => data(api.get(`/2fa/profiles/${id}`));
export const updateProfile = (id, payload) =>
  data(api.patch(`/2fa/profiles/${id}`, payload));
export const deleteProfile = (id) => data(api.delete(`/2fa/profiles/${id}`));
export const listPlatforms = (profileId) =>
  data(api.get(`/2fa/profiles/${profileId}/platforms`));
export const addPlatform = (profileId, payload) =>
  data(api.post(`/2fa/profiles/${profileId}/platforms`, payload));
export const addPlatforms = (profileId, platforms) =>
  data(api.post(`/2fa/profiles/${profileId}/platforms/bulk`, { platforms }));
export const updatePlatform = (id, payload) =>
  data(api.patch(`/2fa/platforms/${id}`, payload));
export const deletePlatform = (id) => data(api.delete(`/2fa/platforms/${id}`));
export const revealTwofa = (id) =>
  data(api.post(`/2fa/platforms/${id}/reveal-2fa`, {}));
export const revealAuthKey = (id, currentPassword) =>
  data(api.post(`/2fa/platforms/${id}/reveal-key`, { currentPassword }));
export const listAccess = (profileId) =>
  data(api.get(`/2fa/profiles/${profileId}/access`));
export const grantAccess = (profileId, payload) =>
  data(api.post(`/2fa/profiles/${profileId}/access`, payload));
export const revokeAccess = (profileId, employeeId) =>
  data(api.delete(`/2fa/profiles/${profileId}/access/${employeeId}`));
export const profileHistory = (profileId, params) =>
  api
    .get(`/2fa/profiles/${profileId}/history`, { params })
    .then((response) => ({
      rows: response.data.data,
      meta: response.data.pagination,
    }));
export const globalHistory = (params) =>
  api
    .get("/2fa/history", { params })
    .then((response) => ({
      rows: response.data.data,
      meta: response.data.pagination,
    }));
