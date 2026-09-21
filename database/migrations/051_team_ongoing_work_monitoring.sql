INSERT IGNORE INTO permissions(name,description)
VALUES('ongoing_work.view_team','View team ongoing and completed work');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name='ongoing_work.view_team'
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');

CREATE INDEX idx_ongoing_work_status_completed_employee
  ON ongoing_work(status,completed_at,employee_id);
