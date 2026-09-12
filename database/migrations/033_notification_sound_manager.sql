CREATE TABLE notification_sounds(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,original_name VARCHAR(255) NULL,storage_key VARCHAR(500) NULL,
  mime_type VARCHAR(50) NULL,size_bytes INT UNSIGNED NULL,uploaded_by BIGINT UNSIGNED NULL,
  builtin_key VARCHAR(30) NULL,is_builtin BOOLEAN NOT NULL DEFAULT FALSE,is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_notification_sound_builtin(builtin_key),
  INDEX idx_notification_sounds_available(deleted_at,is_builtin),
  FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_sounds(name,builtin_key,is_builtin,is_default) VALUES
('Standard','STANDARD',1,1),('Strong Alert','STRONG',1,0),('Soft Bell','SOFT',1,0),
('Warning','WARNING',1,0),('Critical','CRITICAL',1,0);

CREATE TABLE notification_sound_settings(
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,default_sound_id BIGINT UNSIGNED NULL,
  normal_volume TINYINT UNSIGNED NOT NULL DEFAULT 70,important_volume TINYINT UNSIGNED NOT NULL DEFAULT 85,
  warning_volume TINYINT UNSIGNED NOT NULL DEFAULT 90,critical_volume TINYINT UNSIGNED NOT NULL DEFAULT 100,
  updated_by BIGINT UNSIGNED NULL,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(default_sound_id) REFERENCES notification_sounds(id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO notification_sound_settings(id,default_sound_id) SELECT 1,id FROM notification_sounds WHERE builtin_key='STANDARD';

CREATE TABLE notification_sound_assignments(
  scope_type ENUM('CATEGORY','EVENT') NOT NULL,scope_key VARCHAR(50) NOT NULL,sound_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(scope_type,scope_key),FOREIGN KEY(sound_id) REFERENCES notification_sounds(id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notification_preferences ADD COLUMN sound_id BIGINT UNSIGNED NULL AFTER volume,
  ADD CONSTRAINT fk_notification_preference_sound FOREIGN KEY(sound_id) REFERENCES notification_sounds(id) ON DELETE SET NULL;
