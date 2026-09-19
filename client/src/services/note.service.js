import api from "./api";
export const listNotes = (params) =>
  api.get("/notes", { params }).then((r) => r.data.data);
export const listNoteAuthors = () =>
  api.get("/notes/authors").then((r) => r.data.data);
export const toggleNotePin = (id) =>
  api.patch("/notes/" + id + "/pin").then((r) => r.data.data);
export const getNote = (id, archived = false) =>
  api
    .get(`/notes/${id}`, { params: archived ? { archived: true } : undefined })
    .then((r) => r.data.data);
export const createNote = (data) =>
  api.post("/notes", data).then((r) => r.data.data);
export const publishNoteNotifications = (id) =>
  api.post(`/notes/${id}/notifications/published`).then((r) => r.data.data);
export const updateNote = (id, data) =>
  api.put(`/notes/${id}`, data).then((r) => r.data.data);
export const archiveNote = (id) =>
  api.patch(`/notes/${id}/archive`).then((r) => r.data.data);
export const restoreNote = (id) =>
  api.patch(`/notes/${id}/restore`).then((r) => r.data.data);
export const deleteNote = (id) =>
  api.delete(`/notes/${id}`).then((r) => r.data.data);
export const exportNotes = async (params) => {
  try {
    const response = await api.get("/notes/export/docx", {
      params,
      responseType: "blob",
      timeout: 120000,
    });
    const disposition = response.headers["content-disposition"] || "";
    return {
      blob: response.data,
      filename:
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ||
        `Work-Notes-Report-${new Date().toISOString().slice(0, 10)}.docx`,
    };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        error.exportMessage = JSON.parse(
          await error.response.data.text(),
        ).message;
      } catch {
        /* keep the generic export error */
      }
    }
    throw error;
  }
};
export const uploadImage = (id, file) =>
  api
    .post(`/notes/${id}/images`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
    })
    .then((r) => r.data.data);
export const removeImage = (id, imageId) =>
  api.delete(`/notes/${id}/images/${imageId}`).then((r) => r.data.data);
export const imageBlob = (id, imageId) =>
  api
    .get(`/notes/${id}/images/${imageId}/content`, { responseType: "blob" })
    .then((r) => r.data);
export const listNoteReplies = (id, archived = false) =>
  api
    .get(`/notes/${id}/replies`, {
      params: archived ? { archived: true } : undefined,
    })
    .then((r) => r.data.data);
export const listMentionableNoteUsers = (id, search = "", archived = false) =>
  api
    .get(`/notes/${id}/replies/mentionable`, {
      params: {
        ...(search ? { search } : {}),
        ...(archived ? { archived: true } : {}),
      },
    })
    .then((r) => r.data.data);
export const createNoteReply = (id, data) =>
  api.post(`/notes/${id}/replies`, data).then((r) => r.data.data);
export const updateNoteReply = (noteId, replyId, data) =>
  api.put(`/notes/${noteId}/replies/${replyId}`, data).then((r) => r.data.data);
export const deleteNoteReply = (noteId, replyId) =>
  api.delete(`/notes/${noteId}/replies/${replyId}`).then((r) => r.data.data);
