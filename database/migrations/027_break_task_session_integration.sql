-- Phase 3.3: remember the exact task session paused by an attendance break.
ALTER TABLE attendance_breaks
  ADD COLUMN paused_task_id BIGINT UNSIGNED NULL AFTER attendance_id,
  ADD CONSTRAINT fk_attendance_break_paused_task
    FOREIGN KEY (paused_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  ADD INDEX idx_attendance_break_paused_task (paused_task_id);
