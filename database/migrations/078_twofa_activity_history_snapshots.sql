-- Deployment mirror of server/database/migrations/078_twofa_activity_history_snapshots.sql.
ALTER TABLE twofa_activity_logs
  ADD COLUMN profile_name_snapshot VARCHAR(200) NULL AFTER profile_id,
  ADD COLUMN platform_name_snapshot VARCHAR(150) NULL AFTER platform_id,
  ADD COLUMN employee_name_snapshot VARCHAR(200) NULL AFTER employee_id,
  ADD INDEX idx_twofa_activity_status_created (event_status,created_at,id),
  ADD INDEX idx_twofa_activity_profile_action_created (profile_id,action,created_at,id),
  ADD INDEX idx_twofa_activity_employee_action_created (employee_id,action,created_at,id);
UPDATE twofa_activity_logs a JOIN twofa_profiles p ON p.id=a.profile_id
LEFT JOIN twofa_platforms tp ON tp.id=a.platform_id LEFT JOIN employees e ON e.id=a.employee_id
SET a.profile_name_snapshot=p.profile_name,
    a.platform_name_snapshot=CASE WHEN tp.platform_name='OTHER' THEN tp.platform_custom_name ELSE REPLACE(tp.platform_name,'_',' ') END,
    a.employee_name_snapshot=CONCAT(e.first_name,' ',e.last_name);
ALTER TABLE twofa_profile_access DROP FOREIGN KEY fk_twofa_access_employee;
ALTER TABLE twofa_profile_access
  ADD CONSTRAINT fk_twofa_access_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE twofa_profiles DROP FOREIGN KEY fk_twofa_profile_creator,
  DROP FOREIGN KEY fk_twofa_profile_updater,DROP FOREIGN KEY fk_twofa_profile_deleter;
ALTER TABLE twofa_profiles MODIFY created_by BIGINT UNSIGNED NULL,MODIFY updated_by BIGINT UNSIGNED NULL;
ALTER TABLE twofa_profiles ADD CONSTRAINT fk_twofa_profile_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_twofa_profile_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_twofa_profile_deleter FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE twofa_platforms DROP FOREIGN KEY fk_twofa_platform_creator,
  DROP FOREIGN KEY fk_twofa_platform_updater,DROP FOREIGN KEY fk_twofa_platform_deleter;
ALTER TABLE twofa_platforms MODIFY created_by BIGINT UNSIGNED NULL,MODIFY updated_by BIGINT UNSIGNED NULL;
ALTER TABLE twofa_platforms ADD CONSTRAINT fk_twofa_platform_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_twofa_platform_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_twofa_platform_deleter FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE twofa_profile_access DROP FOREIGN KEY fk_twofa_access_grantor;
ALTER TABLE twofa_profile_access MODIFY granted_by BIGINT UNSIGNED NULL;
ALTER TABLE twofa_profile_access ADD CONSTRAINT fk_twofa_access_grantor FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;
