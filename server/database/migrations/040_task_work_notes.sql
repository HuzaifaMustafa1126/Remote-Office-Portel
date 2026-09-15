ALTER TABLE work_notes ADD COLUMN related_task_title VARCHAR(255) NULL AFTER related_task_id;
UPDATE work_notes n JOIN tasks t ON t.id=n.related_task_id SET n.related_task_title=t.title WHERE n.related_task_id IS NOT NULL AND n.related_task_title IS NULL;
