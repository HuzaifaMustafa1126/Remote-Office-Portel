CREATE TABLE day_end_report_settings (
  id TINYINT UNSIGNED PRIMARY KEY,
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_before_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  overdue_grace_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  overdue_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  review_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  review_reminder_after_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 480,
  manual_reminder_cooldown_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_day_end_settings_user FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO day_end_report_settings(id) VALUES(1);

CREATE TABLE day_end_report_followups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NULL,
  attendance_id BIGINT UNSIGNED NULL,
  report_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  event_key VARCHAR(190) NOT NULL,
  sent_by BIGINT UNSIGNED NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_day_end_followup_event(event_key),
  INDEX idx_day_end_followup_attendance(attendance_id,event_type,sent_at),
  INDEX idx_day_end_followup_report(report_id,event_type,sent_at),
  INDEX idx_day_end_followup_employee(employee_id,event_type,sent_at),
  CONSTRAINT fk_day_end_followup_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_day_end_followup_attendance FOREIGN KEY(attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_day_end_followup_report FOREIGN KEY(report_id) REFERENCES day_end_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_day_end_followup_sender FOREIGN KEY(sent_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_policies(event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
 ('DAY_END_REPORT_DUE_SOON','ALL_EMPLOYEES',0,1,1,1),
 ('DAY_END_REPORT_OVERDUE','ALL_EMPLOYEES',0,1,1,1),
 ('DAY_END_REPORT_MANUAL_REMINDER','ALL_EMPLOYEES',0,1,1,1),
 ('DAY_END_REPORT_BLOCKER','CEO_ADMIN',0,1,1,0),
 ('DAY_END_REPORT_AWAITING_REVIEW','CEO_ADMIN',0,1,1,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
