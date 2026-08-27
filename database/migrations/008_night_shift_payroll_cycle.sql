-- Central shift/payroll policy and explicit attendance work dates.
CREATE TABLE IF NOT EXISTS work_shifts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,
 start_time TIME NOT NULL,end_time TIME NOT NULL,crosses_midnight BOOLEAN NOT NULL,
 grace_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 is_default BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_work_shifts_active(status,is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO work_shifts(name,start_time,end_time,crosses_midnight,grace_minutes,is_default)
SELECT 'Night Shift','18:00:00','03:00:00',TRUE,15,TRUE
WHERE NOT EXISTS(SELECT 1 FROM work_shifts WHERE is_default=TRUE);

CREATE TABLE IF NOT EXISTS payroll_settings (
 id TINYINT UNSIGNED PRIMARY KEY,cycle_start_day TINYINT UNSIGNED NOT NULL DEFAULT 5,
 currency CHAR(3) NOT NULL DEFAULT 'PKR',default_salary_divisor SMALLINT UNSIGNED NOT NULL DEFAULT 30,
 updated_by BIGINT UNSIGNED NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_payroll_settings_user FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO payroll_settings(id,cycle_start_day,currency,default_salary_divisor) VALUES(1,5,'PKR',30);

ALTER TABLE attendance_records
 ADD COLUMN work_date DATE NULL AFTER attendance_date,
 ADD COLUMN shift_id BIGINT UNSIGNED NULL AFTER work_date,
 ADD COLUMN reconciliation_status ENUM('NORMAL','OPEN_SHIFT','CORRECTED') NOT NULL DEFAULT 'NORMAL' AFTER day_status,
 ADD INDEX idx_attendance_work_date(employee_id,work_date),
 ADD CONSTRAINT fk_attendance_shift FOREIGN KEY(shift_id) REFERENCES work_shifts(id) ON DELETE SET NULL;
UPDATE attendance_records SET work_date=attendance_date WHERE work_date IS NULL;
ALTER TABLE attendance_records MODIFY work_date DATE NOT NULL;
