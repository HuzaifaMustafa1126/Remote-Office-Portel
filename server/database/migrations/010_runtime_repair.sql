-- Runtime repair: synchronize existing role permissions. Shift assignment remains an explicit CEO action.
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN
('dashboard.view','employees.view_own','attendance.clock','attendance.view_own','leave.create','leave.view_own','leave.cancel_own','calendar.view','shift.view','salary.view_own','payroll.view_own')
WHERE r.name='Employee';

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN
('dashboard.view','employees.view_all','employees.create','employees.update','employees.deactivate','attendance.view_all','attendance.edit','attendance.reports','leave.view_all','leave.approve','leave.reject','leave.reports','calendar.view','calendar.manage','shift.view','shift.manage','shift.assign','salary.view_all','salary.manage','payroll.view_all','payroll.generate','payroll.recalculate','payroll.approve','payroll.mark_paid','payroll.adjust','roles.view','roles.manage','permissions.view','permissions.manage','audit.view')
WHERE r.name='CEO';

DELETE rp FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id
WHERE r.name='CEO' AND p.name IN('attendance.clock','attendance.view_own');
