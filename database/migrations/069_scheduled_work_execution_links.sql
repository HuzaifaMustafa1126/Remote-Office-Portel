-- Restart-safe because MySQL DDL auto-commits. A previous attempt may have
-- completed the scheduled_work ALTER before failing on ongoing_work.
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='scheduled_work' AND column_name='linked_task_id'),'SELECT 1','ALTER TABLE scheduled_work ADD COLUMN linked_task_id BIGINT UNSIGNED NULL AFTER recurrence_status');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='scheduled_work' AND constraint_name='fk_scheduled_work_linked_task'),'SELECT 1','ALTER TABLE scheduled_work ADD CONSTRAINT fk_scheduled_work_linked_task FOREIGN KEY(linked_task_id) REFERENCES tasks(id) ON DELETE SET NULL');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='scheduled_work' AND index_name='idx_scheduled_work_linked_task'),'SELECT 1','ALTER TABLE scheduled_work ADD INDEX idx_scheduled_work_linked_task(linked_task_id)');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='ongoing_work' AND column_name='source_type'),'SELECT 1','ALTER TABLE ongoing_work ADD COLUMN source_type ENUM(''MANUAL'',''SCHEDULED_WORK'',''TASK'') NOT NULL DEFAULT ''MANUAL'' AFTER total_duration_seconds');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='ongoing_work' AND column_name='source_scheduled_work_id'),'SELECT 1','ALTER TABLE ongoing_work ADD COLUMN source_scheduled_work_id BIGINT UNSIGNED NULL AFTER source_type');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='ongoing_work' AND column_name='source_occurrence_id'),'SELECT 1','ALTER TABLE ongoing_work ADD COLUMN source_occurrence_id BIGINT UNSIGNED NULL AFTER source_scheduled_work_id');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='ongoing_work' AND constraint_name='fk_ongoing_work_source_schedule'),'SELECT 1','ALTER TABLE ongoing_work ADD CONSTRAINT fk_ongoing_work_source_schedule FOREIGN KEY(source_scheduled_work_id) REFERENCES scheduled_work(id) ON DELETE SET NULL');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='ongoing_work' AND constraint_name='fk_ongoing_work_source_occurrence'),'SELECT 1','ALTER TABLE ongoing_work ADD CONSTRAINT fk_ongoing_work_source_occurrence FOREIGN KEY(source_occurrence_id) REFERENCES scheduled_work_occurrences(id) ON DELETE SET NULL');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='ongoing_work' AND index_name='uq_ongoing_work_source_occurrence'),'SELECT 1','ALTER TABLE ongoing_work ADD UNIQUE KEY uq_ongoing_work_source_occurrence(source_occurrence_id)');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
SET @ddl=IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='ongoing_work' AND index_name='idx_ongoing_work_source_schedule'),'SELECT 1','ALTER TABLE ongoing_work ADD INDEX idx_ongoing_work_source_schedule(source_scheduled_work_id,source_occurrence_id)');
PREPARE migration_statement FROM @ddl; EXECUTE migration_statement; DEALLOCATE PREPARE migration_statement;
