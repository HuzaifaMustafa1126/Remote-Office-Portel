-- Phase 3.7: persisted manual availability preferences.
CREATE TABLE IF NOT EXISTS employee_availability_preferences (
  employee_id BIGINT UNSIGNED PRIMARY KEY,
  manual_status ENUM('AWAY','DO_NOT_DISTURB','IN_MEETING') NOT NULL,
  manual_status_until DATETIME NULL,
  status_note VARCHAR(80) NULL,
  status_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_availability_employee FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_availability_expiry(manual_status_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
