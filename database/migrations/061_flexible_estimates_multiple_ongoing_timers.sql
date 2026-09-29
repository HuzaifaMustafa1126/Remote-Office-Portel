-- Preserve the exact meaning of historical minute snapshots while recording
-- the employee-selected unit for all new Day-End Report estimates.
ALTER TABLE day_end_report_items
  ADD COLUMN estimated_remaining_value DECIMAL(10,2) NULL AFTER estimated_remaining_minutes,
  ADD COLUMN estimated_remaining_unit ENUM('MINUTES','HOURS','DAYS') NULL AFTER estimated_remaining_value;

UPDATE day_end_report_items
SET estimated_remaining_value=estimated_remaining_minutes,
    estimated_remaining_unit='MINUTES'
WHERE estimated_remaining_minutes IS NOT NULL;

-- Permit multiple active items per employee, while retaining the invariant
-- that an individual Ongoing Work item has at most one open timer session.
ALTER TABLE ongoing_work_sessions
  DROP FOREIGN KEY fk_ongoing_work_session_attendance,
  DROP FOREIGN KEY fk_ongoing_work_session_employee,
  DROP FOREIGN KEY fk_ongoing_work_session_user,
  DROP FOREIGN KEY fk_ongoing_work_session_work;

ALTER TABLE ongoing_work_sessions
  DROP INDEX uq_one_active_ongoing_work_per_employee,
  DROP COLUMN active_employee_id,
  ADD COLUMN active_ongoing_work_id BIGINT UNSIGNED
    GENERATED ALWAYS AS (IF(ended_at IS NULL,ongoing_work_id,NULL)) STORED AFTER duration_seconds,
  ADD UNIQUE KEY uq_one_active_session_per_ongoing_work(active_ongoing_work_id);

ALTER TABLE ongoing_work_sessions
  ADD CONSTRAINT fk_ongoing_work_session_work
    FOREIGN KEY(ongoing_work_id) REFERENCES ongoing_work(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_ongoing_work_session_employee
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_ongoing_work_session_user
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_ongoing_work_session_attendance
    FOREIGN KEY(attendance_record_id) REFERENCES attendance_records(id) ON DELETE RESTRICT;
