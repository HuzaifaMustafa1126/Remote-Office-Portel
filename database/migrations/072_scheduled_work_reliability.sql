ALTER TABLE scheduled_work_reminders
  MODIFY COLUMN status ENUM('PENDING','TRIGGERED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN attempts_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN next_attempt_at DATETIME NULL AFTER attempts_count,
  ADD COLUMN last_error VARCHAR(500) NULL AFTER next_attempt_at,
  ADD COLUMN failed_at DATETIME NULL AFTER last_error,
  ADD INDEX idx_scheduled_work_reminder_retry (status,next_attempt_at,remind_at);

ALTER TABLE scheduled_work_snoozes
  MODIFY COLUMN status ENUM('PENDING','TRIGGERED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN attempts_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN next_attempt_at DATETIME NULL AFTER attempts_count,
  ADD COLUMN last_error VARCHAR(500) NULL AFTER next_attempt_at,
  ADD COLUMN failed_at DATETIME NULL AFTER last_error,
  ADD INDEX idx_scheduled_work_snooze_retry (status,next_attempt_at,snoozed_until);
