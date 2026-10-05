import api from "./api";
export const listScheduledWork = (params = {}) =>
  api.get("/scheduled-work", { params }).then((r) => r.data.data);
export const todayScheduledWork = (params = {}) =>
  api.get("/scheduled-work/today", { params }).then((r) => r.data.data);
export const getScheduledWork = (id) =>
  api.get(`/scheduled-work/${id}`).then((r) => r.data.data);
export const getOverview = () =>
  api.get("/scheduled-work/overview").then((r) => r.data.data);
export const getCalendar = (params) =>
  api.get("/scheduled-work/calendar", { params }).then((r) => r.data.data);
export const listCompletedWork = (params = {}) =>
  api.get("/scheduled-work/completed", { params }).then((r) => r.data.data);
export const listRecurringWork = () =>
  api.get("/scheduled-work/recurring").then((r) => r.data.data);
export const listOccurrences = (id, params = {}) =>
  api.get(`/scheduled-work/${id}/occurrences`, { params }).then((r) => r.data.data);
export const getOccurrence = (id, occurrenceId) =>
  api.get(`/scheduled-work/${id}/occurrences/${occurrenceId}`).then((r) => r.data.data);
export const pauseRecurrence = (id) =>
  api.post(`/scheduled-work/${id}/recurrence/pause`).then((r) => r.data.data);
export const resumeRecurrence = (id) =>
  api.post(`/scheduled-work/${id}/recurrence/resume`).then((r) => r.data.data);
export const endRecurrence = (id) =>
  api.post(`/scheduled-work/${id}/recurrence/end`).then((r) => r.data.data);
export const updateRecurrence = (id, repeat) =>
  api.patch(`/scheduled-work/${id}/recurrence`, { repeat }).then((r) => r.data.data);
export const startOccurrence = (id, occurrenceId) =>
  api.post(`/scheduled-work/${id}/occurrences/${occurrenceId}/start`).then((r) => r.data.data);
export const startWork = (id) =>
  api.post(`/scheduled-work/${id}/start-work`).then((r) => r.data.data);
export const startOccurrenceWork = (id, occurrenceId) =>
  api.post(`/scheduled-work/${id}/occurrences/${occurrenceId}/start-work`).then((r) => r.data.data);
export const rescheduleOccurrence = (id, occurrenceId, data) =>
  api.post(`/scheduled-work/${id}/occurrences/${occurrenceId}/reschedule`, data).then((r) => r.data.data);
export const completeOccurrence = (id, occurrenceId, data = {}) =>
  api.post(`/scheduled-work/${id}/occurrences/${occurrenceId}/complete`, data).then((r) => r.data.data);
export const snoozeOccurrence = (id, occurrenceId, data) =>
  api.post(`/scheduled-work/${id}/occurrences/${occurrenceId}/snooze`, data).then((r) => r.data.data);
export const createScheduledWork = (data) =>
  api.post("/scheduled-work", data).then((r) => r.data.data);
export const updateScheduledWork = (id, data) =>
  api.patch(`/scheduled-work/${id}`, data).then((r) => r.data.data);
export const rescheduleScheduledWork = (id, data) =>
  api.post(`/scheduled-work/${id}/reschedule`, data).then((r) => r.data.data);
export const completeScheduledWork = (id, data = {}) =>
  api.post(`/scheduled-work/${id}/complete`, data).then((r) => r.data.data);
export const startScheduledWork = (id) =>
  api.post(`/scheduled-work/${id}/start`).then((r) => r.data.data);
export const snoozeScheduledWork = (id, data) =>
  api.post(`/scheduled-work/${id}/snooze`, data).then((r) => r.data.data);
export const listSnoozes = (id) =>
  api.get(`/scheduled-work/${id}/snoozes`).then((r) => r.data.data);
export const cancelScheduledWork = (id, data = {}) =>
  api.post(`/scheduled-work/${id}/cancel`, data).then((r) => r.data.data);
export const listReminders = (id) =>
  api.get(`/scheduled-work/${id}/reminders`).then((r) => r.data.data);
export const addReminder = (id, data) =>
  api.post(`/scheduled-work/${id}/reminders`, data).then((r) => r.data.data);
export const removeReminder = (id, reminderId) =>
  api.delete(`/scheduled-work/${id}/reminders/${reminderId}`).then((r) => r.data.data);
export const getTeamOverview = () => api.get("/scheduled-work/team/overview").then((r) => r.data.data);
export const listTeamScheduledWork = (params = {}) => api.get("/scheduled-work/team", { params }).then((r) => r.data.data);
export const getTeamCalendar = (params) => api.get("/scheduled-work/team/calendar", { params }).then((r) => r.data.data);
export const listScheduleEmployees = () => api.get("/scheduled-work/team/employees").then((r) => r.data.data);
export const createTeamScheduledWork = (data) => api.post("/scheduled-work/team", data).then((r) => r.data.data);
export const reassignTeamScheduledWork = (id, data) => api.post(`/scheduled-work/team/${id}/reassign`, data).then((r) => r.data.data);
export const rescheduleTeamScheduledWork = (id, data) => api.post(`/scheduled-work/team/${id}/reschedule`, data).then((r) => r.data.data);
export const cancelTeamScheduledWork = (id) => api.post(`/scheduled-work/team/${id}/cancel`).then((r) => r.data.data);
export const rescheduleTeamOccurrence = (id, occurrenceId, data) => api.post(`/scheduled-work/team/${id}/occurrences/${occurrenceId}/reschedule`, data).then((r) => r.data.data);
export const cancelTeamOccurrence = (id, occurrenceId) => api.post(`/scheduled-work/team/${id}/occurrences/${occurrenceId}/cancel`).then((r) => r.data.data);
