-- Login security metadata extends the existing authoritative auth session model.
ALTER TABLE auth_sessions
  ADD COLUMN browser VARCHAR(60) NULL AFTER user_agent,
  ADD COLUMN operating_system VARCHAR(60) NULL AFTER browser,
  ADD COLUMN device_type ENUM('DESKTOP','MOBILE','TABLET','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' AFTER operating_system,
  ADD COLUMN login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER device_type,
  ADD COLUMN logout_at DATETIME NULL AFTER login_at,
  ADD COLUMN ended_reason ENUM('LOGOUT','EXPIRED','REVOKED') NULL AFTER logout_at,
  ADD COLUMN is_new_ip BOOLEAN NOT NULL DEFAULT FALSE AFTER ended_reason,
  ADD COLUMN is_new_device BOOLEAN NOT NULL DEFAULT FALSE AFTER is_new_ip,
  ADD INDEX idx_auth_security_status_login(status,login_at),
  ADD INDEX idx_auth_security_ip(ip_address,login_at);

UPDATE auth_sessions SET login_at=created_at;

CREATE TABLE login_failed_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempted_identifier VARCHAR(190) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  employee_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  browser VARCHAR(60) NULL,
  operating_system VARCHAR(60) NULL,
  device_type ENUM('DESKTOP','MOBILE','TABLET','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  failure_category VARCHAR(40) NOT NULL DEFAULT 'INVALID_CREDENTIALS',
  suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_failed_login_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_failed_login_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_failed_login_attempted(attempted_at),
  INDEX idx_failed_login_identifier(attempted_identifier,attempted_at),
  INDEX idx_failed_login_ip(ip_address,attempted_at),
  INDEX idx_failed_login_suspicious(suspicious,attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions(name,description) VALUES
 ('security.login_activity.view','View login security and session activity'),
 ('security.sessions.revoke','Terminate active login sessions')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE UPPER(r.name) IN ('CEO','ADMIN','SUPER_ADMIN')
  AND p.name IN ('security.login_activity.view','security.sessions.revoke');
