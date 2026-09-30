CREATE TABLE IF NOT EXISTS scheduled_work_reminders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scheduled_work_id BIGINT UNSIGNED NOT NULL,
  reminder_type ENUM('AT_TIME','BEFORE') NOT NULL,
  reminder_value INT UNSIGNED NULL,
  reminder_unit ENUM('MINUTES','HOURS','DAYS') NULL,
  remind_at DATETIME NOT NULL,
  status ENUM('PENDING','TRIGGERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  triggered_at DATETIME NULL,
  notification_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_scheduled_work_reminder_work FOREIGN KEY (scheduled_work_id) REFERENCES scheduled_work(id) ON DELETE CASCADE,
  CONSTRAINT fk_scheduled_work_reminder_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL,
  INDEX idx_scheduled_work_reminder_due (status,remind_at),
  INDEX idx_scheduled_work_reminder_work (scheduled_work_id,status,remind_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO scheduled_work_reminders
  (scheduled_work_id,reminder_type,remind_at)
SELECT sw.id,'AT_TIME',sw.scheduled_at
FROM scheduled_work sw
WHERE sw.status='UPCOMING'
  AND NOT EXISTS (
    SELECT 1 FROM scheduled_work_reminders r
    WHERE r.scheduled_work_id=sw.id AND r.reminder_type='AT_TIME' AND r.status='PENDING'
  );

INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('SCHEDULED_WORK_REMINDER','SELECTED_EMPLOYEES',1,1,1,1),
  ('SCHEDULED_WORK_DUE','SELECTED_EMPLOYEES',1,1,1,1)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
