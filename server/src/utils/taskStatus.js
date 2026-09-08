import ApiError from "./ApiError.js";
const employee = {
  TO_DO: ["IN_PROGRESS"],
  CHANGES_REQUIRED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED_FOR_REVIEW", "COMPLETED"],
};
const management = {
  DRAFT: ["SCHEDULED", "OPEN", "TO_DO"],
  SCHEDULED: ["DRAFT", "OPEN", "TO_DO"],
  SUBMITTED_FOR_REVIEW: ["COMPLETED", "CHANGES_REQUIRED"],
  COMPLETED: ["CHANGES_REQUIRED", "ARCHIVED"],
  ARCHIVED: ["COMPLETED"],
};
export function assertTransition(
  from,
  to,
  { management: manage = false, reviewRequired = false } = {},
) {
  const allowed = manage ? management[from] || [] : employee[from] || [];
  if (!allowed.includes(to))
    throw new ApiError(409, `Invalid task transition: ${from} to ${to}`);
  if (
    !manage &&
    from === "IN_PROGRESS" &&
    reviewRequired &&
    to !== "SUBMITTED_FOR_REVIEW"
  )
    throw new ApiError(409, "This task must be submitted for review");
  if (
    !manage &&
    from === "IN_PROGRESS" &&
    !reviewRequired &&
    to !== "COMPLETED"
  )
    throw new ApiError(409, "This task does not require review");
}
export function isOverdue(task, now = new Date()) {
  if (["COMPLETED", "ARCHIVED"].includes(task.status) || !task.dueAt)
    return false;
  const delivered = task.submittedAt || task.completedAt;
  return delivered
    ? new Date(delivered) > new Date(task.dueAt)
    : now > new Date(task.dueAt);
}
