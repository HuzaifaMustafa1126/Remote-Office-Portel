-- Complete task notification policy coverage without changing existing choices.
-- event_type is unique. Existing rows take the duplicate-key branch, whose
-- self-assignment deliberately preserves the row id, audience, channel flags,
-- role/employee mappings, mandatory flag, actor rule, and administrator edits.
INSERT INTO notification_policies
  (event_type,audience_type,in_app_enabled,desktop_enabled,sound_enabled)
VALUES
  ('OPEN_TASK_CREATED','ALL_EMPLOYEES',1,1,1),
  ('TASK_CLAIMED','CEO_ADMIN',1,1,1),
  ('TASK_ASSIGNED','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_REASSIGNED','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_UPDATED','SELECTED_EMPLOYEES',1,0,0),
  ('TASK_STARTED','CEO_ADMIN',1,0,0),
  ('TASK_PAUSED','CEO_ADMIN',1,0,0),
  ('TASK_RESUMED','SELECTED_EMPLOYEES',1,0,0),
  ('TASK_SUBMITTED','CEO_ADMIN',1,1,0),
  ('TASK_CHANGES_REQUIRED','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_COMPLETED','CEO_ADMIN',1,1,1),
  ('TASK_REOPENED','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_DEADLINE_CHANGED','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_PRIORITY_CHANGED','SELECTED_EMPLOYEES',1,0,0),
  ('TASK_COMMENT','SELECTED_EMPLOYEES',1,1,0),
  ('TASK_DUE_SOON','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_OVERDUE','SELECTED_EMPLOYEES',1,1,1),
  ('TASK_DELETED','SELECTED_EMPLOYEES',1,1,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
