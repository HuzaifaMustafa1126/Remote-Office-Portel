-- Phase 5.9: configurable management notifications for meaningful ongoing-work events.
INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('ONGOING_WORK_STARTED','CEO_ADMIN',0,1,0,0),
  ('ONGOING_WORK_COMPLETED','CEO_ADMIN',0,1,1,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
