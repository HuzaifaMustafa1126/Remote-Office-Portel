ALTER TABLE ongoing_work_sessions
  ADD COLUMN attendance_record_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD CONSTRAINT fk_ongoing_work_session_attendance
    FOREIGN KEY(attendance_record_id) REFERENCES attendance_records(id) ON DELETE RESTRICT,
  ADD INDEX idx_ongoing_work_sessions_attendance(attendance_record_id,started_at);
