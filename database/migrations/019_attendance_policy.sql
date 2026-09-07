-- Versioned policies and immutable attendance/penalty snapshots. End dates are exclusive.
CREATE TABLE attendance_policies (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 scope_type ENUM('COMPANY','DEPARTMENT','SHIFT','EMPLOYEE') NOT NULL DEFAULT 'COMPANY',
 scope_id VARCHAR(150) NOT NULL DEFAULT '',
 late_rule_enabled BOOLEAN NOT NULL,
 grace_minutes INT UNSIGNED NOT NULL,
 late_accumulation_enabled BOOLEAN NOT NULL,
 late_instances_required INT UNSIGNED NOT NULL,
 late_penalty_type ENUM('FULL_DAY_LEAVE','HALF_DAY','SALARY_DEDUCTION','NO_PENALTY') NOT NULL,
 late_penalty_quantity DECIMAL(8,2) NOT NULL,
 half_day_rule_enabled BOOLEAN NOT NULL,
 half_day_after_minutes INT UNSIGNED NOT NULL,
 half_day_salary_deduction_percent DECIMAL(5,2) NOT NULL,
 count_half_day_as_late BOOLEAN NOT NULL,
 late_counter_period ENUM('MONTHLY','PAYROLL_CYCLE','CALENDAR_MONTH','NEVER') NOT NULL,
 effective_from DATE NOT NULL, effective_to DATE NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_by BIGINT UNSIGNED NULL, updated_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_policy_version(scope_type,scope_id,effective_from),
 CHECK (late_instances_required > 0), CHECK (half_day_salary_deduction_percent BETWEEN 0 AND 100),
 CHECK (late_penalty_quantity >= 0),
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
INSERT INTO attendance_policies(name,late_rule_enabled,grace_minutes,late_accumulation_enabled,late_instances_required,late_penalty_type,late_penalty_quantity,half_day_rule_enabled,half_day_after_minutes,half_day_salary_deduction_percent,count_half_day_as_late,late_counter_period,effective_from)
VALUES('Company Default',TRUE,15,TRUE,3,'FULL_DAY_LEAVE',1,TRUE,120,50,FALSE,'PAYROLL_CYCLE','2000-01-01');
ALTER TABLE attendance_records
 MODIFY day_status ENUM('PRESENT','LATE','ABSENT','HALF_DAY','LEAVE','OFF_DAY','HOLIDAY','WEEKLY_OFF','WORKED_HOLIDAY') NOT NULL DEFAULT 'PRESENT',
 ADD COLUMN policy_id BIGINT UNSIGNED NULL,
 ADD COLUMN policy_snapshot JSON NULL,
 ADD COLUMN actual_late_minutes DECIMAL(10,2) NULL,
 ADD COLUMN chargeable_late_minutes DECIMAL(10,2) NULL,
 ADD COLUMN policy_processed_at DATETIME NULL,
 ADD COLUMN policy_finalized_at DATETIME NULL,
 ADD CONSTRAINT fk_attendance_policy FOREIGN KEY(policy_id) REFERENCES attendance_policies(id);
CREATE TABLE employee_late_counters (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 employee_id BIGINT UNSIGNED NOT NULL,
 counter_period VARCHAR(30) NOT NULL,
 period_start DATE NOT NULL, period_end DATE NOT NULL,
 late_count INT UNSIGNED NOT NULL DEFAULT 0,
 converted_count INT UNSIGNED NOT NULL DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_employee_counter(employee_id,counter_period,period_start,period_end),
 FOREIGN KEY(employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;
CREATE TABLE attendance_late_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 attendance_id BIGINT UNSIGNED NOT NULL UNIQUE,
 counter_id BIGINT UNSIGNED NOT NULL,
 policy_id BIGINT UNSIGNED NOT NULL,
 count_after INT UNSIGNED NOT NULL,
 converted_instances INT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(attendance_id) REFERENCES attendance_records(id),
 FOREIGN KEY(counter_id) REFERENCES employee_late_counters(id),
 FOREIGN KEY(policy_id) REFERENCES attendance_policies(id)
) ENGINE=InnoDB;
CREATE TABLE attendance_penalties (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 employee_id BIGINT UNSIGNED NOT NULL,
 attendance_id BIGINT UNSIGNED NOT NULL,
 penalty_type ENUM('FULL_DAY_LEAVE','HALF_DAY','SALARY_DEDUCTION') NOT NULL,
 quantity DECIMAL(8,2) NOT NULL,
 salary_days DECIMAL(10,4) NOT NULL,
 deduction_amount DECIMAL(12,2) NULL,
 reason VARCHAR(500) NOT NULL,
 source ENUM('HALF_DAY_ARRIVAL','LATE_ACCUMULATION') NOT NULL,
 adjustment_type VARCHAR(40) NOT NULL DEFAULT 'ATTENDANCE_PENALTY',
 policy_id BIGINT UNSIGNED NOT NULL, policy_snapshot JSON NOT NULL,
 status ENUM('ACTIVE','WAIVED') NOT NULL DEFAULT 'ACTIVE',
 waived_by BIGINT UNSIGNED NULL, waived_reason VARCHAR(500) NULL, waived_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_attendance_penalty(attendance_id,source),
 INDEX idx_penalty_employee(employee_id,status),
 FOREIGN KEY(employee_id) REFERENCES employees(id),
 FOREIGN KEY(attendance_id) REFERENCES attendance_records(id),
 FOREIGN KEY(policy_id) REFERENCES attendance_policies(id),
 FOREIGN KEY(waived_by) REFERENCES users(id)
) ENGINE=InnoDB;
ALTER TABLE payroll_items
 ADD COLUMN half_days INT UNSIGNED NOT NULL DEFAULT 0,
 ADD COLUMN late_penalty_days DECIMAL(10,4) NOT NULL DEFAULT 0,
 ADD COLUMN half_day_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
 ADD COLUMN late_penalty_deduction DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_day_details MODIFY classification VARCHAR(40) NOT NULL;
CREATE TABLE payroll_attendance_penalties (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 payroll_item_id BIGINT UNSIGNED NOT NULL,
 penalty_id BIGINT UNSIGNED NOT NULL,
 deduction_amount DECIMAL(12,2) NOT NULL,
 policy_snapshot JSON NOT NULL,
 UNIQUE KEY uq_payroll_penalty(payroll_item_id,penalty_id),
 FOREIGN KEY(payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE,
 FOREIGN KEY(penalty_id) REFERENCES attendance_penalties(id)
) ENGINE=InnoDB;
INSERT INTO permissions(name,description) VALUES
('attendance_policy.view','View applicable attendance policy'),
('attendance_policy.manage','Create attendance policy versions'),
('attendance_penalty.view','View own attendance penalties'),
('attendance_penalty.manage','View all and waive attendance penalties');
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (UPPER(r.name) IN ('CEO','ADMIN') AND p.name IN ('attendance_policy.view','attendance_policy.manage','attendance_penalty.view','attendance_penalty.manage'))
 OR (UPPER(r.name)='EMPLOYEE' AND p.name IN ('attendance_policy.view','attendance_penalty.view'));
