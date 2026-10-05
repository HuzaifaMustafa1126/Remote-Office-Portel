ALTER TABLE scheduled_work
  ADD INDEX idx_scheduled_work_assignee_completed (assigned_to,status,completed_at);

ALTER TABLE scheduled_work_occurrences
  ADD INDEX idx_scheduled_work_occurrence_assignee_completed (assigned_to,status,completed_at);
