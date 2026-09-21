-- Completed Ongoing Work retention uses archival so timer sessions and historical
-- references remain intact while archived records disappear from normal views.
ALTER TABLE ongoing_work
  ADD COLUMN deleted_at DATETIME NULL AFTER completed_at,
  ADD COLUMN deleted_by_user_id BIGINT UNSIGNED NULL AFTER deleted_at,
  ADD COLUMN deletion_reason ENUM('MANUAL_ADMIN_DELETE','RETENTION_POLICY') NULL AFTER deleted_by_user_id,
  ADD CONSTRAINT fk_ongoing_work_deleted_by
    FOREIGN KEY(deleted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_ongoing_work_retention(status,deleted_at,completed_at,id);

CREATE TABLE ongoing_work_retention_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  auto_cleanup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  retention_days SMALLINT UNSIGNED NOT NULL DEFAULT 7,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_ongoing_work_retention_days CHECK (retention_days IN (7,14,30,60,90)),
  CONSTRAINT fk_ongoing_work_retention_updated_by
    FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ongoing_work_retention_settings(id,auto_cleanup_enabled,retention_days)
VALUES(1,FALSE,7);

INSERT IGNORE INTO permissions(name,description)
VALUES('ongoing_work.retention_manage','Manage completed Ongoing Work retention and deletion');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r
JOIN permissions p ON p.name='ongoing_work.retention_manage'
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');
