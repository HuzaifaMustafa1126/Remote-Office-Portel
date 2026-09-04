ALTER TABLE users
  ADD COLUMN password_changed_at DATETIME NULL,
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE employees
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_employees_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_employees_deleted_at (deleted_at);

INSERT INTO permissions(name, description) VALUES
  ('employees.reset_password', 'Reset another employee password'),
  ('employees.delete', 'Archive an employee account'),
  ('employees.restore', 'Restore an archived employee account')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('employees.reset_password', 'employees.delete', 'employees.restore')
WHERE r.name IN ('CEO', 'Super Admin');
