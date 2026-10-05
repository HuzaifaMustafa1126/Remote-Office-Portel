ALTER TABLE scheduled_work_reminders
  MODIFY COLUMN status ENUM('PENDING','PROCESSING','TRIGGERED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN claim_token CHAR(36) NULL AFTER next_attempt_at,
  ADD COLUMN claimed_at DATETIME NULL AFTER claim_token,
  ADD INDEX idx_scheduled_work_reminder_claim (status,claimed_at);

ALTER TABLE scheduled_work_snoozes
  MODIFY COLUMN status ENUM('PENDING','PROCESSING','TRIGGERED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN claim_token CHAR(36) NULL AFTER next_attempt_at,
  ADD COLUMN claimed_at DATETIME NULL AFTER claim_token,
  ADD INDEX idx_scheduled_work_snooze_claim (status,claimed_at);
