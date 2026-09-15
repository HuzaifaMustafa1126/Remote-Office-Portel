-- Phase 3.5 task collaboration additions. Additive and backward compatible.
ALTER TABLE task_comments
  ADD COLUMN parent_comment_id BIGINT UNSIGNED NULL AFTER author_user_id,
  ADD COLUMN updated_at TIMESTAMP NULL AFTER created_at,
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at,
  ADD CONSTRAINT fk_task_comment_parent FOREIGN KEY(parent_comment_id) REFERENCES task_comments(id) ON DELETE SET NULL,
  ADD INDEX idx_task_comments_parent(parent_comment_id);

CREATE TABLE task_attachments(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_task_attachments_task(task_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_read_states(
  task_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(task_id,user_id),
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_read_user(user_id,last_read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO notification_policies(event_type,audience_type,in_app_enabled,desktop_enabled,sound_enabled) VALUES
('TASK_COMMENT','SELECTED_EMPLOYEES',1,0,0),('TASK_MENTION','SELECTED_EMPLOYEES',1,1,0),
('TASK_REPLY','SELECTED_EMPLOYEES',1,1,0),('TASK_ATTACHMENT_ADDED','SELECTED_EMPLOYEES',1,0,0),
('TASK_APPROVED','SELECTED_EMPLOYEES',1,1,0);
