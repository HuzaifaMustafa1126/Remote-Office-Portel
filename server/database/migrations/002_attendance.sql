-- Phase 1.2 attendance and break tracking. Safe to run after 001_initial_schema.sql.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  clock_in_at TIMESTAMP NOT NULL,
  clock_out_at TIMESTAMP NULL,
  total_break_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  total_work_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('WORKING','ON_BREAK','CLOCKED_OUT') NOT NULL DEFAULT 'WORKING',
  day_status ENUM('PRESENT','ABSENT','HALF_DAY','LEAVE') NOT NULL DEFAULT 'PRESENT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_attendance_employee_date (employee_id, attendance_date),
  INDEX idx_attendance_date_status (attendance_date, status),
  INDEX idx_attendance_employee_clock_in (employee_id, clock_in_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_breaks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attendance_id BIGINT UNSIGNED NOT NULL,
  break_start_at TIMESTAMP NOT NULL,
  break_end_at TIMESTAMP NULL,
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_break_record FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
  INDEX idx_breaks_attendance_status (attendance_id, status),
  INDEX idx_breaks_started (break_start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (name, description) VALUES
  ('attendance.clock', 'Clock in, take breaks, and clock out'),
  ('attendance.view_own', 'View own attendance records'),
  ('attendance.view_all', 'View attendance for all employees'),
  ('attendance.edit', 'Correct attendance records'),
  ('attendance.reports', 'View attendance reports')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'CEO' AND p.name IN ('attendance.view_all', 'attendance.edit', 'attendance.reports');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.name IN ('attendance.clock', 'attendance.view_own')
WHERE r.name = 'Employee';
