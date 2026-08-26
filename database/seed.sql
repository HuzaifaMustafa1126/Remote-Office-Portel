-- Idempotent Phase 1.1 seed. Development CEO password: ChangeMe123!
INSERT INTO roles(name) VALUES ('CEO'),('Employee') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO permissions(name,description) VALUES
('dashboard.view','View the dashboard'),('employees.view_own','View own employee profile'),('employees.view_all','View all employees'),
('employees.create','Create employees'),('employees.update','Update employees'),('employees.deactivate','Activate or deactivate employees'),
('roles.view','View roles'),('roles.manage','Create and update roles'),('permissions.view','View permissions'),
('permissions.manage','Assign permissions to roles'),('audit.view','View audit logs')
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='CEO';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('dashboard.view','employees.view_own') WHERE r.name='Employee';
INSERT INTO employees(employee_code,first_name,last_name,email,phone,job_title,department,joining_date,status)
VALUES('CEO-001','Chief','Executive Officer','ceo@example.com',NULL,'CEO','Executive',CURRENT_DATE,'ACTIVE')
ON DUPLICATE KEY UPDATE employee_code=VALUES(employee_code);
INSERT INTO users(employee_id,email,password_hash,status)
SELECT id,'ceo@example.com','$2b$12$WBFeBndI6vUp.oTMSpc6AOl3zQNopAEiVL48Z5odQcVZGGk1lw5rm','ACTIVE' FROM employees WHERE email='ceo@example.com'
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id),password_hash=VALUES(password_hash),status='ACTIVE';
INSERT IGNORE INTO user_roles(user_id,role_id) SELECT u.id,r.id FROM users u JOIN roles r ON r.name='CEO' WHERE u.email='ceo@example.com';
