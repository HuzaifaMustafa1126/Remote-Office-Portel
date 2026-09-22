CREATE TABLE IF NOT EXISTS day_end_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  attendance_id BIGINT UNSIGNED NOT NULL,
  report_date DATE NOT NULL,
  other_work VARCHAR(2000) NULL,
  blocker_type ENUM('NONE','WAITING_ADMIN','WAITING_CLIENT','WAITING_TEAM','TECHNICAL','MISSING_ASSETS','OTHER') NOT NULL DEFAULT 'NONE',
  blocker_details VARCHAR(2000) NULL,
  tomorrow_priority VARCHAR(1000) NOT NULL,
  status ENUM('SUBMITTED','REVIEWED') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at DATETIME NOT NULL,
  reviewed_at DATETIME NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_day_end_report_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_day_end_report_attendance FOREIGN KEY(attendance_id) REFERENCES attendance_records(id) ON DELETE RESTRICT,
  CONSTRAINT fk_day_end_report_reviewer FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_day_end_report_attendance(attendance_id),
  INDEX idx_day_end_report_employee_date(employee_id,report_date),
  INDEX idx_day_end_report_status_submitted(status,submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS day_end_report_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT UNSIGNED NOT NULL,
  source_type ENUM('TASK','ONGOING_WORK') NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  ongoing_work_id BIGINT UNSIGNED NULL,
  title_snapshot VARCHAR(200) NOT NULL,
  status_snapshot VARCHAR(40) NOT NULL,
  tracked_minutes_snapshot INT UNSIGNED NOT NULL DEFAULT 0,
  summary VARCHAR(2000) NULL,
  whats_left VARCHAR(2000) NULL,
  estimated_remaining_minutes INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_day_end_item_report FOREIGN KEY(report_id) REFERENCES day_end_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_day_end_item_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  CONSTRAINT fk_day_end_item_ongoing FOREIGN KEY(ongoing_work_id) REFERENCES ongoing_work(id) ON DELETE SET NULL,
  UNIQUE KEY uq_day_end_report_task(report_id,task_id),
  UNIQUE KEY uq_day_end_report_ongoing(report_id,ongoing_work_id),
  INDEX idx_day_end_item_task(task_id),
  INDEX idx_day_end_item_ongoing(ongoing_work_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions(name,description)
VALUES('day_end_report.submit','Submit own Day-End Report');
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='day_end_report.submit'
WHERE UPPER(r.name)='EMPLOYEE';

INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES('DAY_END_REPORT_SUBMITTED','CEO_ADMIN',0,1,0,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
