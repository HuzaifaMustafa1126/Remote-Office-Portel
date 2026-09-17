ALTER TABLE work_notes
  ADD COLUMN archived_at TIMESTAMP NULL AFTER published_at,
  ADD INDEX idx_work_notes_archived_at(is_archived,archived_at);
