-- Additive payroll/salary audit layer. Existing salary and payroll tables remain authoritative.
ALTER TABLE audit_logs
  ADD COLUMN old_values JSON NULL AFTER description,
  ADD COLUMN new_values JSON NULL AFTER old_values,
  ADD COLUMN reason VARCHAR(500) NULL AFTER new_values,
  ADD COLUMN payroll_period_start DATE NULL AFTER reason,
  ADD COLUMN payroll_period_end DATE NULL AFTER payroll_period_start,
  ADD INDEX idx_audit_payroll_period(payroll_period_start,payroll_period_end);

ALTER TABLE employee_salary_profiles
  ADD COLUMN change_reason VARCHAR(500) NULL AFTER effective_until;

ALTER TABLE payroll_runs
  ADD COLUMN reopened_by BIGINT UNSIGNED NULL AFTER approved_at,
  ADD COLUMN reopened_at DATETIME NULL AFTER reopened_by,
  ADD COLUMN reopen_reason VARCHAR(500) NULL AFTER reopened_at,
  ADD COLUMN payment_method ENUM('BANK_TRANSFER','CASH','OTHER') NULL AFTER paid_at,
  ADD COLUMN payment_date DATE NULL AFTER payment_method,
  ADD COLUMN payment_reference VARCHAR(190) NULL AFTER payment_date,
  ADD COLUMN payment_note VARCHAR(500) NULL AFTER payment_reference,
  ADD CONSTRAINT fk_payroll_reopened_by FOREIGN KEY(reopened_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payroll_items
  ADD COLUMN per_day_salary DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER salary_divisor,
  ADD COLUMN allowances DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER absence_deduction,
  ADD COLUMN manual_deductions DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER allowances,
  ADD COLUMN positive_adjustments DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER manual_deductions,
  ADD COLUMN negative_adjustments DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER positive_adjustments,
  ADD COLUMN gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER adjustments,
  ADD COLUMN total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER gross_salary,
  ADD COLUMN calculation_status ENUM('VERIFIED','CALCULATION_MISMATCH') NOT NULL DEFAULT 'VERIFIED' AFTER net_salary;

CREATE TABLE IF NOT EXISTS payroll_adjustments(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payroll_run_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  adjustment_type ENUM('ALLOWANCE','DEDUCTION','POSITIVE_ADJUSTMENT','NEGATIVE_ADJUSTMENT') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payroll_adjustment_run FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_adjustment_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payroll_adjustment_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_payroll_adjustment_updater FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payroll_adjustment_run_employee(payroll_run_id,employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payroll_day_details(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payroll_item_id BIGINT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  classification ENUM('PRESENT','FREE_APPROVED_LEAVE','DEDUCTIBLE_APPROVED_LEAVE','UNAUTHORIZED_ABSENCE','WEEKLY_OFF','PUBLIC_HOLIDAY','COMPANY_HOLIDAY','SPECIAL_OFF_DAY','WORKING_DAY_NO_RECORD') NOT NULL,
  attendance_id BIGINT UNSIGNED NULL,
  leave_day_id BIGINT UNSIGNED NULL,
  calendar_day_id BIGINT UNSIGNED NULL,
  deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payroll_day_item FOREIGN KEY(payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_day_attendance FOREIGN KEY(attendance_id) REFERENCES attendance_records(id) ON DELETE SET NULL,
  CONSTRAINT fk_payroll_day_leave FOREIGN KEY(leave_day_id) REFERENCES leave_days(id) ON DELETE SET NULL,
  CONSTRAINT fk_payroll_day_calendar FOREIGN KEY(calendar_day_id) REFERENCES company_calendar_days(id) ON DELETE SET NULL,
  UNIQUE KEY uq_payroll_item_work_date(payroll_item_id,work_date),
  INDEX idx_payroll_day_classification(classification,work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions(name,description) VALUES
('payroll.reopen','Reopen approved payroll with a reason')
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN
('payroll.reopen','payroll.recalculate','payroll.approve','payroll.mark_paid','payroll.adjust')
WHERE r.name='CEO';
