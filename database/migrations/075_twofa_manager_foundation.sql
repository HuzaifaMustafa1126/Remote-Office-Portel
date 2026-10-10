-- Phase 7.2: storage-only 2FA Manager database foundation.
-- Secrets are encrypted by the application before insertion. The database
-- stores only AES-256-GCM ciphertext and its non-secret decryption metadata.

CREATE TABLE IF NOT EXISTS twofa_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_name VARCHAR(200) NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  deleted_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_twofa_profile_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_profile_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_profile_deleter FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_twofa_profiles_active_updated (deleted_at,updated_at,id),
  INDEX idx_twofa_profiles_creator_active (created_by,deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS twofa_platforms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id BIGINT UNSIGNED NOT NULL,
  platform_name VARCHAR(50) NOT NULL,
  platform_custom_name VARCHAR(100) NULL,
  twofa_information_ciphertext MEDIUMBLOB NOT NULL,
  twofa_information_iv BINARY(12) NOT NULL,
  twofa_information_tag BINARY(16) NOT NULL,
  auth_key_ciphertext BLOB NOT NULL,
  auth_key_iv BINARY(12) NOT NULL,
  auth_key_tag BINARY(16) NOT NULL,
  encryption_key_version SMALLINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  deleted_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT chk_twofa_platform_key_version CHECK (encryption_key_version > 0),
  CONSTRAINT chk_twofa_platform_custom_name CHECK (
    (platform_name = 'OTHER' AND platform_custom_name IS NOT NULL AND CHAR_LENGTH(TRIM(platform_custom_name)) > 0)
    OR (platform_name <> 'OTHER' AND platform_custom_name IS NULL)
  ),
  CONSTRAINT fk_twofa_platform_profile FOREIGN KEY (profile_id) REFERENCES twofa_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_platform_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_platform_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_platform_deleter FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_twofa_platforms_profile_active (profile_id,deleted_at,id),
  INDEX idx_twofa_platforms_name_active (platform_name,deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS twofa_profile_access (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  access_type ENUM('OWNER','GRANTED') NOT NULL DEFAULT 'GRANTED',
  granted_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_twofa_access_profile FOREIGN KEY (profile_id) REFERENCES twofa_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_access_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_access_grantor FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_twofa_profile_employee (profile_id,employee_id),
  INDEX idx_twofa_access_employee_profile (employee_id,profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS twofa_activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id BIGINT UNSIGNED NOT NULL,
  platform_id BIGINT UNSIGNED NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  employee_id BIGINT UNSIGNED NULL,
  action ENUM(
    'PROFILE_CREATED',
    'PROFILE_UPDATED',
    'PROFILE_DELETED',
    'PLATFORM_ADDED',
    'PLATFORM_UPDATED',
    'PLATFORM_REMOVED',
    'TWOFA_UPDATED',
    'AUTH_KEY_UPDATED',
    'TWOFA_REVEALED',
    'AUTH_KEY_REVEALED',
    'ACCESS_GRANTED',
    'ACCESS_REVOKED',
    'ACCESS_DENIED'
  ) NOT NULL,
  changed_fields JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  request_id VARCHAR(100) NULL,
  event_status ENUM('SUCCESS','FAILURE') NOT NULL DEFAULT 'SUCCESS',
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_twofa_activity_profile FOREIGN KEY (profile_id) REFERENCES twofa_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_activity_platform FOREIGN KEY (platform_id) REFERENCES twofa_platforms(id) ON DELETE RESTRICT,
  CONSTRAINT fk_twofa_activity_user FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_twofa_activity_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_twofa_activity_profile_created (profile_id,created_at,id),
  INDEX idx_twofa_activity_platform_created (platform_id,created_at),
  INDEX idx_twofa_activity_employee_created (employee_id,created_at),
  INDEX idx_twofa_activity_action_created (action,created_at),
  INDEX idx_twofa_activity_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (name,description) VALUES
  ('2fa.profile.create','Create 2FA Manager profiles'),
  ('2fa.profile.view','View authorized 2FA Manager profiles'),
  ('2fa.profile.edit','Edit authorized 2FA Manager profiles'),
  ('2fa.profile.delete','Delete authorized 2FA Manager profiles'),
  ('2fa.platform.add','Add platforms to authorized 2FA Manager profiles'),
  ('2fa.platform.edit','Edit platforms in authorized 2FA Manager profiles'),
  ('2fa.platform.delete','Remove platforms from authorized 2FA Manager profiles'),
  ('2fa.information.reveal','Reveal stored 2FA information for authorized profiles'),
  ('2fa.key.reveal','Reveal stored authentication keys for authorized profiles'),
  ('2fa.history.view','View activity history for authorized 2FA Manager profiles'),
  ('2fa.access.manage','Manage employee access to authorized 2FA Manager profiles')
ON DUPLICATE KEY UPDATE description=VALUES(description);
