import api from "./api";
export const listTasks = (params) =>
  api.get("/tasks", { params }).then((r) => r.data.data);
export const getTask = (id) => api.get(`/tasks/${id}`).then((r) => r.data.data);
export const createTask = (data) =>
  api.post("/tasks", data).then((r) => r.data.data);
export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data).then((r) => r.data.data);
export const publishTask = (id) =>
  api.post(`/tasks/${id}/publish`).then((r) => r.data.data);
export const scheduleTask = (id, scheduledPublishAt) =>
  api
    .post(`/tasks/${id}/schedule`, { scheduledPublishAt })
    .then((r) => r.data.data);
export const cancelTaskSchedule = (id) =>
  api.post(`/tasks/${id}/cancel-schedule`).then((r) => r.data.data);
export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`).then((r) => r.data.data);
export const duplicateTask = (id) =>
  api.post(`/tasks/${id}/duplicate`).then((r) => r.data.data);
export const listTaskAssignees = () =>
  api.get("/tasks/assignees").then((r) => r.data.data);
export const uploadReferenceImage = (id, file) =>
  api
    .post(`/tasks/${id}/reference-images`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      timeout: 30000,
    })
    .then((r) => r.data.data);
export const removeTaskImage = (taskId, imageId) =>
  api.delete(`/tasks/${taskId}/images/${imageId}`).then((r) => r.data.data);
export const claimTask = (id) =>
  api.post(`/tasks/${id}/claim`).then((r) => r.data.data);
export const getClaimStatus = () =>
  api.get("/tasks/claim-status").then((r) => r.data.data);
export const transitionTask = (id, data) =>
  api.patch(`/tasks/${id}/status`, data).then((r) => r.data.data);
export const uploadSubmissionImage = (id, file) =>
  api
    .post(`/tasks/${id}/submission-images`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      timeout: 30000,
    })
    .then((r) => r.data.data);
export const addTaskComment = (
  id,
  content,
  parentCommentId = null,
  mentionUserIds = [],
) =>
  api
    .post(`/tasks/${id}/comments`, { content, parentCommentId, mentionUserIds })
    .then((r) => r.data.data);
export const editTaskComment = (taskId, commentId, content) =>
  api
    .patch(`/tasks/${taskId}/comments/${commentId}`, { content })
    .then((r) => r.data.data);
export const deleteTaskComment = (taskId, commentId) =>
  api.delete(`/tasks/${taskId}/comments/${commentId}`).then((r) => r.data.data);
export const getMentionableUsers = (id, search = "") =>
  api
    .get(`/tasks/${id}/mentionable-users`, { params: { search } })
    .then((r) => r.data.data);
export const markTaskRead = (id) =>
  api.post(`/tasks/${id}/read`).then((r) => r.data.data);
export const uploadTaskAttachment = (id, file, onUploadProgress) =>
  api
    .post(`/tasks/${id}/attachments`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      timeout: 30000,
      onUploadProgress,
    })
    .then((r) => r.data.data);
export const getTaskAttachmentBlob = (taskId, attachmentId) =>
  api
    .get(`/tasks/${taskId}/attachments/${attachmentId}/content`, {
      responseType: "blob",
    })
    .then((r) => URL.createObjectURL(r.data));
export const deleteTaskAttachment = (taskId, attachmentId) =>
  api
    .delete(`/tasks/${taskId}/attachments/${attachmentId}`)
    .then((r) => r.data.data);
export const uploadChangeImage = (id, file) =>
  api
    .post(`/tasks/${id}/change-images`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      timeout: 30000,
    })
    .then((r) => r.data.data);
export const getTaskImageBlob = (taskId, imageId) =>
  api
    .get(`/tasks/${taskId}/images/${imageId}/content`, { responseType: "blob" })
    .then((r) => URL.createObjectURL(r.data));
export const listManagedTasks = (params) =>
  api.get("/tasks/management", { params }).then((r) => r.data.data);
export const changeTaskDeadline = (id, data) =>
  api.patch(`/tasks/${id}/deadline`, data).then((r) => r.data.data);
export const reassignTask = (id, data) =>
  api.put(`/tasks/${id}/assignee`, data).then((r) => r.data.data);
export const bulkTasks = (data) =>
  api.post("/tasks/bulk", data).then((r) => r.data.data);
const analyticsRequests = new Map();
export const getTaskAnalytics = (params, version = 0) => {
  const clean = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([, value]) => value !== "" && value != null,
      ),
    ),
    key = JSON.stringify([clean, version]),
    cached = analyticsRequests.get(key);
  if (cached && Date.now() - cached.at < 2000) return cached.request;
  const request = api
    .get("/tasks/analytics", { params: clean })
    .then((r) => r.data.data);
  analyticsRequests.set(key, { at: Date.now(), request });
  return request;
};
export const getEmployeeTaskPerformance = (employeeId, params) =>
  api
    .get(`/tasks/analytics/employees/${employeeId}`, {
      params: Object.fromEntries(
        Object.entries(params || {}).filter(
          ([, value]) => value !== "" && value != null,
        ),
      ),
    })
    .then((r) => r.data.data);
