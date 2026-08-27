-- Normalize schedule assignments and add the payroll lifecycle. Additive; preserves legacy settings.
ALTER TABLE attendance_records MODIFY reconciliation_status ENUM('NORMAL','OPEN_SHIFT','CORRECTED','HISTORICAL_REVIEW') NOT NULL DEFAULT 'NORMAL';
UPDATE attendance_records ar JOIN work_shifts ws ON ws.is_default=TRUE
SET ar.reconciliation_status='HISTORICAL_REVIEW'
WHERE ar.clock_in_at IS NOT NULL AND ws.crosses_midnight=TRUE AND TIME(ar.clock_in_at)<=ws.end_time
 AND ar.work_date=DATE(ar.clock_in_at) AND ar.reconciliation_status='NORMAL';
ALTER TABLE work_shifts
 ADD COLUMN shift_span_minutes SMALLINT UNSIGNED NULL AFTER crosses_midnight,
 ADD COLUMN required_work_minutes SMALLINT UNSIGNED NULL AFTER shift_span_minutes,
 ADD COLUMN break_allowance_minutes SMALLINT UNSIGNED NULL AFTER required_work_minutes,
 ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER is_default,
 ADD CONSTRAINT fk_work_shift_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL;
UPDATE work_shifts SET shift_span_minutes=TIMESTAMPDIFF(MINUTE,TIMESTAMP('2000-01-01',start_time),TIMESTAMP(IF(crosses_midnight,'2000-01-02','2000-01-01'),end_time)),required_work_minutes=COALESCE(required_work_minutes,480),break_allowance_minutes=COALESCE(break_allowance_minutes,60);
ALTER TABLE work_shifts MODIFY shift_span_minutes SMALLINT UNSIGNED NOT NULL,MODIFY required_work_minutes SMALLINT UNSIGNED NOT NULL,MODIFY break_allowance_minutes SMALLINT UNSIGNED NOT NULL;

CREATE TABLE IF NOT EXISTS employee_shift_assignments(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,employee_id BIGINT UNSIGNED NOT NULL,shift_id BIGINT UNSIGNED NOT NULL,
 effective_from DATE NOT NULL,effective_to DATE NULL,status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',assigned_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_shift_assignment_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
 CONSTRAINT fk_shift_assignment_shift FOREIGN KEY(shift_id) REFERENCES work_shifts(id) ON DELETE RESTRICT,
 CONSTRAINT fk_shift_assignment_user FOREIGN KEY(assigned_by) REFERENCES users(id) ON DELETE SET NULL,
 UNIQUE KEY uq_employee_shift_effective(employee_id,effective_from),INDEX idx_shift_assignment_lookup(employee_id,effective_from,effective_to,status),INDEX idx_shift_assignment_shift(shift_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO work_shifts(name,start_time,end_time,crosses_midnight,shift_span_minutes,required_work_minutes,break_allowance_minutes,grace_minutes,status)
SELECT CONCAT('Migrated Schedule ',ews.id),ews.clock_in_time,ews.clock_out_time,ews.crosses_midnight,
 TIMESTAMPDIFF(MINUTE,TIMESTAMP('2000-01-01',ews.clock_in_time),TIMESTAMP(IF(ews.crosses_midnight,'2000-01-02','2000-01-01'),ews.clock_out_time)),ews.required_work_minutes,ews.break_allowance_minutes,ews.grace_minutes,'ACTIVE'
FROM employee_work_settings ews LEFT JOIN work_shifts ws ON ws.start_time=ews.clock_in_time AND ws.end_time=ews.clock_out_time AND ws.required_work_minutes=ews.required_work_minutes AND ws.break_allowance_minutes=ews.break_allowance_minutes AND ws.grace_minutes=ews.grace_minutes WHERE ws.id IS NULL;
INSERT IGNORE INTO employee_shift_assignments(employee_id,shift_id,effective_from,effective_to,assigned_by)
SELECT ews.employee_id,ws.id,ews.effective_from,ews.effective_until,ews.created_by FROM employee_work_settings ews JOIN work_shifts ws ON ws.start_time=ews.clock_in_time AND ws.end_time=ews.clock_out_time AND ws.required_work_minutes=ews.required_work_minutes AND ws.break_allowance_minutes=ews.break_allowance_minutes AND ws.grace_minutes=ews.grace_minutes;

CREATE TABLE IF NOT EXISTS payroll_runs(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,period_label VARCHAR(7) NOT NULL,period_start DATE NOT NULL,period_end DATE NOT NULL,
 status ENUM('DRAFT','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',review_required BOOLEAN NOT NULL DEFAULT FALSE,generated_by BIGINT UNSIGNED NULL,approved_by BIGINT UNSIGNED NULL,approved_at DATETIME NULL,paid_by BIGINT UNSIGNED NULL,paid_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_payroll_period(period_start,period_end),INDEX idx_payroll_status(status,period_start),
 FOREIGN KEY(generated_by) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(paid_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS payroll_items(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,payroll_run_id BIGINT UNSIGNED NOT NULL,employee_id BIGINT UNSIGNED NOT NULL,salary_profile_id BIGINT UNSIGNED NOT NULL,
 base_salary DECIMAL(12,2) NOT NULL,salary_divisor DECIMAL(8,2) NOT NULL,working_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,present_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 free_leave_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,deductible_leave_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,absence_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 leave_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,absence_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,adjustments DECIMAL(12,2) NOT NULL DEFAULT 0,net_salary DECIMAL(12,2) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_payroll_employee(payroll_run_id,employee_id),INDEX idx_payroll_item_employee(employee_id),
 FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,FOREIGN KEY(salary_profile_id) REFERENCES employee_salary_profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO permissions(name,description) VALUES
('salary.view_own','View own salary profile'),('payroll.view_own','View own payroll'),('payroll.view_all','View all payroll'),('payroll.generate','Generate draft payroll'),('payroll.recalculate','Recalculate draft payroll'),('payroll.approve','Approve payroll'),('payroll.mark_paid','Mark approved payroll paid'),('payroll.adjust','Manage payroll adjustments')
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('shift.view','salary.view_own','payroll.view_own') WHERE r.name='Employee';
INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('payroll.view_all','payroll.generate','payroll.recalculate','payroll.approve','payroll.mark_paid','payroll.adjust') WHERE r.name='CEO';
