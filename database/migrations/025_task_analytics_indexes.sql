-- Phase 3.2 analytics indexes. Additive only; no task records are changed.
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_tasks_due_completed ON tasks(due_at,completed_at);
CREATE INDEX idx_tasks_assignee_created ON tasks(assignee_employee_id,created_at);
