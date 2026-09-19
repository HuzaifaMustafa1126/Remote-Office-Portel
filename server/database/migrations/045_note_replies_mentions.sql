CREATE TABLE note_replies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  note_id BIGINT UNSIGNED NOT NULL,
  content VARCHAR(3000) NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_note_replies_note FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_replies_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_note_replies_note_created(note_id,created_at,id),
  INDEX idx_note_replies_creator(created_by,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_reply_mentions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reply_id BIGINT UNSIGNED NOT NULL,
  mentioned_user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_reply_mentions_reply FOREIGN KEY(reply_id) REFERENCES note_replies(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_reply_mentions_user FOREIGN KEY(mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_note_reply_mention(reply_id,mentioned_user_id),
  INDEX idx_note_reply_mentions_user(mentioned_user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('NOTE_REPLY_CREATED','ALL_EMPLOYEES',0,1,1,1),
  ('NOTE_REPLY_MENTION','ALL_EMPLOYEES',0,1,1,1)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
