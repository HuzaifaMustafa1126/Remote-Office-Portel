CREATE TABLE IF NOT EXISTS ongoing_work_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ongoing_work_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  duration_seconds BIGINT UNSIGNED NULL,
  active_employee_id BIGINT UNSIGNED
    GENERATED ALWAYS AS (IF(ended_at IS NULL,employee_id,NULL)) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ongoing_work_session_work
    FOREIGN KEY (ongoing_work_id) REFERENCES ongoing_work(id) ON DELETE CASCADE,
  CONSTRAINT fk_ongoing_work_session_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ongoing_work_session_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_one_active_ongoing_work_per_employee(active_employee_id),
  INDEX idx_ongoing_work_sessions_work(ongoing_work_id,started_at),
  INDEX idx_ongoing_work_sessions_employee(employee_id,ended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 5.1 records predate timer sessions. Keep them, but make their initial
-- timer state truthful: no session means no timer is currently running.
UPDATE ongoing_work SET status='PAUSED' WHERE status='WORKING';
