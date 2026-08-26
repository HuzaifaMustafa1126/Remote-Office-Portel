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
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='CEO';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('dashboard.view','employees.view_own') WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('attendance.clock','attendance.view_own') WHERE r.name='Employee';
