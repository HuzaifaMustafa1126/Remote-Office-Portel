-- Categories are retired from the active Notes workflow. Preserve the column,
-- foreign key, category rows, and all historical category assignments.
ALTER TABLE work_notes MODIFY category_id BIGINT UNSIGNED NULL;
