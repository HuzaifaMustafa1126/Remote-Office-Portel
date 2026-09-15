-- Repair the two built-in roles without changing any custom role.
INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'CEO'
  AND p.name NOT IN (
    'attendance.clock', 'attendance.view_own',
    'leave.create', 'leave.view_own', 'leave.cancel_own',
    'salary.view_own', 'payroll.view_own'
  );

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'CEO'
  AND p.name IN (
    'attendance.clock', 'attendance.view_own',
    'leave.create', 'leave.view_own', 'leave.cancel_own',
    'salary.view_own', 'payroll.view_own'
  );

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'dashboard.view', 'employees.view_own',
  'attendance.clock', 'attendance.view_own',
  'leave.create', 'leave.view_own', 'leave.cancel_own',
  'calendar.view', 'shift.view', 'salary.view_own', 'payroll.view_own'
)
WHERE r.name = 'Employee';

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'Employee'
  AND p.name NOT IN (
    'dashboard.view', 'employees.view_own',
    'attendance.clock', 'attendance.view_own',
    'leave.create', 'leave.view_own', 'leave.cancel_own',
    'calendar.view', 'shift.view', 'salary.view_own', 'payroll.view_own'
  );
