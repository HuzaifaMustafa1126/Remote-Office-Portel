import api from "./api";
export const list = (params) =>
  api.get("/notifications", { params }).then((r) => r.data.data);
export const unreadCount = () =>
  api.get("/notifications/unread-count").then((r) => r.data.data.count);
export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data.data);
export const markAllRead = () =>
  api.patch("/notifications/read-all").then((r) => r.data.data);
export const getPreferences = () =>
  api.get("/notifications/preferences").then((r) => r.data.data);
export const updatePreferences = (data) =>
  api.patch("/notifications/preferences", data).then((r) => r.data.data);
export const sendTest = () =>
  api.post("/notifications/test").then((r) => r.data.data);
export const getSounds = () => api.get("/notifications/sounds").then(r=>r.data.data);
export const uploadSound = (file,name) => api.post("/notifications/sounds",file,{headers:{"Content-Type":file.type,"X-File-Name":encodeURIComponent(file.name),"X-Sound-Name":name}}).then(r=>r.data.data);
export const renameSound = (id,name) => api.patch(`/notifications/sounds/${id}`,{name}).then(r=>r.data.data);
export const saveSoundSettings = data => api.put("/notifications/sounds/settings",data).then(r=>r.data.data);
export const deleteSound = id => api.delete(`/notifications/sounds/${id}`).then(r=>r.data.data);
export const soundContent = id => api.get(`/notifications/sounds/${id}/content`,{responseType:"blob"}).then(r=>r.data);
