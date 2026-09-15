CREATE TABLE note_attachments(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,note_id BIGINT UNSIGNED NOT NULL,uploaded_by BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(500) NOT NULL,original_filename VARCHAR(255) NOT NULL,mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,deleted_at TIMESTAMP NULL,
  INDEX idx_note_attachments_note(note_id,deleted_at,created_at),
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
