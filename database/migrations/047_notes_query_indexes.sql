ALTER TABLE work_notes
  ADD INDEX idx_work_notes_active_created(status,is_archived,created_at,id),
  ADD INDEX idx_work_notes_active_important(status,is_archived,is_important,created_at,id);

ALTER TABLE note_replies
  ADD INDEX idx_note_replies_active(note_id,deleted_at,created_at,id);
