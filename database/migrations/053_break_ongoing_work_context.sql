ALTER TABLE attendance_breaks
  ADD COLUMN auto_paused_ongoing_work_id BIGINT UNSIGNED NULL AFTER paused_task_id,
  ADD CONSTRAINT fk_attendance_breaks_ongoing_work
    FOREIGN KEY(auto_paused_ongoing_work_id) REFERENCES ongoing_work(id) ON DELETE SET NULL,
  ADD INDEX idx_attendance_breaks_ongoing_work(auto_paused_ongoing_work_id);
