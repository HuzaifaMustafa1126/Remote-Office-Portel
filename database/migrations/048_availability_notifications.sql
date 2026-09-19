ALTER TABLE notification_preferences
  ADD COLUMN availability_notifications BOOLEAN NOT NULL DEFAULT TRUE AFTER attendance_notifications;

INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('AVAILABILITY_CHANGED','ALL_EMPLOYEES',0,1,1,1)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
