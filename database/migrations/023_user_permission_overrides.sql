CREATE TABLE user_permission_overrides(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,permission_id BIGINT UNSIGNED NOT NULL,
 effect ENUM('ALLOW','DENY') NOT NULL,created_by BIGINT UNSIGNED NULL,updated_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_user_permission_override(user_id,permission_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
INSERT INTO permissions(name,description) VALUES('permissions.employee_override.manage','Manage individual employee permission overrides');
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='permissions.employee_override.manage' WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');
