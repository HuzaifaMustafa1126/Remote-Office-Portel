ALTER TABLE work_notes MODIFY visibility ENUM('TEAM','PRIVATE','CEO_ONLY','MANAGEMENT') NOT NULL DEFAULT 'PRIVATE';
UPDATE work_notes SET visibility='CEO_ONLY' WHERE visibility='MANAGEMENT';
ALTER TABLE work_notes MODIFY visibility ENUM('TEAM','PRIVATE','CEO_ONLY') NOT NULL DEFAULT 'PRIVATE';
UPDATE work_notes SET summary=LEFT(content,300) WHERE summary IS NULL OR TRIM(summary)='';
ALTER TABLE work_notes MODIFY summary VARCHAR(300) NOT NULL;

CREATE TABLE note_images(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  note_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_note_images_note(note_id,uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p
WHERE UPPER(r.name)='EMPLOYEE' AND p.name IN('notes.view_own','notes.create','notes.edit_own');
