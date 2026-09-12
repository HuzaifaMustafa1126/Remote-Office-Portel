# Task Time Tracking Phase 3.1 Audit

- Tasks use `tasks`; work periods use the existing `task_work_sessions` table from migration 024.
- Tasks and sessions reference `employees.id`; authenticated requests resolve this as `req.user.employee_id` through the existing auth session middleware.
- Attendance uses `attendance_records`; breaks use `attendance_breaks`; both are managed by `attendance.service.js` transactions.
- Task statuses are `DRAFT`, `SCHEDULED`, `OPEN`, `TO_DO`, `IN_PROGRESS`, `SUBMITTED_FOR_REVIEW`, `CHANGES_REQUIRED`, `COMPLETED`, and `ARCHIVED`.
- Start and Resume use `PATCH /api/v1/tasks/:id/status` with `IN_PROGRESS`. Submit and Complete use the same endpoint with their target status.
- Started reassignment uses `PUT /api/v1/tasks/:id/assignee` and preserves `task_assignment_history` and existing work sessions.
- `task_work_sessions.active_employee_id` is a generated value with unique key `uq_one_active_task_per_employee`, enforcing one active session per employee. Application transactions additionally lock the employee row before checking and inserting.
- Session start/end and duration calculations use MySQL `CURRENT_TIMESTAMP`; the client timer is display-only.
- Existing indexes already cover the active employee constraint and `(task_id, employee_id, started_at)` history queries. No migration is required.
- Read-only database audit on 2026-09-10 found no duplicate active sessions, no active sessions on non-`IN_PROGRESS` tasks, and no `IN_PROGRESS` task missing an active session. Nine closed sessions were preserved.
- The repository already contained attendance integration that pauses sessions on break/clock-out and resumes after break. Phase 3.1 did not add or alter that behavior. Offline timeout remains unimplemented.
