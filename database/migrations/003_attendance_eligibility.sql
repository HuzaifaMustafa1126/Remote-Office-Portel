-- Phase 1.2 UI/role refinement: explicitly control who participates in attendance.
SET @track_attendance_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'track_attendance'
);
SET @track_attendance_sql = IF(
  @track_attendance_exists = 0,
  'ALTER TABLE employees ADD COLUMN track_attendance BOOLEAN NOT NULL DEFAULT TRUE AFTER status',
  'SET @track_attendance_exists = @track_attendance_exists'
);
PREPARE track_attendance_statement FROM @track_attendance_sql;
EXECUTE track_attendance_statement;
DEALLOCATE PREPARE track_attendance_statement;

-- Existing CEO accounts become management-only. This is a one-time configuration;
-- runtime attendance queries use track_attendance and never check role names.
UPDATE employees e
JOIN users u ON u.employee_id = e.id
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
SET e.track_attendance = FALSE
WHERE r.name = 'CEO';

DELETE rp FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'CEO' AND p.name IN ('attendance.clock', 'attendance.view_own');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.name IN ('attendance.view_all', 'attendance.edit', 'attendance.reports')
WHERE r.name = 'CEO';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.name IN ('attendance.clock', 'attendance.view_own')
WHERE r.name = 'Employee';
