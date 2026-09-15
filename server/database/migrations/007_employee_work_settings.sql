-- Effective-dated employee schedules, salary profiles, and immutable attendance snapshots.
CREATE TABLE IF NOT EXISTS employee_work_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  clock_in_time TIME NOT NULL,
  clock_out_time TIME NOT NULL,
  crosses_midnight BOOLEAN NOT NULL,
  grace_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  break_allowance_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  required_work_minutes SMALLINT UNSIGNED NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_work_settings_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_work_settings_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_work_settings_effective(employee_id,effective_from),
  INDEX idx_work_settings_lookup(employee_id,effective_from,effective_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_salary_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  monthly_salary DECIMAL(12,2) NOT NULL,
  salary_divisor SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  effective_from DATE NOT NULL,
  effective_until DATE NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salary_profile_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_salary_profile_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_salary_profile_effective(employee_id,effective_from),
  INDEX idx_salary_profile_lookup(employee_id,effective_from,effective_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attendance_records
  ADD COLUMN scheduled_clock_in DATETIME NULL AFTER attendance_date,
  ADD COLUMN scheduled_clock_out DATETIME NULL AFTER scheduled_clock_in,
  ADD COLUMN grace_minutes SMALLINT UNSIGNED NULL AFTER scheduled_clock_out,
  ADD COLUMN required_work_minutes SMALLINT UNSIGNED NULL AFTER grace_minutes,
  ADD COLUMN break_allowance_minutes SMALLINT UNSIGNED NULL AFTER required_work_minutes,
  ADD COLUMN arrival_status ENUM('ON_TIME','LATE') NULL AFTER break_allowance_minutes,
  ADD COLUMN late_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER arrival_status,
  ADD COLUMN short_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER total_work_minutes,
  ADD COLUMN extra_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER short_minutes,
  ADD COLUMN break_exceeded_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER extra_minutes;

INSERT INTO permissions(name,description) VALUES
 ('shift.view','View employee work schedules'),('shift.manage','Manage work schedule definitions'),
 ('shift.assign','Assign effective-dated schedules to employees'),('salary.view_all','View all employee salary profiles'),
 ('salary.manage','Manage effective-dated employee salaries')
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='CEO' AND p.name IN ('shift.view','shift.manage','shift.assign','salary.view_all','salary.manage');
