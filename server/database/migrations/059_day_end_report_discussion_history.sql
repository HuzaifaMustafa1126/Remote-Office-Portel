CREATE TABLE day_end_report_replies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  message VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_day_end_reply_report FOREIGN KEY(report_id) REFERENCES day_end_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_day_end_reply_author FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_day_end_reply_report_created(report_id,created_at,id),
  INDEX idx_day_end_reply_author(created_by,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_policies(event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES('DAY_END_REPORT_REPLY','ALL_EMPLOYEES',0,1,1,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
