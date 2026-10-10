-- Deployment mirror of server/database/migrations/077_twofa_employee_access_capabilities.sql.
ALTER TABLE twofa_profile_access
  ADD COLUMN can_view BOOLEAN NOT NULL DEFAULT TRUE AFTER access_type,
  ADD COLUMN can_edit BOOLEAN NOT NULL DEFAULT FALSE AFTER can_view,
  ADD COLUMN can_reveal_twofa BOOLEAN NOT NULL DEFAULT FALSE AFTER can_edit,
  ADD COLUMN can_reveal_auth_key BOOLEAN NOT NULL DEFAULT FALSE AFTER can_reveal_twofa,
  ADD CONSTRAINT chk_twofa_access_requires_view CHECK (
    can_view OR (NOT can_edit AND NOT can_reveal_twofa AND NOT can_reveal_auth_key)
  );
UPDATE twofa_profile_access
SET can_view=TRUE,can_edit=TRUE,can_reveal_twofa=TRUE,can_reveal_auth_key=TRUE
WHERE access_type='OWNER';
ALTER TABLE twofa_activity_logs
  MODIFY COLUMN action ENUM(
    'PROFILE_CREATED','PROFILE_UPDATED','PROFILE_DELETED',
    'PLATFORM_ADDED','PLATFORM_UPDATED','PLATFORM_REMOVED',
    'TWOFA_UPDATED','AUTH_KEY_UPDATED','TWOFA_REVEALED','AUTH_KEY_REVEALED',
    'ACCESS_GRANTED','ACCESS_UPDATED','ACCESS_REVOKED','ACCESS_DENIED'
  ) NOT NULL;
