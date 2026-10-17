-- Shared employee access uses normal authenticated sessions; access rows are
-- retained for backward compatibility and historical attribution.
ALTER TABLE twofa_activity_logs MODIFY action ENUM(
  'PROFILE_CREATED','PROFILE_UPDATED','PROFILE_DELETED',
  'PLATFORM_ADDED','PLATFORM_UPDATED','PLATFORM_REMOVED',
  'TWOFA_UPDATED','AUTH_KEY_UPDATED','TWOFA_REVEALED','AUTH_KEY_REVEALED',
  'TWOFA_COPIED','AUTH_KEY_COPIED',
  'ACCESS_GRANTED','ACCESS_UPDATED','ACCESS_REVOKED','ACCESS_DENIED'
) NOT NULL;

