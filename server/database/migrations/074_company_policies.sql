CREATE TABLE IF NOT EXISTS company_policies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_company_policies_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_company_policies_updated(updated_at,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions(name,description) VALUES
  ('company_policy.view','View company policies'),
  ('company_policy.manage','Create, edit and delete company policies');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='company_policy.view';

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='company_policy.manage'
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');
