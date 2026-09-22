INSERT IGNORE INTO permissions(name,description) VALUES
('day_end_report.view_all','View team Day-End Reports'),
('day_end_report.review','Review and lock Day-End Reports');
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN('day_end_report.view_all','day_end_report.review')
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');
INSERT INTO notification_policies(event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled)
VALUES('DAY_END_REPORT_REVIEWED','SELECTED_EMPLOYEES',0,1,1,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
CREATE INDEX idx_day_end_report_date_status_employee ON day_end_reports(report_date,status,employee_id);
