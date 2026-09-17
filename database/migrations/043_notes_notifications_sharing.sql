-- Phase 4.5: Notes notifications, preferences, and per-user read tracking.
ALTER TABLE notification_preferences
  ADD COLUMN note_notifications BOOLEAN NOT NULL DEFAULT TRUE AFTER task_notifications;

CREATE TABLE note_reads (
  note_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (note_id,user_id),
  CONSTRAINT fk_note_reads_note FOREIGN KEY (note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_note_reads_user_read(user_id,read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('NOTE_TEAM_PUBLISHED','ALL_EMPLOYEES',0,1,1,1),
  ('NOTE_CEO_PUBLISHED','ALL_EMPLOYEES',0,1,1,1),
  ('NOTE_IMPORTANT_PUBLISHED','ALL_EMPLOYEES',0,1,1,1),
  ('NOTE_UPDATED','ALL_EMPLOYEES',0,1,1,1),
  ('NOTE_SHARED_TEAM','ALL_EMPLOYEES',0,1,1,1)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
