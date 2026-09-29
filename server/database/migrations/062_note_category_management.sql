ALTER TABLE note_categories
  ADD COLUMN color VARCHAR(20) NULL AFTER name,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER color,
  ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER sort_order,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN archived_at DATETIME NULL AFTER updated_at,
  ADD CONSTRAINT fk_note_categories_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_note_categories_active_order (is_active, sort_order, name);

UPDATE note_categories SET sort_order = id * 10 WHERE sort_order = 0;

-- Category administration is intentionally CEO-only. SUPER_ADMIN retains the
-- permission for emergency platform administration.
DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.name = 'notes.manage_categories'
  AND UPPER(r.name) NOT IN ('CEO', 'SUPER_ADMIN');
