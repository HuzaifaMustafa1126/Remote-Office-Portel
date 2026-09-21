INSERT INTO notification_policies
  (event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('ONGOING_WORK_CREATED','CEO_ADMIN',0,1,1,0),
  ('ONGOING_WORK_UPDATED','CEO_ADMIN',0,1,0,0),
  ('ONGOING_WORK_PAUSED','CEO_ADMIN',0,1,0,0),
  ('ONGOING_WORK_SWITCHED','CEO_ADMIN',0,1,1,0),
  ('ONGOING_WORK_DELETED','CEO_ADMIN',0,1,0,0),
  ('ONGOING_WORK_AUTO_PAUSED_BREAK','CEO_ADMIN',0,1,0,0),
  ('ONGOING_WORK_AUTO_PAUSED_CLOCK_OUT','CEO_ADMIN',0,1,0,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);

UPDATE notification_policies
SET desktop_enabled=1
WHERE event_type='ONGOING_WORK_STARTED';
