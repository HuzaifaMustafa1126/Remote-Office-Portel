DELETE FROM permissions WHERE name = 'employees.restore';

ALTER TABLE employees
  DROP FOREIGN KEY fk_employees_deleted_by,
  DROP INDEX idx_employees_deleted_at,
  DROP COLUMN deleted_by,
  DROP COLUMN deleted_at;
