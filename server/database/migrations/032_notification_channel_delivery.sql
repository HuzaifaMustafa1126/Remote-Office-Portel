-- Track in-app delivery independently so desktop-only events remain idempotent
-- without appearing in the notification center or unread count.
ALTER TABLE notifications
  ADD COLUMN in_app_allowed BOOLEAN NOT NULL DEFAULT TRUE AFTER event_key,
  ADD INDEX idx_notifications_user_in_app_created(user_id,in_app_allowed,created_at);
