-- Idempotent Phase 1.1 roles and permissions seed.
-- Run `npm run seed:admin -w server` from the repository root afterward.
-- The Node seed hashes the development admin password with the authentication
-- system's bcrypt configuration; no password or reusable hash is stored here.
INSERT INTO roles(name) VALUES ('CEO'),('Employee') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO permissions(name,description) VALUES
('dashboard.view','View the dashboard'),('employees.view_own','View own employee profile'),('employees.view_all','View all employees'),
('employees.create','Create employees'),('employees.update','Update employees'),('employees.deactivate','Activate or deactivate employees'),
('roles.view','View roles'),('roles.manage','Create and update roles'),('permissions.view','View permissions'),
('permissions.manage','Assign permissions to roles'),('audit.view','View audit logs')
 ,('attendance.clock','Clock in, take breaks, and clock out'),('attendance.view_own','View own attendance records'),
 ('attendance.view_all','View attendance for all employees'),('attendance.edit','Correct attendance records'),
 ('attendance.reports','View attendance reports')
 ,('leave.create','Submit a leave request'),('leave.view_own','View own leave requests'),
 ('leave.view_all','View all employee leave requests'),('leave.approve','Approve leave requests'),
 ('leave.reject','Reject leave requests'),('leave.cancel_own','Cancel own pending leave requests'),
 ('leave.reports','View leave and payroll-preparation reports')
 ,('calendar.view','View the company working calendar'),('calendar.manage','Create, edit, and cancel company holidays')
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='CEO' AND p.name NOT IN ('attendance.clock','attendance.view_own','leave.create','leave.view_own','leave.cancel_own');
DELETE rp FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name='CEO' AND p.name IN ('attendance.clock','attendance.view_own');
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('dashboard.view','employees.view_own') WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('attendance.clock','attendance.view_own') WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('leave.create','leave.view_own','leave.cancel_own') WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='calendar.view' WHERE r.name='Employee';
 