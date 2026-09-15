ALTER TABLE notification_preferences
  ADD COLUMN announcement_notifications BOOLEAN NOT NULL DEFAULT TRUE AFTER attendance_notifications;
