INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('NOTE_SHARED_CEO','ALL_EMPLOYEES',0,1,1,1)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
