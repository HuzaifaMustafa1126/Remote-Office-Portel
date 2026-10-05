INSERT IGNORE INTO permissions(name,description) VALUES
 ('scheduled_work.create_self','Create personal Scheduled Work'),
 ('scheduled_work.view_self','View personal Scheduled Work'),
 ('scheduled_work.manage_self','Manage personal Scheduled Work'),
 ('scheduled_work.assign','Assign Scheduled Work to employees'),
 ('scheduled_work.view_team','View team Scheduled Work'),
 ('scheduled_work.manage_team','Manage team Scheduled Work'),
 ('scheduled_work.reassign','Reassign team Scheduled Work');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN('scheduled_work.create_self','scheduled_work.view_self','scheduled_work.manage_self');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN('scheduled_work.assign','scheduled_work.view_team','scheduled_work.manage_team','scheduled_work.reassign')
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN');

CREATE TABLE scheduled_work_assignment_history (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 scheduled_work_id BIGINT UNSIGNED NOT NULL,
 occurrence_id BIGINT UNSIGNED NULL,
 previous_employee_id BIGINT UNSIGNED NULL,
 new_employee_id BIGINT UNSIGNED NOT NULL,
 changed_by BIGINT UNSIGNED NOT NULL,
 scope ENUM('INITIAL','ONE_TIME','THIS_OCCURRENCE','FUTURE_OCCURRENCES') NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_scheduled_assignment_work FOREIGN KEY(scheduled_work_id) REFERENCES scheduled_work(id) ON DELETE CASCADE,
 CONSTRAINT fk_scheduled_assignment_occurrence FOREIGN KEY(occurrence_id) REFERENCES scheduled_work_occurrences(id) ON DELETE SET NULL,
 CONSTRAINT fk_scheduled_assignment_previous FOREIGN KEY(previous_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
 CONSTRAINT fk_scheduled_assignment_new FOREIGN KEY(new_employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
 CONSTRAINT fk_scheduled_assignment_actor FOREIGN KEY(changed_by) REFERENCES users(id) ON DELETE RESTRICT,
 INDEX idx_scheduled_assignment_work(scheduled_work_id,created_at),
 INDEX idx_scheduled_assignment_employee(new_employee_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notification_policies(event_type,audience_type,notify_actor,in_app_enabled,desktop_enabled,sound_enabled) VALUES
 ('SCHEDULED_WORK_ASSIGNED','SELECTED_EMPLOYEES',0,1,1,0),
 ('SCHEDULED_WORK_REASSIGNED','SELECTED_EMPLOYEES',0,1,1,0),
 ('SCHEDULED_WORK_RESCHEDULED','SELECTED_EMPLOYEES',0,1,1,0),
 ('SCHEDULED_WORK_CANCELLED','SELECTED_EMPLOYEES',0,1,1,0),
 ('SCHEDULED_WORK_RECURRENCE_PAUSED','SELECTED_EMPLOYEES',0,1,0,0)
ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
