ALTER TABLE scheduled_work
  ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
  ADD COLUMN recurrence_type ENUM('DAILY','WEEKLY','MONTHLY','CUSTOM_INTERVAL') NULL AFTER is_recurring,
  ADD COLUMN recurrence_interval INT UNSIGNED NULL AFTER recurrence_type,
  ADD COLUMN recurrence_unit ENUM('HOURS','DAYS','WEEKS','MONTHS') NULL AFTER recurrence_interval,
  ADD COLUMN recurrence_config JSON NULL AFTER recurrence_unit,
  ADD COLUMN recurrence_reminders JSON NULL AFTER recurrence_config,
  ADD COLUMN recurrence_start_at DATETIME NULL AFTER recurrence_reminders,
  ADD COLUMN recurrence_end_type ENUM('NEVER','ON_DATE','AFTER_OCCURRENCES') NULL AFTER recurrence_start_at,
  ADD COLUMN recurrence_end_at DATETIME NULL AFTER recurrence_end_type,
  ADD COLUMN recurrence_max_occurrences INT UNSIGNED NULL AFTER recurrence_end_at,
  ADD COLUMN recurrence_status ENUM('ACTIVE','PAUSED','ENDED') NULL AFTER recurrence_max_occurrences,
  ADD INDEX idx_scheduled_work_recurrence (assigned_to,is_recurring,recurrence_status);

CREATE TABLE IF NOT EXISTS scheduled_work_occurrences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scheduled_work_id BIGINT UNSIGNED NOT NULL,
  assigned_to BIGINT UNSIGNED NOT NULL,
  occurrence_number INT UNSIGNED NOT NULL,
  scheduled_at DATETIME NOT NULL,
  status ENUM('UPCOMING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_scheduled_work_occurrence_parent FOREIGN KEY (scheduled_work_id) REFERENCES scheduled_work(id) ON DELETE CASCADE,
  CONSTRAINT fk_scheduled_work_occurrence_assignee FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_scheduled_work_occurrence_time (scheduled_work_id,scheduled_at),
  UNIQUE KEY uq_scheduled_work_occurrence_number (scheduled_work_id,occurrence_number),
  INDEX idx_scheduled_work_occurrence_assignee_status_time (assigned_to,status,scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE scheduled_work_reminders
  ADD COLUMN occurrence_id BIGINT UNSIGNED NULL AFTER scheduled_work_id,
  ADD CONSTRAINT fk_scheduled_work_reminder_occurrence FOREIGN KEY (occurrence_id) REFERENCES scheduled_work_occurrences(id) ON DELETE CASCADE,
  ADD INDEX idx_scheduled_work_reminder_occurrence (occurrence_id,status,remind_at);

ALTER TABLE scheduled_work_snoozes
  ADD COLUMN occurrence_id BIGINT UNSIGNED NULL AFTER scheduled_work_id,
  ADD CONSTRAINT fk_scheduled_work_snooze_occurrence FOREIGN KEY (occurrence_id) REFERENCES scheduled_work_occurrences(id) ON DELETE CASCADE,
  ADD INDEX idx_scheduled_work_snooze_occurrence (occurrence_id,status,snoozed_until);
