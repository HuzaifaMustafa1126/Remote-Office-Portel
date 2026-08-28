INSERT INTO permissions(name,description) VALUES('reports.view','View company-wide reports and analytics'),('reports.export','Export company reports') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN('reports.view','reports.export') WHERE r.name='CEO';
-- The reporting columns are already covered by idx_leave_day_employee_date and
-- idx_salary_profile_lookup in their owning migrations. Do not create duplicate
-- indexes here.
